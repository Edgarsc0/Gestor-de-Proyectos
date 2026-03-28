// src/app/dashboard/equipo/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { Avatar, StatusBadge, PriorityBadge } from "@/components/Badges";

export default function EquipoPage() {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedMember, setExpandedMember] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "active" | "idle">("all");

  const fetchData = useCallback(async () => {
    const res = await fetch("/api/members");
    const data = await res.json();
    setMembers(data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-3 border-slate-200 border-t-brand-600 rounded-full animate-spin" /></div>;
  }

  const getActiveTasks = (m: any) => m.createdTasks?.filter((t: any) => t.status !== "COMPLETED") || [];
  const filteredMembers = members.filter((m) => {
    if (filter === "active") return getActiveTasks(m).length > 0;
    if (filter === "idle") return getActiveTasks(m).length === 0;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">Equipo</h1>
          <p className="text-slate-500 text-sm mt-1">Revisa qué hace cada miembro y en qué proyectos participa</p>
        </div>
        <div className="flex gap-2">
          {(["all", "active", "idle"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-xs font-medium transition-all
                ${filter === f ? "bg-brand-600 text-white shadow-sm" : "bg-white text-slate-500 border border-slate-200 hover:bg-slate-50"}`}
            >
              {f === "all" ? "Todos" : f === "active" ? "Con tareas" : "Sin tareas"}
              {f === "all" && ` (${members.length})`}
            </button>
          ))}
        </div>
      </div>

      {/* Members List */}
      <div className="space-y-3 stagger-children">
        {filteredMembers.map((member) => {
          const activeTasks = getActiveTasks(member);
          const allTasks = member.createdTasks || [];
          const completedTasks = allTasks.filter((t: any) => t.status === "COMPLETED").length;
          const isExpanded = expandedMember === member.id;

          return (
            <div key={member.id} className="card overflow-hidden">
              {/* Main row */}
              <button
                onClick={() => setExpandedMember(isExpanded ? null : member.id)}
                className="w-full p-5 flex items-center gap-4 hover:bg-slate-50/50 transition-colors text-left"
              >
                <Avatar src={member.image} name={member.name} size="md" />

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-slate-900 text-sm">{member.name || "Sin nombre"}</h3>
                    <span className="text-xs text-slate-400">{member.email}</span>
                  </div>

                  {/* Projects tags */}
                  {member.assignments?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {member.assignments.map((a: any) => (
                        <span
                          key={a.project.id}
                          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-50 text-slate-600"
                        >
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: a.project.color }} />
                          {a.project.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-4 flex-shrink-0">
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-semibold text-slate-700">{activeTasks.length}</p>
                    <p className="text-[11px] text-slate-400">activas</p>
                  </div>
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-semibold text-emerald-600">{completedTasks}</p>
                    <p className="text-[11px] text-slate-400">hechas</p>
                  </div>
                  <div className={`transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round"><polyline points="6 9 12 15 18 9" /></svg>
                  </div>
                </div>
              </button>

              {/* Expanded tasks */}
              {isExpanded && (
                <div className="px-5 pb-5 border-t border-slate-100 pt-4 animate-fade-in">
                  {activeTasks.length > 0 ? (
                    <div className="space-y-2">
                      <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-3">
                        Tareas activas
                      </p>
                      {activeTasks.map((task: any) => (
                        <div key={task.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                          <StatusBadge status={task.status} />
                          <span className="text-sm text-slate-700 flex-1 truncate">{task.title}</span>
                          <PriorityBadge priority={task.priority} />
                        </div>
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
              )}
            </div>
          );
        })}

        {filteredMembers.length === 0 && (
          <div className="card p-12 text-center">
            <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
              </svg>
            </div>
            <p className="text-slate-500 text-sm">
              {filter === "all" ? "Los miembros aparecerán aquí cuando inicien sesión con Google." : "No hay miembros con este filtro."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
