"""Page-preserving extraction and evidence-linked candidate entities."""
from io import BytesIO
from pathlib import Path
import re
from zipfile import ZipFile, BadZipFile
from xml.etree import ElementTree as ET

from fastapi import HTTPException
from pypdf import PdfReader

MAX_BYTES = 24 * 1024 * 1024
MAX_CHARS = 3_000_000
TERMS = {
    "lugar": ["Tobar", "Burgos", "Viseu", "Beira", "Lisboa", "Veracruz", "Sevilla",
              "Portugal", "España", "México", "Mexico", "Méjico", "Argentina", "Brasil", "Colombia", "Perú", "Chile"],
    "apellido": ["Tovar", "Tobar", "Amaral"],
}
PATTERNS = [(kind, re.compile(r"\b(?:" + "|".join(values) + r")\b", re.I))
            for kind, values in TERMS.items()]
PATTERNS += [
    ("lugar candidato", re.compile(r"(?<=natural de )[A-ZÁÉÍÓÚÑ][\wÀ-ÿ-]+")),
    ("apellido candidato", re.compile(r"(?<=apellido )[A-ZÁÉÍÓÚÑ][\wÀ-ÿ-]+")),
    ("año", re.compile(r"\b(?:1[0-9]{3}|20[0-2][0-9])\b")),
    ("persona candidata", re.compile(r"\b(?i:don|doña|fray|dom|dona)\s+([A-ZÁÉÍÓÚÑ][\wÀ-ÿ-]+(?:\s+(?:(?:de|da|do|del)\s+)?[A-ZÁÉÍÓÚÑ][\wÀ-ÿ-]+){0,4})")),
]


def extract(filename, raw):
    ext = Path(filename).suffix.lower()
    title, author = Path(filename).stem, ""
    if ext == ".pdf":
        try:
            reader = PdfReader(BytesIO(raw))
            if reader.is_encrypted or len(reader.pages) > 1500:
                raise HTTPException(422, "El PDF está cifrado o supera 1500 páginas.")
            meta = reader.metadata
            if meta:
                title = meta.title or title
                author = meta.author or ""
            pages = ((f"Página {i}", page.extract_text() or "") for i,page in enumerate(reader.pages,1))
            chunks = segment(pages)
        except HTTPException:
            raise
        except Exception:
            raise HTTPException(422, "No se pudo interpretar el PDF.") from None
    elif ext == ".docx":
        try:
            with ZipFile(BytesIO(raw)) as package:
                def read_xml(name, limit):
                    if package.getinfo(name).file_size > limit:
                        raise HTTPException(413, "El texto expandido supera el límite de importación.")
                    return ET.fromstring(package.read(name))
                document = read_xml("word/document.xml", 16 * 1024 * 1024)
                ns = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"
                chunks = segment((f"Párrafo {i}", "".join(t.text or "" for t in para.iter(ns+"t")))
                                 for i,para in enumerate(document.iter(ns+"p"),1))
                if "docProps/core.xml" in package.namelist():
                    meta = read_xml("docProps/core.xml", 100000)
                    dc = "{http://purl.org/dc/elements/1.1/}"
                    title = meta.findtext(dc+"title") or title
                    author = meta.findtext(dc+"creator") or author
        except (BadZipFile, KeyError, ET.ParseError, RuntimeError, ValueError):
            raise HTTPException(422, "No se pudo interpretar el documento Word.") from None
    elif ext in {".txt", ".md"}:
        try:
            body = raw.decode("utf-16" if raw.startswith((b"\xff\xfe", b"\xfe\xff")) else "utf-8-sig")
        except UnicodeError:
            raise HTTPException(422, "Guarda el texto en UTF-8 o UTF-16 con marca de orden.") from None
        if "\x00" in body:
            raise HTTPException(422, "El archivo contiene datos binarios.")
        chunks = segment((f"Bloque {i}", text) for i,text in enumerate(body.split("\f"),1))
    else:
        raise HTTPException(415, "Formatos disponibles: PDF, TXT, Markdown y DOCX.")
    if not chunks:
        raise HTTPException(422, "No hay texto extraíble. Los escaneos requieren OCR previo.")
    return str(title)[:300], str(author)[:300], chunks


def segment(pages):
    result, total = [], 0
    for locator, text in pages:
        text = " ".join(text.replace("\0"," ").split())
        total += len(text)
        if total > MAX_CHARS:
            raise HTTPException(413, "La obra supera el límite de texto por importación.")
        while text:
            cut = len(text)
            if cut > 1200:
                cut = text.rfind(" ", 600, 1201)
                if cut < 0:
                    cut = 1200
            part, text = text[:cut], text[cut:].lstrip()
            entities = [{"tipo":kind,"texto":m.group(),"inicio":m.start(),"fin":m.end()}
                        for kind, pattern in PATTERNS for m in pattern.finditer(part)]
            result.append((locator, part, entities))
    return result
