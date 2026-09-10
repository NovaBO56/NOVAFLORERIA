Sí. Ahora que cambiamos de **NestJS + Firebase** a **Next.js +
Supabase + PostgreSQL**, conviene **replantear todas las fases desde
cero** para que el orden tenga sentido y no terminemos haciendo cosas
adelantadas.

Y mantengo nuestra regla: **solo trabajamos una fase a la vez y no
avanzamos hasta que tú la confirmes.**

# 🌸 PLAN DEFINITIVO DE FASES --- FLORERÍA

# 🛡️ REGLAS MAESTRAS DE EJECUCIÓN --- OBLIGATORIAS

Estas reglas forman parte del Documento Maestro y aplican a **TODAS las
fases**, sin excepción.

## 1. El Maestro es la fuente de verdad

-   Ninguna implementación puede contradecir este documento.
-   Si el código funciona pero no cumple una regla del Maestro, **la
    fase NO está terminada**.
-   No se puede cambiar, omitir, mover ni reinterpretar una
    funcionalidad para hacer pasar una fase.
-   Si existe una contradicción entre código y Maestro, se corrige el
    código, salvo que el usuario apruebe expresamente una modificación
    del Maestro.

## 2. Una fase a la vez

``` text
FASE N
  ↓
Implementación SOLO de FASE N
  ↓
Pruebas funcionales
  ↓
Pruebas de seguridad y permisos
  ↓
Pruebas de validaciones
  ↓
Revisión contra el Maestro
  ↓
Lint + Build
  ↓
¿Todo cumple?
  ├─ NO → CORREGIR
  └─ SÍ
       ↓
FASE TERMINADA
       ↓
CONFIRMACIÓN EXPLÍCITA DEL USUARIO
       ↓
FASE N+1
```

**Nunca se inicia la siguiente fase sin confirmación explícita del
usuario.**

## 3. Criterio obligatorio de cierre

Una fase solo puede marcarse como terminada cuando:

-   Todas sus funcionalidades del Maestro están implementadas.
-   Todas sus reglas y validaciones están implementadas.
-   Los permisos definidos para esa fase están realmente protegidos.
-   RLS está activo y probado cuando la fase toca datos protegidos.
-   Las operaciones del servidor no dependen únicamente de controles de
    interfaz.
-   Las validaciones del servidor existen aunque exista validación en
    cliente.
-   Zod se utiliza donde el Maestro lo exige.
-   Las pruebas comprueban el **código real de producción**, no copias
    de la lógica.
-   Los cambios de Supabase están respaldados por migraciones
    versionadas en `supabase/migrations`.
-   Los casos de error relevantes están probados.
-   `lint` pasa.
-   `build` pasa.
-   No existen errores conocidos pendientes dentro del alcance de la
    fase.
-   No se implementaron funcionalidades de fases futuras.
-   Se documentan las decisiones técnicas relevantes.
-   Se entrega un checklist de cumplimiento antes de solicitar el
    cierre.

## 4. Seguridad obligatoria

Para datos protegidos, el flujo esperado es:

``` text
UI
 ↓
Server Action / Route Handler
 ↓
Autorización
 ↓
Zod / validación del servidor
 ↓
Supabase
 ↓
PostgreSQL + RLS
```

RLS es una **defensa obligatoria de base de datos**, no un sustituto de
la autorización de la aplicación.

Toda tabla sensible nueva debe:

1.  Tener RLS habilitado mediante migración.
2.  Tener políticas explícitas.
3.  Definir acceso para `anon` cuando corresponda.
4.  Definir acceso para `authenticated`.
5.  Definir acceso para `empleado`.
6.  Definir acceso para `administrador`.
7.  Tener pruebas de acceso permitido y denegado cuando corresponda.

## 5. Migraciones obligatorias

Todo cambio de esquema de Supabase/PostgreSQL debe quedar en:

``` text
supabase/migrations/
```

No se considera suficiente crear o modificar tablas manualmente desde el
Dashboard.

Las migraciones deben ser versionadas, reproducibles y corresponder al
estado real de la base de datos.

## 6. Validación obligatoria

Zod es la fuente de verdad de las reglas de validación de las entidades.

``` text
Cliente → Zod
Servidor → Zod → Supabase
```

**Nunca confiar solamente en la validación del cliente.**

No se considera cumplimiento simplemente tener `zod` instalado: debe
utilizarse en el código donde el Maestro lo exige.

## 7. Pruebas obligatorias

