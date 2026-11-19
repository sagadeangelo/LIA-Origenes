"""Busqueda bibliografica publica; no constituye evidencia genealogica."""

import re
import unicodedata

import httpx

API = "https://archive.org/advancedsearch.php"

HEADERS = {
    "User-Agent": "LIA-Origenes/0.1 (https://lia-tech.com; investigacion historica)",
    "Accept": "application/json",
}

CLAVES_GENEALOGICAS = (
    "genealog", "herald", "armorial", "linaje", "linhagem",
    "familia", "family history", "ancestry", "apellido",
    "sobrenome", "nobili", "blason",
)

CLAVES_HISTORICAS = (
    "historia", "historical", "historico", "historia de",
    "cronica", "archivo", "anales", "memorias", "documentos",
    "colonial", "siglo", "biografia", "biographical",
)

CLAVES_JUDICIALES = (
    "gov.uscourts.", "usfederalcourts",
    "court case", "affidavit", "bankruptcy",
    "united states v.", " v. ",
)


def normalizar(valor):
    texto = unicodedata.normalize("NFKD", str(valor or ""))
    return "".join(
        caracter for caracter in texto
        if not unicodedata.combining(caracter)
    ).casefold()


def convertir_texto(valor, maximo=500):
    if isinstance(valor, list):
        valor = ", ".join(str(x) for x in valor[:5])
    return str(valor or "")[:maximo]


def clasificar_documento(doc, apellido):
    """Clasificacion documental orientativa basada en metadatos.

    No verifica autenticidad, parentesco ni filiacion.
    """
    titulo = normalizar(convertir_texto(doc.get("title"), 2000))
    materias = normalizar(convertir_texto(doc.get("subject"), 2000))
    colecciones = normalizar(convertir_texto(doc.get("collection"), 2000))
    ident = normalizar(convertir_texto(doc.get("identifier")))
    autores = normalizar(convertir_texto(doc.get("creator"), 1000))

    contenido = f"{titulo} {materias}"
    apellido_n = normalizar(apellido)
    patron = r"(?<!\w)" + re.escape(apellido_n) + r"(?!\w)"

    # precision_documental_2612
    apellido_en_contenido = bool(re.search(patron, contenido))

    encabezado_genealogico = bool(
        re.search(
            r"\bgenealogia\s+d[ae]\s+fam",
            titulo,
        )
    )

    # Ejemplo: "GENEALOGIA DE FAMÍ LIAMENDOZA".
    # La coincidencia debe estar al final del encabezado
    # o seguida de puntuacion, no de otras letras.
    apellido_ocr = bool(
        encabezado_genealogico
        and re.search(
            re.escape(apellido_n) + r"(?!\w)",
            titulo,
        )
    )

    if not (apellido_en_contenido or apellido_ocr):
        return None

    fecha = convertir_texto(doc.get("date") or doc.get("year"))
    match = re.search(r"\b(1[0-9]{3}|20[0-9]{2})\b", fecha)
    ano = int(match.group(1)) if match else None
    antiguo = ano is not None and ano <= 1900

    # Exclusion de expedientes federales modernos reconocibles.
    # Los pleitos historicos sobre mayorazgos se conservan.
    if (
        ident.startswith("gov.uscourts.")
        or "usfederalcourts" in colecciones
        or any(
            termino in titulo
            for termino in (
                "united states v.",
                "court case",
                "affidavit",
                "bankruptcy",
            )
        )
    ):
        return None

    # Genealogia conceptual: no implica estudio familiar.
    conceptual = any(
        termino in contenido
        for termino in (
            "arque-genealog",
            "arquegenealog",
            "genealogia del cyberpunk",
            "genealogia do cyberpunk",
            "genealogia del conocimiento",
            "genealogia del poder",
            "genealogia de la moral",
            "genealogia das ideias",
        )
    )

    # Terminos generales aplicables a cualquier apellido.
    genealogico = any(
        termino in contenido
        for termino in (
            "genealogia de la familia",
            "genealogia da familia",
            "genealogia familiar",
            "arbol genealogico",
            "family genealogy",
            "family history",
            "historia familiar",
            "linaje",
            "linhagem",
            "heraldica",
            "heraldry",
            "armorial",
            "blason",
            "mayorazgo",
            "morgadio",
            "nobiliario",
            "registros parroquiales",
            "partidas de bautismo",
        )
    )

    sucesorio = any(
        termino in contenido
        for termino in (
            "pleito sobre herencia",
            "pleyto sobre herencia",
            "pleito sucesorio",
            "sucesion hereditaria",
            "tenuta del mayorazgo",
            "tenuta, y possession del mayorazgo",
            "fundaron don",
            "testamento de la familia",
        )
    )

    # Evita tratar la palabra genealogia aislada como prueba
    # de una investigacion familiar.
    genealogia_ocr = bool(
        re.search(
            r"\bgenealogia\s+d[ae]\s+fam",
            titulo,
        )
        and apellido_ocr
    )

    genealogico = (
        genealogico or sucesorio or genealogia_ocr
    ) and not conceptual

    historico = any(
        termino in contenido
        for termino in (
            "historia", "historico", "historica",
            "historical", "cronica", "anales",
            "constituyente", "revolucionario",
            "archivo historico", "documentos historicos",
            "colonial", "biografia",
        )
    )

    tipologia_historica = bool(
        antiguo
        and re.search(
            r"\b(?:codex|codice|capitulacion|"
            r"capitulacao|capitulacoes|real cedula|"
            r"cedula real|provision real)\b",
            titulo,
        )
    )

    administrativo = any(
        termino in titulo
        for termino in (
            "suprema junta",
            "junta conservadora",
            "asamblea legislativa",
            "assemblea legislativa",
            "presidente da provincia",
            "presidente de la provincia",
            "vice presidente",
            "vice-presidente",
            "administracion de la provincia",
            "administracao da provincia",
            "nombrado por unanimidad",
            "falla com que abrio",
            "relatorio com que",
        )
    )

    apellido_en_titulo = bool(re.search(patron, titulo))
    apellido_solo_materia = (
        not apellido_en_titulo
        and bool(re.search(patron, materias))
    )

    # Detecta titulos que comienzan con un apellido
    # usado como referencia bibliografica de autor.
    apellido_inicio = re.match(
        patron + r"\s*[,.:;&]",
        titulo,
    ) is not None

    autor_coincide = bool(
        autores and re.search(patron, autores)
    )

    # Coincidencia bibliografica, no genealogica.
    autor_bibliografico = apellido_inicio or (
        autor_coincide and not genealogico and not administrativo
    )

    # La tematica academica general no equivale
    # a una fuente historica sobre la familia.
    academico_general = any(
        termino in titulo
        for termino in (
            "vida de socrates",
            "politica exterior",
            "gramatica historica",
            "historia de la hispania romana",
            "historia romana",
            "cyberpunk",
        )
    )

    if genealogico:
        categoria = "genealogia_y_linaje"
        puntuacion = 80
        relevancia = "alta"
    elif (administrativo or tipologia_historica) and antiguo:
        categoria = "documento_historico"
        puntuacion = 65
        relevancia = "media"
    elif historico and antiguo and not academico_general:
        categoria = "documento_historico"
        puntuacion = 55
        relevancia = "media"
    elif historico and not academico_general:
        categoria = "contexto_historico"
        puntuacion = 35
        relevancia = "media"
    else:
        categoria = "coincidencia_nominal"
        puntuacion = 5
        relevancia = "baja"

    if re.search(patron, titulo):
        puntuacion += 15
    else:
        puntuacion += 10

    if antiguo:
        puntuacion += 5

    # Una referencia de autor por si sola no debe
    # convertirse en relevancia genealogica.
    if autor_bibliografico and not genealogico:
        categoria = "coincidencia_nominal"
        relevancia = "baja"
        puntuacion = min(puntuacion, 20)

    if apellido_solo_materia and not (
        genealogico or administrativo or tipologia_historica
    ):
        categoria = "coincidencia_nominal"
        relevancia = "baja"
        puntuacion = min(puntuacion, 20)

    if conceptual:
        categoria = "coincidencia_nominal"
        relevancia = "baja"
        puntuacion = min(puntuacion, 20)

    return {
        "relevancia": relevancia,
        "puntuacion": puntuacion,
        "categoria_documental": categoria,
        "criterio": "clasificacion_automatica_por_metadatos",
    }

