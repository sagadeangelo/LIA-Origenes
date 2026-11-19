from io import BytesIO
import os
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
from zipfile import ZipFile

from fastapi import HTTPException
from fastapi.testclient import TestClient
from reportlab.pdfgen.canvas import Canvas

from backend.main import create_app
from backend.app.core.config import Settings
from backend.app.services.historical_sources import extract


class Documents(unittest.TestCase):
    def test_pdf_metadata_pages(self):
        buf=BytesIO()
        pdf=Canvas(buf)
        pdf.setTitle("Atlas documental")
        pdf.setAuthor("Archivo")
        for place in ["Viseu","México"]:
            pdf.drawString(100,700,place)
            pdf.showPage()
        pdf.save()
        title,author,parts=extract("atlas.pdf",buf.getvalue())
        self.assertEqual((title,author),("Atlas documental","Archivo"))
        self.assertEqual([p[0] for p in parts],["Página 1","Página 2"])

    def test_word_and_markdown(self):
        raw=BytesIO()
        with ZipFile(raw,"w") as archive:
            archive.writestr("word/document.xml", '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:p><w:r><w:t>Don Luis Amaral, Viseu 1750</w:t></w:r></w:p></w:document>')
        chunks=extract("registro.docx",raw.getvalue())[2]
        self.assertEqual(chunks[0][0],"Párrafo 1")
        _,body,entities=chunks[0]
        for item in entities:
            self.assertEqual(body[item["inicio"]:item["fin"]],item["texto"])
        self.assertEqual({e["tipo"] for e in entities},{"persona candidata","apellido","lugar","año"})
        self.assertEqual(extract("registro.md","México".encode("utf-16"))[2][0][1],"México")

    def test_bad_files(self):
        for name,raw in [("x.txt",b" "),("x.docx",b"bad"),("x.jpg",b"abc"),("x.txt",b"a\0b")]:
            with self.subTest(name=name),self.assertRaises(HTTPException):
                extract(name,raw)


@unittest.skipUnless(os.getenv("ORIGENES_TEST_PG_DSN"),"Requiere PostgreSQL de pruebas aislado")
class ArchiveFlow(unittest.TestCase):
    def test_research_transaction(self):
        # Use a fresh, empty database reserved for this test.
        folder=self.enterContext(tempfile.TemporaryDirectory())
        app=create_app(Settings(Path(folder)/"orders.sqlite"))
        app.state.archive.dsn=os.environ["ORIGENES_TEST_PG_DSN"]
        client=self.enterContext(TestClient(app))
        root="/api/research"
        self.assertEqual(client.get(root+"/sources").json(),[])
        text="Registro de prueba: Don Luis Amaral viajó desde Viseu a México en 1750."
        def upload(body):
            return client.post(root+"/sources",headers={"x-origenes-import":"local"},
                               files={"file":("obra.txt",body.encode())},data={"category":"Registro genealógico"})
        with patch.object(app.state.archive,"embed",side_effect=HTTPException(503,"offline")):
            self.assertEqual(upload(text).status_code,503)
            self.assertEqual(client.get(root+"/sources").json(),[])
        with patch.object(app.state.archive,"embed",side_effect=lambda texts:
                ["["+ ",".join(["1"]+["0"]*767)+"]" for _ in texts]):
            source=upload(text)
            source.raise_for_status()
            ident=source.json()["source"]["id"]
            self.assertTrue(upload(text).json()["duplicate"])
            self.assertEqual(client.get(f"{root}/sources/{ident}/original").content,text.encode())
            hit=client.get(root+"/search",params={"q":"archivo de viajes"}).json()[0]
            self.assertEqual(hit["locator"],"Bloque 1")
            self.assertAlmostEqual(hit["similarity"],1)
            route=client.get(root+"/route?surname=Amaral&country=MX").json()
            self.assertEqual(route["passages"][0]["body"],text)
            self.assertEqual(client.get(root+"/route?surname=Tovar&country=MX").json()["passages"],[])
