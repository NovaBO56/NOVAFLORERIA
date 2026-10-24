# Floristería Anabelle — auditoría e implementación pública

Rama: `desarrollo-auditoria`. Base: `035eec3a55a79a0d66a752fee5879900fa8bc7f5`.
Implementación para revisión en la rama de desarrollo; sin publicación productiva.

## Evidencia de partida

Se abrió `ANABELLE_DISENO_FINAL_20261023.zip` y se leyeron su README, índice y manifiesto: 50 entradas, 46 capturas y siete anchuras. Se inspeccionaron capturas de Inicio completo, catálogo, filtros, vista rápida, carrito y checkout. No se recibió en este mensaje otro archivo separado del menú móvil; se revisó el menú directamente en el navegador LOCAL.

Los nombres TEST/LAB y las ilustraciones sintéticas configuradas se conservaron. No son fallos de contenido comercial. Ninguna captura se utiliza como imagen de producto. No se generaron, sustituyeron ni reasignaron fotografías ni datos del catálogo.

## Hallazgos corregidos

| Hallazgo visual | Implementación |
| --- | --- |
| Paleta violeta dispersa | Marfil `#FFF9F4`, rosa `#F3E3E5`, acción vino `#873C58`, texto ciruela `#392B38`; oliva `#788064` en pequeños detalles. Tokens públicos y estilos de compra; tema administrativo intacto. |
| Tarjetas altas, poca separación entre imagen y compra | Tarjetas cálidas delimitadas, proporción de imagen más compacta, fotos configuradas con `object-contain`, precio y controles legibles, controles de 44 px. Reemplazo neutro explícito cuando no hay imagen. |
| Foto de vista rápida ocupa casi todo el diálogo | Foto acotada a 220 px en móvil; dos columnas desde tablet; nombres en letra sencilla, acciones próximas, cierre de 44 px y scroll conservado. También se adapta el detalle utilizado por combos y complementos. |
| Muchos puntos de promociones en varias filas | Contador y selector nativo compacto, conserva acceso a todas las ofertas, flechas, teclado, gestos y anuncio de la oferta activa. |
| Checkout sin introducción de marca clara | «Completa tu pedido», explicación de confirmación manual y pequeño detalle floral. Conserva los cuatro pasos, validación, foco, formulario y resumen. |
| Mapa externo vacío | Vista previa decorativa con carga de Google Maps bajo solicitud, dirección y enlaces independientes. Opción «Ocultar mapa» para volver a la tarjeta; fallback ante error detectable. Iframe diferido y con título accesible. |
| Contacto/ubicación/horarios repetidos | Ubicación mantiene dirección, referencia, mapa y semana completa. Contacto muestra ayuda y horario de hoy, enlazando al resto. Footer compacto con desplegables nativos de catálogo y horarios. |
| Canales sin configurar presentados como promesa | No hay enlaces ni promesas de WhatsApp cuando no está disponible; se conservan consulta de pedido y acceso a ubicación. |
| Menú móvil sin jerarquía | Búsqueda, lista clara con catálogo destacado, accesos a favoritos/carrito y cierre accesible. No añade canales inexistentes. |
| Caligrafía repetida en información funcional | Se conserva en portada y «Hecho con intención»; productos, promociones, navegación, formularios y carrito utilizan tipografía sencilla. |

Confirmación, QR, avisos, dedicatorias, resumen y línea temporal utilizan la misma paleta pública. No se altera el significado de éxito, error o pago pendiente. Se mantiene `prefers-reduced-motion`, sin nuevas librerías ni listeners de animación.

## Navegador real LOCAL

Entorno: `NOVA-LOCAL-INTEGRITY`, web 3116 y Supabase API 62621. Build y servidor iniciados mediante el lanzador existente que comprueba el laboratorio y sustituye las variables por las locales. No se usaron las bases remotas.

