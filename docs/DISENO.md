# Livingshop — Sistema de Órdenes, Producción y Ventas

**Estado:** Borrador v1 — sujeto a iteración
**Última actualización:** 2026-08-11

## 1. Resumen del problema

Livingshop (fábrica y venta de muebles a medida) tiene un sistema que hoy solo sirve para:
1. Crear la orden de compra.
2. Volcar TODAS las especificaciones reales del pedido (tipo de mueble, medidas, tela, patas, orientación, decos) como texto libre en el campo "Comentarios".
3. Generar el PDF de la orden para el cliente.

A partir de esa orden, el resto del flujo se hace **a mano**, transcribiendo información a 3 lugares distintos:

| Output | Quién lo usa | Contenido clave |
|---|---|---|
| Orden de compra (PDF cliente) | Cliente / ventas | Datos del cliente, productos, pagos, comentarios libres |
| Ficha técnica | Fábrica (diseño/corte) | Por cada producto: atributos técnicos + croquis con medidas, fecha de entrega, fecha de impresión (versión vigente) |
| Planilla de producción | Planta / operarios | Por cada línea de producto: checkboxes de avance (Tela, Esqueleto, Espuma, Corte, Tapizado, Listo) |
| Planilla de ventas | Ventas / administración | Por línea vendida: proveedor, forma de pago, importe, saldo, estado de entrega |

El objetivo de este proyecto es que **una sola carga de datos** (producto + orden) genere los 4 outputs automáticamente, elimine la transcripción manual, y digitalice las dos planillas de Google Sheets como pantallas del sistema.

## 2. Hallazgos clave al revisar los documentos reales

- **Una orden puede tener varios productos de tipos completamente distintos**, cada uno con su propio set de atributos. Ejemplos reales encontrados:
  - *Esquinero Nube*: Medida, Brazo, Base, Patas, Tela, Almohadón de asiento (densidad), Almohadón de respaldo, Orientación.
  - *Chester Industrial*: Medida, Brazo, Base, Patas, Tela, Almohadón de asiento, Tachas (con foto de color elegido).
  - *Retapizado* (servicio sobre un mueble del cliente, no fabricación nueva): Tela, Almohadón de asiento, Patas.
  - *Almohadón decorativo / Pillow*: Medida, Tela — nada más.
  - Esto descarta un modelo de "un solo tipo de producto con atributos fijos": el modelo tiene que soportar **atributos distintos por tipo de producto**.
- La ficha técnica tiene **fecha de entrega** y **fecha de impresión** por separado — es un mecanismo de versionado manual: si la orden se modifica, se reimprime con fecha más nueva y esa es la vigente en planta.
- La planilla de producción trackea el avance **por línea de producto** (no por orden completa): un sofá, su puff, y cada almohadón decorativo son líneas independientes, cada una con sus propios checks de proceso.
- La planilla de ventas revela que **no todo lo que vende Livingshop lo fabrica Livingshop** — hay líneas con proveedor externo (Pablo, David, Sillas, Marta, Rieles, Alfombras, Decoración, Importados) con su propio checkbox de "pedido realizado". Por decisión de alcance (ver sección 3), esto queda **fuera de la v1**.

## 3. Decisiones de alcance ya tomadas (ping-pong con el cliente del proyecto)

| Tema | Decisión |
|---|---|
| Atributos de producto | **Híbrido**: el admin define atributos base por tipo de producto desde un CRUD (sin tocar código). El vendedor, al armar una orden, puede además **agregar atributos/campos ad-hoc** a un producto puntual de esa orden (para casos especiales), sin depender del admin. Sujeto a iteración. |
| Proveedores externos | **Fuera de alcance en v1.** Se ignora el circuito de compra a terceros y facturación. Puede incorporarse en una fase futura. |
| Croquis técnico | **Carga de archivo/imagen.** El vendedor/diseñador adjunta el croquis (dibujado aparte) al producto de la orden; el sistema lo almacena y lo inserta en la ficha técnica generada. No se genera el dibujo automáticamente en v1. |
| Versionado de fichas | **Solo la versión vigente.** Cada edición actualiza la fecha de impresión y sobreescribe. No se guarda historial de versiones anteriores en v1. |
| Etapas de producción | **Fijas para todos los productos**: Tela, Esqueleto, Espuma, Corte (base/almohadones), Tapizado (base/almohadones), Listo. No configurable por tipo de producto en v1. |
| Alcance del negocio | **Single-tenant.** Sistema pensado exclusivamente para Livingshop, no como producto multi-cliente. |
| Hosting | Se mantiene **DigitalOcean** (ya lo paga la dueña) salvo que convenga cambiar — ver sección 6. |
| Modelo de datos | **Relacional (PostgreSQL) con columnas JSONB** para atributos variables — ver sección 5. |
| Rol fábrica | Ve **solo datos técnicos y fichas** (croquis, atributos, etapas de producción). No ve precios ni pagos. |
| Exportación de Producción/Ventas | **Google Sheets vía API** (para seguir trabajando como hoy si lo prefieren) **+ PDF para impresión** (para la planilla física en planta). No se pide CSV. |
| Diseño del PDF de la orden | **Se rediseña**: colores más sobrios y una estructura más prolija que la actual. Queda como tarea de diseño visual, a definir mockup antes de codear. |
| Catálogos de telas/colores | **Catálogo maestro compartido** entre tipos de producto (ej. una tabla de "Telas" y otra de "Colores de pata"), en vez de repetir opciones por tipo de producto. El vendedor tipea texto libre solo en casos puntuales (ej. un mueble de diseño no estándar). |
| Autenticación | **Email + contraseña** en v1. Pendiente confirmar con Livingshop si usan Google Workspace, para evaluar si conviene sumar login con Google más adelante (ver sección 9). |

