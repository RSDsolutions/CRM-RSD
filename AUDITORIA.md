# 📋 AUDITORÍA DEL SISTEMA: MINI-CRM RSD SOLUTIONS

**Documento de Estado Técnico, Arquitectura y Registro Funcional**  
**Fecha de Auditoría:** 21 de Septiembre de 2026  
**Versión del Sistema:** 1.0.0 (Producción / Estable)  
**Organización:** RSD Solutions  
**Repositorio GitHub:** [https://github.com/RSDsolutions/CRM-RSD](https://github.com/RSDsolutions/CRM-RSD)  
**ID del Proyecto Supabase:** `gzgdilrlzqitsprhqcld`

---

## 1. Resumen Ejecutivo
El **Mini-CRM de RSD Solutions** es una plataforma web interna diseñada para la gestión, seguimiento y prospección comercial de leads calificados provenientes de pauta publicitaria. El sistema permite a los asesores comerciales ingresar prospectos de forma estandarizada y al Administrador supervisar el pipeline en tiempo real mediante un tablero visual Kanban interactivo con soporte de Drag & Drop y actualización optimista.

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

## 3. Arquitectura del Código Fuente

```text
CRM-RSD/
├── app/
│   ├── layout.tsx                # Layout principal con Navbar persistente y configuración de fuentes
│   ├── globals.css               # Estilos globales, variables de color CSS y scrollbars personalizadas
│   ├── page.tsx                  # Vista principal: Servidor SSR que consulta leads y renderiza Kanban
│   ├── login/
│   │   └── page.tsx              # Vista de autenticación con credenciales Supabase Auth
│   └── nuevo-lead/
│       └── page.tsx              # Vista de ingreso de prospectos con validación Zod y DatePicker
├── components/
│   ├── navbar.tsx                # Barra de navegación superior con sesión activa, logo y logout
│   └── kanban/
│       ├── kanban-board.tsx      # Contenedor central DndContext, lógica optimista y rollback
│       ├── lead-card.tsx         # Tarjeta arrastrable con cálculo de urgencia (hoy/vencido en rojo)
│       └── lead-detail-sheet.tsx # Panel lateral deslizante para auditoría y edición de bitácora
├── types/
│   └── database.types.ts         # Definiciones TypeScript de entidades y enumeraciones de base de datos
├── utils/
│   └── supabase/
│       ├── client.ts             # Cliente de Supabase para Client Components (createBrowserClient)
│       └── server.ts             # Cliente de Supabase para Server Components y Server Actions
├── middleware.ts                 # Interceptor de rutas para refresco de tokens y redirección a /login
├── supabase/
│   ├── config.toml               # Configuración del CLI de Supabase
│   └── schema.sql                # Script DDL declarativo de creación de tablas, ENUMs y RLS
├── .env.local                    # Credenciales activas locales (ignorado por Git)
├── .env.example                  # Plantilla de variables sin valores sensibles
├── .gitignore                    # Reglas de exclusión de Git (node_modules, .env, .temp)
├── package.json                  # Definición de dependencias y scripts de ejecución
├── tsconfig.json                 # Configuración de compilador TypeScript y alias de importación (@/*)
└── tailwind.config.ts            # Configuración de temas, colores y rutas de purgado CSS
```

---

## 4. Base de Datos y Seguridad (Supabase PostgreSQL)

### A. Tipos Enumerados (`ENUM`)
1. **`software_type_enum`:**
   - Valores permitidos: `'Web App'`, `'Mobile App'`, `'E-commerce'`, `'ERP/CRM'`, `'Landing Page'`, `'Otro'`.
2. **`lead_status_enum`:**
   - Valores permitidos: `'Nuevo'`, `'Contactado'`, `'Cita Agendada'`, `'Propuesta'`, `'Negociación'`, `'Cerrado-Ganado'`, `'Cerrado-Perdido'`.

### B. Tabla Principal: `public.leads`
| Campo | Tipo SQL | Restricciones | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY, DEFAULT gen_random_uuid()` | Identificador único universal |
| `company_name` | `TEXT` | `NOT NULL` | Razón social o nombre comercial |
| `contact_name` | `TEXT` | `NOT NULL` | Nombre y apellido del contacto clave |
| `software_type` | `software_type_enum` | `NOT NULL` | Tipo de solución tecnológica buscada |
| `interaction_log`| `TEXT` | `NOT NULL` | Bitácora de requerimientos, objeciones y notas |
| `appointment_scheduled` | `BOOLEAN` | `NOT NULL, DEFAULT false` | Indicador si se coordinó reunión de diagnóstico |
| `appointment_date` | `TIMESTAMPTZ` | `NULLABLE` | Fecha y hora pactada para la cita |
| `status` | `lead_status_enum` | `NOT NULL, DEFAULT 'Nuevo'` | Estado comercial dentro del pipeline Kanban |
| `assigned_to` | `TEXT` | `NOT NULL` | Nombre del asesor comercial responsable |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL, DEFAULT now()` | Fecha de registro inicial |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL, DEFAULT now()` | Fecha de última modificación |

### C. Índices y Triggers
- **Índice `idx_leads_status`:** Optimiza el agrupamiento por columnas en el tablero Kanban.
- **Índice `idx_leads_created_at`:** Acelera la ordenación cronológica descendente.
- **Trigger `trigger_set_leads_updated_at`:** Ejecuta la función `public.handle_updated_at()` antes de cada `UPDATE` para mantener sincronizado `updated_at`.

### D. Políticas de Seguridad RLS (Row Level Security)
La tabla `public.leads` tiene RLS habilitado de forma estricta. Todo acceso anónimo es bloqueado por defecto.
- `SELECT`: Permitido únicamente a usuarios con rol `authenticated`.
- `INSERT`: Permitido únicamente a usuarios con rol `authenticated`.
- `UPDATE`: Permitido únicamente a usuarios con rol `authenticated`.
- `DELETE`: Permitido únicamente a usuarios con rol `authenticated`.

---

## 5. Vistas y Módulos del Sistema

### 1. Módulo de Autenticación (`/login`)
- **Acceso:** Público (usuarios ya autenticados son redirigidos automáticamente al Dashboard `/`).
- **Mecanismo:** Supabase Auth (`signInWithPassword`).
- **Seguridad:** Cookies seguras gestionadas por `@supabase/ssr`.
- **UI:** Interfaz oscura minimalista con validación de inputs, feedback de carga (`Loader2`) y mensajes de error descriptivos.

### 2. Tablero Kanban (`/`)
- **Acceso:** Protegido por Middleware (requiere sesión activa).
- **Columnas agrupadas por estado:**
  1. *Nuevo* (Indicador azul)
  2. *Contactado* (Indicador amarillo)
  3. *Cita Agendada* (Indicador violeta)
  4. *Propuesta* (Indicador cian)
  5. *Negociación* (Indicador ámbar)
  6. *Cerrado-Ganado* (Indicador verde esmeralda)
  7. *Cerrado-Perdido* (Indicador rojo rosa)
- **Comportamiento Drag & Drop:**
  - Sensor de puntero con tolerancia de 5px de distancia para evitar arrastres involuntarios al hacer clic.
  - **Actualización Optimista:** Al soltar la tarjeta, el estado local de React se actualiza de inmediato sin esperar al servidor.
  - **Persistencia Asíncrona:** Se dispara la mutación a Supabase (`update({ status })`). En caso de error de red, el sistema ejecuta un rollback al estado previo y muestra una alerta visual.
- **Botón de Refresco Manual:** Permite sincronizar el tablero con la base de datos sin recargar la página completa.

### 3. Tarjeta de Prospecto (`LeadCard`)
- **Datos visibles:** Nombre de la empresa, badge del tipo de software, nombre del contacto y asesor asignado.
- **Alertas Visuales de Cita:**
  - Si no tiene cita: no muestra badge adicional.
  - Si la cita es hoy o ya venció: Badge rojo pulsante (`animate-pulse`) con icono de alerta (`AlertTriangle`).
  - Si la cita es a futuro: Badge índigo/azul con icono de reloj y formato amigable en español.
- **Interacción:** Un clic sobre la tarjeta abre el panel lateral de auditoría y edición.

### 4. Panel Lateral de Detalle (`LeadDetailSheet`)
- **Componente:** Panel deslizable tipo Sheet (animación lateral derecha).
- **Funcionalidad:**
  - Muestra la metadata completa del prospecto.
  - **Edición en caliente:** Campo de texto enriquecido para modificar `interaction_log`.
  - Botón de guardado con estado de carga (`Loader2`) y confirmación toast en verde.
  - Sincronización instantánea con el estado del tablero padre.

### 5. Formulario de Ingreso de Leads (`/nuevo-lead`)
- **Acceso:** Protegido por Middleware.
- **Validación con Zod:**
  - `company_name`: Mínimo 2 caracteres.
  - `contact_name`: Mínimo 2 caracteres.
  - `software_type`: Validación contra los 6 tipos del ENUM.
  - `assigned_to`: Nombre obligatorio del asesor.
  - `interaction_log`: Mínimo 10 caracteres obligatorios.
  - `appointment_scheduled`: Booleano (checkbox reactivo).
  - `appointment_date`: Validación condicional cruzada (`.refine()`). Si `appointment_scheduled` es `true`, el campo de fecha y hora es estrictamente obligatorio.
- **Flujo:** Al guardar exitosamente, muestra alerta de confirmación y redirige automáticamente al tablero en 1.2 segundos.

### 6. Capa de Protección y Sesiones (`middleware.ts`)
- Intercepta todas las rutas excepto archivos estáticos (`_next`, favicons, imágenes).
- Refresca automáticamente las cookies de sesión en cada navegación.
- Redirección segura:
  - Sin sesión activa intentando ver `/` o `/nuevo-lead` -> Redirige a `/login`.
  - Con sesión activa intentando ver `/login` -> Redirige a `/`.

---

## 6. Usuarios y Credenciales de Acceso Activas

Las siguientes cuentas han sido creadas en Supabase Auth y validadas con confirmación inmediata de correo electrónico:

| Usuario | Rol en Sistema | Correo de Acceso |
| :--- | :--- | :--- |
| **Administrador Principal** | Auditor / Supervisor de Pipeline | `robinisonsolorzano99@gmail.com` |
| **Administrador (Reserva)** | Auditor / Supervisor de Pipeline | `robinsonsolorzano99@gmail.com` |
| **Asesor Comercial** | Captura y Gestión de Prospectos | `asesor@rsdsolutions.lat` |

---

## 7. Variables de Entorno

| Variable | Visibilidad | Obligatoria en Vercel | Descripción |
| :--- | :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Cliente / Servidor | **Sí** | Endpoint del proyecto Supabase (`https://gzgdilrlzqitsprhqcld.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Cliente / Servidor | **Sí** | Clave anónima pública para autenticación e interacción con RLS |

---

## 8. Historial de Versiones y Modificaciones

### Versión 1.0.0 (21/09/2026)
- Creación inicial del proyecto con Next.js 14 App Router, Tailwind y TypeScript.
- Creación de esquema relacional `leads` con enums, RLS y triggers en Supabase.
- Implementación de Kanban multi-columna con `@dnd-kit` y actualización optimista.
- Formulario de captura con validación Zod y DatePicker condicional.
- Panel Sheet para edición directa de bitácoras de interacción.
- Configuración de Middleware de protección de sesión con `@supabase/ssr`.
- Despliegue y repositorio enlazado a GitHub (`main`) con verificación de build en verde.
