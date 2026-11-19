from backend.app.integrations.sources.internet_archive import (
    clasificar_documento,
)


def evaluar(apellido, titulo, fecha="", **extra):
    doc = {
        "identifier": "archivo-historico",
        "title": titulo,
        "date": fecha,
    }
    doc.update(extra)
    return clasificar_documento(doc, apellido)


def test_mayorazgo_tovar_1611():
    r = evaluar(
        "Tovar",
        "Pleito sobre la tenuta del Mayorazgo de la Casa de Tovar",
        "1611",
    )
    assert r["relevancia"] == "alta"


def test_mayorazgo_otro_apellido():
    r = evaluar(
        "Mendoza",
        "Pleito sobre el Mayorazgo de la Casa de Mendoza",
        "1601",
    )
    assert r["categoria_documental"] == "genealogia_y_linaje"


def test_gurgel_amaral_genealogia():
    r = evaluar(
        "Amaral",
        "Genealogia da familia Gurgel do Amaral",
        "1986",
    )
    assert r["relevancia"] == "alta"


def test_cyberpunk_falso_positivo():
    r = evaluar(
        "Amaral",
        "Arque-genealogia do cyberpunk por Adriana Amaral",
        "2015",
    )
    assert r["relevancia"] == "baja"


def test_documento_venezuela_1810():
    r = evaluar(
        "Tovar",
        "Suprema Junta Conservadora: nombrado por unanimidad "
        "Martin Tovar vice presidente",
        "1810",
    )
    assert r["categoria_documental"] == "documento_historico"


def test_documento_bahia_1864():
    r = evaluar(
        "Amaral",
        "Falla com que abrio a Assemblea Legislativa da Bahia "
        "el vice-presidente Manoel do Amaral",
        "1864",
    )
    assert r["categoria_documental"] == "documento_historico"


def test_autor_vida_socrates():
    r = evaluar(
        "Tovar",
        "Tovar, A. Vida de Socrates",
        "1984",
    )
    assert r["relevancia"] == "baja"


def test_autor_historia_general():
    r = evaluar(
        "Tovar",
        "Tovar, Antonio. Historia de la Hispania Romana",
        "1982",
    )
    assert r["categoria_documental"] == "coincidencia_nominal"


def test_memorias_amaral():
    r = evaluar(
        "Amaral",
        "Memorias de Guilherme do Amaral",
        "1863",
    )
    assert r["relevancia"] == "baja"


def test_expediente_moderno_excluido():
    r = evaluar(
        "Tovar",
        "United States v. Tovar",
        "2020",
        identifier="gov.uscourts.test.123",
    )
    assert r is None


def test_documento_historico_no_es_parentesco():
    r = evaluar(
        "Tovar",
        "Suprema Junta Conservadora: Martin Tovar",
        "1810",
    )
    assert "parentesco" not in r
    assert r["criterio"] == (
        "clasificacion_automatica_por_metadatos"
    )


def test_genealogia_supera_coincidencia():
    genealogia = evaluar(
        "Amaral",
        "Genealogia da familia Amaral",
        "1900",
    )
    coincidencia = evaluar(
        "Amaral",
        "Amaral, A. Vida de Socrates",
        "1984",
    )
    assert genealogia["puntuacion"] > coincidencia["puntuacion"]