Las pruebas deben ejecutar la implementación real:

``` text
test
 ↓
importa función real de producción
 ↓
ejecuta función real
 ↓
assert
```

No es válido reemplazar la función de producción por una copia
equivalente dentro del test.

## 8. No adelantar fases

Si durante una fase aparece una necesidad perteneciente a una fase
futura:

-   se registra;
-   no se implementa anticipadamente;
-   se continúa con la fase actual.

Ejemplo: **la generación automática de lotes pertenece a FASE 3** y no
debe implementarse durante FASE 2.

## 9. FASE DE CORRECCIONES

Si se descubre después del cierre que una fase no cumplía completamente
el Maestro, se crea una **FASE DE CORRECCIONES**.

Esta fase:

-   no cambia la numeración de las fases;
-   no permite avanzar a la siguiente fase;
-   corrige exclusivamente incumplimientos detectados;
-   vuelve a ejecutar las pruebas afectadas;
-   requiere confirmación explícita del usuario antes de continuar.

## 10. Checklist obligatorio antes de cerrar cualquier fase

``` text
[ ] Requisitos del Maestro revisados
[ ] Funcionalidades implementadas
[ ] Reglas implementadas
[ ] Validaciones de servidor
[ ] Zod cuando corresponda
[ ] Autorización
[ ] RLS
[ ] Policies
[ ] Pruebas de permisos sobre código real
[ ] Pruebas funcionales
[ ] Pruebas de errores
[ ] Migraciones versionadas
[ ] Lint
[ ] Build
[ ] Sin errores pendientes del alcance
[ ] Sin funcionalidades adelantadas
[ ] Documentación actualizada
[ ] Usuario confirma cierre
```

**Si una casilla no está cumplida, la fase no está cerrada.**

------------------------------------------------------------------------

## 🟢 FASE 0 --- Preparación del proyecto

**Objetivo:** dejar la base técnica completamente lista.

### Incluye

-   Next.js
-   TypeScript
-   App Router
-   Tailwind CSS
-   shadcn/ui
-   Supabase
-   PostgreSQL
-   Supabase Auth preparado
-   Supabase Storage preparado
-   Vercel preparado
-   Variables de entorno
-   Git/GitHub
-   ESLint
-   Testing
-   Estructura inicial
-   Manejo base de errores
-   Validación base
-   Configuración de desarrollo/producción

### NO incluye

-   Login funcional
-   Usuarios
-   Productos
-   Inventario
-   Pedidos
-   Frontend final
-   UI/UX

**Resultado:** proyecto limpio y preparado.

------------------------------------------------------------------------

# 🔐 FASE 1 --- Autenticación, usuarios y permisos

Ahora hacemos que el sistema sepa **quién está utilizando el sistema**.

### Administrador

Puede:

-   Crear usuarios.
-   Desactivar usuarios.
-   Gestionar roles.
-   Configuración crítica.
-   Todas las operaciones de la florería.

### Empleado

Puede realizar prácticamente **todas las operaciones normales**, igual
que el administrador.

No puede:

-   Gestionar usuarios.
-   Cambiar roles/permisos.
-   Modificar configuración crítica.
-   Eliminar/modificar auditoría.

### Incluye

-   Supabase Auth.
-   Login.
-   Logout.
-   Sesiones.
-   Usuarios.
-   Roles.
-   Protección de rutas.
-   Middleware cuando corresponda.
-   RLS de PostgreSQL.
-   Protección de operaciones del servidor.

**Resultado:** tenemos un sistema seguro que sabe quién puede hacer qué.

------------------------------------------------------------------------

# 🌸 FASE 2 --- Catálogo y productos

Aquí construimos la **estructura de los productos**, todavía sin
preocuparnos por hacer el frontend bonito.

### Productos

-   Nombre.
-   Descripción.
-   Precio.
-   Imágenes.
-   Categoría.
-   Ocasión.
-   Temporada.
-   Destacado.
-   Disponible/no disponible.
-   Agotado.
-   Orden del catálogo.

### Categorías

-   Crear.
-   Editar.
-   Activar/desactivar.

### Temporadas

-   San Valentín.
-   Día de la Madre.
-   Cumpleaños.
-   Otras.

### Combos

Preparar la estructura para productos compuestos.

### Imágenes

-   Supabase Storage.
-   Validación.
-   WebP.
-   Compresión.
-   Redimensionamiento.
-   Límite de imágenes.

**Resultado:** el backend puede administrar correctamente el catálogo.

