from contextlib import asynccontextmanager
from fastapi import FastAPI, Query
from fastapi.staticfiles import StaticFiles
from backend.app.api.payments import router
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

    @app.get("/api/health")
    def health():
        return {"ok": True, "mode": settings.mode}

    @app.get("/api/catalog")
    def catalog():
        return {"products": PRODUCTS, "mode": settings.mode,
                "surnames": [{k: row[k] for k in ("name", "place", "mark")} for row in CATALOG.values()]}

    @app.get("/api/surnames")
    def search(q: str = Query(min_length=1, max_length=80)):
        key = lookup(q)
        if key:
            row = CATALOG[key]
            return {"result": {k: row[k] for k in ("name", "place", "region", "summary", "source", "url", "mark")}}
        return {"result": None}

    dist = ROOT / "frontend/dist"
    if dist.is_dir():
        app.mount("/", StaticFiles(directory=dist, html=True), name="atlas")
    return app


app = create_app()
