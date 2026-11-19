# Checkout Pro vía Orders (México)

Predeterminado ORIGENES_MODE=demo. El código solo acepta demo y sandbox y no carga archivos dotenv. Solo después de comprobar vendedor y comprador de prueba y la aplicación independiente de Orígenes, el operador puede inyectar en el entorno del proceso:

- ORIGENES_MODE=sandbox
- ORIGENES_TEST_ACCOUNTS_CONFIRMED=yes
- ORIGENES_MP_ACCESS_TOKEN (credencial de prueba con prefijo TEST-)
- ORIGENES_MP_TEST_SELLER_ID y ORIGENES_MP_APPLICATION_ID
- ORIGENES_MP_WEBHOOK_SECRET

Antes de crear una orden, GET /users/me debe confirmar el vendedor esperado, MLM y la etiqueta test_user. Una cuenta o convención de credenciales que no cumpla estas comprobaciones deja el checkout bloqueado. La habilitación particular de la cuenta se verifica por separado.

La orden lleva referencia LIA-ORI-, importe del catálogo y un UUID persistente en X-Idempotency-Key. Después de un timeout se reintenta con la misma clave. La pestaña guarda la clave de acceso privada. La base guarda su hash. El checkout abre en otra pestaña. Al volver se puede pulsar Verificar estado.

En la aplicación de pruebas seleccionar el evento Order y configurar una URL HTTPS de pruebas con ruta /api/payments/mercadopago/webhook. El servidor local solo escucha en loopback. Esta distribución no publica ningún túnel. Las notificaciones usan HMAC-SHA256 con data.id, x-request-id y ts. La notificación desencadena una lectura autenticada del recurso. Cada descarga vuelve a comprobar la orden en sandbox. Solo se acepta processed/accredited con importe y total pagado exactos, MXN, referencia, vendedor y aplicación coincidentes.

Documentación oficial:
- https://www.mercadopago.com.mx/developers/es/docs/checkout-pro-orders/create-order
- https://www.mercadopago.com.mx/developers/es/docs/checkout-pro-orders/notifications
