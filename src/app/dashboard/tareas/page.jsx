// src/app/dashboard/tareas/page.jsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import LoadingScreen from "@/components/LoadingScreen";
import Modal from "@/components/Modal";
import { StatusBadge, PriorityBadge, Avatar } from "@/components/Badges";
import Select from "@/components/Select";
import { Loader2 } from "lucide-react";

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
  const [tasks, setTasks]       = useState([]);
  const [projects, setProjects] = useState([]);
  const [members, setMembers]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [viewMode, setViewMode] = useState("kanban");
  const [filterProject, setFilterProject] = useState("");
  const [filterMember, setFilterMember]   = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editTask, setEditTask]     = useState(null);
  const [form, setForm] = useState({ title: "", description: "", projectId: "", assigneeId: "", priority: "MEDIUM", dueDate: "" });
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false });

  const fetchData = useCallback(async () => {
    const [tRes, pRes, mRes] = await Promise.all([
      fetch("/api/tasks"), fetch("/api/projects"), fetch("/api/members"),
    ]);
    const [tData, pData, mData] = await Promise.all([tRes.json(), pRes.json(), mRes.json()]);
    setTasks(tData);
    setProjects(pData);
    setMembers(mData);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Refrescar al volver a la pestaña
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible") fetchData();
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [fetchData]);

  const filteredTasks = tasks.filter((t) => {
    if (filterProject && t.projectId !== filterProject) return false;
    if (filterMember && t.assigneeId !== filterMember) return false;
    return true;
  });

  const createTask = async () => {
    if (!form.title.trim() || !form.projectId) return;
    setIsProcessing(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, assigneeId: form.assigneeId || null }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Error al crear la tarea.");
      setForm({ title: "", description: "", projectId: "", assigneeId: "", priority: "MEDIUM", dueDate: "" });
      setShowCreate(false);
      fetchData();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const updateTask = async (id, data) => {
    setIsProcessing(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...data }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Error al actualizar la tarea.");
      fetchData();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const deleteTask = async (id) => {
    setConfirmDialog({
      isOpen: true,
      title: "Eliminar tarea",
      message: "¿Estás seguro de que deseas eliminar esta tarea? Esta acción no se puede deshacer.",
      onConfirm: async () => {
        setIsProcessing(true);
        try {
          const res = await fetch(`/api/tasks?id=${id}`, { method: "DELETE" });
          if (!res.ok) throw new Error("Error al eliminar la tarea.");
          setEditTask(null);
          fetchData();
        } catch (err) {
          setErrorMsg(err.message);
        } finally {
          setIsProcessing(false);
        }
      },
    });
  };

  if (loading) {
    return (
      <LoadingScreen />
    );
  }

  // Build "Por integrante" columns
  const memberColumns = [
    { id: "__unassigned__", name: "Sin asignar", image: null, tasks: filteredTasks.filter((t) => !t.assigneeId) },
    ...members
      .map((m) => ({ ...m, tasks: filteredTasks.filter((t) => t.assigneeId === m.id) }))
      .filter((m) => m.tasks.length > 0),
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div variants={fadeUp} initial="hidden" animate="show" custom={0}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-slate-100">Tareas</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            {filteredTasks.length} tarea{filteredTasks.length !== 1 ? "s" : ""} · {filteredTasks.filter((t) => t.status === "COMPLETED").length} completadas
          </p>
        </div>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
          onClick={() => setShowCreate(true)} className="btn-primary">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Nueva tarea
        </motion.button>
      </motion.div>

      {/* Filters + view toggle */}
      <motion.div variants={fadeUp} initial="hidden" animate="show" custom={1}
        className="flex flex-wrap items-center gap-3">
        <Select size="sm" className="w-44" value={filterProject} onChange={setFilterProject}
          placeholder="Todos los proyectos"
          options={[{ value: "", label: "Todos los proyectos" }, ...projects.map(p => ({ value: p.id, label: p.name }))]} />
        <Select size="sm" className="w-44" value={filterMember} onChange={setFilterMember}
          placeholder="Todos los miembros"
          options={[{ value: "", label: "Todos los miembros" }, ...members.map(m => ({ value: m.id, label: m.name || m.email }))]} />

        {/* View toggle */}
        <div className="ml-auto flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          {[
            { mode: "kanban", title: "Por estado", icon: <><rect x="3" y="3" width="5" height="18" rx="1" /><rect x="10" y="3" width="5" height="12" rx="1" /><rect x="17" y="3" width="5" height="16" rx="1" /></> },
            { mode: "member", title: "Por integrante", icon: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></> },
            { mode: "list",   title: "Lista", icon: <><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></> },
          ].map(({ mode, title, icon }) => (
            <button key={mode} title={title} onClick={() => setViewMode(mode)}
              className={`p-2 rounded-lg transition-all ${viewMode === mode
                ? "bg-white dark:bg-slate-700 shadow-sm text-slate-700 dark:text-slate-200"
                : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"}`}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">{icon}</svg>
            </button>
          ))}
        </div>
      </motion.div>

      {/* View content */}
      <AnimatePresence mode="wait">

        {/* ─── KANBAN (por estado) ─── */}
        {viewMode === "kanban" && (
          <motion.div key="kanban" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {STATUSES.map(({ key, label, color }, colIndex) => {
              const colTasks = filteredTasks.filter((t) => t.status === key);
              return (
                <motion.div key={key} variants={fadeUp} initial="hidden" animate="show" custom={colIndex} className="space-y-3">
                  <div className="flex items-center gap-2 px-1">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{label}</span>
                    <span className="text-xs text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md ml-auto">{colTasks.length}</span>
                  </div>
                  <div className="space-y-2 min-h-[80px]">
                    {colTasks.map((task, ti) => (
                      <motion.div key={task.id} variants={fadeUp} initial="hidden" animate="show" custom={colIndex * 0.5 + ti * 0.06}
                        whileHover={{ y: -2, transition: { duration: 0.15 } }}
                        className="card-hover p-4 cursor-pointer" onClick={() => setEditTask(task)}>
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
                    {colTasks.length === 0 && (
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

        {/* ─── POR INTEGRANTE ─── */}
        {viewMode === "member" && (
          <motion.div key="member" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}>
            {memberColumns.length === 0 ? (
              <div className="card p-12 text-center text-sm text-slate-400">No hay tareas con estos filtros.</div>
            ) : (
              <div className="flex gap-4 overflow-x-auto pb-4">
                {memberColumns.map(({ id: colId, name, image, tasks: colTasks }, colIdx) => (
                  <motion.div key={colId} variants={fadeUp} initial="hidden" animate="show" custom={colIdx * 0.15}
                    className="flex-shrink-0 w-72 space-y-3">
                    {/* Member header */}
                    <div className="flex items-center gap-2.5 px-1">
                      {colId === "__unassigned__" ? (
                        <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-600 flex-shrink-0" />
                      ) : (
                        <Avatar src={image} name={name} size="xs" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 truncate">{name}</p>
                      </div>
                      <span className="text-xs text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md flex-shrink-0">{colTasks.length}</span>
                    </div>

                    {/* Task cards */}
                    <div className="space-y-2">
                      {colTasks.map((task, ti) => (
                        <motion.div key={task.id} variants={fadeUp} initial="hidden" animate="show"
                          custom={colIdx * 0.15 + ti * 0.05}
                          whileHover={{ y: -2, transition: { duration: 0.15 } }}
                          className="card-hover p-3.5 cursor-pointer" onClick={() => setEditTask(task)}>
                          <div className="flex items-start gap-2 mb-2.5">
                            <span className="w-2 h-2 rounded-full mt-1 flex-shrink-0" style={{ backgroundColor: task.project?.color }} />
                            <p className="text-sm font-medium text-slate-800 dark:text-slate-200 line-clamp-2 flex-1">{task.title}</p>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <StatusBadge status={task.status} />
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              <PriorityBadge priority={task.priority} />
                            </div>
                          </div>
                          {task.project && (
                            <p className="text-[11px] text-slate-400 mt-2 truncate">{task.project.name}</p>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* ─── LISTA ─── */}
        {viewMode === "list" && (
          <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }} className="card overflow-hidden">
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
                  <motion.tr key={task.id} variants={fadeUp} initial="hidden" animate="show" custom={i * 0.03}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 cursor-pointer transition-colors"
                    onClick={() => setEditTask(task)}>
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
              <Select value={form.projectId} onChange={v => setForm({ ...form, projectId: v })}
                placeholder="Seleccionar…"
                options={[{ value: "", label: "Seleccionar…" }, ...projects.map(p => ({ value: p.id, label: p.name }))]} />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Asignar a</label>
              <Select value={form.assigneeId} onChange={v => setForm({ ...form, assigneeId: v })}
                placeholder="Sin asignar"
                options={[{ value: "", label: "Sin asignar" }, ...members.map(m => ({ value: m.id, label: m.name || m.email }))]} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Prioridad</label>
              <Select value={form.priority} onChange={v => setForm({ ...form, priority: v })}
                options={[{ value: "LOW", label: "Baja" }, { value: "MEDIUM", label: "Media" }, { value: "HIGH", label: "Alta" }, { value: "URGENT", label: "Urgente" }]} />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Fecha límite</label>
              <input type="date" className="input-field" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setShowCreate(false)} disabled={isProcessing} className="btn-secondary flex-1">Cancelar</button>
            <button onClick={createTask} disabled={isProcessing || !form.title.trim() || !form.projectId} className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              {isProcessing ? <><Loader2 size={15} className="animate-spin" /> Creando...</> : "Crear tarea"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Task Modal */}
      <Modal open={!!editTask} onClose={() => !isProcessing && setEditTask(null)} title="Detalle de tarea">
        {editTask && (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Título</label>
              <input className="input-field" value={editTask.title}
                onChange={(e) => setEditTask({ ...editTask, title: e.target.value })}
                onBlur={() => updateTask(editTask.id, { title: editTask.title })} />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Descripción</label>
              <textarea className="input-field resize-none h-20" value={editTask.description || ""}
                placeholder="Sin descripción…"
                onChange={(e) => setEditTask({ ...editTask, description: e.target.value })}
                onBlur={() => updateTask(editTask.id, { description: editTask.description })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Estado</label>
                <Select value={editTask.status}
                  onChange={v => { updateTask(editTask.id, { status: v }); setEditTask({ ...editTask, status: v }); }}
                  options={[{ value: "PENDING", label: "Pendiente" }, { value: "IN_PROGRESS", label: "En progreso" }, { value: "IN_REVIEW", label: "En revisión" }, { value: "COMPLETED", label: "Completada" }]} />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Prioridad</label>
                <Select value={editTask.priority}
                  onChange={v => { updateTask(editTask.id, { priority: v }); setEditTask({ ...editTask, priority: v }); }}
                  options={[{ value: "LOW", label: "Baja" }, { value: "MEDIUM", label: "Media" }, { value: "HIGH", label: "Alta" }, { value: "URGENT", label: "Urgente" }]} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Asignado a</label>
                <Select value={editTask.assigneeId || ""}
                  onChange={v => { updateTask(editTask.id, { assigneeId: v || null }); setEditTask({ ...editTask, assigneeId: v }); }}
                  placeholder="Sin asignar"
                  options={[{ value: "", label: "Sin asignar" }, ...members.map(m => ({ value: m.id, label: m.name || m.email }))]} />
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
              <button onClick={() => deleteTask(editTask.id)} disabled={isProcessing} className="btn-ghost text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 disabled:opacity-50">
                Eliminar
              </button>
              <button onClick={() => setEditTask(null)} className="btn-primary ml-auto">Listo</button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmModal
        {...confirmDialog}
        onClose={() => setConfirmDialog({ isOpen: false })}
      />

      <AnimatePresence>
        {isProcessing && (
          <motion.div
            key="tareas-loader"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex flex-col items-center justify-center text-white"
          >
            <Loader2 size={48} className="animate-spin text-brand-500 mb-4" />
            <p className="text-lg font-semibold">Procesando...</p>
            <p className="text-sm text-slate-300">Por favor, espera un momento</p>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {errorMsg && (
          <>
            <motion.div key="err-bd" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[110]" onClick={() => setErrorMsg("")} />
            <motion.div key="err-md"
              initial={{ opacity: 0, scale: 0.95, x: "-50%", y: "-50%" }}
              animate={{ opacity: 1, scale: 1, x: "-50%", y: "-50%" }}
              exit={{ opacity: 0, scale: 0.95, x: "-50%", y: "-50%" }}
              className="fixed left-1/2 top-1/2 w-[90%] max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl z-[110] overflow-hidden"
            >
              <div className="p-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Atención</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">{errorMsg}</p>
              </div>
              <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 flex justify-end">
                <button onClick={() => setErrorMsg("")} className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors">Aceptar</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function ConfirmModal({ isOpen, onClose, onConfirm, title, message, confirmText = "Confirmar" }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div key="bd" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[120]" onClick={onClose} />
          <motion.div key="md"
            initial={{ opacity: 0, scale: 0.95, x: "-50%", y: "-50%" }}
            animate={{ opacity: 1, scale: 1, x: "-50%", y: "-50%" }}
            exit={{ opacity: 0, scale: 0.95, x: "-50%", y: "-50%" }}
            className="fixed left-1/2 top-1/2 w-[90%] max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl z-[120] overflow-hidden"
          >
            <div className="p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">{title}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">{message}</p>
            </div>
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-3">
              <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">Cancelar</button>
              <button onClick={() => { onConfirm(); onClose(); }} className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors">{confirmText}</button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
