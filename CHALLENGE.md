# Tareas del Challenge 📋

## Tarea 1: Diseño e implementación del schema de base de datos

Diseña el modelo de datos para soportar toda la funcionalidad del portal. Como mínimo necesitas:

- **Usuarios** — proveedores (flotilleros e independientes) con perfil fiscal, datos bancarios, verificaciones
- **Administradores** — usuarios admin con roles (super_admin, finance, operations, viewer)
- **Facturas** — CFDIs con todos los campos fiscales (UUID, RFC, montos, retenciones, etc.)
- **Proyectos** — catálogo de proyectos a los que se asignan facturas
- **Notas de crédito** — vinculadas a facturas para el programa Pronto Pago
- **Configuración del sistema** — parámetros como tasa de Pronto Pago, RFC receptor esperado
- **API Keys** — para integraciones externas

**Entregable:** Archivo(s) de migración SQL o schema definition (Prisma, Drizzle, etc.)

**Tip:** Revisa los tipos en `src/types/` y las interfaces en `src/services/` para entender la estructura de datos completa.

---

## Tarea 2: Construcción de la API REST

Implementa los endpoints que el frontend consume. Los servicios mock en `src/services/` documentan cada endpoint con su ruta y método HTTP esperado.

### Endpoints principales:

#### Autenticación
- `POST /api/admin/login` — Login de administrador
- `POST /api/admin/google-auth` — Login con Google OAuth
- `GET /api/admin/session` — Verificar sesión admin
- `POST /api/user/login` — Login de usuario/proveedor
- `POST /api/user/magic-link` — Enviar magic link por email
- `GET /api/user/verify-magic-link` — Verificar magic link
- `POST /api/user/verify-email` — Enviar código de verificación
- `PUT /api/user/verify-email` — Verificar código de email
- `POST /api/user/verify-whatsapp` — Enviar código WhatsApp
- `PUT /api/user/verify-whatsapp` — Verificar código WhatsApp
- `POST /api/user/forgot-password` — Solicitar reset de contraseña
- `PUT /api/user/forgot-password` — Resetear contraseña

#### Admin
- `GET /api/admin/stats` — Dashboard con métricas
- `GET /api/admin/invoices` — Listado con filtros y paginación
- `GET /api/admin/export` — Exportar a CSV/JSON
- `GET /api/admin/export-payments` — Exportar pagos en XLSX
- `GET /api/admin/config` — Configuración del sistema
- `PUT /api/admin/config` — Actualizar configuración
- `GET /api/admin/api-keys` — Listar API keys
- `POST /api/admin/api-keys` — Crear API key
- `DELETE /api/admin/api-keys` — Revocar API key

#### Usuario / Proveedor
- `GET /api/user/profile` — Obtener perfil
- `PUT /api/user/profile` — Actualizar perfil
- `GET /api/user/onboarding` — Estado del onboarding
- `PUT /api/user/onboarding` — Actualizar paso del onboarding
- `POST /api/user/onboarding` — Completar onboarding
- `GET /api/user/invoices` — Historial de facturas del usuario
- `GET /api/user/csd` — Estado del CSD
- `POST /api/user/csd` — Subir CSD
- `DELETE /api/user/csd` — Eliminar CSD
- `GET /api/user/invoices/list` — Listar facturas emitidas
- `POST /api/user/invoices/create` — Emitir factura (ingreso/egreso/pago)
- `GET /api/user/invoices/download` — Descargar XML/PDF
- `POST /api/user/invoices/cancel` — Cancelar factura

#### Público
- `POST /api/extract` — Extraer datos de XML/PDF (con AI o parsing)
- `POST /api/validate` — Verificar si un UUID ya existe
- `POST /api/invoice` — Enviar factura (flujo público de carga)
- `GET /api/config` — Configuración pública del sistema
- `GET /api/health` — Health check

**Entregable:** API funcional con documentación de endpoints.

**Tecnología sugerida:** Node.js/Express, NestJS, Python/FastAPI, Go — elige lo que prefieras.

---

## Tarea 3: Conectar el frontend con la API real

Reemplaza los mocks en `src/services/` con llamadas reales a tu API:

1. `adminService.ts` — Todas las funciones admin (login, stats, invoices, export, config, api-keys)
2. `userService.ts` — Auth, perfil, onboarding, facturas de usuario
3. `invoicingService.ts` — CSD, emisión de CFDIs, descarga, cancelación
4. `openaiService.ts` — Extracción de datos de facturas
5. `webhookService.ts` — Envío de facturas, validación, health check

Cada función tiene un comentario `TODO` que indica el endpoint correspondiente.

**Entregable:** Frontend conectado y funcional contra tu API.

---

## Tarea 4: Implementar flujo de autenticación

El sistema tiene dos tipos de usuarios con flujos distintos:

### Admin
- Login con email/password
- Login con Google OAuth (opcional)
- JWT con expiración
- Roles: super_admin, finance, operations, viewer

### Usuario (proveedor)
- Login con email/password
- Magic link por email
- Verificación de email (código por correo)
- Verificación de WhatsApp (código por WA)
- Onboarding obligatorio antes de acceder al portal
- Reset de contraseña

**Entregable:** Sistema de autenticación completo con protección de rutas.

---

## Tarea 5 (Bonus): Extracción inteligente de facturas con AI/OCR

El portal permite subir archivos XML y PDF de facturas CFDI. Actualmente el mock en `openaiService.ts` parsea datos básicos del XML.

Implementa extracción inteligente:

1. **Parsing de XML** — Extraer todos los campos del CFDI 4.0 (emisor, receptor, conceptos, impuestos, complementos)
2. **OCR de PDF** — Extraer datos del PDF cuando no hay XML disponible
3. **Cross-validation** — Comparar datos del XML con el PDF para detectar inconsistencias
4. **Extracción con AI** — Usar OpenAI, Google Gemini u otro LLM para interpretar PDFs complejos

**Entregable:** Endpoint `/api/extract` que reciba XML y/o PDF y devuelva los datos estructurados.

---

## Criterios de Evaluación

### Arquitectura (25%)
- Separación de responsabilidades
- Estructura de proyecto clara y escalable
- Patrones de diseño apropiados
- Manejo de configuración y secrets

### Calidad de Código (25%)
- TypeScript tipado correctamente
- Código limpio y legible
- Tests (unitarios y/o de integración)
- Sin code smells

### Diseño de API (20%)
- RESTful y consistente
- Validación de inputs
- Paginación y filtros
- Documentación (Swagger/OpenAPI es un plus)

### Manejo de Errores (15%)
- Errores HTTP apropiados
- Mensajes de error claros para el usuario
- Logging
- Casos edge (archivos corruptos, duplicados, etc.)

### Documentación (15%)
- README con instrucciones de setup
- Documentación de decisiones técnicas
- Comentarios en código donde sea necesario
- Schema de base de datos documentado

---

## Entrega

1. Fork este repositorio
2. Implementa las tareas en tu fork
3. Asegúrate de que `npm run build` pase sin errores
4. Incluye instrucciones claras para levantar el proyecto completo (frontend + backend + DB)
5. Envía el link de tu repositorio

**Tiempo estimado: 5-7 días**

¡Éxito! 🚀
