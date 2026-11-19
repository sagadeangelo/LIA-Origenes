from contextlib import contextmanager
import hashlib
import json
import math
import os
from pathlib import Path
from threading import Lock
from typing import Literal
from urllib.parse import quote

from fastapi import APIRouter, File, Form, HTTPException, Query, Request, UploadFile
from fastapi.responses import Response
import httpx
import psycopg
from psycopg.rows import dict_row
from psycopg.types.json import Jsonb

from ..core.config import ROOT
from ..services.historical_sources import MAX_BYTES, extract
from ..services.surname_research import CATALOG, lookup

router = APIRouter(prefix="/api/research")
MODEL = "embeddinggemma"
COLUMNS = "id,filename,title,author,category,created_at"
COUNTRIES = {"MX":"México","ES":"España","PT":"Portugal","AR":"Argentina",
             "BR":"Brasil","CO":"Colombia","PE":"Perú","CL":"Chile"}
SOURCE_TYPES = Literal["Libro histórico","Diccionario","Armorial","Registro genealógico"]


class Archive:
    def __init__(self):
        self.dsn = os.getenv("ORIGENES_RESEARCH_DSN")
        self.ready = False
        self.lock = Lock()

    @contextmanager
    def connect(self):
        if not self.dsn:
            raise HTTPException(503, "Activa la biblioteca documental con el iniciador de investigación.")
        try:
            with psycopg.connect(self.dsn, row_factory=dict_row, connect_timeout=4) as db:
                with self.lock:
                    if not self.ready:
                        db.execute("SELECT pg_advisory_xact_lock(811319)")
                        db.execute((ROOT/"database/research.sql").read_text(encoding="utf-8"))
                        db.commit()
                        self.ready = True
                yield db
        except psycopg.Error:
            raise HTTPException(503, "La biblioteca PostgreSQL con pgvector no está disponible.") from None

    def embed(self, texts):
        try:
            with httpx.Client(timeout=120, trust_env=False) as client:
                result = client.post("http://127.0.0.1:11434/api/embed",
                                     json={"model":MODEL, "input":texts,"truncate":False})
                result.raise_for_status()
                vectors = result.json()["embeddings"]
                if len(vectors) != len(texts) or any(len(v)!=768 or not any(v) or
                        not all(isinstance(n,(int,float)) and math.isfinite(n) for n in v) for v in vectors):
                    raise ValueError()
                return [json.dumps(v, separators=(",",":")) for v in vectors]
        except (httpx.HTTPError, ValueError, KeyError, TypeError):
            raise HTTPException(503, "Ollama no devolvió vectores válidos. Comprueba el modelo embeddinggemma.") from None


@router.get("/internet-archive")
def internet_archive_search(
    apellido: str = Query(min_length=2, max_length=80),
    limite: int = Query(default=10, ge=1, le=20),
):
    """Busca candidatos bibliograficos sin atribuir genealogia."""
    from ..integrations.sources.internet_archive import buscar_documentos

    try:
        registros = buscar_documentos(apellido, limite=limite)
    except ValueError as exc:
        raise HTTPException(422, str(exc)) from None
    except (httpx.HTTPError, httpx.InvalidURL):
        raise HTTPException(
            503,
            "Internet Archive no esta disponible temporalmente."
        ) from None

    return {
        "apellido": apellido.strip(),
        "fuente": "Internet Archive",
        "tipo": "busqueda_bibliografica",
        "verificacion": "pendiente",
        "total": len(registros),
        "records": registros,
        "advertencia": (
            "Los resultados son pistas bibliograficas, "
            "no pruebas de ascendencia familiar."
        ),
    }

@router.get("/sources")
def sources(request: Request):
    with request.app.state.archive.connect() as db:
        return db.execute(f"SELECT {COLUMNS} FROM ori_sources ORDER BY id DESC").fetchall()


