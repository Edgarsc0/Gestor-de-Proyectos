// src/app/layout.tsx
import type { Metadata } from "next";
import Providers from "@/components/Providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gestión de Equipo — Servicio Social",
  description: "Sistema de gestión de proyectos y tareas para equipos de servicio social",
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
