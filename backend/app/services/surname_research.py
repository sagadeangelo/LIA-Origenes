import unicodedata

CATALOG = {
    "tovar": {
        "name": "Tovar", "place": "Tobar, Burgos", "region": "Castilla",
        "summary": "La variante Tobar vincula este apellido con topónimos castellanos. Uno de ellos se conserva en la provincia de Burgos.",
        "detail": "El diccionario relaciona Tobar con la toba, una roca porosa. Un nombre de lugar podía pasar a identificar a alguien procedente de allí. Las grafías con b y con v son pistas para buscar documentos de distintas épocas.",
        "source": "Dictionary of American Family Names · entrada Tobar",
        "url": "https://www.familysearch.org/en/surname?surname=TOBAR",
        "aliases": ["tobar"], "mark": [256, 95],
    },
    "amaral": {
        "name": "Amaral", "place": "Viseu, Portugal", "region": "Beira",
        "summary": "La tradición toponímica portuguesa relaciona Amaral con un lugar del entorno de Viseu.",
        "detail": "El repertorio Nós, Portugueses recoge una tradición que sitúa una quinta llamada Amaral en el término de Viseu. Esta referencia permite explorar el paisaje asociado al nombre. Para vincular a una persona con esa zona hacen falta documentos de su propia familia.",
        "source": "Nós, Portugueses · repertorio de apellidos, Amaral",
        "url": "https://sites.nosportugueses.pt/pt/106/apelido/1/amaral",
        "aliases": [], "mark": [133, 161],
    },
}


def normalize(value):
    return "".join(c for c in unicodedata.normalize("NFD", value.strip().casefold()) if not unicodedata.combining(c))


def lookup(value):
    term = normalize(value)
    return next((key for key, row in CATALOG.items() if term in [key, *row["aliases"]]), None)
