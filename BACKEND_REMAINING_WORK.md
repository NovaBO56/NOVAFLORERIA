# Pendientes del backend — revisión local

Auditoría del código de `revision/backend-certificado` (HEAD inicial `2ad2be7`). A: conectado; B: implementado pendiente de validación real ampliada; C: incompleto; D: parcial; E: API sin UI; F: UI con backend incompleto; G: demostración. Las cuatro migraciones certificadas y las 39 históricas se preservan. Destino exclusivo: NOVA-LOCAL-VALIDATION, http://127.0.0.1:55421, sin enlace remoto.

| Módulo | Estado | Backend | API | UI | Tests | Problema | Prioridad |
|---|---|---|---|---|---|---|---|
| Catálogo | B | Productos, categorías, temporadas, imágenes y recetas | Existentes | Conectada | Unitarios; ampliar HTTP | Validar personalización y disponibilidad completas | P1 |
| Inventario | D | Entradas FIFO y reservas; ajustes/mermas inconsistentes | Existentes | Conectada | Falta regresión de lotes | Ajustes no actualizan lotes; merma sin lote tampoco; acepta lote de otro ítem y stock reservado | P0 |
| Pedidos online | B | 035/036/037, estados y cancelación | Conectadas | Checkout/seguimiento | Certificación local anterior | Repetir flujo con configuración real local | P1 |
| Ventas físicas | D | Consumo, descuentos y caja | Conectadas | Conectada | Concurrencia anterior | Sesión de caja no bloqueada frente a cierre | P1 |
| Caja | D | Apertura/cierre/movimientos | Conectadas | Conectada | Ampliar concurrencia | Aperturas simultáneas; devolución no registra salida automática | P1 |
| Clientes | B | Creación, búsqueda e historial | Existentes | Conectada | Ampliar HTTP | Verificar duplicados y asociación | P1 |
| Promociones | B | Porcentaje, monto/combo, mínimos, vigencia, total cero | Conectadas | Conectada | Certificación anterior | Repetir casos negativos y stock/pago | P1 |
| Pagos | B | RPC privado de dos argumentos; confirmación/rechazo | Conectadas | Conectada | Certificación anterior | Repetir teléfono, duplicados y roles | P1 |
| WhatsApp | E | Reemplazo no atómico | POST admin/GET público | Falta configuración | Falta HTTP admin | Activación/desactivación y UI; carrera al reemplazar | P1 |
| QR | E | Storage y reemplazo no atómico | POST admin/GET público | Falta configuración | Falta archivo real | Tipo declarado sin firma; activación/desactivación y UI | P1 |
| Horarios | F | Días y zona America/La_Paz | PATCH admin/GET público | Configuración ausente | Unitarios | HH:MM acepta horas inválidas y reapertura incompleta | P1 |
| Usuarios/roles | B | Auth y perfil activo; acceso por rol | Existentes | Conectada | Roles anteriores | Redirección login admite URL con doble barra; ampliar JWT | P1 |
| Auditoría | E | audit_logs/audit_trail; productos y eventos parciales | audit-log | Falta pantalla | Falta cambios sensibles | Cobertura insuficiente de configuración y operaciones críticas | P1 |
| Notificaciones | E | Tabla/triggers y lectura compartida | GET/PATCH | Sin consumidor operacional | Falta integración | Conectar lectura/marcado sin inventar sistema paralelo | P1 |
| Reportes/dashboard | B | Consultas reales, sin mocks operacionales | Existentes | Conectada | Ampliar HTTP | Límites diarios UTC del dashboard frente a zona comercial | P1 |
| Devoluciones/cancelaciones | D | Reversión de inventario y sale_returns | Existentes | Conectada | Falta caja | Devolución física requiere movimiento monetario atómico; API permite empleado aunque RPC exige admin | P1 |
| Rate limiting | D | Conteo no serializado; RPC público | Públicos sensibles | N/A | Unitarios de valores | Carrera de conteo; fallo abierto en escrituras; contrato manipulable directamente | P1 |
| Configuración administrativa | F | APIs existentes | Editor general apunta a ruta inexistente | Falta panel integrado | Falta integración | Crear panel existente de configuración, sin semillas ficticias | P0 |
| Rutas de demostración | G | /admin/prueba-ui y /prueba-cliente | No operacionales | Datos de demostración | N/A | Conservar justificadas para desarrollo; impedir exposición productiva | P2 |

Este inventario precede a los cambios funcionales. La certificación final requiere replay local, SQL real, HTTP/JWT, pruebas negativas y regresión. No se declara backend terminado mientras quede P0/P1.
