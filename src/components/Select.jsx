// src/components/Select.jsx
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronDown } from "lucide-react";

export default function Select({ value, onChange, options = [], placeholder = "Seleccionar…", className = "", size = "md" }) {
  const [open, setOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState({});
  const triggerRef = useRef(null);

  const selected = options.find(o => o.value === value);

  const sizeClasses = size === "sm"
    ? "px-3 py-1.5 text-xs rounded-xl"
    : "px-4 py-2.5 text-sm rounded-xl";

  // Calcular posición del dropdown basada en el trigger
  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUpward = spaceBelow < 200 && rect.top > 200;

    setDropdownStyle({
      position: "fixed",
      left: rect.left,
      width: Math.max(rect.width, 160),
      zIndex: 9999,
      ...(openUpward
        ? { bottom: window.innerHeight - rect.top + 4 }
        : { top: rect.bottom + 4 }),
    });
  }, []);

  const handleOpen = () => {
    updatePosition();
    setOpen(o => !o);
  };

  // Cerrar al hacer click fuera
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (triggerRef.current && !triggerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Cerrar con Escape y reposicionar en scroll/resize
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    const onScroll = () => { updatePosition(); };
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);
    return () => {
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
    };
  }, [open, updatePosition]);

  const select = (val) => {
    onChange(val);
    setOpen(false);
  };

  const dropdown = (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -4, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -4, scale: 0.97 }}
          transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
          style={dropdownStyle}
          className="bg-white dark:bg-slate-900
                     border border-slate-200 dark:border-slate-700
                     rounded-xl shadow-xl shadow-slate-200/60 dark:shadow-slate-900/60
                     overflow-hidden"
        >
          <div className="py-1 max-h-64 overflow-y-auto">
            {options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); select(opt.value); }}
                  className={`w-full flex items-center justify-between gap-3 px-3.5 py-2.5
                    text-sm text-left transition-colors duration-100
                    ${isSelected
                      ? "bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-400"
                      : "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                >
                  <span className="flex items-center gap-2.5 truncate">
                    {opt.color && (
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: opt.color }} />
                    )}
                    <span className="truncate">{opt.label}</span>
                  </span>
                  {isSelected && <Check size={14} className="flex-shrink-0 text-brand-600 dark:text-brand-400" strokeWidth={2.5} />}
                </button>
              );
            })}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div ref={triggerRef} className={`relative ${className}`}>
      {/* Trigger */}
      <button
        type="button"
        onClick={handleOpen}
        className={`w-full flex items-center justify-between gap-2 ${sizeClasses}
          bg-white dark:bg-slate-800/80
          border border-slate-200 dark:border-slate-700
          text-slate-700 dark:text-slate-200
          hover:border-brand-400 dark:hover:border-brand-500
          focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400
          transition-all duration-150 cursor-pointer select-none`}
      >
        <span className="flex items-center gap-2 truncate min-w-0">
          {selected?.color && (
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: selected.color }} />
          )}
          <span className={`truncate ${!selected ? "text-slate-400" : ""}`}>
            {selected?.label ?? placeholder}
          </span>
        </span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }} className="flex-shrink-0">
          <ChevronDown size={14} className="text-slate-400" />
        </motion.span>
      </button>

      {/* Dropdown renderizado en el body via portal */}
      {typeof window !== "undefined" && createPortal(dropdown, document.body)}
    </div>
  );
}
