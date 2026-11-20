"""Browser regression. Run against a local built app: python frontend/tests/atlas.py"""
import os
import sys
from playwright.sync_api import expect, sync_playwright


def check_geometry(page, fitted):
    values = page.locator(".folio-atlas__viewport").evaluate("""v => {
      const img = v.querySelector('img'), r = img.getBoundingClientRect();
      const errors = [...v.querySelectorAll('[data-name]')].map(b => {
        const box = b.getBoundingClientRect(), dot = getComputedStyle(b, '::before');
        const x = box.left + (dot.position === 'absolute' ? parseFloat(dot.left) : box.width / 2);
        const y = box.top + box.height / 2;
        const [u,t] = b.dataset.name === 'Tovar' ? [.688,.60] : [.622,.69];
        return Math.max(Math.abs(x-r.left-u*r.width), Math.abs(y-r.top-t*r.height));
      });
      return {errors, ratio:r.width/r.height, dx:v.scrollWidth-v.clientWidth,
        dy:v.scrollHeight-v.clientHeight, x:v.scrollLeft, y:v.scrollTop,
        doc:document.documentElement.scrollWidth-document.documentElement.clientWidth};
    }""")
    assert max(values["errors"]) < 1 and abs(values["ratio"] - 2.5) < .02, values
    assert values["doc"] == 0, values
    if fitted:
        assert all(values[k] == 0 for k in ("dx", "dy", "x", "y")), values
    return values


def swipe(page, session, dx, dy):
    box = page.locator(".folio-atlas__viewport").bounding_box()
    x, y = box["x"] + box["width"] * .78, box["y"] + box["height"] * .70
    for step in range(9):
        session.send("Input.dispatchTouchEvent", {
            "type": "touchMove" if step else "touchStart",
            "touchPoints": [{"x": x + step * dx / 8, "y": y + step * dy / 8}]
        })
    session.send("Input.dispatchTouchEvent", {"type": "touchEnd", "touchPoints": []})


def check(browser, origin, width):
    page = browser.new_page(viewport={"width": width, "height": 900}, has_touch=True)
    page.goto(origin)
    view = page.locator(".folio-atlas__viewport")
    view.scroll_into_view_if_needed()
    page.locator(".scene img").evaluate("img => img.decode()")
    viseu = page.get_by_role("button", name="Seleccionar Viseu, Portugal")
    viseu.wait_for()
    check_geometry(page, True)
    if width == 390:
        cdp = page.context.new_cdp_session(page)
        top = page.evaluate("scrollY")
        swipe(page, cdp, 0, -65)
        page.wait_for_function("y=>scrollY>y", arg=top)
    viseu.tap()
    expect(viseu).to_have_attribute("aria-pressed", "true")
    source = page.get_by_role("button", name="Consultar la fuente")
    source.click()
    expect(page.locator("#record-title")).to_have_text("Amaral")
    for _ in range(2):
        page.get_by_role("button", name="Acercar mapa").click()
    view.focus()
    view.evaluate("v=>v.scrollTo(0,0)")
    view.press("ArrowRight")
    page.wait_for_function("document.querySelector('.folio-atlas__viewport').scrollLeft>0")
    if width == 390:
        view.evaluate("v=>v.scrollTo(0,0)")
        swipe(page, cdp, -70, 0)
        page.wait_for_function("document.querySelector('.folio-atlas__viewport').scrollLeft>0")
        page.set_viewport_size({"width": 900, "height": 390})
        check_geometry(page, False)
        page.set_viewport_size({"width": 390, "height": 900})
    view.evaluate("v=>v.scrollTo(v.scrollWidth,v.scrollHeight)")
    assert check_geometry(page, False)["x"] > 0
    page.get_by_role("button", name="Restablecer").click()
    expect(page.locator(".folio-atlas__tools output")).to_have_text("100 %")
    check_geometry(page, True)
    page.get_by_role("button", name="Explorar Tovar en Tobar, Burgos").click()
    expect(page.locator(".folio-atlas__detail h4")).to_have_text("Tobar, Burgos")
    source.click()
    expect(page.locator("#record-title")).to_have_text("Tovar")
    page.close()


if __name__ == "__main__":
    url = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8113"
    with sync_playwright() as pw:
        browser = pw.chromium.launch(executable_path=os.getenv("ORIGENES_QA_CHROMIUM"),
                                     ignore_default_args=["--hide-scrollbars"],
                                     args=["--disable-features=OverlayScrollbar"])
        for width in (320, 390, 768, 1280, 1920):
            check(browser, url, width)
            print(f"Atlas verificado a {width} px")
        browser.close()
