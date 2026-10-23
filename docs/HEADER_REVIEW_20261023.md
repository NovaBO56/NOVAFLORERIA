# Cabecera pública — revisión LOCAL del 23/10/2026

Rama `codex/inventory-refunds-dashboard-2`. HEAD y master conservan `42b75b8166e60cf9c44709c1891905da70a42e22`. Todo el trabajo anterior sin commit está conservado. No hubo push, merge, deploy ni operaciones Supabase remotas.

## Alcance

Solo `src/components/public/home/header.tsx`, estilos de cabecera en `src/app/globals.css` y clase visual de ClosedBanner en `src/components/public/home/sections.tsx`; más este informe. No se cambiaron hero, fotografías, texto “Flores que hablan”, catálogo, producto, complementos, compras, SQL ni APIs.

Franja de marca crema/rosa/lavanda, contenedor redondeado, sombra discreta y motivos botánicos vectoriales decorativos sin interacción. El archivo oficial del logo sigue intacto. Una mezcla CSS darken integra su fondo pastel sobre un tono compatible: no es una eliminación de fondo ni una transparencia inventada. Para transparencia de archivo sigue haciendo falta el original con alfa, pero no se recortaron pétalos o letras.

Logo a la izquierda, navegación al centro en escritorio y acciones a la derecha. Menú móvil conserva todos los destinos y buscador; favoritos y carrito tienen acceso directo en celular. Se conservan contadores y callbacks. Se ajustó el margen de anclas para evitar títulos detrás del encabezado. La franja violeta mantiene exactamente la condición y mensajes dependientes del estado real, con tratamiento visual compatible.

## Controles técnicos

`npm test` predeterminado se ejecutó dos veces: 714 PASS / 1 timeout en una prueba existente de importación/persistencia de promociones; ninguna aserción funcional falló. No se modificó la prueba ni su límite de 5000ms.

Repetición completa con paralelismo limitado: `npm test -- --maxWorkers=2 --minWorkers=1`: **715/715**, 60 archivos, exit0, 84.57s. La prueba previamente afectada terminó en1793ms. Esto apunta a contención del entorno, no demuestra que el comando predeterminado esté libre de incidencias en esta máquina.

Build final PASS (73/73 páginas); lint PASS, 0 errores y 0 warnings; TypeScript independiente PASS. git diff --check correcto. La advertencia CJS de Vite es una advertencia de dependencia, no un warning de ESLint.

## Evidencia

Antes: `header-before-20261023.png`, captura real de399px, muestra logo rectangular en cabecera blanca. Las capturas y medidas posteriores están fuera de Git, en la carpeta de visualizaciones de Codex. No se consideran PASS visual las capturas incompletas ni una resolución solicitada que no coincida con innerWidth.

Sin publicación automática. La aplicación de revisión utiliza únicamente el laboratorio LOCAL.

## Navegador final

Validación visual real en innerWidth 375, 390, 430, 768, 1280 y 1440 px. Logo completo, acciones visibles y sin overflow horizontal. scrollWidth respectivos: 356, 371, 411, 749, 1261 y 1421 px. Capturas header-after-{ancho}-20261023.png y medidas header-responsive-20261023.json en la carpeta privada de visualizaciones.

Las seis anclas de escritorio navegaron a sus secciones existentes. Seguimiento abrió su formulario público. Búsqueda mostró resultados y permitió quitar el filtro; favoritos activó/desactivó su filtro conservando el contador; carrito abrió con sus tres unidades existentes y cerró sin cambios. En móvil de 390 px, menú con siete destinos y búsqueda; Tab pasó de cerrar al buscador; Escape cerró y devolvió foco a Abrir menú; Ubicación navegó y cerró el panel. No se crearon pedidos ni se modificaron datos comerciales.

La franja de horario mostró el aviso LOCAL de tienda cerrada en las seis resoluciones. No se alteró la configuración para probar otros horarios. No se realizó prueba en celular físico en esta tarea. Capturas de navegador reales, no simulaciones de diseño.

HEAD y master siguen sin cambios. Los cambios previos del árbol permanecen; no se declara árbol limpio porque esta entrega conserva trabajo sin commit.
