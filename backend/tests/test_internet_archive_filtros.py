import httpx

from backend.app.integrations.sources.internet_archive import (
    buscar_documentos,
    clasificar_documento,
)


def cliente_simulado(documentos):
    def responder(request):
        consulta = request.url.params["q"]
        assert "subject:" in consulta
        assert "NOT collection:usfederalcourts" in consulta

        return httpx.Response(
            200,
            json={"response": {"docs": documentos}},
        )

    return httpx.Client(transport=httpx.MockTransport(responder))


def test_prioriza_genealogia():
    docs = [
        {
            "identifier": "manual-tovar",
            "title": "Manual de Tovar",
        },
        {
            "identifier": "genealogia-tovar",
            "title": "Genealogia de la familia Tovar",
            "date": "1880",
        },
    ]

    with cliente_simulado(docs) as client:
        resultados = buscar_documentos("Tovar", client=client)

    assert resultados[0]["id"] == "genealogia-tovar"
    assert resultados[0]["relevancia"] == "alta"


def test_excluye_expediente_judicial():
    docs = [{
        "identifier": "gov.uscourts.test.123",
        "title": "United States v. Tovar",
        "collection": ["usfederalcourts"],
    }]

    with cliente_simulado(docs) as client:
        assert buscar_documentos("Tovar", client=client) == []


def test_conserva_url_original():
    docs = [{
        "identifier": "archivo-amaral-1616",
        "title": "Historia de Amaral",
        "date": "1616",
    }]

    with cliente_simulado(docs) as client:
        resultado = buscar_documentos("Amaral", client=client)

    assert resultado[0]["url"] == (
        "https://archive.org/details/archivo-amaral-1616"
    )
    assert resultado[0]["tipo"] == "candidato_bibliografico_sin_verificar"


def test_descarta_coincidencia_irrelevante():
    docs = [{
        "identifier": "hotel-grand-canyon",
        "title": "Grand Canyon Hotel",
        "subject": "Tourism",
    }]

    with cliente_simulado(docs) as client:
        assert buscar_documentos("Tovar", client=client) == []


def test_ordenamiento_por_relevancia():
    docs = [
        {
            "identifier": "tovar-simple",
            "title": "Tovar",
        },
        {
            "identifier": "tovar-historia",
            "title": "Historia de Tovar",
            "date": "1810",
        },
        {
            "identifier": "tovar-genealogia",
            "title": "Genealogia de la familia Tovar",
        },
    ]

    with cliente_simulado(docs) as client:
        resultados = buscar_documentos("Tovar", client=client)

    assert [x["id"] for x in resultados] == [
        "tovar-genealogia",
        "tovar-historia",
        "tovar-simple",
    ]


def test_no_atribuye_parentesco():
    doc = {
        "identifier": "amaral-antiguo",
        "title": "Antonio Amaral",
        "date": "1616",
    }

    resultado = clasificar_documento(doc, "Amaral")

    assert resultado is not None
    assert resultado["criterio"] == (
        "clasificacion_automatica_por_metadatos"
    )
    assert "parentesco" not in resultado


def test_descarta_duplicados():
    doc = {
        "identifier": "historia-tovar",
        "title": "Historia de Tovar",
    }

    with cliente_simulado([doc, doc]) as client:
        resultado = buscar_documentos("Tovar", client=client)

    assert len(resultado) == 1
