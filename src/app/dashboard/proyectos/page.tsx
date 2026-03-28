// src/app/dashboard/proyectos/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import Modal from "@/components/Modal";
import { ProgressBar, AvatarStack, ProjectStatusBadge, StatusBadge, Avatar } from "@/components/Badges";

const COLORS = ["#6366f1", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#f97316"];

export default function ProyectosPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [showAssign, setShowAssign] = useState(false);
  const [showTaskCreate, setShowTaskCreate] = useState(false);
  const [formData, setFormData] = useState({ name: "", description: "", color: COLORS[0] });
  const [taskForm, setTaskForm] = useState({ title: "", description: "", assigneeId: "", priority: "MEDIUM", dueDate: "" });

  const fetchData = useCallback(async () => {
    const [pRes, mRes] = await Promise.all([fetch("/api/projects"), fetch("/api/members")]);
    const [pData, mData] = await Promise.all([pRes.json(), mRes.json()]);
    setProjects(pData);
    setMembers(mData);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const createProject = async () => {
    if (!formData.name.trim()) return;
    await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    setFormData({ name: "", description: "", color: COLORS[0] });
    setShowCreate(false);
    fetchData();
  };

  const updateProjectStatus = async (id: string, status: string) => {
    await fetch("/api/projects", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    fetchData();
  };

  const deleteProject = async (id: string) => {
    if (!confirm("¿Eliminar este proyecto y todas sus tareas?")) return;
    await fetch(`/api/projects?id=${id}`, { method: "DELETE" });
    setSelectedProject(null);
    fetchData();
  };

  const assignMember = async (userId: string) => {
    if (!selectedProject) return;
    await fetch("/api/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, projectId: selectedProject.id }),
    });
    fetchData();
    // Refresh selected project
    const res = await fetch("/api/projects");
    const data = await res.json();
    const updated = data.find((p: any) => p.id === selectedProject.id);
    if (updated) setSelectedProject(updated);
  };

  const removeMember = async (userId: string) => {
    if (!selectedProject) return;
    await fetch(`/api/members?userId=${userId}&projectId=${selectedProject.id}`, { method: "DELETE" });
    fetchData();
    const res = await fetch("/api/projects");
    const data = await res.json();
    const updated = data.find((p: any) => p.id === selectedProject.id);
    if (updated) setSelectedProject(updated);
  };

  const createTask = async () => {
    if (!taskForm.title.trim() || !selectedProject) return;
    await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...taskForm, projectId: selectedProject.id, assigneeId: taskForm.assigneeId || null }),
    });
    setTaskForm({ title: "", description: "", assigneeId: "", priority: "MEDIUM", dueDate: "" });
    setShowTaskCreate(false);
    fetchData();
    const res = await fetch("/api/projects");
    const data = await res.json();
    const updated = data.find((p: any) => p.id === selectedProject.id);
    if (updated) setSelectedProject(updated);
  };

  const updateTaskStatus = async (taskId: string, status: string) => {
    await fetch("/api/tasks", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: taskId, status }),
    });
    fetchData();
    if (selectedProject) {
      const res = await fetch("/api/projects");
      const data = await res.json();
      const updated = data.find((p: any) => p.id === selectedProject.id);
      if (updated) setSelectedProject(updated);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-3 border-slate-200 border-t-brand-600 rounded-full animate-spin" /></div>;
  }

  const getProgress = (p: any) => {
    const total = p.tasks?.length || 0;
    const done = p.tasks?.filter((t: any) => t.status === "COMPLETED").length || 0;
    return total > 0 ? Math.round((done / total) * 100) : 0;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">Proyectos</h1>
          <p className="text-slate-500 text-sm mt-1">Gestiona los proyectos de tu equipo</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          Nuevo proyecto
        </button>
      </div>

      {/* Project Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
        {projects.map((project) => {
          const progress = getProgress(project);
          const totalTasks = project.tasks?.length || 0;
          const doneTasks = project.tasks?.filter((t: any) => t.status === "COMPLETED").length || 0;

          return (
            <div
              key={project.id}
              className="card-hover p-5 cursor-pointer"
              onClick={() => setSelectedProject(project)}
            >
              <div className="flex items-start gap-3 mb-4">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-display font-bold text-lg flex-shrink-0"
                  style={{ backgroundColor: project.color }}
                >
                  {project.name.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-slate-900 truncate">{project.name}</h3>
                  <ProjectStatusBadge status={project.status} />
                </div>
              </div>

              {project.description && (
                <p className="text-xs text-slate-500 mb-4 line-clamp-2">{project.description}</p>
              )}

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">{doneTasks} de {totalTasks} tareas</span>
                  <span className="font-semibold text-slate-700">{progress}%</span>
                </div>
                <ProgressBar percent={progress} color={project.color} />
              </div>

              {project.assignments?.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <AvatarStack users={project.assignments.map((a: any) => a.user)} max={4} />
                </div>
              )}
            </div>
          );
        })}

        {projects.length === 0 && (
          <div className="col-span-full card p-12 text-center">
            <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><path d="M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7-6H4a2 2 0 0 0-2 2v16z" /><path d="M14 2v6h6" /></svg>
            </div>
            <p className="text-slate-500 text-sm mb-1">No hay proyectos todavía</p>
            <p className="text-slate-400 text-xs">Crea tu primer proyecto para comenzar</p>
          </div>
        )}
      </div>

      {/* Create Project Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Nuevo proyecto">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1.5 block">Nombre del proyecto</label>
            <input className="input-field" placeholder="Ej: Rediseño del portal web" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1.5 block">Descripción (opcional)</label>
            <textarea className="input-field resize-none h-20" placeholder="¿De qué trata este proyecto?" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 mb-2 block">Color</label>
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setFormData({ ...formData, color: c })}
                  className={`w-8 h-8 rounded-lg transition-all ${formData.color === c ? "ring-2 ring-offset-2 scale-110" : "hover:scale-105"}`}
                  style={{ backgroundColor: c, ringColor: c }}
                />
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setShowCreate(false)} className="btn-secondary flex-1">Cancelar</button>
            <button onClick={createProject} className="btn-primary flex-1">Crear proyecto</button>
          </div>
        </div>
      </Modal>

      {/* Project Detail Modal */}
      <Modal open={!!selectedProject} onClose={() => { setSelectedProject(null); setShowAssign(false); }} title={selectedProject?.name || ""} size="lg">
        {selectedProject && (
          <div className="space-y-5">
            {selectedProject.description && (
              <p className="text-sm text-slate-500">{selectedProject.description}</p>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-2">
              <select
                className="select-field w-auto text-xs"
                value={selectedProject.status}
                onChange={(e) => { updateProjectStatus(selectedProject.id, e.target.value); setSelectedProject({ ...selectedProject, status: e.target.value }); }}
              >
                <option value="ACTIVE">Activo</option>
                <option value="PAUSED">Pausado</option>
                <option value="COMPLETED">Completado</option>
                <option value="ARCHIVED">Archivado</option>
              </select>
              <button onClick={() => setShowAssign(!showAssign)} className="btn-secondary text-xs">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" /></svg>
                Asignar miembros
              </button>
              <button onClick={() => setShowTaskCreate(true)} className="btn-primary text-xs">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                Nueva tarea
              </button>
              <button onClick={() => deleteProject(selectedProject.id)} className="btn-ghost text-xs text-red-500 hover:bg-red-50 hover:text-red-600 ml-auto">
                Eliminar proyecto
              </button>
            </div>

            {/* Assign members panel */}
            {showAssign && (
              <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Miembros del equipo</p>
                {members.map((m: any) => {
                  const isAssigned = selectedProject.assignments?.some((a: any) => a.user?.id === m.id);
                  return (
                    <div key={m.id} className="flex items-center gap-3">
                      <Avatar src={m.image} name={m.name} size="sm" />
                      <span className="text-sm text-slate-700 flex-1">{m.name || m.email}</span>
                      {isAssigned ? (
                        <button onClick={() => removeMember(m.id)} className="text-xs text-red-500 hover:text-red-600 font-medium">Quitar</button>
                      ) : (
                        <button onClick={() => assignMember(m.id)} className="text-xs text-brand-600 hover:text-brand-700 font-medium">Asignar</button>
                      )}
                    </div>
                  );
                })}
                {members.length === 0 && <p className="text-xs text-slate-400">No hay miembros registrados aún.</p>}
              </div>
            )}

            {/* Task creation form */}
            {showTaskCreate && (
              <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Nueva tarea</p>
                <input className="input-field" placeholder="Título de la tarea" value={taskForm.title} onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })} />
                <textarea className="input-field resize-none h-16" placeholder="Descripción (opcional)" value={taskForm.description} onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })} />
                <div className="grid grid-cols-3 gap-3">
                  <select className="select-field text-xs" value={taskForm.assigneeId} onChange={(e) => setTaskForm({ ...taskForm, assigneeId: e.target.value })}>
                    <option value="">Sin asignar</option>
                    {members.map((m: any) => <option key={m.id} value={m.id}>{m.name || m.email}</option>)}
                  </select>
                  <select className="select-field text-xs" value={taskForm.priority} onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}>
                    <option value="LOW">Baja</option>
                    <option value="MEDIUM">Media</option>
                    <option value="HIGH">Alta</option>
                    <option value="URGENT">Urgente</option>
                  </select>
                  <input type="date" className="input-field text-xs" value={taskForm.dueDate} onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })} />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setShowTaskCreate(false)} className="btn-secondary text-xs flex-1">Cancelar</button>
                  <button onClick={createTask} className="btn-primary text-xs flex-1">Crear tarea</button>
                </div>
              </div>
            )}

            {/* Tasks list */}
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                Tareas ({selectedProject.tasks?.length || 0})
              </p>
              <div className="space-y-2">
                {selectedProject.tasks?.length === 0 && (
                  <p className="text-sm text-slate-400 py-4 text-center">No hay tareas en este proyecto</p>
                )}
                {selectedProject.tasks?.map((task: any) => (
                  <div key={task.id} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-100 hover:border-slate-200 transition-colors">
                    <select
                      className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                      value={task.status}
                      onChange={(e) => updateTaskStatus(task.id, e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <option value="PENDING">Pendiente</option>
                      <option value="IN_PROGRESS">En progreso</option>
                      <option value="IN_REVIEW">En revisión</option>
                      <option value="COMPLETED">Completada</option>
                    </select>
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm ${task.status === "COMPLETED" ? "line-through text-slate-400" : "text-slate-700"}`}>{task.title}</p>
                    </div>
                    <StatusBadge status={task.status} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
