from typing import Literal
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, Header, HTTPException, Request
from fastapi.responses import Response
from pydantic import BaseModel, Field, ConfigDict

from ..core.database import connect
from ..core.security import owner, verify_signature
from ..models.purchase import PRODUCTS
from ..services.surname_research import lookup
from ..services.pdf_generator import render_pdf
from ..services.shield_generator import original_palette, render_shield

router = APIRouter(prefix="/api")


class Selection(BaseModel):
    model_config = ConfigDict(extra="forbid")
    palette: Literal["bosque", "carmesi", "azul"] | None = None
    product: str
    surname: str = Field(min_length=1, max_length=80)


def mine(db, ident, identity, mode):
    row = db.execute("SELECT * FROM purchases WHERE id=? AND owner=? AND mode=?",
                     (ident, identity, mode)).fetchone()
    if not row:
        raise HTTPException(404, "Orden desconocida.")
    return row


def snapshot(row):
    return {key: row[key] for key in ("id", "product", "surname", "amount", "status", "checkout", "mode")}


def reconcile(db, request, row):
    if row["mode"] == "sandbox" and row["remote_id"]:
        status = request.app.state.orders.status(row)
        db.execute("UPDATE purchases SET status=? WHERE id=?", (status, row["id"]))
        return status
    return row["status"]


@router.post("/orders")
def create(data: Selection, request: Request, idempotency_key: UUID = Header(),
           identity: str = Depends(owner)):
    settings = request.app.state.settings
    key = str(idempotency_key)
    surname = lookup(data.surname)
    if not surname or data.product not in PRODUCTS:
        raise HTTPException(422, "Selecciona una ficha y un producto del catálogo.")
    if data.palette and data.product != "legado":
        raise HTTPException(422, "La paleta corresponde al Legado heráldico.")
    palette = data.palette or original_palette(surname)
    # Persist the intent before the remote call, including across process restarts.
    with connect(settings) as db:
        inserted = db.execute("""INSERT INTO purchases(id, attempt, owner, mode, surname, product, amount)
                      VALUES(?,?,?,?,?,?,?) ON CONFLICT(attempt) DO NOTHING""",
                   ("LIA-ORI-" + uuid4().hex, key, identity, settings.mode, surname,
                    data.product, PRODUCTS[data.product]["amount"]))
        row = db.execute("SELECT * FROM purchases WHERE attempt=?", (key,)).fetchone()
        if (row["owner"], row["mode"], row["surname"], row["product"]) != (identity, settings.mode, surname, data.product):
            raise HTTPException(409, "El intento ya corresponde a otra compra.")
        if data.product == "legado":
            if inserted.rowcount:
                db.execute("INSERT INTO shield_styles VALUES (?,?)", (row["id"], palette))
            style = db.execute("SELECT palette FROM shield_styles WHERE purchase_id=?", (row["id"],)).fetchone()
            if palette != (style["palette"] if style else original_palette(surname)):
                raise HTTPException(409, "Este intento pertenece a otro diseño.")
    if settings.mode == "sandbox" and not row["remote_id"]:
        remote_id, checkout = request.app.state.orders.create(row)
        with connect(settings) as db:
            db.execute("UPDATE purchases SET remote_id=?, checkout=? WHERE id=? AND remote_id IS NULL",
                       (remote_id, checkout, row["id"]))
    with connect(settings) as db:
        return snapshot(mine(db, row["id"], identity, settings.mode))


@router.get("/orders/{ident}")
def status(ident: str, request: Request, identity: str = Depends(owner)):
    settings = request.app.state.settings
    with connect(settings) as db:
        row = mine(db, ident, identity, settings.mode)
        reconcile(db, request, row)
        return snapshot(mine(db, ident, identity, settings.mode))


@router.post("/orders/{ident}/simulate")
def simulate(ident: str, request: Request, identity: str = Depends(owner)):
    settings = request.app.state.settings
    if settings.mode != "demo":
        raise HTTPException(404)
    with connect(settings) as db:
        row = mine(db, ident, identity, "demo")
        db.execute("UPDATE purchases SET status='paid' WHERE id=?", (row["id"],))
        return snapshot(mine(db, ident, identity, "demo"))


@router.post("/payments/mercadopago/webhook")
def webhook(request: Request):
    settings = request.app.state.settings
    if settings.mode != "sandbox":
        raise HTTPException(404)
    remote_id = request.query_params.get("data.id", "")
    if not remote_id.isalnum() or len(remote_id) > 90:
        raise HTTPException(400, "Identificador inválido.")
    verify_signature(request, settings.secret, remote_id)
    with connect(settings) as db:
        row = db.execute("SELECT * FROM purchases WHERE remote_id=? AND mode='sandbox'",
                         (remote_id.upper(),)).fetchone()
        if row:
            reconcile(db, request, row)
    return {"received": True}


@router.get("/orders/{ident}/files/{kind}")
def download(ident: str, kind: str, request: Request, identity: str = Depends(owner)):
    settings = request.app.state.settings
    with connect(settings) as db:
        row = mine(db, ident, identity, settings.mode)
        status = reconcile(db, request, row)
        style = db.execute("SELECT palette FROM shield_styles WHERE purchase_id=?", (ident,)).fetchone()
    if status != "paid":
        raise HTTPException(403, "La descarga requiere un pago acreditado.")
    if kind == "pdf":
        content, mime = render_pdf(row), "application/pdf"
    elif kind == "svg" and row["product"] == "legado":
        content, mime = render_shield(row["surname"], style["palette"] if style else None), "image/svg+xml"
    else:
        raise HTTPException(404, "Archivo fuera de este producto.")
    return Response(content, media_type=mime, headers={"Cache-Control": "private, no-store",
                    "Content-Disposition": f'attachment; filename="LIA-{row["surname"]}.{kind}"'})