## 4. Modelo de datos propuesto

### Entidades principales

- **Usuario**: id, nombre, email, password_hash, rol (`admin` \| `vendedor` \| `fabrica`), activo.
- **Cliente**: id, nombre, apellido, direccion_entrega, celular, telefono, email.
- **TipoProducto** *(catálogo, gestionado por admin)*: id, nombre (ej. "Chester Industrial"), descripcion, activo.
- **CatalogoAtributo** *(catálogo maestro compartido, gestionado por admin)*: id, nombre (ej. "Tela", "Color de pata", "Tipo de brazo"). Agrupa los valores reutilizables entre tipos de producto.
- **CatalogoValor**: id, catalogo_atributo_id (FK), valor (ej. "Liso Molinari 04 Camel"), activo. Evita retipear el mismo valor en cada tipo de producto.
- **AtributoDefinicion** *(plantilla de atributos por tipo de producto, gestionado por admin)*: id, tipo_producto_id (FK), nombre, tipo_dato (`texto` \| `numero` \| `catalogo` \| `color`), catalogo_atributo_id (FK, solo si tipo_dato = `catalogo`), orden, requerido. Cuando el atributo es de tipo `catalogo`, el vendedor elige un valor de `CatalogoValor`; cuando es `texto` libre, tipea directamente (pensado para casos puntuales, ej. muebles de diseño no estándar).
- **Orden**: id, numero, fecha, fecha_entrega, cliente_id (FK), vendedor_id (FK), estado (`borrador` \| `confirmada` \| `en_produccion` \| `entregada` \| `cancelada`), total, pagado, saldo, forma_pago, observaciones.
- **OrdenItem** (línea de producto dentro de una orden): id, orden_id (FK), tipo_producto_id (FK), cantidad, precio_unitario, precio_total, `atributos` (**JSONB** — valores de los AtributoDefinicion del tipo + campos ad-hoc agregados por el vendedor para esta línea), comentarios_fabricacion (texto libre, ej. "PUFF POR SEPARADO Y COLCHONETA!!").
- **Adjunto**: id, orden_item_id (FK), tipo (`croquis` \| `foto_referencia`), url, nombre_archivo.
- **EstadoProduccionItem**: id, orden_item_id (FK), etapa (enum fijo: `tela`, `esqueleto`, `espuma`, `corte_base`, `corte_almohadones`, `tapizado_base`, `tapizado_almohadones`, `listo`), completado (bool), fecha_completado, usuario_id (FK, quién lo marcó).
- **Pago**: id, orden_id (FK), fecha, monto, medio_pago, tasa_pct (comisión del medio de pago), comentario.

### Relaciones (resumen)

```
Cliente 1───N Orden N───1 Usuario(vendedor)
Orden 1───N OrdenItem N───1 TipoProducto 1───N AtributoDefinicion N───1 CatalogoAtributo 1───N CatalogoValor
OrdenItem 1───N Adjunto
OrdenItem 1───N EstadoProduccionItem
Orden 1───N Pago
```

### Por qué JSONB y no columnas fijas

Los atributos de `OrdenItem` varían radicalmente según `TipoProducto` (un Chester tiene Tachas, un Retapizado no tiene Base ni Brazo). Modelar esto como columnas fijas obligaría a tener decenas de columnas nulas según el producto, o una tabla EAV (Entity-Attribute-Value) clásica que es incómoda de consultar. Una columna JSONB por línea, validada en la capa de aplicación contra la plantilla de `AtributoDefinicion` del `TipoProducto`, da la flexibilidad de un documento exactamente donde se necesita, sin sacrificar la integridad relacional del resto (dinero, roles, estados).

