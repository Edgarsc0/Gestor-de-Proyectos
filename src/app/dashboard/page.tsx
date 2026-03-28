// src/app/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { StatusBadge, PriorityBadge, ProgressBar, Avatar, AvatarStack } from "@/components/Badges";
import Link from "next/link";

interface DashboardData {
  stats: {
    totalProjects: number;
    activeProjects: number;
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    pendingTasks: number;
    totalMembers: number;
    completionRate: number;
  };
  recentTasks: any[];
  projects: any[];
  members: any[];
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-3 border-slate-200 border-t-brand-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) return null;
  const { stats, recentTasks, projects, members } = data;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900">
          Buen día, {session?.user?.name?.split(" ")[0]} 👋
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Aquí tienes un resumen de lo que está pasando con tu equipo.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
        <StatCard
          label="Proyectos activos"
          value={stats.activeProjects}
          sub={`de ${stats.totalProjects} totales`}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7-6H4a2 2 0 0 0-2 2v16z" /><path d="M14 2v6h6" />
            </svg>
          }
          color="brand"
        />
        <StatCard
          label="Tareas completadas"
          value={stats.completedTasks}
          sub={`${stats.completionRate}% de avance`}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
          }
          color="emerald"
        />
        <StatCard
          label="En progreso"
          value={stats.inProgressTasks}
          sub={`${stats.pendingTasks} pendientes`}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
            </svg>
          }
          color="amber"
        />
        <StatCard
          label="Miembros"
          value={stats.totalMembers}
          sub="en el equipo"
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
            </svg>
          }
          color="violet"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Projects Column */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-semibold text-lg text-slate-900">Proyectos activos</h2>
            <Link href="/dashboard/proyectos" className="text-sm text-brand-600 hover:text-brand-700 font-medium">
              Ver todos →
            </Link>
          </div>
          <div className="space-y-3 stagger-children">
            {projects.length === 0 && (
              <div className="card p-8 text-center text-slate-400 text-sm">
                No hay proyectos activos aún. ¡Crea el primero!
              </div>
            )}
            {projects.map((project: any) => (
              <div key={project.id} className="card-hover p-5">
                <div className="flex items-start gap-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-white font-display font-bold text-sm"
                    style={{ backgroundColor: project.color }}
                  >
                    {project.name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold text-sm text-slate-900 truncate">{project.name}</h3>
                    </div>
                    {project.description && (
                      <p className="text-xs text-slate-500 mb-3 line-clamp-1">{project.description}</p>
                    )}
                    <div className="flex items-center gap-4">
                      <div className="flex-1 max-w-[200px]">
                        <ProgressBar percent={project.progress} color={project.color} />
                      </div>
                      <span className="text-xs text-slate-500 font-medium">
                        {project.completedCount}/{project.taskCount} tareas
                      </span>
                      {project.assignments?.length > 0 && (
                        <AvatarStack users={project.assignments.map((a: any) => a.user)} />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-semibold text-lg text-slate-900">Actividad reciente</h2>
            <Link href="/dashboard/tareas" className="text-sm text-brand-600 hover:text-brand-700 font-medium">
              Ver todas →
            </Link>
          </div>
          <div className="card divide-y divide-slate-50">
            {recentTasks.length === 0 && (
              <div className="p-8 text-center text-slate-400 text-sm">
                No hay tareas aún.
              </div>
            )}
            {recentTasks.map((task: any) => (
              <div key={task.id} className="px-4 py-3 hover:bg-slate-50/50 transition-colors">
                <div className="flex items-center gap-3">
                  {task.assignee ? (
                    <Avatar src={task.assignee.image} name={task.assignee.name} size="xs" />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                      </svg>
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-slate-700 truncate">{task.title}</p>
                    <p className="text-[11px] text-slate-400 truncate">
                      <span className="inline-block w-2 h-2 rounded-full mr-1" style={{ backgroundColor: task.project?.color }} />
                      {task.project?.name}
                    </p>
                  </div>
                  <StatusBadge status={task.status} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Team Overview */}
      <div className="space-y-4">
        <h2 className="font-display font-semibold text-lg text-slate-900">¿Quién hace qué?</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
          {members.map((member: any) => (
            <div key={member.id} className="card-hover p-5">
              <div className="flex items-center gap-3 mb-4">
                <Avatar src={member.image} name={member.name} size="md" />
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-slate-900 truncate">{member.name || "Sin nombre"}</p>
                  <p className="text-xs text-slate-400 truncate">{member.email}</p>
                </div>
              </div>

              {/* Projects assigned */}
              {member.assignments?.length > 0 && (
                <div className="mb-3">
                  <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-2">Proyectos</p>
                  <div className="flex flex-wrap gap-1.5">
                    {member.assignments.map((a: any) => (
                      <span
                        key={a.project.name}
                        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-50 text-slate-600"
                      >
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: a.project.color }} />
                        {a.project.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Active tasks */}
              {member.createdTasks?.length > 0 ? (
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-2">
                    Tareas activas ({member.createdTasks.length})
                  </p>
                  <div className="space-y-1.5">
                    {member.createdTasks.slice(0, 3).map((t: any) => (
                      <div key={t.id} className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: t.project?.color }} />
                        <span className="text-xs text-slate-600 truncate flex-1">{t.title}</span>
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
            </div>
          ))}
          {members.length === 0 && (
            <div className="col-span-full card p-8 text-center text-slate-400 text-sm">
              Aún no hay miembros. Los usuarios de ANAM aparecerán aquí al iniciar sesión con Google.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, icon, color }: { label: string; value: number; sub: string; icon: React.ReactNode; color: string }) {
  const colors: Record<string, { bg: string; iconBg: string; iconText: string }> = {
    brand:   { bg: "bg-brand-50/50",  iconBg: "bg-brand-100",  iconText: "text-brand-600" },
    emerald: { bg: "bg-emerald-50/50", iconBg: "bg-emerald-100", iconText: "text-emerald-600" },
    amber:   { bg: "bg-amber-50/50",  iconBg: "bg-amber-100",  iconText: "text-amber-600" },
    violet:  { bg: "bg-violet-50/50", iconBg: "bg-violet-100", iconText: "text-violet-600" },
  };
  const c = colors[color] || colors.brand;

  return (
    <div className={`card p-5 ${c.bg}`}>
      <div className="flex items-center justify-between mb-3">
        <span className={`w-9 h-9 rounded-xl ${c.iconBg} ${c.iconText} flex items-center justify-center`}>
          {icon}
        </span>
      </div>
      <p className="font-display text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-sm font-medium text-slate-600 mt-0.5">{label}</p>
      <p className="text-xs text-slate-400 mt-1">{sub}</p>
    </div>
  );
}
