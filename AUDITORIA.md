# 📋 AUDITORÍA DEL SISTEMA: MINI-CRM RSD SOLUTIONS

**Documento de Estado Técnico, Arquitectura y Registro Funcional**  
**Fecha de Auditoría:** 21 de Septiembre de 2026  
**Versión del Sistema:** 1.4.0 (Fase 4 - Dashboard Operativo e Indicadores)  
**Organización:** RSD Solutions  
**Repositorio GitHub:** [https://github.com/RSDsolutions/CRM-RSD](https://github.com/RSDsolutions/CRM-RSD)  
**ID del Proyecto Supabase:** `gzgdilrlzqitsprhqcld`

---

## 1. Resumen Ejecutivo
El **CRM de RSD Solutions** es una plataforma web interna diseñada para la gestión integral del ciclo de vida del cliente. Comenzó como un MVP para captura de prospectos y ha evolucionado hacia un ERP comercial completo que cubre: Prospección (Leads), Demostraciones de Producto, Cotizaciones y Propuestas Comerciales, Conversión a Clientes, Gestión de Proyectos en ejecución, y ahora también el **Ciclo Post-Proyecto (Entregas, Aceptaciones, Pagos, Mantenimiento y Renovaciones)**.

Todo el sistema está soportado por un robusto modelo relacional en PostgreSQL, RBAC (Role-Based Access Control) y trazabilidad completa de auditoría, manteniendo una interfaz minimalista, veloz e intuitiva para los asesores comerciales.

---

## 2. Ficha Técnica y Stack Tecnológico

| Capa | Tecnología | Versión | Propósito |
| :--- | :--- | :--- | :--- |
| **Framework Web** | Next.js (App Router) | `14.2.35` | Renderizado híbrido (SSR/CSR), Server Actions y Middleware |
| **Librería UI** | React / React DOM | `18.3.1` | Motor de interfaz de usuario reactiva |
| **Lenguaje** | TypeScript | `^5.7.3` | Tipado estricto en cliente, servidor y esquemas |
| **Estilos CSS** | Tailwind CSS + Autoprefixer | `3.4.17` | Sistema de diseño responsivo y tema oscuro (Dark Slate) |
| **Base de Datos** | Supabase (PostgreSQL 17) | `17.x` | Base de datos relacional con RLS, triggers y extensiones |
| **Autenticación** | Supabase Auth (`@supabase/ssr`) | `0.5.2` | Manejo de sesiones seguras mediante Cookies HTTP-only |
| **Gestión Drag & Drop**| `@dnd-kit/core` + `@dnd-kit/sortable` | `6.3.1` / `10.0.0` | Motor de arrastre accesible con soporte táctil y puntero |
| **Formularios** | React Hook Form | `7.54.2` | Manejo de formularios sin re-renderizados innecesarios |
| **Validación** | Zod + `@hookform/resolvers` | `3.24.2` | Validación estricta de esquemas y tipos inferidos |
| **Iconografía** | Lucide React | `0.475.0` | Iconos vectoriales ligeros |
| **Manejo de Fechas** | Date-fns (con locale `es`) | `4.1.0` | Formateo, parsing y cálculo de alertas de vencimiento |

---

## 3. Arquitectura del Código Fuente (Evolucionada)

```text
CRM-RSD/
├── app/
│   ├── (dashboard)/              # Rutas protegidas (Agrupación lógica)
│   │   ├── clientes/             # Módulo de Directorio de Clientes
│   │   ├── comercial/            # Módulo Comercial (Demos y Propuestas)
│   │   ├── proyectos/            # Módulo Operativo de Proyectos
│   │   ├── dashboard/            # [FASE 4] Dashboard de métricas globales
│   │   └── page.tsx              # Vista Kanban principal de Leads
│   ├── actions/                  # Server Actions (Mutaciones)
│   │   ├── clients.ts, demos.ts, proposals.ts, projects.ts
│   │   ├── deliveries.ts, acceptances.ts, payments.ts, maintenance.ts, renewals.ts
│   │   └── dashboard.ts          # [FASE 4] Server action para extracción de métricas
│   ├── layout.tsx                # Layout principal con Navbar dinámico (Roles)
│   ├── login/                    # Autenticación
│   └── nuevo-lead/               # Ingreso de prospectos
├── components/
│   ├── dashboard/                # [FASE 4] Componentes UI del Dashboard (metric-card.tsx)
│   ├── clients/, demos/, kanban/, proposals/, projects/
│   └── navbar.tsx                # Barra superior con navegación por módulos y RBAC
├── types/
│   └── database.types.ts         # Definiciones TypeScript de entidades actualizadas
├── utils/
│   ├── auth/roles.ts             # Utilidades para roles y RBAC
│   └── supabase/                 # Clientes Supabase SSR
├── middleware.ts                 # Interceptor de sesión y redirecciones
└── supabase/migrations/          # Archivos SQL de evolución de Base de Datos
```

---

## 4. Modelo de Base de Datos y Seguridad (PostgreSQL)

El sistema ha evolucionado hacia un ERP desacoplando el ciclo de vida del proyecto en entidades atómicas que garantizan trazabilidad y reglas de negocio.

### A. Entidades Principales
1. **`leads`**: Prospectos ingresados. Mantiene el pipeline inicial.
2. **`profiles`**: Extensión de `auth.users` para manejar metadatos, nombres y Roles (`admin` | `comercial`).
3. **`clients` & `client_contacts`**: Directorio formal de empresas o personas que ya son clientes activos.
4. **`demos` & `demo_feedback`**: Registro de presentaciones de software a prospectos o clientes.
5. **`proposals`**: Cotizaciones formales. Autogeneran su correlativo (`RSD-PROP-2026-001`).
6. **`projects`**: Trabajos de desarrollo en ejecución. Desacoplado en la Fase 3, centrado solo en el estado de desarrollo.
7. **`project_deliveries`**: Historial de entregas (iteraciones, Betas, versiones finales). Relación 1:N con proyectos.
8. **`project_acceptances`**: Validaciones del cliente sobre una entrega. Relación 1:1 con entregas. Si se aprueba, auto-cierra el proyecto (`projects.status = Completado`).
9. **`payments`**: Pagos del cliente (Anticipo, Hito, Saldo Final). Un pago puede ser 'Registrado' y un `admin` debe pasarlo a 'Confirmado'.
10. **`maintenance_contracts`**: Contratos de soporte post-lanzamiento. Se autogenera transaccionalmente (3 meses incluidos) si se confirma un pago y el proyecto ya estaba completado.
11. **`maintenance_events`**: Bitácora de incidencias o requerimientos del cliente durante un contrato de soporte.
12. **`renewals`**: Entidad prospectiva para realizar seguimiento cuando el mantenimiento está por vencer.
13. **`audit_logs`**: Tabla de trazabilidad que registra automáticamente todos los eventos de DB con Triggers.

### B. Políticas de Seguridad (RBAC y RLS)
- **RLS (Row Level Security):** Activo en todas las tablas.
- Todo acceso anónimo está bloqueado.
- **`DELETE`**: Eliminaciones físicas están estrictamente restringidas solo a usuarios con rol `admin`.
- **Server Actions**: La lógica transaccional de pagos, mantenimientos y finalización de proyectos reside en el servidor. No confiamos en el cliente para esto.

---

## 5. Vistas y Módulos del Sistema

### 1. Dashboard Operativo (Fase 4)
- **Acceso:** Restringido a Administradores (vía RPC).
- **Métricas Consolidadas:**
  - *Proyectos*: Activos, Completados, Entregas pendientes de revisión.
  - *Finanzas*: Pagos por confirmar vs Facturado (confirmado).
  - *Soporte*: Contratos activos y aquellos por vencer (alerta a menos de 15 días).
  - *Comercial*: Renovaciones pendientes.
- **Enfoque Action-Driven**: Interfaz en base a `metric-cards` orientada no solo a ver datos, sino a identificar cuellos de botella (ej. Entregas en revisión).

### 2. Tablero Comercial Kanban (Leads)
- Mantiene toda la robustez del Drag&Drop optimista original.

### 3. Módulo Comercial (Demos y Propuestas)
- Demos con bitácora de feedback y paso fluido a Propuestas (Cotizaciones automatizadas).

### 4. Módulo de Directorio de Clientes
- Manejo de información fiscal y notas.

### 5. Módulo de Proyectos (Rediseñado Fase 3)
La Vista de Detalle de Proyecto fue reconstruida utilizando componentes tipo *Tabs* (Resumen, Entregas, Pagos, Mantenimiento):
- **Resumen:** Presupuesto, Enlaces a código/producción, Fechas y selector limitado a progreso del software.
- **Entregas & Aceptación:** Historial visual de entregas y registro in situ de la Aceptación/Rechazo del cliente.
- **Pagos:** Sistema para agregar pagos con monto, tipo (Anticipo, Final) y estado (Registrado/Confirmado). Calculo en vivo de total confirmado.
- **Mantenimiento & Soporte:** Visor de días restantes de soporte, barra indicadora de vigencia y registro completo de *Tickets* o actividades vinculadas a ese periodo.

---

## 6. Historial de Versiones y Modificaciones

### Versión 1.4.0 (21/09/2026) - Fase 4 (Dashboard Operativo)
- Implementación de la vista `/dashboard` para Administradores.
- Creación de un Action optimizado (`getDashboardMetricsAction`) para agrupar las métricas de negocio desde las entidades de la Fase 3.
- Actualización de barra de navegación (`Navbar`) basada en roles.

### Versión 1.3.0 (21/09/2026) - Fase 3 (Post-Proyecto)
- Desacople de estados en `projects`. Migración de dependencias hacia nuevas entidades.
- Creación de esquema `project_deliveries`, `project_acceptances`, `payments`, `maintenance_contracts`, `maintenance_events`, `renewals`.
- Lógica transaccional cruzada (Pagos + Proyecto Completo = Activación de Mantenimiento Automático).
- Refactorización de UI del Detalle del Proyecto en un diseño modular en pestañas (Tabs).
- Todo el módulo integrado a `audit_logs` para estricta trazabilidad operativa.

### Versión 1.2.0 (21/09/2026) - Evolución Estructural
- Implementación de RBAC (Role-Based Access Control) para separar perfiles Admin y Comercial.
- Tablas `clients` y `client_contacts` añadidas. Conversión manual y automática de leads a clientes.
- Sistema transversal de Auditoría (`audit_logs`) con triggers automáticos en PostgreSQL.
- Automatización del flujo comercial: Demo -> Propuesta -> Aceptación -> Auto-creación de Proyecto y Cliente.

### Versión 1.0.0 (21/09/2026) - MVP Inicial
- Creación del proyecto con Next.js 14, Tailwind y Supabase.
- Implementación de Kanban con `@dnd-kit` y actualización optimista.
- Formulario de leads y protección con Middleware de sesión.
