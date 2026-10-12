# ROUND 3 FIX — revisión local

Fecha: 12 de octubre de 2026. Rama: `fix/certification-round-3`.
Base exacta: `bc5430260188c39929ebf222f736047ff26d3547`.

Solo corrección y regresión dirigida local. Sin merge, deploy, SQL remoto,
cambios de Auth/RLS ni cambios de migraciones. No se repitió la batería masiva.

## Correcciones y evidencia

| BREAK | Prioridad | Antes | Cambio | Resultado dirigido |
|---|---|---|---|---|
| 001 | P1 | Panel limitado a 1.000 pedidos | Paginación real, conteo exacto, filtros/búsqueda en DB y pagos incluidos en cada página | PASS: recorrido de todas las páginas con más de 1.000, sin duplicados; #1104 encontrado por API y navegador; UI página 2 de 35 |
| 002 | P1 | Ventas omitidas y Bs 10.240 faltantes en snapshot original | Recorrido completo por páginas de 500, orden estable y suma en centavos; mismo conjunto para JSON/PDF | PASS: 1.171 ventas y Bs 31.148.798,69 conciliados con SQL en el último snapshot previo al flujo; PDF real 200 |
| 003 | P2 | Dashboard 500 por consulta con muchos UUID | Join con pedidos en páginas acotadas; ventas/inventario/cumpleaños recorren todas sus páginas | PASS: 200, ventas de hoy y top 5 coinciden con SQL; más de 1.000 ventas recientes |
| 004 | P2 | Products-sold 500 y riesgo de truncamiento | Join sobre order_items/orders, paginación completa; cantidades en milésimas e importes en centavos | PASS: cantidades/revenue de 187 grupos coinciden con SQL; JSON y PDF reales 200 |
| 005 | P2 | PATCH producto 500 con detalles del parser | Captura específica de JSON inválido, validación de objeto; creación de producto equivalente también controlada | PASS: cuerpos confirmados devuelven 400 sin escritura; tests preservan 403 de Auth y 500 interno |
| 006 | P2 | 0.001 persistía como 0 | Precio positivo, dos decimales y máximo de numeric(12,2) | PASS: 0.001 devuelve 400 sin persistencia; 0.01 devuelve 200 y persiste; producto sintético restaurado a su precio anterior |
| 007 | P2 | Precio fuera de rango devuelve overflow 500 | Misma validación monetaria antes de escribir | PASS: 1e10/1e20 devuelven 400, máximo 9.999.999.999,99 aceptado; sin cambio por rechazo |
| 008 | P2 | Cantidad 1e9 devuelve 500 | Contrato numeric(12,3): mínimo 0.001, máximo 999.999.999,999 y tres decimales | PASS: 1e9 y stock insuficiente devuelven 400; 0.001/0.5 reales conservados en producto fraccionario; reservas canceladas por API |
| 009 | P2 | Fechas imposibles de entradas devuelven 500 | Validación de calendario y formato ISO, sin normalizar días inexistentes | PASS: tres fechas confirmadas devuelven 400; fecha ISO real aceptada con entrada TEST |
| 010 | P2 | UUID inválido produce 500 en siete rutas | Validación UUID previa; recursos ausentes conservan 404 según contrato | PASS: siete rutas reales devuelven 400 para bad; unitarios cubren 404 público/de pedido y ausencia de llamadas RPC para UUID inválido |
| 011 | P3 | Nombre de cliente largo desborda checkout | overflow-wrap:anywhere y columnas minmax(0,…) | PASS: cliente de 200 caracteres y producto largo, 390/768/1280; recarga del build final sin overflow |
| 012 | P3 | Nombre/descripción largos desbordan catálogo/detalle | Wrapping, límites de botones y ancho mínimo de columnas | PASS: nombre de 200 y descripción de 2.000 caracteres, 390/768/1280 reales |

