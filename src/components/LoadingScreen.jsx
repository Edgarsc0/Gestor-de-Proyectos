// src/components/LoadingScreen.jsx
"use client";

import { motion } from "framer-motion";
import Image from "next/image";

export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center gap-6 bg-white dark:bg-slate-950 z-[200]">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-48 h-16"
      >
        <Image
          src="/anam_logo.png"
          fill
          alt="Logo ANAM"
          className="object-contain"
          priority
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.3 }}
        className="flex items-center gap-1.5"
      >
        {[0, 0.15, 0.3].map((delay, i) => (
          <motion.div
            key={i}
            className="w-2 h-2 rounded-full bg-brand-500"
            animate={{ opacity: [0.3, 1, 0.3], y: [0, -5, 0] }}
            transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut", delay }}
          />
        ))}
      </motion.div>
    </div>
  );
}
