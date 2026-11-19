# LIA Orígenes

Atlas local de apellidos. Busca Tovar (también Tobar) o Amaral, o selecciona un punto del mapa. Cada ficha incluye contexto y una fuente consultable. El pergamino histórico cuesta 30 MXN. El legado heráldico cuesta 69 MXN e incluye el informe ampliado y un escudo artístico vectorial.

## Windows

Requiere Python 3.12 con lanzador py, Node 22.12 o posterior y npm. Desde PowerShell:

```powershell
Set-Location 'C:\LIA_RECUPERACION\RECUPERACIONES_REPOSITORIOS\lia_origenes'
git switch work/mvp-lia-origenes
git pull --ff-only origin work/mvp-lia-origenes
.\scripts\Verificar-LIA-Origenes.ps1
.\scripts\Iniciar-LIA-Origenes.ps1
```

Abre http://127.0.0.1:8113. Verificar construye React y ejecuta las pruebas con SQLite temporal y transporte HTTP simulado. Construir-LIA-Origenes.ps1 permite solo instalar dependencias y compilar. Ctrl+C detiene el servidor.

En modo demo busca un apellido, elige producto, pulsa **Simular pago aprobado** y descarga el PDF o el SVG. El modo demo funciona sin cuenta ni acceso al proveedor. La sesión de compra se conserva al recargar la pestaña. Cerrar la sesión del navegador puede hacer perder el acceso a sus órdenes. SQLite persiste en data/origenes.sqlite3. ORIGENES_DB permite cambiar su ubicación.

El backend sirve la compilación de Vite y la API en el mismo origen. Para edición con recarga, inicia también npm run dev en frontend y abre http://127.0.0.1:5174. Consulta docs/PAGOS_Y_SEGURIDAD.md para el contrato sandbox.

## Biblioteca documental local

Con Docker Desktop y Ollama activos, detén el servidor anterior con Ctrl+C y ejecuta desde la raíz:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\scripts\Iniciar-Investigacion.ps1"
```

El iniciador solicita una contraseña del PostgreSQL exclusivo de Orígenes. Consérvala y usa la misma al reiniciar. Levanta pgvector en 127.0.0.1:55439, prepara embeddinggemma, compila la aplicación y arranca en modo demo en http://127.0.0.1:8113. La primera ejecución requiere descargar la imagen y el modelo. Las siguientes reutilizan el volumen biblioteca y el modelo. El archivo .env no participa. La base SQLite existente sigue atendiendo las órdenes.

En **Biblioteca documental y rutas**, importa un PDF con texto, TXT, Markdown o DOCX. Selecciona el tipo de obra y, opcionalmente, corrige el título y el autor. El original y los fragmentos se guardan en PostgreSQL. Los PDF conservan números de página, Word conserva el número de párrafo y los textos se citan por bloque y fragmento. La importación síncrona acepta hasta 24 MiB y tres millones de caracteres extraídos por obra. Los escaneos requieren OCR previo.

La IA local convierte pasajes y consultas en vectores de 768 dimensiones mediante /api/embed. El índice HNSW ordena hasta ocho resultados por similitud coseno. Cada resultado muestra el texto, su localizador y el original descargable. La extracción de entidades usa reglas de fechas y nombres, títulos personales y un vocabulario geográfico y de apellidos acotado. Los resultados son candidatos para revisión documental.

Para explorar una ruta, selecciona primero una ficha del atlas y luego un país. El navegador puede preseleccionar un destino según su idioma regional. El usuario puede cambiarlo y la aplicación no solicita ubicación precisa ni consulta servicios de IP. El itinerario enlaza el lugar de la ficha con ese país e identifica pasajes donde coaparecen apellido y destino. Demostrar un viaje individual requiere contrastar los documentos. La biblioteca se comparte entre las sesiones de esta instalación local; los originales quedan disponibles a quienes tengan acceso al servidor.

La importación es atómica y deduplica el archivo por SHA-256. Un fallo del proveedor de vectores revierte la importación completa. Para ejecutar también la prueba SQL, configura ORIGENES_TEST_PG_DSN con una base PostgreSQL vacía y exclusiva de prueba que admita CREATE EXTENSION vector. La prueba usa vectores controlados y deja datos de prueba en esa base.

Referencias técnicas: https://docs.ollama.com/api/embed · https://ollama.com/library/embeddinggemma · https://github.com/pgvector/pgvector
