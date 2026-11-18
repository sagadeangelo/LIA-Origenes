import hashlib
import hmac
import re
from fastapi import HTTPException, Request


def owner(request: Request):
    header = request.headers.get("authorization", "")
    if not re.fullmatch(r"Bearer [a-f0-9]{64}", header):
        raise HTTPException(401, "Falta la clave privada de esta sesión.")
    return hashlib.sha256(header[7:].encode()).hexdigest()


def verify_signature(request, secret, remote_id):
    fields = dict(part.strip().partition("=")[::2] for part in request.headers.get("x-signature", "").split(","))
    ts = fields.get("ts", "")
    request_id = request.headers.get("x-request-id", "")
    if not ts.isdigit() or not request_id or not secret:
        raise HTTPException(401, "Firma inválida.")
    manifest = f"id:{remote_id.lower()};request-id:{request_id};ts:{ts};"
    expected = hmac.new(secret.encode(), manifest.encode(), hashlib.sha256).hexdigest()
    if not hmac.compare_digest(expected.encode(), fields.get("v1", "").encode()):
        raise HTTPException(401, "Firma inválida.")
