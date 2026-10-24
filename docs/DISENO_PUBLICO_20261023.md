# Tienda pública: banners y catálogo integrado

Rama: `desarrollo-auditoria`. Base: `098619b398a77c32d8b476b1f3749c564b421660`.
Trabajo y evidencias en Supabase LOCAL `NOVA-LOCAL-INTEGRITY`, API `127.0.0.1:62621`, web `127.0.0.1:3116`. No se realizaron cambios en producción.

## Implementación

- Portada con el fondo pastel aprobado, texto HTML y ramo original a la derecha; distribución aproximada 45/55 en escritorio y vertical en móvil. Segundo enlace: «Elegir por ocasión».
- «Nuestra esencia / Hecho con intención» con el otro fondo aprobado y el ramo sostenido por una mano. Conserva contenido, enlaces y la posibilidad existente de una fotografía configurada. Sin marco, tarjeta o recorte añadido alrededor del ramo.
- Los dos fondos proceden de `portada.zip`. Las dos fotografías son los originales transparentes aclarados después por el propietario. Fondos WebP de 2048 × 768; ramo inferior convertido a WebP sin pérdida, conservando alfa y píxeles; ramo principal PNG copiado byte por byte. Sin generación ni retoque con IA.
- Proporciones reservadas antes de cargar ambas fotografías. `object-contain`, tamaños limitados a su resolución original, imagen principal prioritaria e imagen inferior diferida. No se añadieron librerías.
- Catálogo con sidebar a partir de 1024 px y botón «Filtros» con diálogo modal en tamaños menores. Selección, limpieza, Escape y retorno del foco al botón. Categorías y ocasiones se presentan por separado.
- Las ocasiones son valores explícitos de `products.occasion` de productos activos. La nueva API de solo lectura `/api/catalog/occasions` reúne las páginas necesarias, elimina duplicados y devuelve solo esos valores; sin deducirlos de nombres. El proxy permite esa ruta pública exacta. Errores parciales devuelven 503 sin detalles internos.
- La Preview visual sin DB obtiene las ocasiones únicamente de su snapshot sintético, sin habilitar escrituras o conexiones remotas.
- «Promociones» reemplaza los resultados del catálogo por el componente de ofertas existente, en modo integrado. Conserva carrusel, vigencia, participantes, mínimos, selección explícita, descuentos y armado guiado de combos. Ya no hay una sección independiente «Ofertas para ti» en Home.
- Encabezado y retorno desde carrito apuntan al catálogo de promociones; se mantiene compatibilidad con enlaces antiguos `#promociones`. Búsqueda, favoritos, paginación, vista rápida, personalización y carrito se conservan.
- Crema, rosa empolvado y lavanda con violeta para títulos/acciones; foco visible. No se modificó la paleta administrativa.

## Recursos originales

El propietario proporcionó el original correcto de la portada después del ZIP inicial: **360 × 542 px, con canal alfa real**. Se conserva byte por byte como `public/brand/banners/hero-tulips.png`, sin IA, recortes o ampliación sobre su resolución nativa. SHA-256: `e850889d903e515169aefe9a8564859db52fd2395ab1e338d1654aed37792593`.

La versión opaca con cuadros del ZIP inicial se descartó y no se incluye en el commit ni en las evidencias finales. La foto inferior mejorada, también aportada después del ZIP, tiene alfa real y resolución **1122 × 1402 px**. Se conserva como `essence-bouquet-original.webp`, sin pérdida, recortes ni IA. La foto principal es de resolución modesta: se limita su tamaño de presentación, sin inventar detalle mediante reescalado.

## Configuración de ocasiones

El laboratorio dispone de: Agradecimiento, Amor y aniversario, Aniversario, Cariño y amistad, Celebración especial, Cumpleaños, Felicitaciones y Gratitud y buenos deseos. Además se muestran sus categorías configuradas, identificadas LAB/TEST.

No se crearon «Para Mamá», «Para Papá», «Graduaciones», «Flores Amarillas», «Condolencias», «20 Rosas de Abril», «Nacimientos», «Matrimonios» o «Centros de Mesa». Para incorporar cualquiera, el administrador debe asignar explícitamente el valor deseado en **Productos → crear/editar → Ocasión**, en los productos que realmente correspondan. Las categorías se siguen administrando por su mecanismo existente. No se renombraron ni reclasificaron datos. Esta lista describe LOCAL, no una auditoría de configuración productiva.

## Validación

- `npm test -- --maxWorkers=2 --minWorkers=1`: **726/726**, 63 archivos. Incluye 10 pruebas nuevas de catálogo/ocasiones; son unitarias/SSR y HTTP con mocks, no pruebas de permisos reales de DB.
- `npm run lint`: **0 errores / 0 warnings**.
- `npx tsc --noEmit`: correcto.
- Build mediante `scripts/start-lab50-local.ps1 -Build`: correcto, 74 páginas generadas. El lanzador comprueba el laboratorio y reemplaza las variables Supabase por las locales sin imprimir claves.
- Primera ejecución dentro del sandbox falló en una junction del test de backup (EPERM); la batería final en Windows normal pasó. Se actualizaron las expectativas y fixtures de presentación que dependían del diseño anterior. No se ocultaron fallos.
- Navegador real con `innerWidth` comprobado en **375, 390, 430, 768, 1024, 1440 y 1920 px**. Sin overflow horizontal global en las mediciones. Viewport redimensionado, no dispositivos físicos ni Safari/iOS.
- Filtros de ocasión y categoría, limpieza, Escape y retorno del foco comprobados. Categoría Rosas paginó de 8 a 10 productos; búsqueda TEST COMPLEMENTS devolvió 4; favoritos devolvió el producto seleccionado. Se abrió su vista rápida con una opción real de personalización.
- Promociones desde filtro y encabezado; flujo real de combo de dos productos hasta carrito y checkout: subtotal Bs 95, descuento Bs 5, total estimado Bs 90. La selección sobrevivió navegación/recarga. Cancelar un segundo armado conservó el carrito anterior. No se enviaron pedidos ni se reportaron pagos.
- Se conservan las regresiones automatizadas de pagos manuales, total cero, reglas de promociones y disponibilidad. No se repitió una batería comercial de mutaciones ni se afirma que hubiera pedidos nuevos.
- Sin SQL, migraciones, seed o cambios administrativos. Directorios activos/legacy y seed intactos; 39 archivos legacy conservados.

## Evidencias y límites

Capturas PNG, índice y manifiesto se entregan fuera de Git en un ZIP separado. Contienen únicamente la UI pública y datos sintéticos, no credenciales, sesiones o snapshots privados. Las capturas anteriores a la incorporación del PNG principal no forman parte del paquete final.

Las imágenes completas/secciones pueden representar la navegación fija dentro del lienzo largo: es una limitación de captura, no una aprobación de cada posición de scroll. Se incluyen capturas de viewport de filtros, vista rápida, carrito y checkout como complemento. El mapa externo y configuraciones locales ausentes no se modificaron para mejorar las fotos.

La revisión visual del propietario queda pendiente. No se considera autorizado publicar este diseño. Solo commit/push de desarrollo; `master`, despliegue y Supabase productiva permanecen intactos.
