import hashlib
import hmac
import tempfile
import unittest
import uuid
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import httpx
from fastapi.testclient import TestClient

from backend.main import create_app
from backend.app.core.config import Settings


class Demo(unittest.TestCase):
    def setUp(self):
        folder = tempfile.TemporaryDirectory()
        self.addCleanup(folder.cleanup)
        self.settings = Settings(Path(folder.name) / "db")
        self.client = self.enterContext(TestClient(create_app(self.settings)))
        self.headers = {"Authorization": "Bearer " + "a"*64, "Idempotency-Key": str(uuid.uuid4())}

    def order(self, product="legado"):
        return self.client.post("/api/orders", headers=self.headers, json={"surname":"Amaral","product":product})

    def test_catalog(self):
        self.assertEqual(self.client.get("/api/surnames?q=Tóbar").json()["result"]["name"], "Tovar")
        self.assertIsNone(self.client.get("/api/surnames?q=Desconocido").json()["result"])
        self.assertEqual(self.client.get("/api/catalog").json()["products"]["pergamino"]["amount"], "30.00")

    def test_downloads(self):
        route = "/api/orders/" + self.order().json()["id"]
        self.assertEqual(self.client.get(route+"/files/pdf", headers=self.headers).status_code, 403)
        self.client.post(route+"/simulate", headers=self.headers).raise_for_status()
        self.assertTrue(self.client.get(route+"/files/pdf", headers=self.headers).content.startswith(b"%PDF"))
        self.assertIn(b"<svg", self.client.get(route+"/files/svg", headers=self.headers).content)
        self.assertEqual(self.client.get(route+"/files/pdf",headers={"Authorization":"Bearer "+"b"*64}).status_code,404)
        self.assertEqual(self.client.get(route+"/files/pdf").status_code,401)

    def test_basic(self):
        route = "/api/orders/" + self.order("pergamino").json()["id"]
        self.client.post(route+"/simulate", headers=self.headers).raise_for_status()
        self.assertEqual(self.client.get(route+"/files/svg", headers=self.headers).status_code,404)

    def test_concurrent_replay_and_conflict(self):
        with ThreadPoolExecutor(max_workers=4) as pool:
            ids = list(pool.map(lambda _: self.order().json()["id"], range(8)))
        self.assertEqual(len(set(ids)),1)
        self.assertEqual(self.order("pergamino").status_code,409)

    def test_price_tampering(self):
        self.assertEqual(self.client.post("/api/orders", headers=self.headers,
                         json={"surname":"Tovar","product":"legado","amount":"1.00"}).status_code,422)


class Sandbox(unittest.TestCase):
    def setUp(self):
        folder = tempfile.TemporaryDirectory()
        self.addCleanup(folder.cleanup)
        self.settings = Settings(Path(folder.name)/"db","sandbox","dummy","unit-secret","123","456")
        self.tags = ["test_user"]
        self.data = {}
        self.created = []
        self.offline = False
        self.transport = httpx.MockTransport(self.provider)
        self.client = self.enterContext(TestClient(create_app(self.settings,self.transport)))
        self.headers = {"Authorization":"Bearer "+"c"*64,"Idempotency-Key":str(uuid.uuid4())}

    def provider(self, req):
        import json
        if req.url.path == "/users/me":
            return httpx.Response(200,json={"id":123,"site_id":"MLM","tags":self.tags})
        if req.method == "POST":
            body = json.loads(req.content)
            self.created.append((req.headers["X-Idempotency-Key"],body))
            self.data = {"id":"ORDTST12","currency":"MXN","user_id":"123",
                         "integration_data":{"application_id":"456"},"status":"created",
                         "checkout_url":"https://www.mercadopago.com.mx/checkout/v1/redirect",
                         "external_reference":body["external_reference"],"total_amount":body["total_amount"]}
        if self.offline:
            raise httpx.ConnectError("offline")
        return httpx.Response(200,json=self.data)

    def order(self):
        return self.client.post("/api/orders", headers=self.headers,json={"surname":"Tovar","product":"legado"})

    def event(self, signature=True):
        digest = hmac.new(b"unit-secret",b"id:ordtst12;request-id:r;ts:123;",hashlib.sha256).hexdigest()
        headers = {"x-request-id":"r","x-signature":"ts=123,v1="+digest} if signature else {}
        return self.client.post("/api/payments/mercadopago/webhook?data.id=ORDTST12",headers=headers)

    def test_seller(self):
        self.tags = []
        self.assertEqual(self.order().status_code,503)
        self.assertFalse(self.created)

    def test_persistence_on_timeout(self):
        self.offline = True
        self.assertEqual(self.order().status_code,503)
        self.offline = False
        with TestClient(create_app(self.settings,self.transport)) as fresh:
            self.client = fresh
            self.order().raise_for_status()
        self.assertEqual(self.created[0],self.created[1])

    def test_reconcile(self):
        route = "/api/orders/"+self.order().json()["id"]
        self.order().raise_for_status()
        self.assertEqual(len(self.created),1)
        self.assertEqual(self.created[0][1]["processing_mode"],"manual")
        self.assertEqual(self.client.post(route+"/simulate",headers=self.headers).status_code,404)
        self.assertEqual(self.event(False).status_code,401)
        self.data.update(status="processed",status_detail="accredited",total_paid_amount="68.99")
        self.event().raise_for_status()
        self.assertEqual(self.client.get(route+"/files/pdf",headers=self.headers).status_code,403)
        self.data["total_paid_amount"] = "69.00"
        for _ in range(2):
            self.event().raise_for_status()
        self.client.get(route+"/files/pdf",headers=self.headers).raise_for_status()
        for key,value in [("external_reference","EGEL"),("currency","USD"),("user_id","789")]:
            old = self.data[key]
            self.data[key] = value
            self.assertEqual(self.client.get(route+"/files/pdf",headers=self.headers).status_code,502)
            self.data[key] = old
        self.data["status"] = "refunded"
        self.assertEqual(self.client.get(route+"/files/pdf",headers=self.headers).status_code,403)
