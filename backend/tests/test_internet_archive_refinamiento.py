from backend.app.integrations.sources.internet_archive import (
    clasificar_documento,
)


def clasificar(titulo, fecha="", identifier="documento"):
    return clasificar_documento(
        {
            "identifier": identifier,
            "title": titulo,
            "date": fecha,
        },
        "Tovar",
    )


def test_mayorazgo_prioridad_alta():
    resultado = clasificar(
        "Pleito sobre la tenuta del Mayorazgo de la Casa de Tovar",
        "1611",
    )
    assert resultado["categoria_documental"] == "genealogia_y_linaje"
    assert resultado["relevancia"] == "alta"


def test_genealogia_prioridad_alta():
    resultado = clasificar(
        "Genealogia de la familia Tovar",
        "1986",
    )
    assert resultado["relevancia"] == "alta"


def test_documento_historico():
    resultado = clasificar(
        "Historia de Tovar y la independencia",
        "1810",
    )
    assert resultado["categoria_documental"] == "documento_historico"
    assert resultado["relevancia"] == "media"


def test_contexto_historico():
    resultado = clasificar(
        "Historia contemporanea de Tovar",
        "2020",
    )
    assert resultado["categoria_documental"] == "contexto_historico"


def test_coincidencia_nominal():
    resultado = clasificar(
        "Tovar, A. Vida de Socrates",
        "1984",
    )
    assert resultado["categoria_documental"] == "coincidencia_nominal"
    assert resultado["relevancia"] == "baja"


def test_memorias_no_son_genealogia():
    resultado = clasificar(
        "Memorias de Guilherme Tovar",
        "1863",
    )
    assert resultado["categoria_documental"] == "coincidencia_nominal"


def test_excluye_tribunal_moderno():
    resultado = clasificar(
        "United States v. Tovar",
        "2020",
        "gov.uscourts.test.123",
    )
    assert resultado is None


def test_conserva_pleito_historico():
    resultado = clasificar(
        "Pleito sobre herencia de la familia Tovar",
        "1611",
        "archivo-historico-1611",
    )
    assert resultado is not None
    assert resultado["relevancia"] == "alta"


def test_mayorazgo_supera_historia_general():
    mayorazgo = clasificar(
        "Mayorazgo de la Casa de Tovar",
        "1611",
    )
    historia = clasificar(
        "Estudio historico sobre Tovar",
        "1884",
    )
    assert mayorazgo["puntuacion"] > historia["puntuacion"]


def test_sin_afirmacion_de_parentesco():
    resultado = clasificar(
        "Genealogia de la familia Tovar",
        "1900",
    )
    assert "parentesco" not in resultado
    assert resultado["criterio"] == (
        "clasificacion_automatica_por_metadatos"
    )