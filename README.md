# 📋 Gestión de Equipo — Servicio Social

Sistema de gestión de proyectos y tareas para equipos de servicio social. Permite ver **quién hace qué**, en qué proyectos participa cada miembro y el avance de cada tarea.

![Next.js](https://img.shields.io/badge/Next.js-14-black)
![Tailwind](https://img.shields.io/badge/Tailwind-3.4-38bdf8)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169e1)
![Prisma](https://img.shields.io/badge/Prisma-5-2d3748)

## ✨ Características

- **Inicio de sesión con Google** — sin contraseñas, solo cuentas de Google autorizadas
- **Panel general** — estadísticas, avance por proyecto, actividad reciente y vista "¿Quién hace qué?"
- **Gestión de proyectos** — crear proyectos, asignar miembros, ver progreso
- **Gestión de tareas** — vista Kanban y lista, filtrar por proyecto o miembro, cambiar estatus rápidamente
- **Vista de equipo** — ver las tareas activas de cada persona, en qué proyectos participa
- **Diseño limpio y responsivo** — funciona en desktop y móvil

---

## 🚀 Instalación paso a paso

### 1. Requisitos previos

- **Node.js 18+** → [descargar aquí](https://nodejs.org/)
- **PostgreSQL** → [descargar aquí](https://www.postgresql.org/download/) o usar [Neon](https://neon.tech) / [Supabase](https://supabase.com) (gratis)

### 2. Clonar e instalar dependencias

```bash
cd gestion-equipo
npm install
```

### 3. Configurar variables de entorno

```bash
cp .env.example .env
```

Edita `.env` con tus datos:

#### Base de datos PostgreSQL
```
DATABASE_URL="postgresql://usuario:contraseña@localhost:5432/gestion_equipo"
```

Si usas **Neon** o **Supabase**, copia la URL de conexión que te dan.

#### Secreto de NextAuth
```bash
# Genera uno con:
openssl rand -base64 32
```

#### Credenciales de Google OAuth

1. Ve a [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Crea un proyecto o selecciona uno existente
3. Ve a **Credenciales** → **Crear credenciales** → **ID de cliente OAuth 2.0**
4. Tipo de aplicación: **Aplicación web**
5. Nombre: "Gestión de Equipo" (o el que quieras)
6. **URIs de redirección autorizados**: `http://localhost:3000/api/auth/callback/google`
7. Copia el **Client ID** y **Client Secret** a tu `.env`

> **Nota:** También necesitas habilitar la **pantalla de consentimiento de OAuth** en la consola de Google. Si es solo para tu equipo, selecciona "Interno" (solo usuarios de tu organización).

### 4. Configurar la base de datos

```bash
# Crear las tablas
npx prisma db push

# (Opcional) Cargar datos de ejemplo
npx tsx prisma/seed.ts

# (Opcional) Ver la base de datos visualmente
npx prisma studio
```

### 5. Iniciar el servidor

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) y listo.

---

## 📁 Estructura del proyecto

```
src/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/  → Autenticación con Google
│   │   ├── dashboard/           → API del panel general
│   │   ├── projects/            → CRUD de proyectos
│   │   ├── tasks/               → CRUD de tareas
│   │   └── members/             → Gestión de asignaciones
│   ├── dashboard/
│   │   ├── page.tsx             → Panel principal
│   │   ├── proyectos/           → Gestión de proyectos
│   │   ├── equipo/              → Vista del equipo
│   │   └── tareas/              → Kanban y lista de tareas
│   └── login/                   → Página de inicio de sesión
├── components/
│   ├── Badges.tsx               → Status, Priority, Avatar, ProgressBar
│   ├── Modal.tsx                → Modal reutilizable
│   ├── Providers.tsx            → SessionProvider de NextAuth
│   └── Sidebar.tsx              → Navegación lateral
├── lib/
│   ├── auth.ts                  → Configuración de NextAuth
│   └── prisma.ts                → Cliente de Prisma
└── types/
    └── next-auth.d.ts           → Extensiones de tipos
```

---

## 🔧 Comandos útiles

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run start` | Iniciar en producción |
| `npx prisma db push` | Sincronizar esquema con la BD |
| `npx prisma studio` | Abrir el visor visual de la BD |
| `npx tsx prisma/seed.ts` | Cargar datos de ejemplo |

---

## 🌐 Deploy en producción

### Vercel (recomendado)
1. Sube el proyecto a GitHub
2. Conéctalo en [vercel.com](https://vercel.com)
3. Agrega las variables de entorno en la configuración del proyecto
4. Cambia `NEXTAUTH_URL` a tu dominio de producción
5. Agrega la URL de callback de producción en Google Cloud Console:
   `https://tu-dominio.vercel.app/api/auth/callback/google`

### Base de datos
Para producción usa un servicio PostgreSQL en la nube:
- **Neon** (gratis) — [neon.tech](https://neon.tech)
- **Supabase** (gratis) — [supabase.com](https://supabase.com)
- **Railway** — [railway.app](https://railway.app)

---

## 👥 Cómo funciona

1. **Los miembros inician sesión** con su cuenta de Google → automáticamente aparecen en el equipo
2. **El administrador crea proyectos** y asigna miembros a cada uno
3. **Se crean tareas** dentro de los proyectos y se asignan a miembros específicos
4. **Cada miembro actualiza** el estatus de sus tareas (Pendiente → En progreso → En revisión → Completada)
5. **El panel principal** muestra en tiempo real quién hace qué y el avance general

---

Hecho con ❤️ para hacer el servicio social más organizado.
