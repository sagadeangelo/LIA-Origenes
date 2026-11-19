# Verificación del MVP comercial local

La revisión partió del árbol publicado en 776540a. Se inspeccionaron las rutas FastAPI, el acceso SQLite, el adaptador de Orders, el cliente HTTP React, los botones de exploración y los generadores de PDF y SVG. En esa versión funcionaban la búsqueda exacta y por componentes, la compra simulada y las descargas premium. El taller y la navegación de la expedición eran informativos. Faltaban la selección persistente de diseño, el pergamino gratuito descargable y pruebas en navegador.

## Recorrido disponible

1. Busca Amaral, Tovar, Tobar o los dos apellidos. Los nombres compuestos ofrecen fichas individuales. El mapa abre esas mismas fichas.
2. Explora las estaciones Lugar, Fuente e Investigación. Las referencias contextualizan el nombre. Para acreditar un vínculo familiar se requieren documentos individuales.
3. Descarga el pergamino gratuito desde la ficha, sin orden ni credenciales. El PDF de 30 MXN añade el desarrollo histórico y orientación para investigar.
4. En el taller elige bosque, carmesí o azul. La vista pública es una miniatura PNG rotulada como boceto. La orden de Legado guarda el color elegido. Tras acreditarse, habilita el informe y el SVG artístico final por 69 MXN. Las compras previas conservan su color original.
5. La referencia a ADN continúa siendo informativa. El catálogo solo incluye dos fichas documentadas.

## Evidencia

- 12 pruebas de backend aprobadas. Se probaron la clave de sesión, reintentos, concurrencia, identidad de la orden, importe, moneda, vendedor, reembolso, descargas por producto y compras antiguas sin paleta.
- Chromium 153 headless, con servidor HTTP local y base temporal. Tres recorridos a 320, 390 y 1280 px. Se comprobaron búsqueda múltiple, formulario inválido, falta de resultados, fallo de red seguido de reintento, lectura de fuente, descarga gratuita, elección del color, pago demo, recarga y descarga premium. Sin errores JavaScript ni desbordamiento horizontal en la ficha.
- axe-core comprobó la ficha y el taller en esos tres anchos con las reglas wcag2a, wcag2aa y wcag21aa. Cero infracciones detectadas durante esa comprobación.
- Vite compiló 28 módulos. La carga inicial local registró 528028 bytes de recursos y DOMContentLoaded entre 46 y 113 ms en la última corrida. Estos datos corresponden a loopback.
- El adaptador se contrastó con la documentación mexicana de Checkout Pro vía Orders y notificaciones. Las pruebas del proveedor usan transporte HTTP simulado. La cuenta particular, el checkout alojado y la entrega de un webhook público siguen pendientes de una prueba autorizada con cuentas sandbox confirmadas.

Documentación oficial de Mercado Pago: https://www.mercadopago.com.mx/developers/es/docs/checkout-pro-orders/create-order y https://www.mercadopago.com.mx/developers/es/docs/checkout-pro-orders/notifications

## Repetición en Windows

Desde la raíz del repositorio, el script Verificar-LIA-Origenes.ps1 construye el frontend e invoca las pruebas del backend. Para repetir además la prueba de navegador, después de verificar:

```powershell
.\.venv\Scripts\python.exe -m pip install playwright
.\.venv\Scripts\python.exe -m playwright install chromium
.\.venv\Scripts\python.exe -m tests.browser.recorrido
```

La prueba inicia y detiene su propio servidor en un puerto libre. ORIGENES_QA_CHROMIUM permite indicar un ejecutable compatible. Para incluir el análisis de accesibilidad, ORIGENES_QA_AXE debe contener la ruta local a axe.min.js de axe-core. Sin esa variable se ejecuta únicamente el recorrido funcional.