def buscar_documentos(apellido: str, limite: int = 10, client=None):
    apellido = apellido.strip()

    if not 2 <= len(apellido) <= 80:
        raise ValueError("El apellido debe tener entre 2 y 80 caracteres.")

    if not re.fullmatch(r"[^\W\d_]+(?:[ '\-][^\W\d_]+)*", apellido, re.UNICODE):
        raise ValueError("El apellido contiene caracteres no permitidos.")

    limite = max(1, min(int(limite), 20))

    frase = apellido.replace("\\", "\\\\").replace('"', '\\"')

    params = {
        "q": (
            "mediatype:texts AND "
            f'(title:"{frase}" OR subject:"{frase}") AND '
            "NOT collection:usfederalcourts"
        ),
        "fl[]": [
            "identifier", "title", "creator", "date",
            "year", "publisher", "language",
            "subject", "collection",
        ],
        "rows": min(max(limite * 5, 30), 100),
        "page": 1,
        "output": "json",
    }

    def consultar(http):
        respuesta = http.get(API, params=params)
        respuesta.raise_for_status()
        datos = respuesta.json()

        if not isinstance(datos, dict):
            raise ValueError("Respuesta bibliografica invalida.")

        resultado = datos.get("response", {})

        if not isinstance(resultado, dict):
            raise ValueError("Respuesta bibliografica invalida.")

        documentos = resultado.get("docs", [])

        if not isinstance(documentos, list):
            raise ValueError("Listado bibliografico invalido.")

        registros = []
        vistos = set()

        for doc in documentos:
            if not isinstance(doc, dict):
                continue

            ident = doc.get("identifier")

            if not isinstance(ident, str):
                continue

            if not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9_.-]{0,199}", ident):
                continue

            if ident in vistos:
                continue

            clasificacion = clasificar_documento(doc, apellido)

            if clasificacion is None:
                continue

            vistos.add(ident)

            registros.append({
                "id": ident,
                "titulo": convertir_texto(doc.get("title")),
                "autor": convertir_texto(doc.get("creator")),
                "fecha": convertir_texto(
                    doc.get("date") or doc.get("year")
                ),
                "editorial": convertir_texto(doc.get("publisher")),
                "idioma": convertir_texto(doc.get("language")),
                "materias": convertir_texto(doc.get("subject"), 1000),
                "url": f"https://archive.org/details/{ident}",
                "fuente": "Internet Archive",
                "tipo": "candidato_bibliografico_sin_verificar",
                **clasificacion,
            })

        registros.sort(
            key=lambda registro: registro["puntuacion"],
            reverse=True,
        )

        return registros[:limite]

    if client is not None:
        return consultar(client)

    with httpx.Client(
        headers=HEADERS,
        timeout=25,
        follow_redirects=False,
        trust_env=False,
    ) as http:
        return consultar(http)
