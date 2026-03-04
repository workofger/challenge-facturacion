# Tareas del Challenge

## Tarea 1: Diseño e implementación del schema de base de datos

Diseña el modelo de datos para soportar toda la funcionalidad que muestra el frontend. Analiza las pantallas, los formularios y los flujos para determinar qué entidades y relaciones necesitas.

**Entregable:** Archivo(s) de migración o schema definition.

---

## Tarea 2: Construcción de la API

Implementa el backend que el frontend necesita para funcionar. Analiza los servicios en `src/services/` para entender qué operaciones existen y qué datos manejan. Diseña tus endpoints, estructura y autenticación.

**Entregable:** API funcional con documentación.

---

## Tarea 3: Conectar el frontend con la API real

Reemplaza los mocks en `src/services/` con llamadas reales a tu API.

**Entregable:** Frontend conectado y funcional contra tu API.

---

## Tarea 4: Implementar flujo de autenticación

El sistema tiene dos tipos de usuarios con flujos distintos. Analiza los contextos de autenticación y las rutas protegidas en el frontend para entender los requerimientos de cada rol.

**Entregable:** Sistema de autenticación completo con protección de rutas.

---

## Tarea 5 (Bonus): Extracción inteligente de facturas

El portal permite subir archivos XML y PDF de facturas CFDI. Actualmente hay un parsing básico en el cliente. Mejora la extracción moviéndola al backend y añadiendo capacidades de AI/OCR para PDFs.

**Entregable:** Endpoint de extracción que reciba XML y/o PDF y devuelva datos estructurados.

---

## Criterios de Evaluación

| Criterio | Peso |
|----------|------|
| Arquitectura y diseño | 25% |
| Calidad de código | 25% |
| Diseño de API | 20% |
| Manejo de errores | 15% |
| Documentación | 15% |

---

## Entrega

1. Fork este repositorio
2. Implementa las tareas en tu fork
3. Asegúrate de que `npm run build` pase sin errores
4. Incluye instrucciones claras para levantar el proyecto completo
5. Envía el link de tu repositorio

**Tiempo estimado: 5-7 días**
