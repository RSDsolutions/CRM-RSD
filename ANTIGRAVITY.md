# 🤖 PROTOCOLO OPERATIVO DE DESARROLLO - GOOGLE ANTIGRAVITY (AGY)

**Proyecto:** Mini-CRM / Lead Management - RSD Solutions  
**Destinatario:** Agente de Inteligencia Artificial (Google Antigravity) y Desarrolladores  
**Archivo de Auditoría Central:** [`AUDITORIA.md`](./AUDITORIA.md)

---

## 1. MANDATO PRINCIPAL: REGISTRO CONTINUO EN AUDITORÍA

Cualquier cambio, adición, refactorización o actualización que se realice en esta base de código **DEBE SER REGISTRADO OBLIGATORIAMENTE EN [`AUDITORIA.md`](./AUDITORIA.md)**.

Antes de dar por concluida cualquier tarea o solicitud del usuario, Antigravity debe:
1. Revisar si la acción modificó componentes, rutas, base de datos, dependencias o flujos lógicos.
2. Actualizar las secciones pertinentes en [`AUDITORIA.md`](./AUDITORIA.md) (Ficha Técnica, Rutas, Base de Datos, etc.).
3. Agregar una entrada descriptiva en la sección **"8. Historial de Versiones y Modificaciones"** indicando:
   - Fecha y número de versión o incremento (ej. v1.1.0).
   - Resumen detallado de los archivos creados o modificados.
   - Justificación y objetivo del cambio.

---

## 2. QUÉ SE DEBE REGISTRAR EN `AUDITORIA.md`

El agente debe mantener actualizado `AUDITORIA.md` ante cualquiera de los siguientes eventos:

| Tipo de Cambio | Qué registrar en `AUDITORIA.md` |
| :--- | :--- |
| **Nueva Vista o Ruta** | Ruta exacta (`/nueva-ruta`), propósito, si es pública o protegida por Middleware, y componentes principales. |
| **Base de Datos / Supabase** | Nuevas tablas, columnas añadidas, cambios en tipos `ENUM`, índices creados y políticas de seguridad RLS actualizadas. |
| **Nuevas Dependencias** | Paquetes añadidos vía `npm install`, versión exacta y razón de su inclusión en el stack. |
| **Cambios en Componentes** | Nuevos componentes en `components/`, modificaciones en la lógica del Kanban, del formulario o del panel lateral. |
| **Variables de Entorno** | Nuevas variables necesarias, si son públicas (`NEXT_PUBLIC_`) o privadas de servidor, y su reflejo en `.env.example`. |
| **Integraciones / APIs** | Nuevos endpoints, webhooks, Server Actions o servicios externos conectados (ej. WhatsApp, Zapier, Webhooks). |

---

## 3. ESTÁNDARES TÉCNICOS ESTRICTOS PARA ANTIGRAVITY

Al trabajar en este proyecto, Antigravity debe cumplir rigurosamente con las siguientes directrices:

### A. Integridad de TypeScript y Compilación
- **Cero errores de compilación:** Siempre verificar que `npm run build` o `npx tsc --noEmit` finalice con código de salida `0` antes de entregar el trabajo al usuario.
- **Tipado estricto:** No usar `any` implícitos. Todas las mutaciones, props y respuestas de Supabase deben tiparse utilizando [`types/database.types.ts`](./types/database.types.ts).

### B. Seguridad de Credenciales y Git
- **Protección de Secretos:** Nunca incluir llaves privadas, Service Role Keys ni contraseñas en archivos rastreados por Git (`.env.example`, scripts, etc.).
- Las credenciales reales deben residir exclusivamente en `.env.local` (el cual debe permanecer siempre dentro de `.gitignore`).
- Las carpetas temporales de herramientas como el CLI de Supabase (`supabase/.temp/`) no deben ser comiteadas.

### C. Supabase y Seguridad RLS
- Toda tabla nueva creada en Supabase **DEBE** tener `ALTER TABLE public.tabla ENABLE ROW LEVEL SECURITY;`.
- Crear políticas explícitas (`SELECT`, `INSERT`, `UPDATE`, `DELETE`) para el rol `authenticated`.
- Mantener sincronizado el archivo [`supabase/schema.sql`](./supabase/schema.sql) con cualquier cambio en base de datos.

### D. Experiencia de Usuario (UI/UX)
- Mantener la estética visual oscura moderna (**Dark Slate**) utilizando Tailwind CSS.
- En formularios y mutaciones asíncronas, incluir siempre indicadores de carga (`isSubmitting` / `Loader2`) y manejo defensivo con bloques `try/catch` para alertar al usuario si una operación falla.
- En componentes interactivos (como el Tablero Kanban), aplicar siempre **actualizaciones optimistas en UI con rollback automático** ante fallos de red.

---

## 4. CHECKLIST DE ENTREGA PARA CADA TAREA

Antes de responder al usuario o hacer commit, el agente debe verificar:
- [ ] ¿El código cumple con los requerimientos exactos solicitados?
- [ ] ¿Se ejecutó y validó la compilación (`npm run build`) exitosamente?
- [ ] ¿Se actualizó [`AUDITORIA.md`](./AUDITORIA.md) con los cambios implementados?
- [ ] ¿Se respetó la seguridad de datos y variables de entorno?
- [ ] ¿El estado de Git está limpio o listo para el commit correspondiente?
