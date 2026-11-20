from tests.browser import recorrido
from pathlib import Path
import os
screens=Path(os.environ['LIA_QA_CAPTURAS']) if os.getenv('LIA_QA_CAPTURAS') else None
def test(browser,origin,w,price,out):
    if w!=390:return
    for width in [390,320,768,1440]:
        page=browser.new_page(viewport={'width':width,'height':850},reduced_motion='reduce')
        errors=[]
        page.on('pageerror',lambda e:errors.append(str(e)))
        page.goto(origin+'/travesia/')
        page.evaluate('document.fonts.ready')
        assert page.get_by_role('button',name='Sonido apagado').get_attribute('aria-pressed')=='false'
        def shot(name):
            if screens and width in [390,1440]:page.screenshot(path=screens/f'{name}-{width}.png')
        shot('Inicio')
        page.get_by_label('Primer apellido').fill('Tóbar');page.get_by_label('Segundo apellido').fill('Amaral')
        page.get_by_label('País de interés').select_option('México');page.get_by_text('Comenzar mi travesía').click()
        page.get_by_role('heading',name='Tovar',exact=True).wait_for()
        assert page.locator('.track.documented').count()==0
        page.get_by_role('button',name='Ver mundo').click()
        assert page.locator('.track.documented').count()==8
        assert page.locator('.ink-key span').count()==2
        shot('Recorridos')
        page.route('**/api/research/search?*',lambda r:r.fulfill(json=[]))
        page.get_by_text('Buscar Tovar en mis documentos').click()
        page.get_by_text('El fondo local no devolvió',exact=False).wait_for()
        page.get_by_text('Explorar recorridos de Tovar').click()
        page.get_by_role('button',name='Hawikuh → Pueblos hopi',exact=False).click()
        assert 'nps.gov' in page.locator('.journal a').get_attribute('href')
        shot('Tovar-detalle')
        page.get_by_role('button',name='Amaral',exact=True).click()
        page.get_by_text('Índice de lugares',exact=False).click()
        page.get_by_role('button',name='Brasil',exact=True).click()
        assert page.locator('.neon-edge.focused').count()==1
        assert 'malba' in page.locator('.journal a').get_attribute('href')
        shot('Mapa')
        assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
        if os.getenv('ORIGENES_QA_AXE'):
            page.add_script_tag(path=os.environ['ORIGENES_QA_AXE'])
            assert not page.evaluate("""async()=> (await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}})).violations.map(x=>x.id)""")
        page.get_by_role('button',name='Saltar al final').click();page.get_by_text('Has elegido México',exact=False).wait_for()
        page.get_by_role('button',name='Repetir').click();page.get_by_role('button',name='Pausar').click()
        page.get_by_text('Abrir el archivo de apellidos').click();page.get_by_role('heading',name='Amaral',exact=True).first.wait_for()
        page.goto(origin+'/travesia/breve/');shot('Breve')
        page.get_by_role('button',name='Saltar introducción').click()
        page.route('**/api/surnames?*',lambda r:r.abort())
        page.get_by_label('Primer apellido').fill('Zzzzz');page.get_by_text('Comenzar mi travesía').click();page.get_by_role('alert').wait_for()
        page.unroute('**/api/surnames?*');page.get_by_text('Comenzar mi travesía').click();page.get_by_text('Ficha pendiente').wait_for()
        page.get_by_text('Nueva búsqueda').click();page.get_by_text('Probar el mapa').click();page.get_by_text('Índice de lugares',exact=False).click();page.get_by_role('button',name='Punto B',exact=True).click()
        assert page.locator('.track.recreation').count()==1
        page.get_by_text('Explorar mi historia completa').click();page.get_by_role('heading',name='Demostración',exact=True).wait_for()
        assert not errors,errors
        print(width,'px: OK',flush=True)
        page.close()
    page=browser.new_page()
    page.goto(origin+'/travesia/breve/')
    page.get_by_label('Primer apellido').fill('Tovar Amaral')
    page.get_by_text('Comenzar mi travesía').click()
    page.get_by_role('button',name='Amaral',exact=True).click()
    page.get_by_text('Explorar mi historia completa').click()
    page.get_by_role('heading',name='Amaral',exact=True).wait_for()
    page.get_by_role('button',name='Sonido apagado').click()
    page.get_by_role('button',name='Sonido activo').click()
    page.close()
    for route in ['/travesia/','/travesia/breve/']:
        page=browser.new_page()
        page.goto(origin+route)
        page.get_by_text('Probar el mapa').click()
        page.get_by_role('heading',name='Ensayo cartográfico').wait_for()
        page.get_by_text('Pausar',exact=True).click()
        page.clock.install()
        page.clock.run_for(25000)
        assert page.get_by_role('heading',name='Ensayo cartográfico').is_visible()
        page.get_by_text('Reproducir',exact=True).click()
        page.clock.run_for(6050)
        assert page.locator('.marker').count()==1
        assert page.locator('.locating').is_visible()
        page.get_by_role('button',name='Pausar').click()
        page.clock.run_for(15000)
        assert page.locator('.locating').is_visible()
        page.get_by_role('button',name='Reproducir').click()
        page.clock.run_for(1900)
        assert page.locator('.stop-text').is_visible()
        page.clock.run_for(7000)
        assert page.get_by_role('heading',name='Punto A',exact=True).is_visible()
        page.clock.run_for(30000)
        page.get_by_role('heading',name='¿Dónde seguir buscando?').wait_for()
        assert page.request.get(origin+'/travesia/portada.jpg').headers['content-type']=='image/jpeg'
        page.get_by_text('Vista previa para compartir').click()
        assert page.get_by_label('Enlace para compartir').input_value().endswith('/travesia/breve/')
        assert page.locator('meta[property="og:image"]').count()==1
        page.close()
    print('Duraciones, pausa y vista previa social OK')
recorrido.exercise=test
recorrido.main()
