from pathlib import Path
import tempfile
import unittest
import uuid

from fastapi.testclient import TestClient
from backend.app.core.config import Settings
from backend.app.core.database import connect
from backend.main import create_app


class Workshop(unittest.TestCase):
    def setUp(self):
        directory = self.enterContext(tempfile.TemporaryDirectory())
        self.settings = Settings(Path(directory)/"db")
        self.client = self.enterContext(TestClient(create_app(self.settings)))
        self.headers = {"Authorization": "Bearer "+"e"*64, "Idempotency-Key":str(uuid.uuid4())}

    def test_free_and_preview(self):
        for key in ("Tobar", "Amaral"):
            response = self.client.get(f"/api/surnames/{key}/parchment.pdf")
            self.assertTrue(response.content.startswith(b"%PDF"))
            response = self.client.get(f"/api/surnames/{key}/shield-preview.png?palette=azul")
            self.assertEqual(response.headers["content-type"], "image/png")
            self.assertTrue(response.content.startswith(b"\x89PNG"))
        self.assertEqual(self.client.get("/api/surnames/x/parchment.pdf").status_code,404)
        self.assertEqual(self.client.get("/api/surnames/Amaral/shield-preview.png?palette=x").status_code,422)

    def test_order_design_ownership_and_idempotency(self):
        body = {"surname":"Amaral","product":"legado","palette":"azul"}
        def create():
            return self.client.post("/api/orders",headers=self.headers,json=body)
        ident = create().json()["id"]
        self.assertEqual(create().json()["id"],ident)
        body["palette"] = "carmesi"
        self.assertEqual(create().status_code,409)
        route = "/api/orders/" + ident
        self.assertEqual(self.client.get(route+"/files/svg",headers=self.headers).status_code,403)
        self.client.post(route+"/simulate",headers=self.headers).raise_for_status()
        svg = self.client.get(route+"/files/svg",headers=self.headers).text
        self.assertIn("#203d68",svg)
        self.assertNotIn("BOCETO",svg)
        body["product"] = "pergamino"
        self.assertEqual(create().status_code,422)

    def test_existing_legacy_order(self):
        with connect(self.settings) as db:
            import hashlib
            owner = hashlib.sha256(("e"*64).encode()).hexdigest()
            db.execute("""INSERT INTO purchases(id,attempt,owner,mode,surname,product,amount,status)
                          VALUES ('legacy','past',?,'demo','tovar','legado','69.00','paid')""",(owner,))
        self.assertIn("#723832",self.client.get("/api/orders/legacy/files/svg",headers=self.headers).text)
