// src/app/dashboard/equipo/page.jsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar, StatusBadge, PriorityBadge } from "@/components/Badges";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.06, duration: 0.4, ease: [0.16, 1, 0.3, 1] },
  }),
};

export default function EquipoPage() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedMember, setExpandedMember] = useState(null);
  const [filter, setFilter] = useState("all");

  const fetchData = useCallback(async () => {
    const res = await fetch("/api/members");
    const data = await res.json();
    setMembers(data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-brand-200 border-t-brand-600 rounded-full"
        />
      </div>
    );
  }

  const getActiveTasks = (m) => m.createdTasks?.filter((t) => t.status !== "COMPLETED") || [];
  const filteredMembers = members.filter((m) => {
    if (filter === "active") return getActiveTasks(m).length > 0;
    if (filter === "idle") return getActiveTasks(m).length === 0;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div variants={fadeUp} initial="hidden" animate="show" custom={0} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-slate-100">Equipo</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Revisa qué hace cada miembro y en qué proyectos participa</p>
        </div>
        <div className="flex gap-2">
          {["all", "active", "idle"].map((f) => (
            <motion.button
              key={f}
              whileTap={{ scale: 0.95 }}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-xs font-medium transition-all
                ${filter === f
                  ? "bg-brand-600 text-white shadow-sm shadow-brand-500/30"
                  : "bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
                }`}
            >
              {f === "all" ? "Todos" : f === "active" ? "Con tareas" : "Sin tareas"}
              {f === "all" && ` (${members.length})`}
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Members List */}
      <div className="space-y-3">
        {filteredMembers.map((member, i) => {
          const activeTasks = getActiveTasks(member);
          const allTasks = member.createdTasks || [];
          const completedTasks = allTasks.filter((t) => t.status === "COMPLETED").length;
          const isExpanded = expandedMember === member.id;

          return (
            <motion.div
              key={member.id}
              variants={fadeUp}
              initial="hidden"
              animate="show"
              custom={i + 1}
              className="card overflow-hidden"
            >
              <button
                onClick={() => setExpandedMember(isExpanded ? null : member.id)}
                className="w-full p-5 flex items-center gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors text-left"
              >
                <Avatar src={member.image} name={member.name} size="md" />

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">{member.name || "Sin nombre"}</h3>
                    <span className="text-xs text-slate-400">{member.email}</span>
                  </div>

                  {member.assignments?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {member.assignments.map((a) => (
                        <span
                          key={a.project.id}
                          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                        >
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: a.project.color }} />
                          {a.project.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-4 flex-shrink-0">
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{activeTasks.length}</p>
                    <p className="text-[11px] text-slate-400">activas</p>
                  </div>
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-semibold text-emerald-600">{completedTasks}</p>
                    <p className="text-[11px] text-slate-400">hechas</p>
                  </div>
                  <motion.div
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round"><polyline points="6 9 12 15 18 9" /></svg>
                  </motion.div>
                </div>
              </button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-5 border-t border-slate-100 dark:border-slate-700/60 pt-4">
                      {activeTasks.length > 0 ? (
                        <div className="space-y-2">
                          <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-3">
                            Tareas activas
                          </p>
                          {activeTasks.map((task, ti) => (
                            <motion.div
                              key={task.id}
                              initial={{ opacity: 0, x: -8 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: ti * 0.04, duration: 0.25 }}
                              className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl"
                            >
                              <StatusBadge status={task.status} />
                              <span className="text-sm text-slate-700 dark:text-slate-300 flex-1 truncate">{task.title}</span>
                              <PriorityBadge priority={task.priority} />
                            </motion.div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-6 text-sm text-slate-400">
                          <p>Este miembro no tiene tareas activas actualmente.</p>
                        </div>
                      )}

                      {completedTasks > 0 && (
                        <p className="mt-3 text-xs text-emerald-600 font-medium">
                          ✓ {completedTasks} tarea{completedTasks > 1 ? "s" : ""} completada{completedTasks > 1 ? "s" : ""}
                        </p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}

        {filteredMembers.length === 0 && (
          <motion.div variants={fadeUp} initial="hidden" animate="show" custom={1} className="card p-12 text-center">
            <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
              </svg>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              {filter === "all" ? "Los miembros aparecerán aquí cuando inicien sesión con Google en ANAM Team." : "No hay miembros con este filtro."}
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
