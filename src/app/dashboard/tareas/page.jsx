// src/app/dashboard/tareas/page.jsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Modal from "@/components/Modal";
import { StatusBadge, PriorityBadge, Avatar } from "@/components/Badges";

const STATUSES = [
  { key: "PENDING",     label: "Pendientes",  color: "#94a3b8" },
  { key: "IN_PROGRESS", label: "En progreso", color: "#3b82f6" },
  { key: "IN_REVIEW",   label: "En revisión", color: "#f59e0b" },
  { key: "COMPLETED",   label: "Completadas", color: "#10b981" },
];

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.05, duration: 0.35, ease: [0.16, 1, 0.3, 1] },
  }),
};

export default function TareasPage() {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("kanban");
  const [filterProject, setFilterProject] = useState("");
  const [filterMember, setFilterMember] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [form, setForm] = useState({ title: "", description: "", projectId: "", assigneeId: "", priority: "MEDIUM", dueDate: "" });

  const fetchData = useCallback(async () => {
    const [tRes, pRes, mRes] = await Promise.all([
      fetch("/api/tasks"),
      fetch("/api/projects"),
      fetch("/api/members"),
    ]);
    const [tData, pData, mData] = await Promise.all([tRes.json(), pRes.json(), mRes.json()]);
    setTasks(tData);
    setProjects(pData);
    setMembers(mData);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filteredTasks = tasks.filter((t) => {
    if (filterProject && t.projectId !== filterProject) return false;
    if (filterMember && t.assigneeId !== filterMember) return false;
    return true;
  });

  const createTask = async () => {
    if (!form.title.trim() || !form.projectId) return;
    await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, assigneeId: form.assigneeId || null }),
    });
    setForm({ title: "", description: "", projectId: "", assigneeId: "", priority: "MEDIUM", dueDate: "" });
    setShowCreate(false);
    fetchData();
  };

  const updateTask = async (id, data) => {
    await fetch("/api/tasks", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...data }),
    });
    fetchData();
  };

  const deleteTask = async (id) => {
    if (!confirm("¿Eliminar esta tarea?")) return;
    await fetch(`/api/tasks?id=${id}`, { method: "DELETE" });
    setEditTask(null);
    fetchData();
  };

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div variants={fadeUp} initial="hidden" animate="show" custom={0} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-slate-100">Tareas</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Todas las tareas de todos los proyectos en un solo lugar</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setShowCreate(true)}
          className="btn-primary"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          Nueva tarea
        </motion.button>
      </motion.div>

      {/* Filters */}
      <motion.div variants={fadeUp} initial="hidden" animate="show" custom={1} className="flex flex-wrap items-center gap-3">
        <select className="select-field w-auto text-xs" value={filterProject} onChange={(e) => setFilterProject(e.target.value)}>
          <option value="">Todos los proyectos</option>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select className="select-field w-auto text-xs" value={filterMember} onChange={(e) => setFilterMember(e.target.value)}>
          <option value="">Todos los miembros</option>
          {members.map((m) => <option key={m.id} value={m.id}>{m.name || m.email}</option>)}
        </select>

        <div className="ml-auto flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setViewMode("kanban")}
            className={`p-2 rounded-lg transition-all ${viewMode === "kanban" ? "bg-white dark:bg-slate-700 shadow-sm text-slate-700 dark:text-slate-200" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"}`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <rect x="3" y="3" width="5" height="18" rx="1" /><rect x="10" y="3" width="5" height="12" rx="1" /><rect x="17" y="3" width="5" height="16" rx="1" />
            </svg>
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-2 rounded-lg transition-all ${viewMode === "list" ? "bg-white dark:bg-slate-700 shadow-sm text-slate-700 dark:text-slate-200" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"}`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        </div>
      </motion.div>

      {/* Kanban View */}
      <AnimatePresence mode="wait">
        {viewMode === "kanban" && (
          <motion.div
            key="kanban"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {STATUSES.map(({ key, label, color }, colIndex) => {
              const columnTasks = filteredTasks.filter((t) => t.status === key);
              return (
                <motion.div
                  key={key}
                  variants={fadeUp}
                  initial="hidden"
                  animate="show"
                  custom={colIndex}
                  className="space-y-3"
                >
                  <div className="flex items-center gap-2 px-1">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{label}</span>
                    <span className="text-xs text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md ml-auto">{columnTasks.length}</span>
                  </div>
                  <div className="space-y-2 min-h-[100px]">
                    {columnTasks.map((task, ti) => (
                      <motion.div
                        key={task.id}
                        variants={fadeUp}
                        initial="hidden"
                        animate="show"
                        custom={colIndex * 0.5 + ti * 0.08}
                        whileHover={{ y: -2, transition: { duration: 0.15 } }}
                        className="card-hover p-4 cursor-pointer"
                        onClick={() => setEditTask(task)}
                      >
                        <div className="flex items-start gap-2 mb-2">
                          <span className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: task.project?.color }} />
                          <p className="text-sm font-medium text-slate-800 dark:text-slate-200 line-clamp-2">{task.title}</p>
                        </div>
                        <div className="flex items-center justify-between mt-3">
                          <span className="text-[11px] text-slate-400 truncate">{task.project?.name}</span>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <PriorityBadge priority={task.priority} />
                            {task.assignee && <Avatar src={task.assignee.image} name={task.assignee.name} size="xs" />}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                    {columnTasks.length === 0 && (
                      <div className="h-24 rounded-xl border-2 border-dashed border-slate-100 dark:border-slate-800 flex items-center justify-center">
                        <p className="text-xs text-slate-300 dark:text-slate-700">Sin tareas</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {/* List View */}
        {viewMode === "list" && (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="card overflow-hidden"
          >
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-700/60">
                  <th className="text-left text-[11px] uppercase tracking-wider text-slate-400 font-semibold px-5 py-3">Tarea</th>
                  <th className="text-left text-[11px] uppercase tracking-wider text-slate-400 font-semibold px-5 py-3 hidden sm:table-cell">Proyecto</th>
                  <th className="text-left text-[11px] uppercase tracking-wider text-slate-400 font-semibold px-5 py-3 hidden md:table-cell">Asignado</th>
                  <th className="text-left text-[11px] uppercase tracking-wider text-slate-400 font-semibold px-5 py-3">Estado</th>
                  <th className="text-left text-[11px] uppercase tracking-wider text-slate-400 font-semibold px-5 py-3 hidden sm:table-cell">Prioridad</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
                {filteredTasks.map((task, i) => (
                  <motion.tr
                    key={task.id}
                    variants={fadeUp}
                    initial="hidden"
                    animate="show"
                    custom={i * 0.5}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 cursor-pointer transition-colors"
                    onClick={() => setEditTask(task)}
                  >
                    <td className="px-5 py-3">
                      <p className="text-sm text-slate-800 dark:text-slate-200 font-medium truncate max-w-[250px]">{task.title}</p>
                    </td>
                    <td className="px-5 py-3 hidden sm:table-cell">
                      <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: task.project?.color }} />
                        {task.project?.name}
                      </span>
                    </td>
                    <td className="px-5 py-3 hidden md:table-cell">
                      {task.assignee ? (
                        <div className="flex items-center gap-2">
                          <Avatar src={task.assignee.image} name={task.assignee.name} size="xs" />
                          <span className="text-xs text-slate-600 dark:text-slate-400">{task.assignee.name}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">Sin asignar</span>
                      )}
                    </td>
                    <td className="px-5 py-3"><StatusBadge status={task.status} /></td>
                    <td className="px-5 py-3 hidden sm:table-cell"><PriorityBadge priority={task.priority} /></td>
                  </motion.tr>
                ))}
                {filteredTasks.length === 0 && (
                  <tr><td colSpan={5} className="px-5 py-12 text-center text-sm text-slate-400">No hay tareas con estos filtros.</td></tr>
                )}
              </tbody>
            </table>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Task Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Nueva tarea">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Título</label>
            <input className="input-field" placeholder="¿Qué hay que hacer?" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Descripción (opcional)</label>
            <textarea className="input-field resize-none h-20" placeholder="Detalles de la tarea" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Proyecto</label>
              <select className="select-field" value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })}>
                <option value="">Seleccionar...</option>
                {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Asignar a</label>
              <select className="select-field" value={form.assigneeId} onChange={(e) => setForm({ ...form, assigneeId: e.target.value })}>
                <option value="">Sin asignar</option>
                {members.map((m) => <option key={m.id} value={m.id}>{m.name || m.email}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Prioridad</label>
              <select className="select-field" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                <option value="LOW">Baja</option>
                <option value="MEDIUM">Media</option>
                <option value="HIGH">Alta</option>
                <option value="URGENT">Urgente</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Fecha límite</label>
              <input type="date" className="input-field" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setShowCreate(false)} className="btn-secondary flex-1">Cancelar</button>
            <button onClick={createTask} className="btn-primary flex-1">Crear tarea</button>
          </div>
        </div>
      </Modal>

      {/* Edit Task Modal */}
      <Modal open={!!editTask} onClose={() => setEditTask(null)} title="Detalle de tarea">
        {editTask && (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Título</label>
              <input
                className="input-field"
                value={editTask.title}
                onChange={(e) => setEditTask({ ...editTask, title: e.target.value })}
                onBlur={() => updateTask(editTask.id, { title: editTask.title })}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Descripción</label>
              <textarea
                className="input-field resize-none h-20"
                value={editTask.description || ""}
                onChange={(e) => setEditTask({ ...editTask, description: e.target.value })}
                onBlur={() => updateTask(editTask.id, { description: editTask.description })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Estado</label>
                <select
                  className="select-field"
                  value={editTask.status}
                  onChange={(e) => { updateTask(editTask.id, { status: e.target.value }); setEditTask({ ...editTask, status: e.target.value }); }}
                >
                  <option value="PENDING">Pendiente</option>
                  <option value="IN_PROGRESS">En progreso</option>
                  <option value="IN_REVIEW">En revisión</option>
                  <option value="COMPLETED">Completada</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Prioridad</label>
                <select
                  className="select-field"
                  value={editTask.priority}
                  onChange={(e) => { updateTask(editTask.id, { priority: e.target.value }); setEditTask({ ...editTask, priority: e.target.value }); }}
                >
                  <option value="LOW">Baja</option>
                  <option value="MEDIUM">Media</option>
                  <option value="HIGH">Alta</option>
                  <option value="URGENT">Urgente</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Asignado a</label>
                <select
                  className="select-field"
                  value={editTask.assigneeId || ""}
                  onChange={(e) => { updateTask(editTask.id, { assigneeId: e.target.value || null }); setEditTask({ ...editTask, assigneeId: e.target.value }); }}
                >
                  <option value="">Sin asignar</option>
                  {members.map((m) => <option key={m.id} value={m.id}>{m.name || m.email}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Proyecto</label>
                <p className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2 mt-1">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: editTask.project?.color }} />
                  {editTask.project?.name}
                </p>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => deleteTask(editTask.id)} className="btn-ghost text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600">
                Eliminar
              </button>
              <button onClick={() => setEditTask(null)} className="btn-primary ml-auto">Listo</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
