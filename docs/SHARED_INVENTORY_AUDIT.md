# Auditoría de inventario compartido — 20 de octubre de 2026

Base de desarrollo: `2b6a622504508196874f07dd4265b55f1d93eec5`, rama `codex/inventory-refunds-dashboard-2`. Master sigue en `ba5654f1939ca71bbb0753cf42cd23269e8613bb`.

La arquitectura compartida funciona en los casos ejecutados. Esta ronda no cambia código comercial, tablas, funciones, migraciones ni seed. Añade un runner LOCAL, pruebas de presentación y este informe. No hubo push, merge, deploy ni escrituras productivas.

## Arquitectura comprobada

1. `inventory_items` identifica el material y su unidad; `current_stock` es el stock físico contable del insumo. Un producto comercial no tiene un contador independiente de unidades fabricables. Incluso un artículo terminado se vende mediante su receta de inventario.
2. `inventory_entries` registra entradas; su trigger crea `inventory_lots` y movimientos. Los ajustes positivos también crean lotes trazables. No se inventaron insumos ni recetas productivas.
3. `product_inventory_requirements` relaciona productos con cantidades de materiales. Las opciones de personalización pueden añadir requerimientos en `customization_option_inventory_requirements`. Varios productos pueden apuntar al mismo UUID de material.
4. Los combos usan las recetas de sus productos y acumulan necesidades por material. `promotion_products` define condiciones comerciales; no es otro almacén ni una segunda fuente de existencias.
5. `create_order` bloquea recetas e insumos en orden, suma las necesidades de todas las líneas/opciones y comprueba stock menos reservas. Crea una reserva agregada por pedido e insumo. El pedido pendiente no descuenta físicamente lotes ni stock.
6. `create_payment(uuid,text)` reporta el pago y conserva la reserva para revisión. La confirmación manual autorizada valida pago, pedido y reservas, consume una sola vez mediante FIFO y reduce stock físico. Un segundo intento de confirmar falla. No se cambió ese contrato.
7. Cancelación de un pedido pendiente o rechazo de su pago libera reservas, sin devolver stock no consumido. La expiración existente libera pedidos sin pago reportado cuando corresponde; un pago ya reportado mantiene su reserva para revisión. No se volvió a ejecutar una prueba temporal de expiración en esta ronda; su contrato fue inspeccionado y sigue cubierto por la suite existente.
8. `handle_inventory_waste` usa `consume_inventory_adjustment`: bloquea el insumo, excluye stock reservado y consume FIFO si no se eligió lote. Un intento de consumir material comprometido se rechaza atómicamente. No es el trigger antiguo de la baseline: se auditó la definición final vigente.
9. La consulta de disponibilidad de la incremental 13 es privada y de lectura. Usa el menor entre stock contable y suma de lotes, resta reservas vigentes y calcula la capacidad mínima por receta. Para carrito/combos verifica demanda conjunta. La creación del pedido mantiene la validación transaccional definitiva.
10. `is_active` es el estado administrativo; los indicadores manuales `is_available` e `is_sold_out` siguen siendo restricciones comerciales. El agotamiento automático se proyecta en la respuesta, sin escribir esos indicadores. Reponer inventario recupera el agotamiento calculado y no reactiva una desactivación administrativa.

La consulta productiva se hizo dentro de `BEGIN READ ONLY`, exclusivamente en el proyecto autorizado. Se compararon definiciones de once funciones de pedidos, pagos, reservas, entradas, ajustes y mermas con las locales probadas: coincidieron. La evidencia detallada productiva se conserva privadamente fuera de Git, sin credenciales ni snapshots remotos en este informe.

## Caso de 30 rosas rojas

Cuatro productos sintéticos comparten un solo material: A Ramo romántico, 12 rosas; B Ramo pequeño, 6; C Caja floral, 8; D Arreglo especial, 15. Las 30 rosas se registraron en dos lotes de 18 y 12 para comprobar FIFO entre lotes.

| Momento | Físico | Lotes | Reservado | Libre | Capacidad A/B/C/D |
|---|---:|---:|---:|---:|---|
| Inicial | 30 | 30 | 0 | 30 | 2 / 5 / 3 / 2 |
| A reservado | 30 | 30 | 12 | 18 | 1 / 3 / 2 / 1 |
| Pago A confirmado | 18 | 18 | 0 | 18 | 1 / 3 / 2 / 1 |
| B reservado | 18 | 18 | 6 | 12 | 1 / 2 / 1 / 0 |
| B cancelado | 18 | 18 | 0 | 18 | 1 / 3 / 2 / 1 |
| C reservado y pago reportado | 18 | 18 | 8 | 10 | 0 / 1 / 1 / 0 |
| Merma de 11 rechazada | 18 | 18 | 8 | 10 | 0 / 1 / 1 / 0 |
| Merma FIFO de 10 aceptada | 8 | 8 | 8 | 0 | 0 / 0 / 0 / 0 |
| Pago C rechazado | 8 | 8 | 0 | 8 | 0 / 1 / 1 / 0 |
| Entrada de 22 | 30 | 30 | 0 | 30 | 2 / 5 / 3 / 2 |
| D desactivado + entrada de 1 | 31 | 31 | 0 | 31 | 2 / 5 / 3 / 0 |

Confirmar A no volvió a descontar sus 12 rosas del stock libre: ya estaban comprometidas. Cancelar B y rechazar C no incrementaron el stock físico. La merma sin lote específico consumió dos lotes correctamente, sin afectar las ocho rosas comprometidas.

