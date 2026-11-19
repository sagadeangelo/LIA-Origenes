"""Page-preserving extraction and evidence-linked candidate entities."""
from io import BytesIO
from pathlib import Path
import re

from fastapi import HTTPException
from pypdf import PdfReader

MAX_BYTES = 24 * 1024 * 1024
MAX_CHARS = 3_000_000
TERMS = {
    "lugar": ["Tobar", "Burgos", "Viseu", "Beira", "Lisboa", "Veracruz", "Sevilla",
              "Portugal", "España", "México", "Méjico", "Argentina", "Brasil", "Colombia", "Perú", "Chile"],
    "apellido": ["Tovar", "Tobar", "Amaral"],
}
PATTERNS = [(kind, re.compile(r"\b(?:" + "|".join(values) + r")\b", re.I))
            for kind, values in TERMS.items()]
PATTERNS += [
    ("año", re.compile(r"\b(?:1[0-9]{3}|20[0-2][0-9])\b")),
    ("persona candidata", re.compile(r"\b(?:don|doña|fray|Dom|Dona)\s+([A-ZÁÉÍÓÚÑ][\wÀ-ÿ-]+(?:\s+(?:(?:de|da|do|del)\s+)?[A-ZÁÉÍÓÚÑ][\wÀ-ÿ-]+){0,4})")),
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
    elif ext in {".txt", ".md"}:
        try:
            body = raw.decode("utf-16" if raw.startswith((b"\xff\xfe", b"\xfe\xff")) else "utf-8-sig")
        except UnicodeError:
            raise HTTPException(422, "Guarda el texto en UTF-8 o UTF-16 con marca de orden.") from None
        if "\x00" in body:
            raise HTTPException(422, "El archivo contiene datos binarios.")
        chunks = segment((f"Bloque {i}", text) for i,text in enumerate(body.split("\f"),1))
    else:
        raise HTTPException(415, "Formatos disponibles: PDF, TXT y Markdown.")
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
