# Nosotros, contacto y ubicación — revisión local

Revisión del 16 de octubre de 2026 en `codex/inventory-refunds-dashboard-2`.

Se conservan la paleta lavanda, Dancing Script/Lato y la ilustración floral. Nosotros mantiene «Hecho con intención», describe los arreglos/regalos y la personalización ya disponibles, y añade accesos al catálogo y contacto. El componente admite una fotografía auténtica suministrada explícitamente; al no existir una configurada sigue mostrando la ilustración. En móvil el texto precede a la ilustración compacta.

La sección independiente `#ubicacion` comparte la única consulta existente de ubicación con el footer. Usa `/api/store-location` y `/api/business-hours`, sin nuevas APIs ni datos duplicados. La información aparece junto al mapa en escritorio y antes del mapa en móvil. El iframe conserva Google Maps, título accesible y carga diferida. El botón «Cómo llegar» utiliza la configuración existente; no se añade otra acción equivalente. Contacto mantiene el destino de WhatsApp configurado, el horario y el enlace de seguimiento sin repetir la dirección/mapa.

El menú conserva sus enlaces y Promociones condicional. Incorpora Ubicación en escritorio/móvil, foco visible y controles móviles de al menos 44 px. El footer añade Ubicación y una dirección breve solo cuando existe. Las columnas contienen direcciones largas, incluso sin espacios.

## Navegador real

Se comprobaron los cinco anchos mediante el navegador integrado, verificando `innerWidth` y el layout calculado; no son únicamente comprobaciones estáticas de CSS. No se probó un teléfono físico.

| Ancho real | Ancho del documento | Presentación | Resultado |
|---|---:|---|---|
| 390 px | 375 px | Menú móvil; información antes del mapa 16:9 | PASS |
| 430 px | 415 px | Menú móvil; información antes del mapa 16:9 | PASS |
| 768 px | 753 px | Menú móvil; información antes del mapa 2:1 | PASS |
| 1280 px | 1265 px | Menú horizontal; información al lado del mapa | PASS |
| 1440 px | 1425 px | Menú horizontal; información al lado del mapa | PASS |

Los 15 px de diferencia corresponden a la barra vertical del navegador. No hubo overflow horizontal. Se comprobaron anclas desde menú, footer y contacto; la sección queda visible debajo del encabezado fijo incluso con el buscador expandido. También se comprobaron apertura/cierre del menú, ciclo de foco, Escape y retorno del foco al botón, y apertura de horarios con teclado. Se revisaron contraste de los textos modificados, etiquetas, estados y título del mapa; esto no constituye una auditoría WCAG completa.

El mapa cargó con la dirección ya configurada en el laboratorio. La referencia no configurada se omite. La configuración local existente tiene WhatsApp desactivado y los siete días cerrados: se presentan esos estados sin inventar teléfono/horarios.

El estado sin configuración se comprobó a 390 px mediante un fixture estático de los mismos componentes reales: sin iframe, dirección o enlaces externos de Maps. Otro fixture claramente marcado TEST utilizó dirección y referencia de 400 caracteres; se detectó y corrigió contención del footer, y después el documento midió 375 px para un viewport de 390 px. En ese fixture el mapa es inerte para no consultar direcciones ficticias. Estos fixtures no simulan una respuesta real de la API ni modifican la base.

## Comprobaciones finales

- `npm test`: 44 archivos, **575/575 tests PASS**, incluidos 11 nuevos de secciones públicas. Son tests unitarios de renderizado/contratos; las pruebas visuales anteriores se realizaron por separado.
- `npm run lint`: salida 0, **0 errores / 0 warnings**.
- `npx tsc --noEmit`: salida 0.
- `npm run build`: salida 0; 69 páginas generadas.
- `git diff --check`: correcto.
- Escaneo de patrones de credenciales en 407 archivos de texto versionables: sin hallazgos. Archivos privados ignorados fuera del commit.
- SHA-256 legacy: **39/39** coinciden con `MIGRATION_REORGANIZATION_AUDIT.md`.
- Sin nuevas dependencias, APIs, migraciones, cambios de seed o lógica de compra, QR, inventario, caja, reintegros, dashboard o seguimiento.

La app se ejecutó exclusivamente contra Supabase LOCAL `127.0.0.1:62621`, sustituyendo las variables del proceso en memoria sin imprimir claves. No hubo escrituras de negocio, seed, reset ni cambios en la configuración almacenada. Algunas imágenes del dataset existente conservan URLs de una IP Wi-Fi anterior y no cargan tras cambiar de red: es una incidencia del laboratorio, no una regresión de estas secciones. Se preservaron sus datos.

## Evidencia privada

Capturas y métricas fuera de Git en `public-visit-20261016/`, dentro de la carpeta de visualizaciones de esta sesión:

- `nosotros-1440.jpg`, `ubicacion-1440-final.jpg`, `contacto-footer-1440.jpg`.
- `ubicacion-1280.jpg`, `ubicacion-768.jpg`.
- `menu-430.jpg`, `ubicacion-430.jpg`, `nosotros-390.jpg`, `ubicacion-390.jpg`, `contacto-390.jpg`.
- `configuracion-ausente-390.jpg`, `texto-largo-390.jpg`, `viewport-checks.json`.

Pendiente: revisión visual del propietario y, si se desea, comprobación adicional desde un celular físico cuando la red local vuelva a estar preparada. No se realizó push, merge, deploy ni acceso a Supabase remoto.
