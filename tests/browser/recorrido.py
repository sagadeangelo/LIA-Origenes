"""Run after the Vite build, with Playwright and its Chromium installed."""
import os
from pathlib import Path
import socket
import tempfile
import threading
import time

import uvicorn
from playwright.sync_api import sync_playwright

from backend.main import create_app
from backend.app.core.config import Settings


def exercise(browser, origin, width, product, output):
    page = browser.new_page(viewport={"width": width, "height": 850})
    page.set_default_timeout(8000)
    try:
        errors = []
        page.on("pageerror", lambda error: errors.append(str(error)))
        page.goto(origin)
        page.get_by_role("button", name="Descubrir").wait_for()
        box = page.get_by_label("Busca en el archivo", exact=True)
        page.wait_for_function("document.querySelector('.scene img')?.complete")
        metric = page.evaluate("""() => ({
            ms: Math.round(performance.getEntriesByType('navigation')[0].domContentLoadedEventEnd),
            bytes: performance.getEntriesByType('resource').reduce((n,r)=>n+r.encodedBodySize,0)
        })""")
        print(f"{width}px · DOM listo {metric['ms']} ms · recursos {metric['bytes']} bytes (local)")
        page.route("**/api/surnames?*", lambda route: route.abort())
        box.fill("Amaral")
        box.press("Enter")
        page.get_by_role("alert").get_by_text("El servidor no respondió", exact=False).wait_for()
        page.unroute("**/api/surnames?*")
        for term, message in [("123", "Escribe un apellido"), ("inventado", "aún no contiene")]:
            box.fill(term)
            box.press("Enter")
            page.get_by_text(message, exact=False).wait_for()
        box.fill("Tóbar  Amaral")
        box.press("Enter")
        page.get_by_text("Fichas disponibles", exact=False).wait_for()
        page.get_by_role("button", name="Amaral ↗").focus()
        page.keyboard.press("Enter")
        page.get_by_role("button", name="2. Fuente").click()
        page.get_by_text("El repertorio Nós", exact=False).wait_for()
        with page.expect_download() as free:
            page.get_by_text("Descargar pergamino gratuito").click()
        free.value.save_as(output/"gratis.pdf")
        page.get_by_label("Color del escudo").select_option("azul")
        page.locator('img[alt*="en azul"]').wait_for()
        page.locator('img[alt*="en azul"]').evaluate("img => img.decode()")
        assert page.evaluate("document.documentElement.scrollWidth <= innerWidth")
        if os.getenv("ORIGENES_QA_AXE"):
            page.add_script_tag(path=os.environ["ORIGENES_QA_AXE"])
            results = page.evaluate("""async () => (await axe.run(document, {runOnly:{
                type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}})).violations.map(
                v => [v.id, v.nodes.map(n => n.target)])""")
            assert not results, results
        page.get_by_role("button", name=f"Probar por ${product} MXN").click()
        page.get_by_role("button", name="Simular pago aprobado").click()
        page.get_by_role("button", name="Descargar pergamino PDF").wait_for()
        page.reload()
        with page.expect_download() as report:
            page.get_by_role("button", name="Descargar pergamino PDF").click()
        report.value.save_as(output/"premium.pdf")
        assert (output/"premium.pdf").read_bytes().startswith(b"%PDF")
        assert (output/"gratis.pdf").read_bytes().startswith(b"%PDF")
        if product == 69:
            with page.expect_download() as shield:
                page.get_by_text("Descargar escudo SVG").click()
            shield.value.save_as(output/"escudo.svg")
            assert "#203d68" in (output/"escudo.svg").read_text()
        else:
            assert page.get_by_text("Descargar escudo SVG").count() == 0
        page.get_by_role("button", name="Explorar Tovar en Tobar, Burgos").click()
        page.get_by_role("heading", name="Tovar", exact=True).wait_for()
        assert not errors, errors
        print(f"{width}px · {product} MXN · recorrido verificado")
    finally:
        page.close()


def main():
    with tempfile.TemporaryDirectory() as folder, socket.socket() as listener:
        output = Path(folder)
        listener.bind(("127.0.0.1", 0))
        origin = "http://127.0.0.1:" + str(listener.getsockname()[1])
        server = uvicorn.Server(uvicorn.Config(create_app(Settings(output/"qa.sqlite3")), log_level="error"))
        thread = threading.Thread(target=server.run, kwargs={"sockets":[listener]}, daemon=True)
        thread.start()
        try:
            for _ in range(100):
                if server.started:
                    break
                time.sleep(.05)
            with sync_playwright() as pw:
                browser = pw.chromium.launch(executable_path=os.getenv("ORIGENES_QA_CHROMIUM"))
                try:
                    for width, price in [(390,69),(1280,30),(320,30)]:
                        exercise(browser, origin, width, price, output)
                finally:
                    browser.close()
        finally:
            server.should_exit = True
            thread.join(5)


if __name__ == "__main__":
    main()