El dataset original siguió evolucionando durante QA: el valor de 1.160 ventas /
Bs 31.148.387,68 corresponde a un snapshot anterior. Ese caso exacto también tiene
regresión unitaria con mocks. No se presenta el nuevo total SQL como el mismo
snapshot antiguo ni una prueba unitaria como una prueba real de Supabase.

La búsqueda numérica compara el número de pedido exacto; nombres y teléfonos
usan coincidencia parcial. Estado, tipo, expiración y pago pendiente se filtran
antes de paginar. Pedidos eliminados lógicamente siguen excluidos.

## Validación

- `npm test`: 472 tests PASS / 33 archivos, incluidos 63 nuevos unitarios.
- `npm run lint`: 0 errores / 0 warnings.
- `npx tsc --noEmit`: exit 0.
- `npm run build`: exit 0, 69 páginas. Variables de Supabase locales en memoria.
- HTTP/Auth/SQL dirigido sobre 3113/57621: 81/81 comprobaciones finales; 74 requests
  secuenciales instrumentadas. Sin pruebas de carga ni nuevas carreras.
- Flujo real: pedido normal, reserva, pago pendiente, confirmación, recibo PDF,
  seguimiento, pedido promocional gratuito sin pago, expiración, venta física/caja.
- Conciliación posterior: 14 consultas independientes, todas con cero diferencias
  (inventario, lotes, reservas, totales, pagos, clientes, caja y devoluciones).
- Navegador real: clientWidth/scrollWidth 375/375, 753/753 y 1265/1265 con viewport
  390/768/1280. Consola local revisada: cero entradas warn/error capturadas.
- Replay local vacío independiente 58621: nueve migraciones + seed, exit 0.
- `ISOLATED_SECURITY_TESTS.sql`: exit 0 y ROLLBACK.
- Las 39 migraciones legacy coinciden con sus SHA-256 históricos. Las nueve
  activas y seed no cambiaron. No se necesita una nueva migración.
- Secret scan sin hallazgos; credenciales, logs y snapshots permanecen fuera de Git.

## Incidencias y datos de prueba

El primer intento del harness leyó incorrectamente una promoción almacenada como
UUID, y creó un pedido normal en lugar del gratuito esperado. Se corrigió solo el
harness; se preservó el resultado fallido. La regresión corregida pasó 73/73;
el script final ampliado pasó 81/81. No fue un defecto de la aplicación.

Los intentos dirigidos crearon en total 12 pedidos sintéticos y una entrada de
inventario. Los UUID, pagos asociados y snapshots completos están en los tres
archivos privados de regresión. No se borraron datos ni evidencia. Los pedidos
decimales se cancelaron por API como parte de su prueba. No se creó un pedido
desde la comprobación visual del checkout largo.

Docker estaba apagado al comenzar y se detuvo antes de la conciliación final;
se reactivó y la conciliación pudo completarse. También se corrigió el mock PDF
de los tests nuevos y una advertencia de hooks antes de los checks finales.
Vitest imprime su aviso de deprecación CJS de Vite; no es un warning de lint.

## Reproducción y límites

`scripts/qa-round-three-local.mjs` reutiliza las fixtures privadas de ROUND 3:

```text
node scripts/qa-round-three-local.mjs <directorio-privado-fixtures> <lab-local-sin-link> <http-local> <resultado-privado-fuera-del-repo>
```

Exige loopback, API 57621 y ausencia de project-ref remoto. No imprime claves.
Las evidencias JSON, logs y capturas se conservaron localmente fuera del repositorio.

Los reportes paginados tienen orden estable, pero no una transacción de snapshot
que abarque las peticiones. Esta ronda comprueba exactitud sobre el dataset
estable de regresión; no certifica reportes durante escrituras simultáneas.
La generación completa de JSON/PDF sigue siendo proporcional al período consultado.

Los doce defectos confirmados quedan cerrados para el alcance dirigido probado.
Esto no sustituye una repetición posterior de la batería completa ROUND 3 ni
constituye autorización para publicar. Rama preparada exclusivamente para revisión.
