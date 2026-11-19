from io import BytesIO
from PIL import Image, ImageDraw, ImageFont
from .surname_research import CATALOG


PALETTES = {"bosque": "#243f41", "carmesi": "#723832", "azul": "#203d68"}


def original_palette(key):
    return "bosque" if key == "amaral" else "carmesi"


def render_shield(key, palette=None):
    name = CATALOG[key]["name"]
    color = PALETTES[palette or original_palette(key)]
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

def render_preview(key, palette):
    name = CATALOG[key]["name"]
    image = Image.new("RGBA", (140, 168))
    draw = ImageDraw.Draw(image)
    gold = "#e8cf97"
    draw.polygon([(15,20),(43,22),(70,12),(97,22),(125,20),(124,82),(112,104),
                  (91,125),(70,139),(49,125),(28,104),(16,82)], fill=PALETTES[palette], outline=gold,width=3)
    draw.polygon([(70,29),(73,37),(82,40),(73,43),(70,52),(67,43),(58,40),(67,37)],fill=gold)
    draw.text((70,78),name[0],font=ImageFont.load_default(size=38),anchor="mm",fill=gold)
    draw.text((70,113),"BOCETO",anchor="mm",fill="white")
    draw.rounded_rectangle((13,141,127,163),radius=3,fill=gold)
    draw.text((70,152),name.upper(),anchor="mm",fill="#34281d")
    out = BytesIO()
    image.save(out,format="PNG")
    return out.getvalue()
