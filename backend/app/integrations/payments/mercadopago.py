from decimal import Decimal, InvalidOperation
from urllib.parse import urlsplit

import httpx
from fastapi import HTTPException

from ...models.purchase import PRODUCTS


class Orders:
    def __init__(self, settings, transport=None):
        self.settings = settings
        self.transport = transport

    def request(self, method, path, **kwargs):
        try:
            with httpx.Client(base_url="https://api.mercadopago.com", timeout=12,
                              transport=self.transport,
                              headers={"Authorization": f"Bearer {self.settings.token}"}) as client:
                response = client.request(method, path, **kwargs)
                response.raise_for_status()
                return response.json()
        except (httpx.HTTPError, ValueError):
            raise HTTPException(503, "Mercado Pago no pudo confirmar la operación. Reintenta.") from None

    def create(self, order):
        account = self.request("GET", "/users/me")
        if not (str(account.get("id")) == self.settings.seller and account.get("site_id") == "MLM"
                and "test_user" in (account.get("tags") or [])):
            raise HTTPException(503, "Cuenta de pruebas mexicana sin verificar.")
        result = self.request("POST", "/v1/orders", headers={"X-Idempotency-Key": order["attempt"]},
                              json={"type": "online", "processing_mode": "manual",
                                    "external_reference": order["id"], "total_amount": order["amount"],
                                    "items": [{"title": PRODUCTS[order["product"]]["name"],
                                               "quantity": 1, "unit_price": order["amount"]}]})
        remote_id = result.get("id", "")
        url = result.get("checkout_url") or ""
        parts = urlsplit(url)
        if not (remote_id.startswith("ORDTST") and remote_id.isalnum()
                and parts.scheme == "https" and parts.netloc in
                {"www.mercadopago.com.mx", "sandbox.mercadopago.com.mx"}
                and self.matches(result, order)):
            raise HTTPException(502, "Respuesta de checkout incompatible.")
        return remote_id, url

    def matches(self, data, order):
        return (data.get("external_reference") == order["id"] and data.get("currency") == "MXN"
                and str(data.get("user_id")) == self.settings.seller
                and str((data.get("integration_data") or {}).get("application_id")) == self.settings.application)

    def status(self, order):
        data = self.request("GET", "/v1/orders/" + order["remote_id"])
        if data.get("id") != order["remote_id"] or not self.matches(data, order):
            raise HTTPException(502, "Identidad de la orden incompatible.")
        try:
            paid = (data.get("status") == "processed" and data.get("status_detail") == "accredited"
                    and Decimal(str(data.get("total_amount"))) == Decimal(order["amount"])
                    and Decimal(str(data.get("total_paid_amount"))) == Decimal(order["amount"]))
        except InvalidOperation:
            paid = False
        if paid:
            return "paid"
        if data.get("status") in {"refunded", "canceled", "cancelled", "expired", "charged_back", "failed"}:
            return "closed"
        return "pending"