------------------------------------------------------------------------

# 📦 FASE 3 --- Inventario

Esta será una de las fases más importantes.

### Inventario

-   Flores.
-   Insumos.
-   Componentes.
-   Productos.

### Entradas

La florería registra la mercancía que llegó.

El sistema genera **automáticamente el lote**.

No se crea manualmente el lote.

### Lotes

-   Entrada.
-   Cantidad.
-   Fecha.
-   Información necesaria.

### FIFO

    Lote antiguo
         ↓
    se utiliza primero
         ↓
    Lote siguiente

### Stock

-   Stock actual.
-   Stock mínimo.
-   Bajo stock.
-   Agotado.
-   No permitir stock negativo.

### Mermas

-   Cantidad.
-   Motivo.
-   Usuario.
-   Fecha.

### Ajustes

-   Cantidad.
-   Motivo obligatorio.
-   Usuario.
-   Auditoría.

### Historial

-   Entradas.
-   Salidas.
-   Mermas.
-   Ajustes.

**Resultado:** tenemos inventario real y controlado.

------------------------------------------------------------------------

# 🌹 FASE 4 --- Arreglos y consumo de inventario

Ahora conectamos **productos con inventario**.

Ejemplo:

    ARREGLO AMOR

    12 rosas rojas
    1 oso
    1 cinta
    1 papel

El sistema sabe qué inventario necesita cada arreglo.

### Personalización

Dependiendo del arreglo:

-   Cantidad de rosas.
-   Color.
-   Tipo de flor.
-   Oso.
-   Decoración.
-   Otros componentes.

### Al vender

Automáticamente:

    Rosas     -12
    Osos       -1
    Cintas     -1
    Papel      -1

Y nunca permitir:

    Stock = -5 ❌

**Resultado:** los arreglos realmente consumen inventario.

------------------------------------------------------------------------

# 🛒 FASE 5 --- Pedidos online

Ahora hacemos el sistema de pedidos.

### Flujo

    Producto
     ↓
    Personalización
     ↓
    Carrito
     ↓
    Datos cliente
     ↓
    Resumen
     ↓
    Crear pedido

### Incluye

-   Número único.
-   Cliente.
-   Productos.
-   Cantidades.
-   Personalización.
-   Mensaje.
-   Nota.
-   Total.
-   Estado.
-   Fecha/hora.

### Protección

-   Doble clic.
-   Pedidos duplicados.
-   Precio manipulado.
-   Stock insuficiente.
-   Producto eliminado/no disponible.

### Estados

    PENDIENTE DE PAGO
            ↓
    CONFIRMADO
            ↓
    EN PREPARACIÓN
            ↓
    LISTO
            ↓
    FINALIZADO

También estados de cancelación/rechazo donde corresponda.

### Reserva de inventario

Definiremos aquí cómo se comporta el stock cuando existe un pedido
pendiente.

**Resultado:** el backend puede recibir y gestionar pedidos
correctamente.

------------------------------------------------------------------------

# 💳 FASE 6 --- Pago QR

Ahora incorporamos el flujo que definiste.

La florería tiene **un solo QR**.

    Pedido
     ↓
    Mostrar QR
     ↓
    Cliente paga
     ↓
    Pendiente
     ↓
    Florería verifica
     ↓
    Pago confirmado

### Incluye

-   QR configurable.
-   Monto exacto.
-   Estado del pago.
-   Confirmación manual.
-   Usuario que confirmó.
-   Fecha/hora.
-   Protección contra doble confirmación.

El cliente **no confirma automáticamente su propio pago**.

**Resultado:** el pago QR queda controlado por la florería.

------------------------------------------------------------------------

# 📱 FASE 7 --- WhatsApp

Después conectamos WhatsApp al pedido.

Mensaje generado automáticamente con:

-   Número de pedido.
-   Cliente.
-   Productos.
-   Personalización.
-   Cantidades.
-   Total.
-   Información necesaria.

WhatsApp será **complemento de comunicación**, no la base del sistema.

El pedido ya existe en PostgreSQL.

También podrá utilizarse para comunicar estados importantes.

**Resultado:** pedido + WhatsApp funcionan juntos.

------------------------------------------------------------------------

# 🏪 FASE 8 --- Ventas físicas

Ahora incorporamos las ventas realizadas directamente en la tienda.

### Venta física

    Buscar producto
     ↓
    Agregar
     ↓
    Cantidad
     ↓
    Descuento
     ↓
    Método de pago
     ↓
    Confirmar venta

