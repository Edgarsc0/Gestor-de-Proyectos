// src/components/Sidebar.jsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/context/ThemeContext";
import Image from "next/image";
import Pusher from "pusher-js";
import {
  LogOut,
  ShieldCheck,
  Building2,
  ShieldAlert,
  Crown,
  Users,
  MessageSquare,
} from "lucide-react";

const ROLE_LABEL = {
  SUPERADMIN: {
    label: "Super Admin",
    color: "bg-red-100 text-red-600 dark:bg-red-950/50 dark:text-red-400",
    Icon: ShieldAlert,
  },
  ADMIN: {
    label: "Administrador",
    color:
      "bg-brand-100 text-brand-700 dark:bg-brand-950/60 dark:text-brand-400",
    Icon: ShieldCheck,
  },
  TITULAR: {
    label: "Titular",
    color:
      "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
    Icon: Crown,
  },
  MEMBER: {
    label: "Miembro",
    color: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
    Icon: Users,
  },
};

const NAV_ITEMS = [
  {
    label: "Panel",
    href: "/dashboard",
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),
  },
  {
    label: "Áreas",
    href: "/dashboard/areas",
    icon: <Building2 width="20" height="20" strokeWidth="2" />,
  },
  {
    label: "Proyectos",
    href: "/dashboard/proyectos",
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7-6H4a2 2 0 0 0-2 2v16z" />
        <path d="M14 2v6h6" />
      </svg>
    ),
  },
  {
    label: "Equipo",
    href: "/dashboard/equipo",
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    label: "Tareas",
    href: "/dashboard/tareas",
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </svg>
    ),
  },
  {
    label: "Mensajes",
    href: "/dashboard/mensajes",
    icon: <MessageSquare width="20" height="20" strokeWidth="2" />,
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isHovered, setIsHovered] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { theme, toggle } = useTheme();

  const expanded = isHovered;
  const unreadCountRef = useRef(0);

  useEffect(() => {
    unreadCountRef.current = unreadCount;
  }, [unreadCount]);

  useEffect(() => {
    const fetchUnread = async () => {
      if (session?.user) {
        try {
          // The cache: "no-store" is still useful for the initial load
          // and for when the tab becomes visible again.
          const res = await fetch("/api/messages/unread_info", {
            cache: "no-store",
          });
          if (res.ok) {
            const { unreadCounts } = await res.json();
            const total = Object.values(unreadCounts || {}).reduce(
              (sum, count) => sum + count,
              0,
            );

            if (total > unreadCountRef.current && document.hidden) {
              if (Notification.permission === "granted") {
                new Notification("Nuevos mensajes", {
                  body: "Has recibido nuevos mensajes en la plataforma.",
                  icon: "/anam_logo.png",
                });
              }
            }
            setUnreadCount(total);
          }
        } catch (error) {
          // Silently fail
        }
      }
    };

    fetchUnread();

    if (!session?.user?.id) return;

    const pusherClient = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
      authEndpoint: "/api/pusher/auth",
    });

    const channel = pusherClient.subscribe(`private-user-${session.user.id}`);

    const handleNewMessage = () => {
      // Only update if the messages page is not active to avoid double counting
      if (!pathname.includes("/dashboard/mensajes")) {
        fetchUnread();
      }
      // The notification logic is already here, which is great.
    };

    channel.bind("incoming-message", handleNewMessage);

    return () => {
      channel.unbind("incoming-message", handleNewMessage);
      pusherClient.unsubscribe(`private-user-${session.user.id}`);
    };
  }, [session, pathname]);

  return (
    <>
      {/* Mobile toggle */}
      <motion.button
        whileTap={{ scale: 0.92 }}
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden w-10 h-10 flex items-center justify-center
                   bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700
                   rounded-xl shadow-md text-slate-600 dark:text-slate-300"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          {mobileOpen ? (
            <>
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </>
          ) : (
            <>
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </>
          )}
        </svg>
      </motion.button>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        animate={{ width: mobileOpen ? 260 : expanded ? 260 : 72 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className={`fixed top-0 left-0 h-screen z-40 flex flex-col overflow-hidden
          bg-white dark:bg-slate-950
          border-r border-slate-100 dark:border-slate-800
          shadow-xl shadow-slate-200/40 dark:shadow-slate-900/60
          ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          transition-transform duration-300 lg:transition-none
        `}
      >
        {/* Header — Logo ANAM */}
        <div className="flex items-center justify-center px-3 py-4 border-b border-slate-100 dark:border-slate-800 overflow-hidden">
          <motion.div
            animate={{
              width: expanded || mobileOpen ? 200 : 40,
              height: expanded || mobileOpen ? 64 : 40,
            }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative flex-shrink-0"
          >
            <Image
              src="/anam_logo.png"
              fill
              alt="Logo ANAM"
              className="object-contain object-left"
            />
          </motion.div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto overflow-x-hidden">
          {NAV_ITEMS.map((item) => {
            // Ocultar Tareas y Equipo para SUPERADMIN y ADMIN
            if (
              ["SUPERADMIN", "ADMIN"].includes(session?.user?.role) &&
              (item.label === "Equipo" ||
                item.label === "Tareas" ||
                item.label === "Mensajes")
            )
              return null;

            // Ocultar Áreas para Miembros (solo SUPERADMIN, ADMIN y TITULAR las gestionan)
            if (
              !["SUPERADMIN", "ADMIN", "TITULAR"].includes(
                session?.user?.role,
              ) &&
              item.label === "Áreas"
            )
              return null;

            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                title={!expanded ? item.label : undefined}
                className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                  transition-all duration-150 whitespace-nowrap
                  ${
                    isActive
                      ? "bg-brand-50 dark:bg-brand-950/50 text-brand-700 dark:text-brand-400"
                      : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 hover:text-slate-800 dark:hover:bg-slate-800/70 dark:hover:text-slate-200"
                  }`}
              >
                {/* Active indicator */}
                {isActive && (
                  <motion.span
                    layoutId="activeBar"
                    className="absolute left-0 inset-y-1 w-[3px] bg-brand-600 dark:bg-brand-500 rounded-full"
                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                  />
                )}
                <span
                  className={`flex-shrink-0 ${isActive ? "text-brand-700 dark:text-brand-400" : ""}`}
                >
                  {item.icon}
                </span>
                <AnimatePresence>
                  {(expanded || mobileOpen) && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.1 }}
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
                {item.label === "Mensajes" && unreadCount > 0 && (
                  <AnimatePresence>
                    {expanded || mobileOpen ? (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="ml-auto bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full"
                      >
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </motion.span>
                    ) : (
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-950" />
                    )}
                  </AnimatePresence>
                )}
              </Link>
            );
          })}

          {/* Admin link — SUPERADMIN, ADMIN y TITULAR */}
          {["SUPERADMIN", "ADMIN", "TITULAR"].includes(session?.user?.role) &&
            (() => {
              const isActive = pathname.startsWith("/dashboard/admin");
              const isSuperAdmin = session?.user?.role === "SUPERADMIN";
              return (
                <Link
                  href="/dashboard/admin"
                  onClick={() => setMobileOpen(false)}
                  title={
                    !expanded
                      ? isSuperAdmin
                        ? "Panel de Control"
                        : "Accesos"
                      : undefined
                  }
                  className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                  transition-all duration-150 whitespace-nowrap mt-1
                  ${
                    isActive
                      ? "bg-brand-50 dark:bg-brand-950/50 text-brand-700 dark:text-brand-400"
                      : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 hover:text-slate-800 dark:hover:bg-slate-800/70 dark:hover:text-slate-200"
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="activeBar"
                      className="absolute left-0 inset-y-1 w-[3px] bg-brand-600 dark:bg-brand-500 rounded-full"
                      transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 35,
                      }}
                    />
                  )}
                  <span
                    className={`flex-shrink-0 ${isActive ? "text-brand-700 dark:text-brand-400" : ""}`}
                  >
                    <ShieldCheck size={20} />
                  </span>
                  <AnimatePresence>
                    {(expanded || mobileOpen) && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.1 }}
                      >
                        {isSuperAdmin ? "Panel de Control" : "Accesos"}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Link>
              );
            })()}
        </nav>

        {/* Theme toggle */}
        <motion.button
          whileTap={{ scale: 0.94 }}
          onClick={toggle}
          title={
            !expanded
              ? theme === "dark"
                ? "Modo claro"
                : "Modo oscuro"
              : undefined
          }
          className="flex items-center gap-3 px-3 py-2.5 mx-2 mb-1 rounded-xl text-sm font-medium
            text-slate-400 hover:bg-slate-50 hover:text-slate-700
            dark:hover:bg-slate-800/70 dark:hover:text-slate-200
            transition-all duration-150 whitespace-nowrap overflow-hidden"
        >
          <motion.span
            key={theme}
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="flex-shrink-0"
          >
            {theme === "dark" ? (
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            ) : (
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </motion.span>
          <AnimatePresence>
            {(expanded || mobileOpen) && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.1 }}
              >
                {theme === "dark" ? "Modo claro" : "Modo oscuro"}
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>

        {/* User */}
        {session?.user &&
          (() => {
            const roleCfg = ROLE_LABEL[session.user.role] || ROLE_LABEL.MEMBER;
            const RoleIcon = roleCfg.Icon;
            return (
              <div className="p-2 border-t border-slate-100 dark:border-slate-800 overflow-hidden">
                <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  {session.user.image ? (
                    <img
                      src={session.user.image}
                      alt=""
                      className="w-8 h-8 rounded-full flex-shrink-0 ring-2 ring-brand-200 dark:ring-brand-900"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-gradient-to-br from-brand-500 to-gold-500 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                      {session.user.name?.charAt(0) || "?"}
                    </div>
                  )}
                  <AnimatePresence>
                    {(expanded || mobileOpen) && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.1 }}
                        className="min-w-0 flex-1"
                      >
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate leading-tight">
                          {session.user.name}
                        </p>
                        <span
                          className={`inline-flex items-center gap-1 mt-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${roleCfg.color}`}
                        >
                          <RoleIcon size={9} />
                          {roleCfg.label}
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <AnimatePresence>
                    {(expanded || mobileOpen) && (
                      <motion.button
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.1 }}
                        onClick={() => signOut({ callbackUrl: "/login" })}
                        title="Cerrar sesión"
                        className="flex-shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:text-brand-400 dark:hover:bg-brand-950/40 transition-all"
                      >
                        <LogOut size={16} />
                      </motion.button>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            );
          })()}
      </motion.aside>
    </>
  );
}
