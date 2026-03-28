// src/app/layout.jsx
import Providers from "@/components/Providers";
import "./globals.css";

export const metadata = {
  title: "ANAM Team — Gestión de Proyectos y Equipo",
  description: "Sistema de gestión de proyectos, tareas y equipo para ANAM",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        <script dangerouslySetInnerHTML={{ __html: `try{const t=localStorage.getItem('theme');const p=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';if((t||p)==='dark')document.documentElement.classList.add('dark')}catch(e){}` }} />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
