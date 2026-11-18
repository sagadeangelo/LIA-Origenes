from .surname_research import CATALOG


def render_shield(key):
    name = CATALOG[key]["name"]
    color = "#243f41" if key == "amaral" else "#723832"
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 480">
    <title>Escudo artístico de {name}</title>
    <path d="M38 55 Q120 69 200 35 Q280 69 362 55 V214 Q356 313 200 397 Q44 313 38 214Z"
          fill="{color}" stroke="#b99350" stroke-width="10"/>
    <path d="M58 77 Q129 87 200 56 Q271 87 342 77 V211 Q339 297 200 371 Q61 297 58 211Z"
          fill="none" stroke="#edd69d" stroke-width="2"/>
    <path d="m200 88 9 25 26 9-26 9-9 25-9-25-26-9 26-9Z" fill="#edd69d"/>
    <text x="200" y="284" font-family="serif" font-size="133" text-anchor="middle" fill="#f6e6bd">{name[0]}</text>
    <path d="M29 398 Q200 424 371 398 L357 445 Q200 467 43 445Z" fill="#e8cf97"/>
    <text x="200" y="440" font-family="serif" font-size="27" text-anchor="middle" fill="#34281d">{name.upper()}</text>
    </svg>'''.encode()
