from io import BytesIO
from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from .surname_research import CATALOG
from ..models.purchase import PRODUCTS


def render_pdf(order):
    row = CATALOG[order["surname"]]
    free = order["product"] == "free"
    title = "Pergamino gratuito" if free else PRODUCTS[order["product"]]["name"]
    out = BytesIO()
    doc = SimpleDocTemplate(out, pagesize=A4, leftMargin=68, rightMargin=68, topMargin=85,
                            title=f'{title} · {row["name"]}')
    story = []

    def paragraph(content, size=13, font="Times-Roman"):
        style = ParagraphStyle("text", fontName=font, fontSize=size, leading=size*1.35,
                               textColor=HexColor("#31271e"), spaceAfter=12)
        story.append(Paragraph(content, style))

    paragraph("LIA ORÍGENES   /   ATLAS DE APELLIDOS", 10, "Helvetica")
    paragraph(row["name"], 42)
    paragraph(title, 20, "Times-Italic")
    paragraph(row["place"], 17)
    paragraph(row["summary"])
    if not free:
        paragraph(row["detail"])
    if not free:
        paragraph("Para continuar tu investigación", 17)
        paragraph("Comienza con un acta familiar y sigue sus referencias a padres y lugares. Conserva la fecha, el archivo y la grafía exacta de cada asiento.")
    if order["product"] == "legado":
        paragraph("Diseño del escudo", 17)
        paragraph("El escudo adjunto es una composición artística contemporánea inspirada en el apellido. La inicial identifica la pieza y la estrella representa la búsqueda de orígenes.")
    story.append(Spacer(1, 8))
    paragraph("Fuente de consulta", 14)
    paragraph(f'<link href="{row["url"]}" color="#664320"><u>{row["source"]}</u></link>', 12)
    paragraph("Alcance: contexto del apellido. La filiación personal requiere investigación documental.", 10)

    def border(canvas, _doc):
        canvas.setFillColor(HexColor("#fbf3df"))
        canvas.rect(0, 0, *A4, fill=1, stroke=0)
        canvas.setStrokeColor(HexColor("#a3854e"))
        canvas.rect(33, 33, A4[0]-66, A4[1]-66)
        canvas.setFont("Times-Italic", 10)
        canvas.setFillColor(HexColor("#66523a"))
        canvas.drawCentredString(A4[0]/2, 48, "LIA Orígenes  ·  Archivo de apellidos")
    doc.build(story, onFirstPage=border, onLaterPages=border)
    return out.getvalue()