### Diferencia

    ONLINE
    FÍSICA

El método de pago es independiente:

    Tipo: FÍSICA
    Método: QR

o:

    Tipo: FÍSICA
    Método: EFECTIVO

### Incluye

-   Venta rápida.
-   Buscador.
-   Productos.
-   Descuentos.
-   Métodos de pago.
-   Comprobante.
-   Inventario.
-   Caja.

**Resultado:** podemos registrar las ventas de tienda.

------------------------------------------------------------------------

# ❌ FASE 9 --- Cancelaciones y devoluciones

Aquí formalizamos las operaciones posteriores a una venta.

### Cancelación de venta

Nunca eliminar.

    VENTA
     ↓
    CANCELADA
     ↓
    DEVOLVER INVENTARIO
     ↓
    REVERTIR MOVIMIENTO
     ↓
    AUDITORÍA

Solo el **administrador** puede cancelar una venta.

Motivo obligatorio.

### Devoluciones

Aquí diferenciamos:

-   Cancelación.
-   Devolución/reintegro de una venta ya finalizada.

Y definimos las reglas exactas de cada caso.

**Resultado:** no perdemos información y las operaciones quedan
trazables.

------------------------------------------------------------------------

# 💰 FASE 10 --- Caja

Ahora hacemos la gestión financiera operativa.

### Incluye

-   Apertura.
-   Cierre.
-   Ventas.
-   Ingresos.
-   Gastos.
-   Ajustes.
-   Métodos de pago.
-   Diferencias.
-   Historial.

Una caja cerrada no se modifica normalmente.

Las correcciones quedan auditadas.

**Resultado:** sabemos qué pasó con la caja.

------------------------------------------------------------------------

# 👥 FASE 11 --- Clientes y promociones

### Clientes

-   Nombre.
-   Teléfono.
-   WhatsApp.
-   Correo cuando corresponda.
-   Cumpleaños.
-   Historial.
-   Pedidos.
-   Ventas.
-   Clientes recurrentes.

### Promociones

-   Cumpleaños.
-   Clientes recurrentes.
-   Temporadas.
-   Combos.
-   Descuentos.

Cada descuento queda registrado.

**Resultado:** la florería puede gestionar sus clientes y promociones.

------------------------------------------------------------------------

# 📊 FASE 12 --- Dashboard y reportes

Cuando ya existen todos los datos, hacemos los reportes.

### Dashboard

-   Ventas.
-   Pedidos.
-   Inventario.
-   Caja.
-   Alertas.
-   Productos más vendidos.
-   Clientes.
-   Cumpleaños.
-   Pagos pendientes.

### Reportes

-   Ventas.
-   Online/físicas.
-   Métodos de pago.
-   Productos vendidos.
-   Inventario.
-   Mermas.
-   Caja.
-   Cancelaciones.
-   Clientes.

### PDF

-   Reportes administrativos.
-   Comprobante para cliente.

**No incluimos todavía cálculo de costo/ganancia**, como decidiste.

------------------------------------------------------------------------

# 🔔 FASE 13 --- Notificaciones y horarios

Aquí incorporamos:

### Notificaciones

-   Nuevo pedido.
-   Pago pendiente.
-   Stock bajo.
-   Stock agotado.
-   Pedido listo.
-   Cumpleaños.
-   Alertas importantes.

### Horario

    Lunes      08:00–20:00
    Martes     08:00–20:00
    ...

Configuración desde administración.

### Fuera de horario

La web puede mostrar:

🌙 **"La florería está cerrada"**

con la animación correspondiente.

Pero el catálogo puede seguir funcionando y, si lo definimos así, **se
pueden recibir pedidos fuera de horario** para atenderlos
posteriormente.

------------------------------------------------------------------------

# 🔐 FASE 14 --- Auditoría + seguridad completa

Aunque la seguridad se implementará desde Fase 0/1, aquí hacemos la
revisión completa.

### Auditoría

Registrar:

-   Usuario.
-   Fecha.
-   Hora.
-   Acción.
-   Registro.
-   Antes.
-   Después.
-   Motivo.

Ejemplos:

    Venta cancelada
    Precio modificado
    Inventario ajustado
    Pago confirmado
    Merma registrada
    Producto modificado
    Descuento aplicado

### Seguridad

-   RLS.
-   Roles.
-   Validaciones.
-   Rate limiting.
-   Protección de endpoints.
-   Idempotencia.
-   Operaciones atómicas.
-   Manejo de errores.
-   Logs.
-   Protección de información sensible.