## 5. Relacional vs. no relacional — decisión

**Recomendación: PostgreSQL** (no MongoDB), con JSONB para atributos variables.

Motivos:
- Los pagos, saldos y los reportes futuros que mencionaste (control de costos, reportes semanal/mensual/anual) son consultas de **agregación relacional** (`SUM`, `GROUP BY`, joins entre ventas/producción/clientes) — el punto fuerte de SQL.
- Los estados de producción, roles y permisos son datos naturalmente relacionales con integridad referencial (FKs) que Postgres garantiza de forma nativa.
- Una venta involucra escrituras relacionadas (orden + pago + saldo) que necesitan consistencia transaccional — trivial en Postgres, más trabajoso en Mongo (transacciones multi-documento).
- El único punto donde el esquema es realmente variable (atributos por tipo de producto) se resuelve con JSONB, que en Postgres moderno es indexable y consultable casi como un documento.

Esto se aparta de la letra de "MERN" (Mongo → Postgres) pero mantiene Express + React + Node. Quedó marcado como decisión a confirmar con vos antes de empezar a codear.

## 6. Infraestructura y hosting

Se mantiene **DigitalOcean** (continuidad de costo/proveedor ya conocido por la dueña):
- **Droplet** (o App Platform) para la API Node/Express + el build de React.
- **Managed Database (PostgreSQL)** de DigitalOcean en vez de una instancia propia — backups automáticos incluidos.
- **DigitalOcean Spaces** (compatible con S3) para almacenar los adjuntos (croquis, fotos de color/tachas) y los PDFs generados.

_(Alternativa a evaluar si el presupuesto lo permite: Vercel para el frontend + Neon/Supabase para Postgres — pero no aporta ventaja clara sobre seguir en DO, así que no lo recomiendo salvo que haya un motivo concreto.)_

## 7. Roles y permisos (borrador)

| Rol | Puede |
|---|---|
| **Admin** | Todo: gestiona catálogo de productos/atributos, usuarios, ve reportes, ve todas las órdenes y pagos. |
| **Vendedor** | Crea/edita clientes y órdenes, agrega productos y atributos ad-hoc, registra pagos, genera el PDF para el cliente. No edita el catálogo base de productos/atributos. |
| **Fábrica** | Ve fichas técnicas y la planilla de producción, marca las etapas de avance por línea. **No ve precios ni pagos** — solo datos técnicos, croquis y fechas. |

## 8. Módulos del sistema

1. **Catálogo de productos** (CRUD, admin) — tipos de producto + sus atributos.
2. **Clientes** (CRUD).
3. **Órdenes** — alta/edición, líneas de producto con atributos + adjuntos, pagos, cambio de estado, exportar PDF (orden) y ficha técnica.
4. **Producción** — pantalla que reemplaza la planilla de fábrica: lista de líneas agrupadas por fecha de entrega/orden, checkboxes de etapa, exportable a **Google Sheets (vía API)** y a **PDF para imprimir** en planta.
5. **Ventas** — pantalla que reemplaza la planilla de ventas: líneas vendidas por período, forma de pago, saldo, estado de entrega, exportable a **Google Sheets (vía API)** y **PDF**.
6. **Usuarios y roles** (admin).
7. *(Futuro)* Reportes de costos, reportes semanales/mensuales/anuales, circuito de proveedores externos.

> Nota técnica: exportar a Google Sheets vía API requiere una cuenta de servicio (Service Account) de Google Cloud con acceso a la planilla, o un flujo OAuth si tiene que quedar en el Drive personal de alguien de Livingshop. Se resuelve al confirmar si usan Google Workspace (ver sección 9).

## 9. Preguntas abiertas para la próxima iteración

1. Confirmar con Livingshop si usan **Google Workspace** (para saber si conviene login con Google y qué cuenta usar para la integración de export a Sheets vía API).
2. Mockup/referencia visual para el rediseño del PDF de la orden (colores sobrios, estructura prolija) — ¿hay alguna paleta o referencia de marca ya definida, o se propone desde cero?
3. Definir el detalle de las **etapas de producción por tipo de dato de atributo** `catalogo` vs `texto` libre: ¿quién decide, al crear un `TipoProducto`, qué atributos son de catálogo y cuáles quedan libres? (probablemente el admin, a confirmar).
