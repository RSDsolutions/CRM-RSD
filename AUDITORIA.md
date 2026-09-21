# 📋 AUDITORÍA DEL SISTEMA: MINI-CRM RSD SOLUTIONS

**Documento de Estado Técnico, Arquitectura y Registro Funcional**  
**Fecha de Auditoría:** 21 de Septiembre de 2026  
**Versión del Sistema:** 1.2.0 (Fase 1 y 2 - Evolución a Plataforma Comercial)  
**Organización:** RSD Solutions  
**Repositorio GitHub:** [https://github.com/RSDsolutions/CRM-RSD](https://github.com/RSDsolutions/CRM-RSD)  
**ID del Proyecto Supabase:** `gzgdilrlzqitsprhqcld`

---

## 1. Resumen Ejecutivo
El **CRM de RSD Solutions** es una plataforma web interna diseñada para la gestión integral del ciclo de vida del cliente. Comenzó como un MVP para captura de prospectos y ha evolucionado hacia un ERP comercial completo que cubre: Prospección (Leads), Demostraciones de Producto, Cotizaciones y Propuestas Comerciales, Conversión a Clientes y Gestión de Proyectos en ejecución. 

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
│   │   └── page.tsx              # Vista Kanban principal de Leads
│   ├── actions/                  # Server Actions (Mutaciones)
│   │   ├── clients.ts
│   │   ├── demos.ts
│   │   ├── proposals.ts
│   │   └── projects.ts
│   ├── layout.tsx                # Layout principal con Navbar dinámico (Roles)
│   ├── login/                    # Autenticación
│   └── nuevo-lead/               # Ingreso de prospectos
├── components/
│   ├── clients/                  # Componentes UI de Clientes
│   ├── demos/                    # Componentes UI de Demos
│   ├── kanban/                   # Tablero Kanban Drag&Drop
│   ├── proposals/                # Componentes UI de Propuestas
│   ├── projects/                 # Componentes UI de Proyectos
│   └── navbar.tsx                # Barra superior con navegación por módulos y RBAC
├── types/
│   └── database.types.ts         # Definiciones TypeScript de entidades actualizadas
├── utils/
│   ├── auth/
│   │   └── roles.ts              # Utilidades para roles y RBAC
│   └── supabase/                 # Clientes Supabase SSR
├── middleware.ts                 # Interceptor de sesión y redirecciones
└── supabase/migrations/          # Archivos SQL de evolución de Base de Datos
```

---

## 4. Modelo de Base de Datos y Seguridad (PostgreSQL)

El sistema ha evolucionado de una única tabla `leads` a un esquema normalizado completo para gestión comercial.

### A. Tipos Enumerados (`ENUM`) Actualizados
1. **`lead_status_enum`:**
   - Flujo comercial: `Nuevo`, `Contactado`, `Diagnóstico`, `Demo`, `Feedback Demo`, `Propuesta`, `Negociación`, `Aprobado`, `Convertido`, `Cerrado-Perdido`, `Perdido`
   - *Legado (por compatibilidad)*: `Cita Agendada`, `Cerrado-Ganado`.

### B. Entidades Principales
1. **`leads`**: Prospectos ingresados. Mantiene el pipeline inicial. Al llegar a "Aprobado" y firmar propuesta, se convierten a `clients`.
2. **`profiles`**: Extensión de `auth.users` para manejar metadatos, nombres y Roles (`admin` | `comercial`).
3. **`clients` & `client_contacts`**: Directorio formal de empresas o personas que ya son clientes activos.
4. **`demos` & `demo_feedback`**: Registro de presentaciones de software a prospectos o clientes. Historial inmutable de feedback por demo.
5. **`proposals`**: Cotizaciones formales. Autogeneran su correlativo (`RSD-PROP-2026-001`). Al aceptarse, disparan la creación automática de un Proyecto y un Cliente (si el origen era un lead).
6. **`projects`**: Trabajos de desarrollo en ejecución, con control de estados, fechas de inicio/entrega y enlaces a repositorios y producción.
7. **`audit_logs`**: Tabla de trazabilidad. Un trigger de BD registra automáticamente todos los eventos de `INSERT`, `UPDATE` o `DELETE` de casi todas las entidades, guardando el autor, tabla y el diff de datos modificado.

### C. Políticas de Seguridad (RBAC y RLS)
- **RLS (Row Level Security):** Activo en todas las tablas.
- Todo acceso anónimo está bloqueado.
- Las lecturas, inserciones y actualizaciones están permitidas a usuarios autenticados, pero la lógica de la UI y los Server Actions controlan los flujos.
- **`DELETE`**: Eliminaciones físicas en tablas como `clients`, `proposals` o `projects` están estrictamente restringidas solo a usuarios con rol `admin` (`public.get_user_role() = 'admin'`).

---

## 5. Vistas y Módulos del Sistema

### 1. Tablero Comercial Kanban (Leads)
- Mantiene toda la robustez del Drag&Drop optimista original.
- Adaptado para mostrar las nuevas columnas de pipeline (`Diagnóstico`, `Demo`, `Propuesta`, etc.).
- Permite la visualización rápida de leads y su gestión hasta la conversión.

### 2. Módulo Comercial (Demos y Propuestas)
- **Demos:** Permite registrar demostraciones asociadas a Leads o Clientes. Cada demo tiene una bitácora de feedback asociada para rastrear objeciones o comentarios del prospecto post-presentación.
- **Propuestas:** Cotizaciones con precio base y descuento.
  - Flujo automatizado: Al cambiar una propuesta al estado **"Aceptada"**, el sistema automáticamente (mediante Server Actions):
    1. Convierte el Lead a un Cliente en el directorio.
    2. Crea un Proyecto asignado a ese cliente, migrando el presupuesto y el alcance.

### 3. Módulo de Directorio de Clientes
- Vista en tabla y vista de perfil (Profile) para cada cliente.
- Manejo de información fiscal, múltiples contactos (`client_contacts`) y notas.

### 4. Módulo de Proyectos (Operativa)
- Gestión de los proyectos firmados.
- Control de estados: Desde `Planificación` y `Desarrollo` hasta `Entregado` y `Mantenimiento`.
- Rastreo de URLs de producción y repositorios.

---

## 6. Historial de Versiones y Modificaciones

### Versión 1.2.0 (21/09/2026) - Evolución Estructural
- Implementación de RBAC (Role-Based Access Control) para separar perfiles Admin y Comercial.
- Tablas `clients` y `client_contacts` añadidas. Conversión manual y automática de leads a clientes.
- Sistema transversal de Auditoría (`audit_logs`) con triggers automáticos en PostgreSQL.
- Ampliación del pipeline comercial en `lead_status_enum`.
- Nuevas entidades comerciales: `demos`, `demo_feedback`, `proposals`, `projects`.
- Automatización del flujo comercial: Demo -> Propuesta -> Aceptación -> Auto-creación de Proyecto y Cliente.
- Nuevas vistas UI funcionales y modulares para todas las entidades implementadas, sin perder el minimalismo del MVP original.

### Versión 1.0.0 (21/09/2026) - MVP Inicial
- Creación del proyecto con Next.js 14, Tailwind y Supabase.
- Implementación de Kanban con `@dnd-kit` y actualización optimista.
- Formulario de leads y protección con Middleware de sesión.
