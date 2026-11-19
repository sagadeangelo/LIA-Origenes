import httpx
import pytest

from backend.app.integrations.sources.internet_archive import buscar_documentos


def cliente_simulado(datos, status=200):
    def responder(request):
        return httpx.Response(status, json=datos)

    return httpx.Client(
        transport=httpx.MockTransport(responder),
        follow_redirects=False,
    )


def test_busqueda_tovar():
    datos = {
        "response": {
            "docs": [{
                "identifier": "libro-historico-123",
                "title": "Historia de Tovar",
                "creator": ["Autor de ejemplo"],
                "date": "1890",
            }]
        }
    }

    with cliente_simulado(datos) as client:
        resultado = buscar_documentos("Tovar", client=client)

    assert len(resultado) == 1
    assert resultado[0]["titulo"] == "Historia de Tovar"
    assert resultado[0]["autor"] == "Autor de ejemplo"
    assert resultado[0]["fecha"] == "1890"
    assert resultado[0]["url"] == (
        "https://archive.org/details/libro-historico-123"
    )
    assert resultado[0]["tipo"] == "candidato_bibliografico_sin_verificar"


def test_apellido_invalido():
    with pytest.raises(ValueError):
        buscar_documentos("")


def test_inyeccion_en_consulta_rechazada():
    with pytest.raises(ValueError):
        buscar_documentos('Tovar" OR *:*')


def test_identificador_inseguro_descartado():
    datos = {
        "response": {
            "docs": [{
                "identifier": "../../archivo",
                "title": "Documento",
            }]
        }
    }

    with cliente_simulado(datos) as client:
        assert buscar_documentos("Tovar", client=client) == []


def test_error_remoto():
    with cliente_simulado({}, status=503) as client:
        with pytest.raises(httpx.HTTPStatusError):
            buscar_documentos("Tovar", client=client)


def test_limite_resultados():
    def responder(request):
        assert request.url.params["rows"] == "100"
        return httpx.Response(200, json={"response": {"docs": []}})

    with httpx.Client(
        transport=httpx.MockTransport(responder)
    ) as client:
        assert buscar_documentos("Amaral", limite=100, client=client) == []