Con diez rosas libres, catálogo y detalle HTTP muestran A/D agotados y B/C disponibles. El carrito B+C exige catorce: se bloquea aunque cada producto, por separado, pueda prepararse. La promoción de A y el combo B+C quedan no comprables. La API de pedidos rechazó ambas compras insuficientes sin crear pedidos parciales.

## Concurrencia real, sin mocks

Se sostuvo temporalmente el bloqueo del insumo desde una sesión LOCAL de control para observar dos solicitudes RPC esperando. Las tres carreras observaron dos sesiones PostgreSQL con espera de bloqueo. Se liberó el bloqueo y se verificó un ganador y un rechazo; los pedidos ganadores pendientes se cancelaron después.

| Caso | Ganador observado | Reserva única | Resultado final |
|---|---|---:|---|
| Dos productos por la última rosa | Primer producto sintético de una rosa | 1 | Liberada al cancelar; sin consumo |
| A consume 12 frente a B × 2 consume 12 | B × 2 | 12 | Liberada al cancelar; sin consumo |
| Combo B+C consume 14 frente a A consume 12 | Combo B+C | 14 | Liberada al cancelar; sin consumo |

El ganador no está garantizado para futuras ejecuciones; las aserciones verifican exclusión y cantidades, no un orden fijo. No hubo stock/lotes negativos, reservas duplicadas ni doble consumo. Las cantidades exactas se comprobaron además por SELECT sobre las reservas conservadas.

## Disponibilidad productiva observada

El diagnóstico de los dos artículos consultados confirmó recetas existentes con el mismo insumo y capacidad vendible cero. El catálogo publicado todavía devolvía los indicadores manuales de disponibilidad. No se activó ningún producto ni se agregó stock productivo.

No se encontró una falla en el algoritmo de inventario compartido ni evidencia que justifique atribuir el problema a caché. La proyección calculada de disponibilidad está implementada en la rama, pero la incremental `20261020000100_product_inventory_availability.sql` y el código asociado siguen pendientes de publicación autorizada. No se creó otra migración en esta auditoría.

## Pruebas, datos y límites

- 82 comprobaciones de la batería real SQL/Auth/RPC/HTTP y tres comprobaciones complementarias de cantidades reservadas: 85 PASS. El runner incorpora esas comprobaciones complementarias para próximas ejecuciones.
- El primer intento del harness comparó objetos JSON por orden de claves y se detuvo con un falso fallo del test. Se corrigió solo el runner; los cuatro productos y su inventario sintético de ese intento se conservaron. No fue un defecto de la aplicación.
- La ejecución final creó ocho productos sintéticos: cuatro del caso principal y cuatro de controles de concurrencia. Creó seis pedidos: uno confirmado, uno rechazado y cuatro cancelados; dos pagos, uno confirmado y otro rechazado; dos promociones sintéticas. No se borró ninguno.
- Prefijos conservados: `TEST ROSAS 1792496462141` (harness inicial) y `TEST ROSAS 1792496496173` (ejecución completa). Informes privados, IDs y snapshots de preservación quedan bajo el laboratorio existente de Windows, fuera del repositorio.
- Los 118 productos y 93 pedidos que existían al iniciar la batería final, incluidas las cuatro filas del primer intento, se conservaron exactamente. También se compararon recetas, pagos, clientes, insumos, lotes, entradas, mermas, ajustes, movimientos, reservas y promociones anteriores: sin cambios. LAB100 no se reseteó ni se sembró de nuevo.
- Las pruebas nuevas de UI son de markup estático con estados recibidos del servidor: etiquetas/botones del catálogo y bloqueo del checkout. Se distinguen de las pruebas reales de API/SQL; no constituyen una nueva validación visual en navegador o celular.
- En esta ronda no se probaron expiraciones temporales nuevas ni cancelaciones de ventas ya pagadas. No se crearon pedidos productivos para validar el rechazo: se verificó el contrato por lectura y se reprodujo en LOCAL.

## Cambios de esta ronda

Solo `scripts/qa-shared-roses-local.mjs`, `__tests__/shared-inventory-ui.test.tsx` y este informe. El código comercial y SQL de la corrección anterior permanecen iguales. La aplicación productiva sigue sin recibir la proyección calculada hasta una autorización nueva de publicación.

## Calidad final

- `npm test`: 664/664 en 55 archivos; cuatro pruebas nuevas de markup. El aviso heredado de Vite sobre la API CJS no es un warning de ESLint.
- `npm run lint`: 0 errores / 0 warnings. Se repitió además ESLint sobre el runner final tras incorporar las comprobaciones complementarias.
- `npx tsc --noEmit`: PASS.
- `npm run build`: PASS, 70 páginas generadas, usando exclusivamente las variables del laboratorio LOCAL antes de cargar Next.
- Legacy: 39/39 SHA-256 conservados. Ninguna migración activa ni seed modificados.
- Secret scan estático de patrones sobre archivos versionables: sin hallazgos; no se ejecutó un servicio externo de escaneo. Credenciales y evidencia detallada permanecen fuera de Git.
- `git diff --check`: PASS. Sin cambios en `src/` respecto de la base de esta ronda.
- Web LOCAL reiniciada en `http://localhost:3116` contra la API LOCAL `http://127.0.0.1:62621` (el acceso LAN existente puede usar la IP privada configurada del mismo laboratorio).

No se ejecutó otro replay porque no hubo cambios SQL; el replay de trece migraciones y seed ya pasó en la ronda anterior. Sigue pendiente exclusivamente la revisión/autorización de publicación de esa corrección previa y las validaciones productivas no destructivas posteriores. Esta auditoría no autoriza esas operaciones.
