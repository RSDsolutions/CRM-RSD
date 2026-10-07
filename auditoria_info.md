# Auditoría Técnica y Funcional: CRM-RSD Solutions
Este documento sirve como base de conocimiento estática (Contexto para IA) detallando la arquitectura, rutas, vistas, componentes, modelos de datos y flujos de negocio del sistema CRM a medida desarrollado para RSD Solutions.

## 1. Stack Tecnológico
*   **Framework:** Next.js 14.2.35 (App Router).
*   **Base de Datos y Auth:** Supabase (PostgreSQL, Row Level Security, RPC Functions, Edge Functions).
*   **Estilos y UI:** Tailwind CSS, Lucide React (Íconos), Diseño oscuro elegante (Slate-950) con acentos de color vibrantes (Indigo, Emerald, Violet).
*   **Manejo de Formularios:** React Hook Form + Zod.
*   **Kanban Drag & Drop:** `@dnd-kit/core`.
*   **Timezones y Fechas:** `date-fns` e `Intl.DateTimeFormat` (enfocado en `America/Bogota` para estandarización).

## 2. Roles del Sistema (`utils/auth/roles.ts`)
*   **`admin` (Robinson Solórzano):** Acceso total. Puede configurar horarios semanales de disponibilidad general, asignar prospectos, ver todo el panorama.
*   **`comercial` (Asesores):** Gestión de Leads, Kanban, Demos y Propuestas.
*   **`tecnico`:** Desarrolladores asignados a proyectos, QA, Entregables.
*   **`soporte`:** Gestión de tickets de clientes post-venta.

---

## 3. Flujo Principal del Negocio (Pipeline)
El sistema abarca el ciclo de vida completo de venta y producción:
`Lead (Prospecto)` ➔ `Diagnóstico (Cita)` ➔ `Demo` ➔ `Propuesta` ➔ `Cliente` ➔ `Proyecto (Implementación)` ➔ `Mantenimiento / Soporte (Post-Venta)`.

---

## 4. Estructura de Vistas y Rutas (Routing)

### 4.1 Kanban de Leads (Ruta: `/`)
El corazón comercial del CRM. Tablero Drag & Drop para mover leads entre estados.
*   **Estados (Columnas):** Nuevo, Contactado, Diagnóstico, Demo, Feedback Demo, Propuesta, Negociación, Aprobado, Convertido, Cerrado-Perdido.
*   **UI (`LeadCard`):** Tarjetas con colores dinámicos basados en el asesor (Morado para Robinson, etc.). Muestran nombre, empresa, pulso de notificación si hay citas pendientes.
*   **Slide-over `LeadDetailSheet`:** Al hacer clic en un lead, se abre un panel lateral completo con pestañas:
    *   *Info:* Datos generales del lead.
    *   *Client DNA:* ADN de la empresa (Flujos operativos, puntos de dolor, software actual). Botón para **Consolidar Contexto IA** que lee los campos del lead y genera un prompt listo para ChatGPT.
    *   *Actividades:* Bitácora de seguimiento.
    *   *Archivos:* Documentos adjuntos.
    *   *Acciones:* Botón global "Convertir a Cliente" que crea el registro de Cliente y Proyecto y marca el lead como "Convertido".

### 4.2 Ingreso de Leads (Ruta: `/nuevo-lead`)
Formulario particionado en pestañas lógicas (Client Components con validación Zod):
*   **Empresa & Contacto:** Datos básicos.
*   **Situación & Necesidad:** Qué software buscan (ERP/CRM, Mobile App, E-commerce, etc.), equipo, presupuesto.
*   **Gestión Comercial:**
    *   Desplegable dinámico de **Asesor Responsable** que consume `profiles` de BD.
    *   Checkpoint para **Agendamiento directo**: Si se marca, pide fecha/hora para el primer Diagnóstico Gratuito. Verifica duplicados en tiempo real (por teléfono/email).

### 4.3 Agenda Compartida (Ruta: `/agenda`)
Motor de reservas atómico anti-colisiones.
*   **UI Calendario:** Grid visual de la semana de Robinson Solórzano.
*   **Slide-over de Reserva (`BookingModal`):** Rediseñado con pasos y tarjetas (Fecha/Hora, Datos del Prospecto, Detalles/Enlace de Meet). Seleccionador nativo de `datetime-local` adaptado a la zona horaria.
*   **Gestión de Horario (`weekly_schedules`):** El admin configura su franja horaria (Ej: 09:00 - 18:00). Las reservas se validan en el servidor (`America/Bogota`) contra este horario.
*   **Excepciones (`availability_blocks`):** Para bloquear horas por almuerzo, viajes o imprevistos.

