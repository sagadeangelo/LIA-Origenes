# Separación de ventas

Inspección de solo lectura de sagadeangelo/lia-landing-v3, main e6568df. src/ui/Guias.js contiene enlaces al dominio www.mercadopago.com.mx. En ese componente no apareció una llamada fetch. La inspección de rutas del repositorio no identificó un receptor webhook ni un backend de Orders. El destino comercial final y la identidad del titular no se pueden confirmar desde los enlaces.

Orígenes mantiene un catálogo, una base SQLite, una aplicación de pagos y una ruta webhook propios. Las variables ORIGENES_MP_* solo se consumen en el backend. La relación de la aplicación con el titular comercial se debe confirmar en el panel del proveedor. La integración publicada solo contempla simulación y sandbox.
