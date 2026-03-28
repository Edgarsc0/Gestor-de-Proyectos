// src/app/dashboard/page.jsx
"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { StatusBadge, ProgressBar, Avatar, AvatarStack } from "@/components/Badges";
import Link from "next/link";

// Animated counter hook
function useCounter(target, duration = 1000) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (target === 0) return;
    let start = 0;
    const steps = 40;
    const increment = target / steps;
    const stepTime = duration / steps;
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) { setValue(target); clearInterval(timer); }
      else setValue(Math.floor(start));
    }, stepTime);
    return () => clearInterval(timer);
  }, [target, duration]);
  return value;
}

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.07, duration: 0.45, ease: [0.16, 1, 0.3, 1] } }),
};

export default function DashboardPage() {
  const { data: session } = useSession();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard").then((r) => r.json()).then(setData).finally(() => setLoading(false));
  }, []);

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

  if (!data) return null;
  const { stats, recentTasks, projects, members } = data;

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div variants={fadeUp} initial="hidden" animate="show" custom={0}>
        <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-slate-100">
          Buen día, {session?.user?.name?.split(" ")[0]} 👋
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Aquí tienes un resumen de lo que está pasando con tu equipo.
        </p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Proyectos activos" value={stats.activeProjects} sub={`de ${stats.totalProjects} totales`}
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7-6H4a2 2 0 0 0-2 2v16z" /><path d="M14 2v6h6" /></svg>}
          color="brand" index={0} />
        <StatCard label="Tareas completadas" value={stats.completedTasks} sub={`${stats.completionRate}% de avance`}
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>}
          color="emerald" index={1} />
        <StatCard label="En progreso" value={stats.inProgressTasks} sub={`${stats.pendingTasks} pendientes`}
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>}
          color="amber" index={2} />
        <StatCard label="Miembros" value={stats.totalMembers} sub="en el equipo"
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>}
          color="violet" index={3} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Projects */}
        <div className="lg:col-span-2 space-y-4">
          <motion.div variants={fadeUp} initial="hidden" animate="show" custom={4} className="flex items-center justify-between">
            <h2 className="font-display font-semibold text-lg text-slate-900 dark:text-slate-100">Proyectos activos</h2>
            <Link href="/dashboard/proyectos" className="text-sm text-brand-600 hover:text-brand-500 dark:text-brand-400 font-medium flex items-center gap-1 group">
              Ver todos
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="transition-transform group-hover:translate-x-0.5">
                <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
              </svg>
            </Link>
          </motion.div>

          <div className="space-y-3">
            {projects.length === 0 && (
              <motion.div variants={fadeUp} initial="hidden" animate="show" custom={5} className="card p-10 text-center">
                <p className="text-slate-400 text-sm">No hay proyectos activos aún.</p>
              </motion.div>
            )}
            {projects.map((project, i) => (
              <motion.div
                key={project.id}
                variants={fadeUp} initial="hidden" animate="show" custom={5 + i}
                whileHover={{ y: -2, transition: { duration: 0.2 } }}
                className="card-hover p-5 cursor-pointer"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-white font-display font-bold text-sm shadow-lg"
                    style={{ backgroundColor: project.color, boxShadow: `0 4px 12px ${project.color}40` }}>
                    {project.name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate mb-2">{project.name}</h3>
                    {project.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 line-clamp-1">{project.description}</p>
                    )}
                    <div className="flex items-center gap-4">
                      <div className="flex-1 max-w-[200px]">
                        <ProgressBar percent={project.progress} color={project.color} />
                      </div>
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-medium tabular-nums">
                        {project.completedCount}/{project.taskCount}
                      </span>
                      {project.assignments?.length > 0 && (
                        <AvatarStack users={project.assignments.map((a) => a.user)} />
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="space-y-4">
          <motion.div variants={fadeUp} initial="hidden" animate="show" custom={4} className="flex items-center justify-between">
            <h2 className="font-display font-semibold text-lg text-slate-900 dark:text-slate-100">Actividad reciente</h2>
            <Link href="/dashboard/tareas" className="text-sm text-brand-600 hover:text-brand-500 dark:text-brand-400 font-medium flex items-center gap-1 group">
              Ver todas
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="transition-transform group-hover:translate-x-0.5">
                <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
              </svg>
            </Link>
          </motion.div>
          <motion.div variants={fadeUp} initial="hidden" animate="show" custom={5} className="card overflow-hidden divide-y divide-slate-50 dark:divide-slate-800">
            {recentTasks.length === 0 && (
              <div className="p-8 text-center text-slate-400 text-sm">No hay tareas aún.</div>
            )}
            {recentTasks.map((task) => (
              <div key={task.id} className="px-4 py-3 hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                <div className="flex items-center gap-3">
                  {task.assignee ? (
                    <Avatar src={task.assignee.image} name={task.assignee.name} size="xs" />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex-shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-slate-700 dark:text-slate-300 truncate">{task.title}</p>
                    <p className="text-[11px] text-slate-400 truncate flex items-center gap-1">
                      <span className="inline-block w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: task.project?.color }} />
                      {task.project?.name}
                    </p>
                  </div>
                  <StatusBadge status={task.status} />
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Team Overview */}
      <div className="space-y-4">
        <motion.h2 variants={fadeUp} initial="hidden" animate="show" custom={6} className="font-display font-semibold text-lg text-slate-900 dark:text-slate-100">
          ¿Quién hace qué?
        </motion.h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.map((member, i) => (
            <motion.div
              key={member.id}
              variants={fadeUp} initial="hidden" animate="show" custom={7 + i}
              whileHover={{ y: -3, transition: { duration: 0.2 } }}
              className="card-hover p-5"
            >
              <div className="flex items-center gap-3 mb-4">
                <Avatar src={member.image} name={member.name} size="md" />
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate">{member.name || "Sin nombre"}</p>
                  <p className="text-xs text-slate-400 truncate">{member.email}</p>
                </div>
              </div>

              {member.assignments?.length > 0 && (
                <div className="mb-3">
                  <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold mb-2">Proyectos</p>
                  <div className="flex flex-wrap gap-1.5">
                    {member.assignments.map((a) => (
                      <span key={a.project.name} className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: a.project.color }} />
                        {a.project.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {member.createdTasks?.length > 0 ? (
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold mb-2">
                    Tareas activas ({member.createdTasks.length})
                  </p>
                  <div className="space-y-1.5">
                    {member.createdTasks.slice(0, 3).map((t) => (
                      <div key={t.id} className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: t.project?.color }} />
                        <span className="text-xs text-slate-600 dark:text-slate-400 truncate flex-1">{t.title}</span>
                        <StatusBadge status={t.status} />
                      </div>
                    ))}
                    {member.createdTasks.length > 3 && (
                      <p className="text-[11px] text-slate-400">+{member.createdTasks.length - 3} más</p>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">Sin tareas asignadas</p>
              )}
            </motion.div>
          ))}
          {members.length === 0 && (
            <motion.div variants={fadeUp} initial="hidden" animate="show" custom={7} className="col-span-full card p-10 text-center text-slate-400 text-sm">
              Aún no hay miembros. Los usuarios de ANAM aparecerán aquí al iniciar sesión con Google.
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

const STAT_STYLES = {
  brand:   { gradient: "from-brand-500/10 via-transparent to-transparent", icon: "bg-brand-100 dark:bg-brand-950 text-brand-600 dark:text-brand-400", glow: "#6480fa" },
  emerald: { gradient: "from-emerald-500/10 via-transparent to-transparent", icon: "bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400", glow: "#10b981" },
  amber:   { gradient: "from-amber-500/10 via-transparent to-transparent",  icon: "bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400",   glow: "#f59e0b" },
  violet:  { gradient: "from-violet-500/10 via-transparent to-transparent", icon: "bg-violet-100 dark:bg-violet-950 text-violet-600 dark:text-violet-400", glow: "#8b5cf6" },
};

function StatCard({ label, value, sub, icon, color, index }) {
  const count = useCounter(value, 900);
  const s = STAT_STYLES[color] || STAT_STYLES.brand;

  return (
    <motion.div
      variants={fadeUp} initial="hidden" animate="show" custom={index + 1}
      whileHover={{ y: -4, transition: { duration: 0.2, ease: "easeOut" } }}
      className="card p-5 relative overflow-hidden cursor-default"
    >
      {/* Gradient bg */}
      <div className={`absolute inset-0 bg-gradient-to-br ${s.gradient} pointer-events-none`} />
      {/* Decorative circle */}
      <div className="absolute -right-5 -top-5 w-20 h-20 rounded-full opacity-[0.07]"
        style={{ backgroundColor: s.glow }} />

      <div className="relative">
        <div className={`w-10 h-10 rounded-xl ${s.icon} flex items-center justify-center mb-4`}>
          {icon}
        </div>
        <p className="font-display text-3xl font-bold text-slate-900 dark:text-slate-100 tabular-nums">{count}</p>
        <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mt-0.5">{label}</p>
        <p className="text-xs text-slate-400 mt-1">{sub}</p>
      </div>
    </motion.div>
  );
}
