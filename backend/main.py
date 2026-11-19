from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Query, Response
from typing import Literal
from backend.app.services.pdf_generator import render_pdf
from backend.app.services.shield_generator import render_preview
from fastapi.staticfiles import StaticFiles
from backend.app.api.payments import router
from backend.app.api.research import Archive, router as research_router
from backend.app.core.config import ROOT, Settings
from backend.app.core.database import initialize
from backend.app.integrations.payments.mercadopago import Orders
from backend.app.models.purchase import PRODUCTS
from backend.app.services.surname_research import CATALOG, lookup


def create_app(settings=None, transport=None):
    settings = settings or Settings.environment()

    @asynccontextmanager
    async def lifespan(app):
        initialize(settings)
        yield

    app = FastAPI(title="LIA Orígenes", lifespan=lifespan)
    app.state.settings = settings
    app.state.orders = Orders(settings, transport)
    app.include_router(router)
    app.state.archive = Archive()
    app.include_router(research_router)

    @app.get("/api/health")
    def health():
        return {"ok": True, "mode": settings.mode}

    @app.get("/api/catalog")
    def catalog():
        return {"products": PRODUCTS, "mode": settings.mode,
                "surnames": [{k: row[k] for k in ("name", "place", "mark")} for row in CATALOG.values()]}

    @app.get("/api/surnames")
    def search(q: str = Query(min_length=1, max_length=80)):
        if not q.strip() or not any(ch.isalpha() for ch in q):
            raise HTTPException(422, "Escribe un apellido con letras.")
        key = lookup(q)
        if key:
            row = CATALOG[key]
            return {"result": {k: row[k] for k in ("name", "place", "region", "summary", "detail", "source", "url", "mark")}}
        matches = []
        for word in q.split():
            candidate = lookup(word)
            if candidate and candidate not in matches:
                matches.append(candidate)
        return {"result": None, "matches": [CATALOG[key]["name"] for key in matches]}

    @app.get("/api/surnames/{surname}/parchment.pdf")
    def free_parchment(surname: str):
        key = lookup(surname)
        if not key:
            raise HTTPException(404, "Ficha desconocida.")
        return Response(render_pdf({"surname": key, "product": "free"}), media_type="application/pdf",
                        headers={"Content-Disposition": f'attachment; filename="Pergamino-gratuito-{key}.pdf"'})

    @app.get("/api/surnames/{surname}/shield-preview.png")
    def shield_preview(surname: str, palette: Literal["bosque", "carmesi", "azul"]):
        key = lookup(surname)
        if not key:
            raise HTTPException(404, "Ficha desconocida.")
        return Response(render_preview(key, palette), media_type="image/png")

    dist = ROOT / "frontend/dist"
    if dist.is_dir():
        app.mount("/", StaticFiles(directory=dist, html=True), name="atlas")
    return app


app = create_app()
