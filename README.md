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
