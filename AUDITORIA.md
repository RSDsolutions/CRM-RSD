# 📋 AUDITORÍA INTEGRAL DEL SISTEMA: CRM INTERNO RSD SOLUTIONS

**Documento Maestro de Arquitectura, Estado Técnico, Matriz de Brechas y Hoja de Ruta**  
**Fecha de Actualización:** 04 de Octubre de 2026  
**Versión del Sistema:** 2.0.0 (Auditoría Integral y Adaptación Empresarial)  
**Organización:** RSD Solutions  
**Repositorio GitHub:** [https://github.com/RSDsolutions/CRM-RSD](https://github.com/RSDsolutions/CRM-RSD)  
**ID del Proyecto Supabase:** `gzgdilrlzqitsprhqcld` (Región: `us-east-1`, Estado: `ACTIVE_HEALTHY`)  
**CLI Supabase:** v2.116.0 — Conexión y sincronización remota verificadas.

---

## 1. Resumen Ejecutivo de la Auditoría

El **CRM interno de RSD Solutions** es la columna vertebral operativa, comercial y documental para la gestión integral de prospectos y proyectos de software a medida. El sistema existente cuenta con una base sólida construida sobre Next.js 14, Tailwind CSS, TypeScript y Supabase (PostgreSQL 17), cubriendo inicialmente la captación de leads en un tablero Kanban, conversión básica a clientes, registro de demos y cotizaciones, y un ciclo preliminar post-proyecto (entregas, pagos y mantenimientos).

La presente auditoría evalúa la solución contra los **30 requerimientos no negociables de la operación de RSD Solutions**, identificando el mapa exacto de lo existente, las brechas funcionales y técnicas, los riesgos de compatibilidad y seguridad, y el plan de migración incremental por fases para adaptar el CRM sin alterar flujos estables ni reiniciar desde cero.

---

## 2. Estado de Conectividad e Infraestructura Supabase CLI

Se ha verificado la conectividad y capacidad de manipulación de la base de datos vía CLI y Management API:

1. **Estado del Proyecto Remoto:** El proyecto remoto `gzgdilrlzqitsprhqcld` (`CRM-RSD`) fue reactivado exitosamente desde estado inactivo a `ACTIVE_HEALTHY`.
2. **Sincronización de Migraciones:**
   - `20260921000000_fase2_roles_clients.sql` (Local: Sincronizada | Remota: Aplicada)
   - `20260921000001_lead_status_profiles.sql` (Local: Sincronizada | Remota: Aplicada)
   - `20260921000002_demos_proposals_projects.sql` (Local: Sincronizada | Remota: Aplicada)
   - `20260921000003_post_project_lifecycle.sql` (Local: Sincronizada | Remota: Aplicada)
3. **Validación CLI:** `npx supabase db push --linked --dry-run` y `npx supabase migration list` completaron con código de salida `0`.
4. **Verificación de DDL y Modificaciones:** El CLI tiene credenciales autenticadas en Windows Credential Manager (`Supabase CLI:supabase`), permitiendo crear tablas, funciones, disparadores y políticas de seguridad RLS mediante nuevas migraciones en `supabase/migrations/` e impulsarlas directamente con el CLI.

---

## 3. Ficha Técnica y Stack Tecnológico

| Capa | Tecnología | Versión | Rol en la Arquitectura |
| :--- | :--- | :--- | :--- |
| **Framework Web** | Next.js (App Router) | `14.2.35` | SSR/CSR híbrido, Server Actions tipadas y Middleware de sesión |
| **Librería UI** | React / React DOM | `18.3.1` | Componentes declarativos e interactivos |
| **Lenguaje** | TypeScript | `^5.7.3` | Tipado estricto extremo (`types/database.types.ts`) sin `any` |
| **Estilos CSS** | Tailwind CSS + Autoprefixer | `3.4.17` | Sistema visual consistente en tema oscuro moderno (*Dark Slate*) |
| **Base de Datos** | Supabase (PostgreSQL 17) | `17.6.1` | Relacional con RLS, triggers de auditoría, funciones PL/pgSQL y constraints atómicas |
| **Autenticación** | Supabase Auth (`@supabase/ssr`) | `0.5.2` | Manejo de sesiones seguras mediante Cookies HTTP-only |
| **Drag & Drop** | `@dnd-kit/core` + `@dnd-kit/sortable` | `6.3.1` / `10.0.0` | Tablero Kanban con actualización optimista y rollback automático |
| **Formularios** | React Hook Form | `7.54.2` | Formularios modularizados por secciones con validación fluida |
| **Validación de Esquemas** | Zod + `@hookform/resolvers` | `3.24.2` | Validación estricta en cliente y servidor |
| **Iconografía** | Lucide React | `0.475.0` | Iconos vectoriales consistentes |
| **Manejo de Fechas** | Date-fns (locale `es`) | `4.1.0` | Formateo, parsing y alertas de fechas de seguimiento |

---

## 4. Mapa de Arquitectura y Módulos Existentes

```text
CRM-RSD/
├── app/
│   ├── (dashboard)/                     # Rutas protegidas por middleware
│   │   ├── layout.tsx                   # Layout global con Navbar dinámico y RBAC
│   │   ├── page.tsx                     # Vista principal: Tablero Kanban de Leads
│   │   ├── clientes/                    # Módulo de Directorio de Clientes
│   │   │   ├── page.tsx                 # Listado y filtros de clientes
│   │   │   ├── nuevo/page.tsx           # Creación manual de clientes
│   │   │   └── [id]/page.tsx            # Perfil y contactos del cliente
│   │   ├── comercial/                   # Módulo Comercial (Demos y Propuestas)
│   │   │   ├── demos/                   # Submódulo de Demostraciones
│   │   │   │   ├── page.tsx             # Listado de demos
│   │   │   │   ├── nuevo/page.tsx       # Creación de demo
│   │   │   │   └── [id]/page.tsx        # Ficha de demo con feedback
│   │   │   └── propuestas/              # Submódulo de Cotizaciones
│   │   │       ├── page.tsx             # Listado de propuestas
│   │   │       ├── nueva/page.tsx       # Generación de propuesta
│   │   │       └── [id]/page.tsx        # Ficha de propuesta
│   │   ├── proyectos/                   # Módulo Operativo de Proyectos
│   │   │   ├── page.tsx                 # Listado de proyectos
│   │   │   ├── nuevo/page.tsx           # Nuevo proyecto
│   │   │   └── [id]/page.tsx            # Detalle con pestañas: Resumen, Entregas, Pagos, Mantenimiento
│   │   └── dashboard/                   # Dashboard administrativo preliminar
│   │       └── page.tsx                 # Métricas de proyectos, pagos y soporte
│   ├── actions/                         # Server Actions (Lógica transaccional de servidor)
│   │   ├── clients.ts, demos.ts, proposals.ts, projects.ts
│   │   ├── deliveries.ts, acceptances.ts, payments.ts, maintenance.ts, renewals.ts
│   │   └── dashboard.ts
│   ├── login/page.tsx                   # Autenticación con Supabase Auth
│   └── nuevo-lead/page.tsx              # Formulario de registro de prospectos
├── components/                          # Componentes reutilizables de UI
│   ├── navbar.tsx                       # Barra de navegación superior con RBAC
│   ├── kanban/                          # Tablero Kanban (kanban-board, lead-card, lead-detail-sheet)
│   ├── clients/                         # Tablas y tarjetas de clientes
│   ├── demos/                           # Formularios y listas de demos
│   ├── proposals/                       # Formularios y fichas de propuestas
│   ├── projects/                        # Vistas por pestañas de proyectos (Tabs)
│   └── dashboard/                       # Tarjetas métricas (metric-card.tsx)
├── types/
│   └── database.types.ts                # Contratos TypeScript de entidades
├── utils/
│   ├── auth/roles.ts                    # Helpers de RBAC (getUserRole, isAdmin)
│   └── supabase/                        # Clientes SSR/Browser de Supabase
├── middleware.ts                        # Protección de rutas y renovación de tokens
└── supabase/
    ├── config.toml                      # Configuración de CLI y servicios locales
    ├── schema.sql                       # Esquema base unificado
    └── migrations/                      # 4 migraciones históricas versionadas
```

---

## 5. Matriz de Brechas Funcionales (Gap Matrix)

A continuación se detalla el análisis comparativo entre los requerimientos del proceso de RSD Solutions y el código actual:

| # | Módulo / Requerimiento | Estado Actual | Estado Requerido | Brecha / Plan de Acción |
| :-: | :--- | :--- | :--- | :--- |
| **1** | **Roles y Permisos (RBAC)** | Parcial (`admin`, `comercial`) | 4 roles formales (`admin`, `comercial`, `tecnico`, `soporte`) con permisos por módulo/acción. | Ampliar `UserRole`, configurar matriz de permisos y políticas RLS granulares con aislamiento por asignación. |
| **2** | **Prospectos, Empresas y Contactos** | Parcial (`leads` + `clients`) | Ficha de prospecto con nichos empresariales (8+ nichos), canal de origen (Meta, etc.), método actual, RUC, ciudad/provincia, detección de duplicados y contactos múltiples. | Enriquecer `leads` con campos de prospección detallada y validación preventiva de duplicados. |
| **3** | **Embudo Comercial** | Parcial (10 etapas visibles) | 28 etapas configurables o estructuradas con reglas estrictas de transición y notas de cambio obligatorias (ej. motivo de pérdida). | Implementar tabla `pipeline_stages`, historial de transiciones y validación en Server Actions de transiciones no permitidas. |
| **4** | **Actividades y Seguimiento** | Inexistente (solo texto `interaction_log`) | Bitácora cronológica estructurada (`activities`) con tipo (llamada, WhatsApp, reunión, etc.), resultado, próximo paso y alertas de inactividad. | Crear entidad `activities`, componentes de timeline y alertas de seguimiento vencido. |
| **5** | **Tareas Globales y Vinculadas** | Inexistente (solo tickets de soporte) | Módulo de tareas vinculadas a lead, cliente o proyecto con prioridades, fechas límite, estados y visualización en lista/tablero. | Crear tabla `tasks`, Server Actions asociadas y vista de tareas. |
| **6** | **Agenda y Disponibilidad de Robinson** | Inexistente (solo campo booleano en lead) | Bloques de disponibilidad administrados por Robinson, reserva por asesores y **prevención atómica de doble reserva** en servidor/DB. | Crear `availability_blocks` y `meetings` con constraint de exclusión PostgreSQL (`EXCLUDE WITH &&`) y RPC transaccional. |
| **7** | **Formulario de Diagnóstico** | Inexistente | Formulario estructurado para Robinson (negocio, problemas, procesos, solución preliminar, viabilidad) y guardado de borradores. | Crear entidad `diagnostics` vinculada al lead/reunión y generador de reporte. |
| **8** | **ADN de la Empresa / Cliente** | Inexistente (solo `notes` en cliente) | Ficha central versionada con requerimientos, identidad visual y **Contexto consolidado del negocio** en Markdown (NO generador automático de prompts). | Crear `company_dna` y `dna_versions`, garantizando que el asesor redacte el prompt manualmente. |
| **9** | **Viabilidad de Proyectos** | Inexistente | Ficha técnica de evaluación de complejidad, módulos, dependencias, riesgos y decisión formal de Robinson. | Crear tabla `feasibility_reviews` y flujo de aprobación técnica. |
| **10** | **Demos, Archivos .md y Tokens IA** | Parcial (tabla `demos` básica) | Solicitud detallada, repositorio de archivos `.md` con versionado, registro manual de ventanas de uso de IA de 5h (0-100%) y aprobación estricta de Robinson. | Crear `demo_files` (markdown), `ai_usage_windows` (declaración manual 0-100% por ventana) y máquina de estados de aprobación. |
| **11** | **Presentación de Demo y Resultados** | Parcial (solo feedback genérico) | Registro formal de presentación, funcionalidades mostradas vs aceptadas, objeciones y decisión del cliente. | Ampliar `demos` con campos estructurados de presentación y acta de feedback. |
| **12** | **Propuestas Comerciales y Tarifas** | Parcial (cotización simple) | Tarifas configurables, desglose de precio base, extras, IVA configurable, mantenimiento y aprobación de Robinson. | Actualizar `proposals` con desglose impositivo y soporte de plantillas de impresión/PDF. |
| **13** | **Gestión de Proyectos** | Implementado básico | Conversión desde oportunidad, retención del asesor como responsable comercial, hitos y tareas de proyecto. | Conectar `projects` con ADN, demo y propuesta, y añadir `project_milestones` y `project_tasks`. |
| **14** | **Control de Cambios de Alcance** | Inexistente | Solicitud formal de cambio de alcance con impacto en plazo/costo, aprobación de Robinson y versión de alcance resultante. | Crear entidad `scope_change_requests` con trazabilidad completa. |
| **15** | **Pruebas (QA) y Capacitación** | Inexistente | Casos de prueba (`qa_test_cases`, `qa_test_results`) y actas de capacitación (`training_sessions`) con confirmación del cliente. | Crear modelos y vistas para control de calidad y sesiones formativas. |
| **16** | **Clientes, Soporte e Incidencias** | Parcial (mantenimiento y eventos) | Mesa de ayuda con tickets clasificados por impacto y severidad, confirmación de solución y SLA. | Renombrar o extender `maintenance_events` a `support_tickets` con categorización completa. |
| **17** | **Retención, Renovación y Referidos** | Parcial (renovaciones básicas) | Alertas de vencimiento de soporte gratuito (3 meses), gestión de planes, referidos (`referrals`) y recuperación de oportunidades perdidas. | Crear entidades `referrals` y `lost_opportunities` con motivos y fechas de reactivación. |
| **18** | **Dashboard Administrativo Real** | Parcial (4 métricas fijas) | Panel ejecutivo con datos 100% reales (leads, embudo, conversión, desempeño de asesores, agenda, demos, proyectos, soporte). Cero datos ficticios. | Rediseñar `/dashboard` consumiendo consultas agregadas reales sobre todas las entidades. |
| **19** | **Centro de Notificaciones Internas** | Inexistente | Notificaciones dentro del CRM (asignaciones, tareas por vencer, reuniones, demos observadas/aprobadas, bloqueos). | Crear tabla `notifications` con lectura y filtrado. |
| **20** | **Búsqueda Global y Ficha 360°** | Inexistente | Buscador omnibox y vista integral del cliente que consolida historial, ADN, proyectos, demos y finanzas en un solo lugar. | Implementar barra de búsqueda y vista agregada 360°. |

---

## 6. Análisis de Riesgos de Compatibilidad y Seguridad

1. **Riesgo de Regresión en Leads Existentes:**
   - *Riesgo:* Modificar el tipo `lead_status_enum` o columnas de `leads` podría romper el tablero Kanban o invalidar datos históricos en producción.
   - *Mitigación:* Se mantendrán intactos los valores históricos del enum y los estados legacy (`Cerrado-Ganado`, `Cerrado-Perdido`, `Cita Agendada`). Las nuevas columnas se añadirán con `ADD COLUMN IF NOT EXISTS` y valores por defecto seguros.
2. **Riesgo de Concurrencia en la Agenda (Doble Reserva):**
   - *Riesgo:* Dos asesores comerciales intentando reservar el mismo bloque de Robinson simultáneamente.
   - *Mitigación:* Validación no solo en la interfaz, sino mediante una función transaccional `reserve_meeting_slot` en PostgreSQL con bloqueo de fila (`SELECT ... FOR UPDATE`) o constraint de exclusión temporal, garantizando atomicidad (ACID).
3. **Riesgo de Fuga de Información y Elevación de Privilegios:**
   - *Riesgo:* Asesores comerciales aprobando sus propias cotizaciones o accediendo a información privada de Robinson.
   - *Mitigación:* Reglas RLS en PostgreSQL donde `aprobar` requiere `get_user_role() = 'admin'`, y las reservas de agenda ocultan detalles privados exponiendo únicamente la etiqueta "No disponible".
4. **Riesgo de Fallo en Modo Offline / Docker:**
   - *Riesgo:* Al no estar Docker Desktop activo en la estación de trabajo local, comandos como `supabase db diff` intentan levantar contenedores locales y fallan.
   - *Mitigación:* Las migraciones se gestionan de forma declarativa con `npx supabase db push --linked` y scripts de verificación directa contra el endpoint SQL de Supabase Management API.

---

## 7. Plan de Implementación Incremental por Fases

- **FASE A — Auditoría y Matriz de Brechas (Completada):**
  - Inspección integral del código y base de datos.
  - Verificación de CLI y conectividad Supabase.
  - Documento de auditoría y matriz de brechas detallada.
  - Commit: `docs(fase-a): auditoria exhaustiva, conectividad cli y matriz de brechas`.

- **FASE B — Base Comercial y Agenda Compartida:**
  - Enriquecimiento de `leads` (nichos, canales, detección de duplicados).
  - Embudo comercial con etapas extendidas y registro de transiciones.
  - Módulo de `activities` (seguimiento continuo) y `tasks` (tareas vinculadas).
  - Módulo de agenda: Disponibilidad de Robinson, reserva atómica de asesores y prevención de solapamientos.

- **FASE C — Diagnóstico, ADN de Empresa y Módulo de Demos:**
  - Formulario estructurado de Diagnóstico para Robinson.
  - ADN de la empresa / cliente versionado con contexto consolidado no-AI.
  - Ficha de viabilidad técnica y comercial.
  - Solicitud de demo, repositorio de archivos `.md` y registro manual de ventanas de tokens de IA de 5h (0-100%).
  - Flujo de revisión y aprobación de Robinson.

- **FASE D — Propuestas Comerciales, Alcance y Proyectos:**
  - Generador de propuestas con tarifas dinámicas, desglose de IVA y aprobación.
  - Conversión a proyecto manteniendo al asesor como responsable comercial.
  - Hitos, tareas operativas y control de cambios de alcance trazable.

- **FASE E — Calidad, Entrega, Soporte y Fidelización:**
  - Pruebas QA (`qa_test_cases`, `qa_test_results`).
  - Actas de entrega y capacitación.
  - Mesa de ayuda, tickets de soporte y contratos de mantenimiento.
  - Oportunidades perdidas (recuperación) y módulo de referidos.

- **FASE F — Dirección Ejecutiva, Notificaciones y Auditoría:**
  - Dashboard directivo con analítica 100% real (cero mocks).
  - Centro de notificaciones internas del sistema.
  - Repositorio documental y búsqueda global 360°.
  - Verificación de compilación, permisos y entrega final.

---

## 8. Historial de Versiones y Modificaciones

### Versión 2.3.0 (04/10/2026) - Fase D (Propuestas Comerciales, Proyectos y Control de Cambios de Alcance)
- **Base de Datos & CLI:**
  - Migración aplicada por Supabase CLI: `20261004000002_fase_d_propuestas_proyectos_alcance.sql`.
  - Ampliación de tabla `proposals`: desglose financiero configurable (`base_amount`, `extras_amount`, `tax_rate`, `tax_amount`, `total`), cuota de mantenimiento mensual (`monthly_maintenance`), plazo de entrega estimado (`estimated_delivery_weeks`), términos comerciales y flujo de aprobación de Robinson (`robinson_approval_status`, `approved_by`, `approved_at`, `proposal_version`).
  - Ampliación de tabla `projects`: distinción de responsabilidad dual (`commercial_advisor_id` para seguimiento comercial permanente del asesor vs `technical_director_id` para dirección técnica de Robinson), versión de alcance (`scope_version`), control de bloqueos críticos (`has_blocker`, `active_blocker`).
  - Nueva tabla `project_milestones`: cronograma de hitos técnicos con fecha objetivo, fecha de completado y estados (`Pendiente`, `En progreso`, `Completado`, `Atrasado`).
  - Nueva tabla `scope_change_requests`: control formal y trazable de cambios de alcance (Change Requests `CR-YYYY-NNN`, impacto técnico, días adicionales, costo adicional, revisión de Robinson y aceptación de cliente).
- **Lógica de Servidor & Server Actions:**
  - `app/actions/milestones.ts`: `createMilestoneAction`, `updateMilestoneStatusAction`, `getProjectMilestonesAction`.
  - `app/actions/scope-changes.ts`: `createScopeChangeRequestAction`, `reviewScopeChangeAction`, `clientAcceptScopeChangeAction` (incrementa `scope_version` y ajusta presupuesto del proyecto automáticamente al ser aceptado por el cliente), `getProjectScopeChangesAction`.
- **Experiencia de Usuario & Vistas:**
  - `components/projects/milestones-section.tsx`: Tablero de hitos técnicos, porcentaje de avance, control de estados y creación de nuevos hitos de desarrollo.
  - `components/projects/scope-changes-section.tsx`: Gestión integral de Change Requests, métricas de impacto comercial/plazo, panel de revisión ejecutiva para Robinson y registro de aceptación formal del cliente.
  - `components/projects/project-detail-view.tsx`: Soporte ampliado a 6 pestañas (`Resumen`, `Hitos`, `Control de Cambios`, `Entregas`, `Pagos`, `Mantenimiento`), indicadores de Asesor Comercial vs Dirección Técnica, banner de alerta de proyectos bloqueados y versión de alcance visible.
  - `app/(dashboard)/proyectos/[id]/page.tsx`: Consulta relacional unificada de hitos y cambios de alcance.

### Versión 2.2.0 (04/10/2026) - Fase C (Diagnóstico, ADN de Empresa, Demos, Archivos .md y Tokens IA)
- **Base de Datos & CLI:**
  - Migración aplicada por Supabase CLI: `20261004000001_fase_c_diagnostico_dna_demos.sql`.
  - Nueva tabla `diagnostics`: formulario estructurado de diagnóstico conducido por Robinson (negocio, problemas, flujos, solución preliminar, viabilidad).
  - Nueva tabla `company_dna`: ADN de la empresa / cliente versionado con campo `consolidated_context` en Markdown (el asesor redacta el prompt maestro fuera del sistema, cumpliendo la regla de no generación automática).
  - Nueva tabla `feasibility_reviews`: análisis de complejidad, riesgos técnicos y decisión de Robinson.
  - Ampliación de `demos`: campos de criterios de aceptación, flujos clave, identidad visual recibida y trazabilidad de aprobación (`approval_status`, `approved_by`, `approved_at`, `approval_notes`).
  - Nueva tabla `demo_files`: repositorio seguro de archivos Markdown (.md) requeridos con versión, tamaño y estado de revisión.
  - Nueva tabla `ai_usage_windows`: modelo de registro manual de uso de IA por ventanas de 5 horas (porcentajes de 0% a 100%, selección rápida, soporte de ventanas sucesivas sin sumar límites).
- **Lógica de Servidor & Server Actions:**
  - `app/actions/diagnostics.ts`: `saveDiagnosticAction`, `getLeadDiagnosticAction`.
  - `app/actions/dna.ts`: `saveCompanyDNAAction`, `getCompanyDNAAction`.
  - `app/actions/feasibility.ts`: `saveFeasibilityReviewAction`, `getFeasibilityReviewAction`.
  - `app/actions/demos.ts`: soporte ampliado con `submitDemoForApprovalAction`, `reviewDemoAction` (Robinson), `uploadDemoMarkdownAction`, `registerAIUsageWindowAction`, `recordDemoPresentationResultAction`.
- **Experiencia de Usuario & Vistas:**
  - Rediseño de `components/demos/demo-detail-view.tsx` organizado en 5 pestañas: Requerimientos, Archivos .md (con visor modal seguro), Tokens IA (con barra de progreso y botones 10%-100%), Aprobación de Robinson y Presentación al Cliente.
  - Barra de progreso del ciclo de vida de la demo (`Borrador` → `En Revisión` → `Aprobada` → `Presentada` → `Aceptada`).

### Versión 2.1.0 (04/10/2026) - Fase B (Base Comercial, Seguimiento y Agenda Compartida)
- **Base de Datos & CLI:**
  - Migración aplicada por Supabase CLI: `20261004000000_fase_b_base_comercial.sql`.
  - Columnas añadidas a `leads`: `niche`, `legal_name`, `tax_id`, `city`, `province`, `website`, `social_media`, `contact_role`, `campaign`, `main_need`, `problem_description`, `current_management_method`, `team_size`, `reference_budget`, `next_action`, `next_followup_date`, `contact_preference`, `is_archived`.
  - Nuevas tablas relacionales: `activities`, `tasks`, `availability_blocks`, `meetings`.
  - Función transaccional atómica PostgreSQL `book_meeting_slot` con bloqueo `FOR UPDATE` para impedir dobles reservas concurrentes entre asesores comerciales.
- **Rutas y Vistas Nuevas:**
  - `/agenda`: Calendario semanal interactivo de Robinson Solórzano, bloques de disponibilidad, modal de reserva atómica y actualización de resultados de citas.
  - `/tareas`: Tablero visual de tareas operativas y comerciales clasificadas por estado (`Pendiente`, `En progreso`, `Bloqueada`, `Completada`), prioridad y alertas de vencimiento.
- **Formularios y Experiencia de Usuario:**
  - `/nuevo-lead`: Formulario enriquecido modularizado en 4 pestañas (Datos de Empresa, Contacto Principal, Situación y Necesidad, Gestión Comercial) con detector preventivo de duplicados en tiempo real.
  - `components/kanban/lead-detail-sheet.tsx`: Ficha expandida del prospecto con pestañas de Info General, Timeline de Actividades, Tareas asociadas y Bitácora histórica.
  - `components/navbar.tsx`: Enlaces directos a `/agenda` y `/tareas` con navegación responsive.
- **Roles & Tipado:**
  - `types/database.types.ts` actualizado con 4 roles (`admin`, `comercial`, `tecnico`, `soporte`), interfaces `Activity`, `Task`, `AvailabilityBlock`, `Meeting`, `BusinessNiche`.
  - `utils/auth/roles.ts`: Soporte ampliado para validación de roles en servidor y cliente.

### Versión 2.0.0 (04/10/2026) - Fase A (Auditoría Integral y Matriz de Brechas)
- Reactivación y verificación de salud de la base de datos Supabase remota (`ACTIVE_HEALTHY`).
- Verificación exitosa de conectividad Supabase CLI (`db push --linked --dry-run`, `migration list`).
- Auditoría exhaustiva de arquitectura, dependencias y rutas existentes.
- Elaboración de la Matriz de Brechas funcional contra los 30 puntos de la especificación empresarial.
- Formulación del plan de trabajo por fases y mitigación de riesgos de concurrencia y seguridad.

### Versión 1.4.0 (21/09/2026) - Fase 4 (Dashboard Operativo Preliminar)
- Implementación de la vista `/dashboard` para Administradores.
- Creación del Server Action `getDashboardMetricsAction`.
- Actualización de `Navbar` con soporte RBAC.

### Versión 1.3.0 (21/09/2026) - Fase 3 (Ciclo Post-Proyecto Inicial)
- Tablas `project_deliveries`, `project_acceptances`, `payments`, `maintenance_contracts`, `renewals`.
- UI de detalle de proyecto modular en pestañas (Tabs).

### Versión 1.2.0 (21/09/2026) - Fase 2 (Evolución Estructural)
- Implementación de RBAC (`admin`, `comercial`) y tabla `clients`.
- Sistema transversal de auditoría (`audit_logs`) con triggers automáticos.

### Versión 1.0.0 (21/09/2026) - MVP Inicial
- Creación del proyecto con Next.js 14, Tailwind y Supabase.
- Tablero Kanban con `@dnd-kit` y formulario básico de leads.