### 4.4 Módulo Comercial (Demos y Propuestas)
*   **`/comercial/demos` y `/comercial/demos/[id]`:** Registro de la demostración técnica, feedback del usuario ("Positivo", "Dudas"), URLs de grabación.
*   **`/comercial/propuestas` y `/comercial/propuestas/[id]`:** Generación de cotizaciones. Estados: Borrador, Enviada, En Negociación, Aprobada, Rechazada. Control de presupuesto.

### 4.5 Módulo de Clientes y 360° (Rutas: `/clientes`, `/clientes/[id]`)
*   **Vista Perfil 360:** Consolidación total de la relación con el cliente (Empresas convertidas).
*   **Sub-secciones:**
    *   *Proyectos Activos:* Vínculo a la producción.
    *   *Facturación & Pagos:* Historial económico.
    *   *Tickets de Soporte (`SupportTicketsSection`):* Manejo de incidencias.
    *   *Retención & Referidos (`ReferralsSection`):* NPS, testimonios, referidos traídos por el cliente.
    *   *Renovaciones (`RenewalsSection`):* Control de pagos de hosting, dominios o mantenimientos anuales.

### 4.6 Módulo de Producción (Rutas: `/proyectos`, `/proyectos/[id]`)
El gestor del ciclo de desarrollo de software para el cliente.
*   **Secciones del Proyecto (`ProjectDetailView`):**
    *   **Hitos (Milestones) & Entregables (`Deliverables`):** Progreso iterativo.
    *   **Pruebas QA (`qa-section.tsx`):** Control de calidad y reporte de bugs internos.
    *   **Capacitación (`training-section.tsx`):** Sesiones grabadas de inducción al software entregado.
    *   **Aceptación Técnica:** Conformidad formal de módulos.
    *   **Cambios de Alcance (`scope-changes.tsx`):** Gestión de requerimientos adicionales (cobros extras) que el cliente pide a mitad de desarrollo.

### 4.7 Utilidades Adicionales
*   **`/dashboard`:** Analíticas de ventas, tasas de conversión, carga de trabajo por asesor.
*   **Notificaciones Internas (`/components/notifications/notifications-bell.tsx`):** Campana en tiempo real alimentada desde `actions/notifications.ts` para alertar cuando se asignan leads, se vencen tareas o se aprueban propuestas.
*   **`/tareas`:** To-Do list general del asesor.

---

## 5. Estructura de la Base de Datos (Principales Tablas y Enums)

*   `profiles`: Maneja el rol (`UserRole`) y datos del usuario (auth).
*   `leads`: Central de prospectos. Status manejado por enum `LeadStatus`. Enlazado a `assigned_to` (nombre).
*   `company_dna`: Información cualitativa 1-a-1 con el lead para extraer contexto útil (modelo, problemas, herramientas actuales).
*   `activities`: Logs del historial del CRM.
*   `meetings` / `availability_blocks` / `weekly_schedules`: Sistema atómico de reservas (con RPC Functions).
*   `demos` y `proposals`: Vinculados al `lead_id`.
*   `clients`: Un prospecto convertido pasa a ser cliente. Hereda datos del lead.
*   `projects`: Vinculados a un cliente. Poseen estados (Planificación, Desarrollo, Pruebas, Lanzamiento, Mantenimiento).
*   Sub-tablas de producción: `project_milestones`, `deliverables`, `qa_testing`, `training_sessions`, `technical_acceptances`, `scope_changes`.
*   Sub-tablas post-venta: `client_maintenance_contracts`, `support_tickets`, `client_retention_referrals`.

## 6. Funciones Server-Side Críticas (`app/actions/`)
El sistema no llama a Supabase desde el cliente (salvo Auth), se usan "Server Actions" en Next.js.
*   **`agenda.ts`:**
    *   `bookMeetingSlotAction`: Valida contra el RPC de la base de datos para bloqueo transaccional (`FOR UPDATE` sobre `profiles`) impidiendo dobles reservas en tiempo real. También formatea la validación con `Intl.DateTimeFormat('en-US', { timeZone: 'America/Bogota' })`.
*   **`leads.ts`:**
    *   `createEnrichedLeadAction`: Guarda el lead.
    *   `getComercialAdvisorsAction`: Extrae la lista de asesores para los desplegables desde `profiles`.
*   **`dna.ts`:** Obtiene y genera el contexto agrupado del cliente para ChatGPT.

---
**Nota para la IA asistente:** Al generar o sugerir código para este proyecto, mantén la estética `slate-950` con `indigo/violet`, utiliza los `Server Actions` existentes en el directorio `/app/actions`, y recuerda que todo componente nuevo con interactividad o `useState` debe usar la directiva `'use client'`. Las fechas se procesan habitualmente considerando la zona horaria UTC-5.
