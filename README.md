# Mini-CRM / Lead Management - RSD Solutions

Aplicación web interna para la gestión y prospección de leads comerciales provenientes de pauta publicitaria para la agencia de software **RSD Solutions**.

## Stack Tecnológico
- **Framework:** Next.js 14+ (App Router, React 18, TypeScript)
- **Estilos:** Tailwind CSS con estética moderna Dark Mode y componentes tipo Shadcn/UI
- **Base de Datos & Auth:** Supabase (PostgreSQL + Row Level Security + Supabase Auth)
- **Formularios & Validación:** React Hook Form + Zod
- **Drag & Drop:** `@dnd-kit/core` & `@dnd-kit/sortable`
- **Iconografía & Utilidades:** Lucide React, date-fns

---

## 1. Configuración Local

### A. Clonar e Instalar Dependencias
```bash
npm install
```

### B. Variables de Entorno
Copia el archivo `.env.example` a `.env.local` y agrega tus credenciales de Supabase:
```bash
cp .env.example .env.local
```

Contenido de `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-aqui
```

### C. Base de Datos en Supabase
1. Ingresa a tu panel de Supabase.
2. Abre el **SQL Editor**.
3. Pega y ejecuta el script ubicado en [`supabase/schema.sql`](supabase/schema.sql).

### D. Ejecutar Servidor Local
```bash
npm run dev
```
Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

---

## 2. Despliegue en Vercel

1. Sube tu proyecto a GitHub:
   ```bash
   git init
   git add .
   git commit -m "feat: initial release CRM RSD Solutions"
   git branch -M main
   git remote add origin https://github.com/TU_USUARIO/CRM-RSD.git
   git push -u origin main
   ```
2. En [Vercel](https://vercel.com), importa el repositorio de GitHub.
3. En la sección **Environment Variables**, configura:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Haz clic en **Deploy**.
5. En Supabase (**Authentication -> URL Configuration**), agrega la URL de Vercel a **Site URL** y **Redirect URLs**.
