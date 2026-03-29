// src/app/login/page.jsx
"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";

function AnamLogoMark({ size = 56 }) {
  return (
    <Image
      src="/anam_logo.png"
      width={size}
      height={size}
      alt="Logo ANAM"
      className="flex-shrink-0"
    />
  );
}

export default function LoginPage() {
  const [loading, setLoading] = useState(false);

  const handleLogin = () => {
    setLoading(true);
    signIn("google", { callbackUrl: "/dashboard" });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 relative overflow-hidden">
      {/* Fondo — orbes con colores ANAM */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ x: [0, 40, 0], y: [0, -30, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-32 -right-32 w-[600px] h-[600px] rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(139,21,21,0.30) 0%, transparent 70%)",
          }}
        />
        <motion.div
          animate={{ x: [0, -50, 0], y: [0, 40, 0], scale: [1, 1.15, 1] }}
          transition={{
            duration: 22,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2,
          }}
          className="absolute -bottom-40 -left-40 w-[700px] h-[700px] rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(163,27,27,0.22) 0%, transparent 70%)",
          }}
        />
        <motion.div
          animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
          transition={{
            duration: 14,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 4,
          }}
          className="absolute top-1/2 left-1/3 w-[500px] h-[500px] rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(212,160,32,0.12) 0%, transparent 70%)",
          }}
        />

        {/* Patrón de cuadrícula */}
        <div
          className="absolute inset-0 opacity-[0.1]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      <div className="relative z-10 w-full max-w-md px-6">
        {/* Logo flotante */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="flex justify-center mb-6"
        >
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="shadow-2xl shadow-brand-900/50 rounded-2xl"
          >
            <AnamLogoMark size={250} />
          </motion.div>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-10 text-center shadow-2xl"
        >
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.5 }}
          >
            <h1 className="font-anam text-3xl font-black text-white mb-1 tracking-wide uppercase">
              ANAM Projects
            </h1>
            <p className="text-brand-400 text-xs font-medium tracking-widest uppercase mb-2">
              Agencia Nacional de Aduanas de México
            </p>
            <p className="text-slate-400 text-sm leading-relaxed mb-8">
              Gestiona proyectos, tareas y el avance
              <br />
              de cada miembro de tu equipo.
            </p>
          </motion.div>

          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.5 }}
            whileHover={{ scale: 1.02, transition: { duration: 0.15 } }}
            whileTap={{ scale: 0.97 }}
            onClick={handleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-6 py-3.5
                       bg-brand-900 text-white font-semibold rounded-2xl text-sm
                       hover:bg-brand-800 active:bg-brand-800
                       transition-colors duration-150
                       disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-brand-700/30"
          >
            {loading ? (
              <div className="flex items-center gap-1">
                {[0, 0.12, 0.24].map((delay, i) => (
                  <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-white"
                    animate={{ opacity: [0.4, 1, 0.4], y: [0, -3, 0] }}
                    transition={{ duration: 0.7, repeat: Infinity, ease: "easeInOut", delay }} />
                ))}
              </div>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
            )}
            {loading ? "Conectando…" : "Continuar con Google"}
          </motion.button>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-6 text-xs text-slate-500"
          >
            Solo miembros autorizados de ANAM pueden acceder.
          </motion.p>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          transition={{ delay: 0.7 }}
          className="text-center text-xs text-slate-400 mt-6"
        >
          ANAM Projects — Agencia Nacional de Aduanas de México
        </motion.p>
      </div>
    </div>
  );
}
