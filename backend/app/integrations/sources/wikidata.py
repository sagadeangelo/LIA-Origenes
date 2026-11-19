"""Conector Wikidata para investigacion documental de apellidos."""

import httpx


API = "https://www.wikidata.org/w/api.php"

HEADERS = {
    "User-Agent": (
        "LIA-Origenes/0.1 "
        "(https://lia-tech.com; investigacion historica)"
    ),
    "Accept": "application/json",
}


def buscar_entidades(termino: str, idioma: str = "es", limite: int = 10):
    termino = termino.strip()

    if not termino:
        raise ValueError("El termino de busqueda esta vacio.")

    parametros = {
        "action": "wbsearchentities",
        "search": termino,
        "language": idioma,
        "uselang": idioma,
        "format": "json",
        "limit": max(1, min(limite, 50)),
    }

    with httpx.Client(
        headers=HEADERS,
        timeout=20,
        follow_redirects=True,
    ) as cliente:
        respuesta = cliente.get(API, params=parametros)
        respuesta.raise_for_status()
        datos = respuesta.json()

    resultados = []

    for entidad in datos.get("search", []):
        identificador = entidad.get("id")

        if not identificador:
            continue

        resultados.append({
            "id": identificador,
            "nombre": entidad.get("label", ""),
            "descripcion": entidad.get("description", ""),
            "url": f"https://www.wikidata.org/wiki/{identificador}",
            "fuente": "Wikidata",
            "licencia_datos": "CC0",
            "tipo": "candidato_sin_verificar",
        })

    return resultados


def buscar_apellido(apellido: str):
    """Obtiene candidatos de apellido, sin asumir genealogia."""

    candidatos = buscar_entidades(apellido, limite=20)

    posibles = []

    for candidato in candidatos:
        descripcion = candidato["descripcion"].lower()

        if (
            "family name" in descripcion
            or "surname" in descripcion
            or "apellido" in descripcion
        ):
            posibles.append(candidato)

    return posibles
