from backend.app.integrations.sources.internet_archive import (
    clasificar_documento,
)


def evaluar(apellido, titulo, fecha="", **extra):
    doc = {
        "identifier": "documento-control",
        "title": titulo,
        "date": fecha,
    }
    doc.update(extra)
    return clasificar_documento(doc, apellido)


def test_genealogia_ocr_amaral():
    r = evaluar(
        "Amaral",
        "GENEALOGIA DA FAMÍ LIAGURGEL "
        "IN MEMORIAM FRANCINA GURGEL DO AMARAL",
        "1986",
    )
    assert r["categoria_documental"] == "genealogia_y_linaje"


def test_genealogia_ocr_mendoza():
    r = evaluar(
        "Mendoza",
        "GENEALOGIA DE FAMÍ LIAMENDOZA",
        "1890",
    )
    assert r is not None
    assert r["relevancia"] == "alta"


def test_cyberpunk_no_genealogico():
    r = evaluar(
        "Amaral",
        "Arque-genealogia do cyberpunk Adriana Amaral",
        "2015",
    )
    assert r["relevancia"] == "baja"


def test_codex_mendoza():
    r = evaluar("Mendoza", "Codex Mendoza", "1541")
    assert r["categoria_documental"] == "documento_historico"


def test_capitulacion_mendoza():
    r = evaluar(
        "Mendoza",
        "Capitulacion con Pedro de Mendoza",
        "1534",
    )
    assert r["categoria_documental"] == "documento_historico"


def test_materia_secundaria():
    r = evaluar(
        "Mendoza",
        "Laboratorio y museo de dinosaurios: historia "
        "y descubrimientos cientificos",
        "2022",
        subject=["Universidad de Mendoza", "Paleontologia"],
    )
    assert r["relevancia"] == "baja"


def test_mayorazgo_tovar():
    r = evaluar(
        "Tovar",
        "Pleito sobre el mayorazgo de la Casa de Tovar",
        "1611",
    )
    assert r["relevancia"] == "alta"


def test_documento_1810():
    r = evaluar(
        "Tovar",
        "Suprema Junta Conservadora: nombrado por "
        "unanimidad Martin Tovar vice presidente",
        "1810",
    )
    assert r["categoria_documental"] == "documento_historico"


def test_tribunal_moderno_excluido():
    r = evaluar(
        "Tovar",
        "United States v. Tovar",
        "2020",
        identifier="gov.uscourts.test.123",
    )
    assert r is None


def test_no_inferir_parentesco():
    r = evaluar(
        "Mendoza",
        "Capitulacion con Pedro de Mendoza",
        "1534",
    )
    assert r["relevancia"] == "media"
    assert "parentesco" not in r