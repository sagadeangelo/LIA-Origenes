import httpx

from fastapi import FastAPI
from fastapi.testclient import TestClient

from backend.app.api.research import router
from backend.app.integrations.sources import internet_archive


app = FastAPI()
app.include_router(router)
client = TestClient(app)


def test_endpoint_tovar(monkeypatch):
    def simular(apellido, limite=10):
        assert apellido == "Tovar"
        assert limite == 10
        return [{
            "id": "documento-ejemplo",
            "titulo": "Historia de Tovar",
            "fuente": "Internet Archive",
            "tipo": "candidato_bibliografico_sin_verificar",
        }]

    monkeypatch.setattr(internet_archive, "buscar_documentos", simular)

    response = client.get(
        "/api/research/internet-archive",
        params={"apellido": "Tovar"},
    )

    assert response.status_code == 200

    data = response.json()

    assert data["total"] == 1
    assert data["verificacion"] == "pendiente"
    assert data["records"][0]["titulo"] == "Historia de Tovar"


def test_endpoint_apellido_corto():
    response = client.get(
        "/api/research/internet-archive",
        params={"apellido": "T"},
    )
    assert response.status_code == 422


def test_endpoint_limite_invalido():
    response = client.get(
        "/api/research/internet-archive",
        params={"apellido": "Tovar", "limite": 100},
    )
    assert response.status_code == 422


def test_endpoint_error_externo(monkeypatch):
    def fallar(apellido, limite=10):
        raise httpx.ConnectError("Sin conexion")

    monkeypatch.setattr(internet_archive, "buscar_documentos", fallar)

    response = client.get(
        "/api/research/internet-archive",
        params={"apellido": "Tovar"},
    )

    assert response.status_code == 503
    assert "temporalmente" in response.json()["detail"]


def test_endpoint_apellido_con_caracteres_invalidos(monkeypatch):
    def validar(apellido, limite=10):
        raise ValueError("El apellido contiene caracteres no permitidos.")

    monkeypatch.setattr(internet_archive, "buscar_documentos", validar)

    response = client.get(
        "/api/research/internet-archive",
        params={"apellido": "Tovar OR test"},
    )

    assert response.status_code == 422