**Resultado:** sistema preparado para producción.

------------------------------------------------------------------------

# 🧠 FASE 15 --- UX

**Aquí recién empezamos a pensar profundamente en la experiencia.**

No programamos todavía el frontend final.

Diseñamos los flujos.

### Cliente

    Inicio
     ↓
    Catálogo
     ↓
    Buscar
     ↓
    Producto
     ↓
    Personalizar
     ↓
    Carrito
     ↓
    Datos
     ↓
    Resumen
     ↓
    QR
     ↓
    Pedido
     ↓
    Seguimiento

### Administración

    Login
     ↓
    Dashboard
     ↓
    Pedidos
     ↓
    Ventas
     ↓
    Inventario
     ↓
    Caja
     ↓
    Clientes
     ↓
    Reportes
     ↓
    Configuración

Aquí definimos:

-   Navegación.
-   Jerarquía.
-   Estados.
-   Mensajes.
-   Errores.
-   Cargas.
-   Confirmaciones.
-   Flujos.
-   Experiencia móvil.

------------------------------------------------------------------------

# 🎨 FASE 16 --- UI + DESIGN SYSTEM

Ahora diseñamos la identidad visual.

### Design System

-   Colores.
-   Tipografías.
-   Espaciado.
-   Botones.
-   Inputs.
-   Cards.
-   Tablas.
-   Modales.
-   Toasts.
-   Alertas.
-   Iconos.
-   Estados.
-   Loading.
-   Animaciones.
-   Responsive.

### Web pública

Debe sentirse como una **florería**, no como un panel administrativo.

### Administración

Debe priorizar:

**rapidez + claridad + información.**

------------------------------------------------------------------------

# 💻 FASE 17 --- FRONTEND

Ahora sí construimos el frontend con:

**Next.js + TypeScript + Tailwind + shadcn/ui.**

### Cliente

-   Inicio.
-   Catálogo.
-   Buscador.
-   Filtros.
-   Producto.
-   Personalización.
-   Carrito.
-   Checkout.
-   QR.
-   Seguimiento.
-   Estados.
-   Cerrado.
-   Animaciones.

### Administración

-   Login.
-   Dashboard.
-   Pedidos.
-   Ventas.
-   Inventario.
-   Lotes.
-   Mermas.
-   Caja.
-   Clientes.
-   Catálogo.
-   Reportes.
-   Auditoría.
-   Configuración.

------------------------------------------------------------------------

# 🔗 FASE 18 --- INTEGRACIÓN

Conectamos definitivamente:

    NEXT.JS
       ↓
    SUPABASE
       ↓
    POSTGRESQL

Y verificamos todos los flujos reales:

    Cliente
     ↓
    Pedido
     ↓
    QR
     ↓
    Pago confirmado
     ↓
    Venta
     ↓
    Inventario
     ↓
    Caja
     ↓
    Historial

------------------------------------------------------------------------

# 🧪 FASE 19 --- PRUEBAS COMPLETAS

Aquí intentamos **romper el sistema**.

### Casos importantes

-   Doble clic.
-   Pedido duplicado.
-   Venta duplicada.
-   Dos clientes comprando el último stock.
-   Stock negativo.
-   Precio manipulado.
-   Pago duplicado.
-   Confirmación doble.
-   Usuario sin permiso.
-   Internet perdido.
-   Supabase temporalmente inaccesible.
-   Backend/API con error.
-   Imagen inválida.
-   Cancelación.
-   Devolución.
-   Caja cerrada.
-   Datos inválidos.

------------------------------------------------------------------------

# 🚀 FASE 20 --- PRODUCCIÓN

Finalmente:

-   Supabase producción.
-   PostgreSQL producción.
-   Storage producción.
-   Vercel.
-   Variables de producción.
-   Dominio cuando lo tengan.
-   Seguridad final.
-   Backups.
-   Monitoring.
-   Pruebas finales.

------------------------------------------------------------------------

# 🔄 REGLA PARA TODO EL PROYECTO

Esta es la parte **más importante**:

### NO hacemos:

> "Claude, haz todo el sistema."

### Hacemos:

    FASE 0
     ↓
    Claude trabaja
     ↓
    Pruebas
     ↓
    Revisión conmigo
     ↓
    ❌ ¿Hay errores?
     ↓
    Corregir
     ↓
    ✅ Fase terminada
     ↓
    TU CONFIRMACIÓN
     ↓
    FASE 1
