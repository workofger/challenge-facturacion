# Challenge: Portal de Facturación 🧾

## Descripción

Portal web donde proveedores pueden subir, gestionar y dar seguimiento a sus facturas CFDI. Incluye un panel administrativo para revisión, aprobación y exportación de facturas, así como un portal de usuario con onboarding, verificación y emisión de comprobantes fiscales.

El frontend está **completamente funcional** con datos mock. Tu reto es construir el backend que lo haga funcionar con datos reales.

## Tech Stack

| Capa | Tecnología |
|------|-----------|
| **Framework** | React 18 + TypeScript |
| **Build** | Vite 5 |
| **Estilos** | Tailwind CSS 3 |
| **Routing** | React Router 6 |
| **Iconos** | Lucide React |
| **PDF** | @react-pdf/renderer |
| **Fechas** | date-fns |

## Estructura del Proyecto

```
src/
├── components/
│   ├── admin/       # Layout y protección de rutas admin
│   ├── common/      # Componentes reutilizables (inputs, modals, file upload)
│   ├── layout/      # Header, navegación
│   ├── multi/       # Carga múltiple de facturas
│   ├── sections/    # Secciones del formulario de factura
│   └── user/        # Layout y componentes del portal de usuario
├── contexts/        # Auth (admin/user), tema, configuración del sistema
├── hooks/           # useInvoiceForm, useProjects, useAdminAuth, etc.
├── pages/
│   ├── admin/       # Dashboard, Invoices, Reports, Settings, Users, Projects, ApiKeys
│   ├── user/        # Dashboard, Invoices, Invoicing, Profile, Onboarding, Login
│   └── Upload.tsx   # Página pública de carga de facturas
├── services/        # ⚡ Servicios con mocks — AQUÍ CONECTAS TU API
├── types/           # Tipos TypeScript (Invoice, MultiInvoice)
├── utils/           # XML parser, formatters, validaciones
└── constants/       # Configuración general
```

## Qué Incluye

- ✅ **UI completa** — todas las páginas, formularios y componentes
- ✅ **Flujo de carga de facturas** — XML + PDF con extracción automática de datos
- ✅ **Panel administrativo** — dashboard, listado, filtros, exportación
- ✅ **Portal de usuario** — onboarding, perfil, historial de facturas, emisión CFDI
- ✅ **Programa Pronto Pago** — descuento por pago anticipado con nota de crédito
- ✅ **Validación de CFDI** — parsing de XML, validación de RFC, UUID
- ✅ **Tema claro/oscuro** — sistema de diseño completo
- ✅ **Datos mock realistas** — facturas, usuarios, estadísticas con formato mexicano

## Qué Necesitas Construir

- 🔧 **API REST** — endpoints para todas las operaciones (auth, facturas, usuarios, config)
- 🔧 **Base de datos** — schema para facturas, usuarios, proyectos, configuración
- 🔧 **Autenticación** — JWT, sesiones, roles (admin/user)
- 🔧 **Procesamiento de archivos** — almacenamiento de XML/PDF, extracción de datos
- 🔧 **Conexión frontend ↔ API** — reemplazar los mocks en `src/services/`

## Inicio Rápido

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Build de producción
npm run build
```

La aplicación correrá en `http://localhost:3000`. Puedes navegar por todas las páginas con datos mock.

## Criterios de Evaluación

| Criterio | Peso |
|----------|------|
| **Arquitectura y diseño** | 25% |
| **Calidad de código** | 25% |
| **Diseño de API** | 20% |
| **Manejo de errores** | 15% |
| **Documentación** | 15% |

## Tiempo Estimado

**5 a 7 días** para completar todas las tareas. Ver [CHALLENGE.md](./CHALLENGE.md) para los requisitos detallados.

## Notas

- Los servicios mock están en `src/services/` con comentarios `TODO` indicando qué implementar
- La configuración base está en `src/constants/config.ts`
- Los tipos de datos están definidos en `src/types/` — úsalos como contrato para tu API
- El frontend usa `import.meta.env.VITE_API_URL` para la URL del backend