- `innerWidth` comprobado en 375, 390, 430, 768, 1024, 1440 y 1920 px. `scrollWidth <= innerWidth` en las mediciones registradas. Revisión visual de móvil/tablet/escritorio mediante viewport real redimensionado, no solo lectura CSS.
- Inicio y secciones inferiores revisados por navegación real. Menú en 375/390/430/768. Posteriormente el propietario pidió retirar Ocasión: Categorías queda como sección principal, se conserva Promociones y el botón de portada pasa a «Ver categorías». Se eliminaron estado/carga/props de ocasiones, su endpoint auxiliar y sus seis tests exclusivos. El campo administrativo permanece opcional, sin inferencias. Esta revisión final de filtros se realizó por interacciones y DOM en 390/1440, sin nuevas capturas.
- Vista rápida en 375/390/430/768/1440: diálogo sin overflow horizontal y fotografía acotada; acciones visibles o alcanzables mediante scroll normal.
- 24 promociones LOCAL: selector cambia a la oferta elegida y mantiene un único renglón. Compra de combo: paso 1 → paso 2 → cancelar; el carrito anterior conserva sus dos líneas.
- Carrito y checkout en 375/390/430/768/1440. Subtotal Bs 95, descuento Bs 5 y total Bs 90. Validación de nombre/celular vacíos, entrega/recojo y revisión final comprobados sin pulsar «Confirmar y crear pedido».
- Seguimiento con pedidos TEST existentes: #251 finalizado y pago confirmado, #252 gratuito confirmado y sin pago requerido, #166 con aviso de pago pendiente de revisión. Se consultaron por la UI pública; no se crearon ni confirmaron pedidos nuevos.
- Footer: desplegables nativos abren/cierra correctamente. Mapa: solicitud de iframe con `title`/`loading="lazy"` y retorno a vista previa mediante «Ocultar mapa» comprobados.
- Ajuste posterior solicitado: 48 px adicionales al inicio de Ubicación, 28 px entre «Nuestro punto de encuentro» y «Ven a conocernos», y 56 px antes de la tarjeta, iguales en móvil y escritorio. Las capturas anteriores corresponden al espaciado previo. El propietario pidió no generar nuevas capturas salvo petición expresa.
- Consola de la pestaña de revisión: sin errores o warnings registrados en la consulta final.

## Checks finales

| Check | Resultado |
| --- | --- |
| `npm test -- --maxWorkers=2 --minWorkers=1` | **725/725**, 62 archivos, 20,95 s |
| `npm run lint` | **0 errores / 0 warnings**, exit 0 |
| `npx tsc --noEmit` | Exit 0 |
| `scripts/start-lab50-local.ps1 -Build` → `npm run build` | Exit 0, 73 páginas generadas |
| Secret scan de archivos cambiados | Sin coincidencias; sin `.env`, claves, dumps o snapshots añadidos |
| API comerciales, SQL/seed, componentes administrativos | Sin cambios; retirado únicamente el endpoint auxiliar `/api/catalog/occasions` y su soporte en proxy/Preview |
| Legacy | 39 archivos conservados, sin diferencias contra HEAD |

Cinco nuevas pruebas cubren promociones numerosas, fallback neutro, encabezado de checkout con cuatro pasos, enlace «Ver categorías» y campo administrativo Ocasión opcional sin inferencia. Se actualizaron las expectativas del filtro y del diseño anterior. Las pruebas SSR/unitarias usan mocks donde ya los usaban; no constituyen nuevas comprobaciones de permisos SQL reales.

Vitest emite el aviso de deprecación CJS de Vite y algunos tests negativos registran sus errores simulados esperados. No son warnings de ESLint ni fallos omitidos.

## Limitaciones expresas

- No se probaron dispositivos físicos, Safari/iOS ni todos los motores de navegador.
- El proveedor Google puede bloquear el iframe sin emitir un error detectable por la página. No se certifica su cartografía externa: la dirección y el enlace independiente permanecen disponibles, y «Ocultar mapa» recupera la tarjeta. No se inventaron enlaces o coordenadas.
- La fase de QR y la confirmación dentro de checkout tienen cobertura automatizada y estilos compartidos; no se crearon pedidos nuevos para capturarlas. La espera y los estados finales sí se comprobaron visualmente en seguimiento con pedidos TEST existentes.
- Algunas capturas largas de Home omitían la foto diferida o el final por limitación de captura; se excluyen del paquete revisado y se complementan con capturas de viewport de las secciones ya cargadas. No se consideran evidencia aprobada. Las capturas largas conservadas de checkout/seguimiento no equivalen a fotos de dispositivos físicos.
- La aprobación estética definitiva corresponde al propietario. No se ejecutaron push, merge, deploy, migraciones ni SQL remoto.

Las evidencias nuevas se guardan fuera de Git en `ANABELLE_PUBLICO_MARFIL_20261023`, con manifiesto, índice y ZIP separado. Solo UI pública y datos sintéticos; sin HTML autenticado, claves o archivos privados.