@router.post("/sources")
def ingest(request: Request, file: UploadFile = File(), category: SOURCE_TYPES = Form(),
           title: str = Form("",max_length=300), author: str = Form("",max_length=300)):
    # A cross-origin HTML form cannot supply this application header.
    if request.headers.get("x-origenes-import") != "local":
        raise HTTPException(403, "Importa la obra desde la biblioteca local.")
    raw = file.file.read(MAX_BYTES+1)
    if len(raw)>MAX_BYTES:
        raise HTTPException(413, "Máximo 24 MiB por obra.")
    filename = Path((file.filename or "obra").replace("\\","/")).name[:240]
    digest = hashlib.sha256(raw).hexdigest()
    archive = request.app.state.archive
    with archive.connect() as db:
        old = db.execute(f"SELECT {COLUMNS} FROM ori_sources WHERE digest=%s",(digest,)).fetchone()
    if old:
        return {"source":old,"duplicate":True}
    name, writer, chunks = extract(filename,raw)
    # Each book and all its passages commit together or roll back together.
    with archive.connect() as db:
        source = db.execute(f"""INSERT INTO ori_sources(digest,filename,title,author,category,original)
            VALUES(%s,%s,%s,%s,%s,%s) ON CONFLICT(digest) DO NOTHING RETURNING {COLUMNS}""",
            (digest,filename,title.strip() or name,author.strip() or writer,category,raw)).fetchone()
        if not source:
            old = db.execute(f"SELECT {COLUMNS} FROM ori_sources WHERE digest=%s",(digest,)).fetchone()
            return {"source":old,"duplicate":True}
        for start in range(0,len(chunks),16):
            batch = chunks[start:start+16]
            vectors = archive.embed([part for _,part,_ in batch])
            with db.cursor() as cursor:
                cursor.executemany("INSERT INTO ori_passages VALUES (%s,%s,%s,%s,%s,%s::vector)",
                   [(source["id"],i,loc,body,Jsonb(entities),vec) for i,((loc,body,entities),vec)
                    in enumerate(zip(batch,vectors,strict=True),start+1)])
    return {"source":source,"duplicate":False,"passages":len(chunks)}


@router.get("/sources/{ident}/original")
def original(ident:int,request:Request):
    with request.app.state.archive.connect() as db:
        row=db.execute("SELECT filename,original FROM ori_sources WHERE id=%s",(ident,)).fetchone()
    if not row:
        raise HTTPException(404,"Obra desconocida.")
    return Response(bytes(row["original"]),media_type="application/octet-stream",
                    headers={"Content-Disposition":"attachment; filename*=UTF-8''"+quote(row["filename"],safe="")})


@router.get("/search")
def search(request:Request,q:str=Query(min_length=2,max_length=500)):
    if len(q.strip())<2:
        raise HTTPException(422,"Escribe al menos dos caracteres.")
    archive=request.app.state.archive
    with archive.connect() as db:
        if not db.execute("SELECT 1 FROM ori_passages LIMIT 1").fetchone():
            return []
        vector=archive.embed([q.strip()])[0]
        return db.execute("""SELECT source_id,title,seq,locator,body,entities,
              1-(embedding <=> %s::vector) AS similarity FROM ori_passages
              JOIN ori_sources ON id=source_id ORDER BY embedding <=> %s::vector LIMIT 8""",
              (vector,vector)).fetchall()


@router.get("/route")
def route(request:Request,surname:str=Query(max_length=80),country:str=Query(max_length=2)):
    key=lookup(surname)
    destination=COUNTRIES.get(country.upper())
    if not key or not destination:
        raise HTTPException(422,"Selecciona una ficha y un país del catálogo.")
    row=CATALOG[key]
    terms=[key,*row["aliases"]]
    with request.app.state.archive.connect() as db:
        passages=db.execute("""SELECT source_id,title,locator,seq,body FROM ori_passages JOIN ori_sources
            ON id=source_id WHERE EXISTS (SELECT FROM jsonb_array_elements(entities) e
              WHERE e->>'tipo'='apellido' AND lower(e->>'texto')=ANY(%s))
            AND EXISTS (SELECT FROM jsonb_array_elements(entities) e WHERE e->>'tipo'='lugar'
              AND lower(e->>'texto')=ANY(%s)) ORDER BY source_id,seq LIMIT 12""",
            (terms,[destination.lower()]+(["méjico","mexico"] if country.upper()=="MX" else []))).fetchall()
    return {"origin":row["place"],"reference":row["url"],"destination":destination,
            "passages":passages,"kind":"itinerario de investigación"}
