// src/app/layout.tsx
import type { Metadata } from "next";
import Providers from "@/components/Providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "ANAM Team — Gestión de Proyectos y Equipo",
  description: "Sistema de gestión de proyectos, tareas y equipo para ANAM",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
