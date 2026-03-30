// src/app/dashboard/areas/page.jsx
"use client";

import { useEffect, useState, useCallback, forwardRef, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import { ProgressBar, AvatarStack, ProjectStatusBadge } from "@/components/Badges";
import Select from "@/components/Select";
import LoadingScreen from "@/components/LoadingScreen";
import {
  Building2, Plus, Pencil, Trash2, X, Check,
  ChevronRight, FolderOpen, Users, ArrowRight,
  Crown, Search, LayoutGrid, Loader2,
} from "lucide-react";

const COLORS = [
  "#8B1515","#A31B1B","#1D4ED8","#0F766E","#6D28D9",
  "#B45309","#065F46","#9D174D","#0369A1","#0F172A",
];

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.06, duration: 0.38, ease: [0.16, 1, 0.3, 1] },
  }),
};

/* ─── Avatar local ─────────────────────────────────────────── */
function UserAvatar({ user, size = 9 }) {
  const cls = `w-${size} h-${size} rounded-full flex-shrink-0 object-cover`;
  return user?.image ? (
    <img src={user.image} alt="" className={`${cls} ring-2 ring-white dark:ring-slate-800`} referrerPolicy="no-referrer" />
  ) : (
    <div className={`${cls} bg-gradient-to-br from-brand-600 to-brand-800 flex items-center justify-center text-white font-bold text-sm ring-2 ring-white dark:ring-slate-800`}>
      {user?.name?.charAt(0) || user?.email?.charAt(0) || "?"}
    </div>
  );
}

/* ─── MultiSelect ───────────────────────────────────────────── */
function MultiSelect({ values = [], onChange, options = [], placeholder = "Sin titular asignado" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const toggle = (val) => {
    if (values.includes(val)) onChange(values.filter(v => v !== val));
    else onChange([...values, val]);
  };

  const selectedLabels = options.filter(o => values.includes(o.value));

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-2 px-4 py-2.5 text-sm rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-brand-400 dark:hover:border-brand-500 focus:outline-none transition-all cursor-pointer select-none">
        <span className="flex flex-wrap gap-1 min-w-0 flex-1">
          {selectedLabels.length === 0
            ? <span className="text-slate-400">{placeholder}</span>
            : selectedLabels.map(o => (
              <span key={o.value} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-400 text-xs font-medium">
                {o.label}
                <span onMouseDown={e => { e.stopPropagation(); toggle(o.value); }} className="cursor-pointer hover:text-red-500">×</span>
              </span>
            ))
          }
        </span>
        <ChevronRight size={14} className={`text-slate-400 flex-shrink-0 transition-transform ${open ? "rotate-90" : ""}`} />
      </button>
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden">
          <div className="py-1 max-h-56 overflow-y-auto">
            {options.map(opt => {
              const checked = values.includes(opt.value);
              return (
                <button key={opt.value} type="button"
                  onMouseDown={e => { e.preventDefault(); toggle(opt.value); }}
                  className={`w-full flex items-center justify-between gap-3 px-3.5 py-2.5 text-sm text-left transition-colors ${checked ? "bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-400" : "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"}`}>
                  <span className="truncate">{opt.label}</span>
                  {checked && <Check size={14} className="flex-shrink-0 text-brand-600 dark:text-brand-400" strokeWidth={2.5} />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── ConfirmModal ──────────────────────────────────────────── */
function ConfirmModal({ isOpen, onClose, onConfirm, title, message, confirmText = "Confirmar" }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div key="bd" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]" onClick={onClose} />
          <motion.div key="md"
            initial={{ opacity: 0, scale: 0.95, x: "-50%", y: "-50%" }}
            animate={{ opacity: 1, scale: 1, x: "-50%", y: "-50%" }}
            exit={{ opacity: 0, scale: 0.95, x: "-50%", y: "-50%" }}
            className="fixed left-1/2 top-1/2 w-[90%] max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl z-[60] overflow-hidden"
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

/* ─── Area Form Panel (ADMIN) ───────────────────────────────── */
const AreaFormPanel = forwardRef(({ form, setForm, onSave, onCancel, editing, users, isProcessing }, ref) => (
  <motion.div ref={ref}
    initial={{ opacity: 0, x: 32 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 32 }}
    transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
    className="fixed inset-y-0 right-0 w-full sm:w-[420px] z-50 flex flex-col bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-700"
  >
    <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800">
      <div>
        <h3 className="font-semibold text-slate-800 dark:text-white">{editing ? "Editar área" : "Nueva área"}</h3>
        <p className="text-xs text-slate-400 mt-0.5">{editing ? "Modifica los datos del área" : "Crea una nueva área institucional"}</p>
      </div>
      <button onClick={onCancel} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-400"><X size={16} /></button>
    </div>
    <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
      {/* Preview */}
      <div className="rounded-2xl p-4 flex items-center gap-3" style={{ background: `${form.color}18`, border: `1.5px solid ${form.color}40` }}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg" style={{ background: form.color }}>
          {form.name?.charAt(0) || "A"}
        </div>
        <div>
          <p className="font-semibold text-slate-800 dark:text-white text-sm">{form.name || "Nombre del área"}</p>
          <p className="text-xs text-slate-400">{form.description || "Sin descripción"}</p>
        </div>
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Nombre *</label>
        <input className="input-field" placeholder="Ej. Administración General"
          value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Descripción</label>
        <textarea className="input-field resize-none h-20" placeholder="Describe brevemente esta área..."
          value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Titulares</label>
        <MultiSelect
          values={form.titularIds}
          onChange={v => setForm(f => ({ ...f, titularIds: v }))}
          placeholder="Sin titulares asignados"
          options={users.map(u => ({ value: u.id, label: u.name || u.email }))}
        />
      </div>
      <div className="space-y-2">
        <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Color</label>
        <div className="flex gap-2 flex-wrap">
          {COLORS.map(c => (
            <button key={c} onClick={() => setForm(f => ({ ...f, color: c }))}
              className="w-8 h-8 rounded-xl transition-all hover:scale-110 relative" style={{ background: c }}>
              {form.color === c && <span className="absolute inset-0 flex items-center justify-center"><Check size={14} className="text-white" strokeWidth={3} /></span>}
            </button>
          ))}
        </div>
      </div>
    </div>
    <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex gap-3">
      <button onClick={onCancel} disabled={isProcessing} className="btn-secondary flex-1">Cancelar</button>
      <button onClick={onSave} disabled={!form.name.trim() || isProcessing} className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
        {isProcessing ? <><Loader2 size={15} className="animate-spin" /> Guardando...</> : (editing ? "Guardar cambios" : "Crear área")}
      </button>
    </div>
  </motion.div>
));
AreaFormPanel.displayName = "AreaFormPanel";

/* ─── Area Detail Panel ─────────────────────────────────────── */
function AreaDetailPanel({ area, onClose, onEdit, isAdmin }) {
  const [search, setSearch] = useState("");

  if (!area) return null;

  const members = area.users?.map(u => u.user) || [];
  const filteredMembers = members.filter(u =>
    (u.name || "").toLowerCase().includes(search.toLowerCase()) ||
    (u.email || "").toLowerCase().includes(search.toLowerCase())
  );

  const totalTasks = area.projects?.reduce((s, p) => s + (p.tasks?.length || 0), 0) || 0;
  const completedTasks = area.projects?.reduce((s, p) => s + (p.tasks?.filter(t => t.status === "COMPLETED").length || 0), 0) || 0;
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: 32 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 32 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-y-0 right-0 w-full sm:w-[500px] z-50 flex flex-col bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-700"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-3.5 h-3.5 rounded-full flex-shrink-0" style={{ background: area.color }} />
          <div>
            <h3 className="font-semibold text-slate-800 dark:text-white">{area.name}</h3>
            {area.description && <p className="text-xs text-slate-400 mt-0.5 truncate max-w-[280px]">{area.description}</p>}
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {isAdmin && (
            <button onClick={onEdit} title="Editar área"
              className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
              <Pencil size={14} />
            </button>
          )}
          <Link href={`/dashboard/areas/${area.id}`}
            className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-400 hover:text-brand-600 dark:hover:text-brand-400"
            title="Ver página completa">
            <ArrowRight size={14} />
          </Link>
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-400">
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Stats bar */}
        <div className="px-6 py-4 grid grid-cols-3 gap-3 border-b border-slate-100 dark:border-slate-800">
          {[
            { label: "Proyectos", value: area.projects?.length || 0, color: area.color },
            { label: "Tareas", value: totalTasks, color: "#3b82f6" },
            { label: "Completadas", value: completedTasks, color: "#10b981" },
          ].map(({ label, value, color }) => (
            <div key={label} className="text-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
              <p className="text-lg font-bold" style={{ color }}>{value}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Progress */}
        {totalTasks > 0 && (
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-slate-400">Progreso general</span>
              <span className="font-semibold text-slate-600 dark:text-slate-400">{progress}%</span>
            </div>
            <ProgressBar percent={progress} color={area.color} />
          </div>
        )}

        {/* Titulares */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
            <Crown size={12} /> Titular{area.titulares?.length !== 1 ? "es" : ""} del área
          </p>
          {area.titulares?.length > 0 ? (
            <div className="space-y-2">
              {area.titulares.map(t => (
                <div key={t.userId} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <UserAvatar user={t.user} size={10} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">{t.user?.name}</p>
                    <p className="text-xs text-slate-400 truncate">{t.user?.email}</p>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full text-white flex-shrink-0"
                    style={{ backgroundColor: area.color }}>Titular</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-dashed border-slate-200 dark:border-slate-700 text-sm text-slate-400 text-center">
              Sin titular asignado
            </div>
          )}
        </div>

        {/* Members */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
            <Users size={12} /> Miembros ({members.length})
          </p>
          {members.length > 5 && (
            <div className="relative mb-3">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                className="w-full pl-9 pr-3 py-2 text-sm bg-transparent border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all dark:text-white"
                placeholder="Buscar miembro..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          )}
          {members.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">No hay miembros en esta área.</p>
          ) : filteredMembers.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">Sin resultados.</p>
          ) : (
            <div className="space-y-1 max-h-52 overflow-y-auto pr-0.5">
              {filteredMembers.map(user => {
                const isTitular = area.titulares?.some(t => t.userId === user.id || t.user?.id === user.id);
                const projectCount = area.projects?.filter(p => p.assignments?.some(a => a.userId === user.id)).length || 0;
                return (
                  <div key={user.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <UserAvatar user={user} size={8} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 dark:text-white truncate">{user.name || "—"}</p>
                      <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      {isTitular && (
                        <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full text-white" style={{ backgroundColor: area.color }}>Titular</span>
                      )}
                      <span className="text-[10px] text-slate-400">{projectCount} proy.</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Projects */}
        <div className="px-6 py-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <LayoutGrid size={12} /> Proyectos ({area.projects?.length || 0})
            </p>
            <Link href={`/dashboard/areas/${area.id}`}
              className="text-xs font-medium flex items-center gap-1 transition-colors hover:text-brand-600 dark:hover:text-brand-400 text-slate-400">
              Ver todos <ChevronRight size={12} />
            </Link>
          </div>
          {!area.projects?.length ? (
            <p className="text-sm text-slate-400 text-center py-4">Sin proyectos en esta área.</p>
          ) : (
            <div className="space-y-2">
              {area.projects.slice(0, 5).map(project => {
                const total = project.tasks?.length || 0;
                const done = project.tasks?.filter(t => t.status === "COMPLETED").length || 0;
                const prog = total > 0 ? Math.round((done / total) * 100) : 0;
                return (
                  <Link key={project.id} href={`/dashboard/proyectos/${project.id}`}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow-sm"
                      style={{ backgroundColor: project.color }}>
                      {project.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                        {project.name}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: `${prog}%`, backgroundColor: project.color }} />
                        </div>
                        <span className="text-[10px] text-slate-400 flex-shrink-0">{prog}%</span>
                      </div>
                    </div>
                    <ProjectStatusBadge status={project.status} />
                  </Link>
                );
              })}
              {area.projects.length > 5 && (
                <Link href={`/dashboard/areas/${area.id}`}
                  className="block text-center text-xs text-slate-400 hover:text-brand-600 py-2 transition-colors">
                  +{area.projects.length - 5} proyectos más
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Main Page ─────────────────────────────────────────────── */
export default function AreasPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN" || session?.user?.role === "SUPERADMIN";

  const [areas, setAreas] = useState([]);
  const [users, setUsers] = useState([]); // for ADMIN titular select
  const [loading, setLoading] = useState(true);

  // Detail panel
  const [selectedArea, setSelectedArea] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showDetail, setShowDetail] = useState(false);

  // Form panel (ADMIN)
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", description: "", color: "#8B1515", titularIds: [] });

  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false });
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const fetchAreas = useCallback(async () => {
    const res = await fetch("/api/areas");
    const data = await res.json();
    setAreas(Array.isArray(data) ? data : []);
    setLoading(false);
  }, []);

  const fetchUsers = useCallback(async () => {
    if (!isAdmin) return;
    const res = await fetch("/api/admin/users");
    const data = await res.json();
    setUsers(Array.isArray(data) ? data : []);
  }, [isAdmin]);

  useEffect(() => { fetchAreas(); }, [fetchAreas]);
  useEffect(() => { if (isAdmin) fetchUsers(); }, [isAdmin, fetchUsers]);

  // Refrescar al volver a la pestaña
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible") fetchAreas();
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [fetchAreas]);

  const openDetail = async (area) => {
    setShowForm(false);
    setDetailLoading(true);
    setShowDetail(true);
    const res = await fetch(`/api/areas/${area.id}`);
    const data = await res.json();
    setSelectedArea(data);
    setDetailLoading(false);
  };

  const openNew = () => {
    setEditing(null);
    setForm({ name: "", description: "", color: "#8B1515", titularIds: [] });
    setShowDetail(false);
    setShowForm(true);
  };

  const openEdit = (area) => {
    setEditing(area);
    setForm({
      name: area.name,
      description: area.description || "",
      color: area.color,
      titularIds: area.titulares?.map(t => t.userId) || [],
    });
    setShowDetail(false);
    setShowForm(true);
  };

  const save = async () => {
    setIsProcessing(true);
    try {
      const method = editing ? "PATCH" : "POST";
      const url = editing ? `/api/admin/areas/${editing.id}` : "/api/admin/areas";
      const payload = { ...form, titularIds: form.titularIds };
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Error al guardar");

      // Asignar rol TITULAR a los nuevos titulares
      for (const tid of form.titularIds) {
        const target = users.find(u => u.id === tid);
        if (target && target.role !== "SUPERADMIN" && target.role !== "ADMIN" && target.role !== "TITULAR") {
          await fetch("/api/admin/users", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: tid, role: "TITULAR" }) });
        }
      }

      setShowForm(false);
      setEditing(null);
      await fetchAreas();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const del = (area) => {
    setConfirmDialog({
      isOpen: true,
      title: "Eliminar área",
      message: `¿Eliminar "${area.name}"? Los proyectos asociados quedarán sin área.`,
      onConfirm: async () => {
        setIsProcessing(true);
        const res = await fetch(`/api/admin/areas/${area.id}`, { method: "DELETE" });
        if (res.ok) {
          if (selectedArea?.id === area.id) setShowDetail(false);
          await fetchAreas();
        }
        setIsProcessing(false);
      },
    });
  };

  if (loading) return <LoadingScreen />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div variants={fadeUp} initial="hidden" animate="show" custom={0}
        className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-slate-100">Áreas</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            {areas.length} área{areas.length !== 1 ? "s" : ""} institucional{areas.length !== 1 ? "es" : ""}
          </p>
        </div>
        {isAdmin && (
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            onClick={openNew} className="btn-primary">
            <Plus size={16} /> Nueva área
          </motion.button>
        )}
      </motion.div>

      {/* Grid */}
      {areas.length === 0 ? (
        <motion.div variants={fadeUp} initial="hidden" animate="show" custom={1}
          className="card p-16 text-center">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Building2 size={28} className="text-slate-400" />
          </div>
          <p className="font-medium text-slate-600 dark:text-slate-400">No hay áreas creadas</p>
          {isAdmin
            ? <button onClick={openNew} className="btn-primary mt-4 mx-auto"><Plus size={15} /> Crear primera área</button>
            : <p className="text-sm text-slate-400 mt-1">Un administrador puede crear áreas desde aquí.</p>
          }
        </motion.div>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {areas.map((area, i) => {
            const totalProjects = area.projects?.length || 0;
            const totalTasks = area.projects?.reduce((s, p) => s + (p.tasks?.length || 0), 0) || 0;
            const completedTasks = area.projects?.reduce((s, p) => s + (p.tasks?.filter(t => t.status === "COMPLETED").length || 0), 0) || 0;
            const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
            const memberMap = new Map();
            area.projects?.forEach(p => p.assignments?.forEach(a => { if (a.user && !memberMap.has(a.user.id)) memberMap.set(a.user.id, a.user); }));
            const projectMembers = Array.from(memberMap.values());

            return (
              <motion.div key={area.id} variants={fadeUp} initial="hidden" animate="show"
                custom={i + 1} whileHover={{ y: -3, transition: { duration: 0.18 } }}>
                <div
                  onClick={() => openDetail(area)}
                  className="card overflow-hidden group cursor-pointer border border-transparent hover:shadow-md transition-all duration-300 h-full"
                  style={{ "--area-color": area.color }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = area.color)}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = "")}
                >
                  {/* Color stripe */}
                  <div className="h-1.5" style={{ backgroundColor: area.color }} />

                  <div className="p-5 flex flex-col gap-4">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-white font-display font-bold text-xl flex-shrink-0 shadow-lg"
                          style={{ backgroundColor: area.color, boxShadow: `0 4px 14px ${area.color}40` }}>
                          {area.name.charAt(0)}
                        </div>
                        <div className="min-w-0 pt-0.5">
                          <h3 className="font-semibold text-slate-900 dark:text-slate-100 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors truncate">
                            {area.name}
                          </h3>
                          {area.description && <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{area.description}</p>}
                        </div>
                      </div>
                      {isAdmin && (
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                          <button onClick={e => { e.stopPropagation(); openEdit(area); }}
                            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-all">
                            <Pencil size={12} />
                          </button>
                          <button onClick={e => { e.stopPropagation(); del(area); }}
                            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-slate-400 hover:text-red-500 transition-all">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Titulares */}
                    {area.titulares?.length > 0 ? (
                      <div className="flex flex-wrap items-center gap-1.5 py-2 px-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                        {area.titulares.map(t => (
                          <div key={t.userId} className="flex items-center gap-1.5">
                            <UserAvatar user={t.user} size={6} />
                            <p className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">{t.user?.name?.split(" ")[0] || t.user?.email}</p>
                          </div>
                        ))}
                        <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full text-white ml-auto flex-shrink-0" style={{ backgroundColor: area.color }}>
                          {area.titulares.length > 1 ? `${area.titulares.length} titulares` : "Titular"}
                        </span>
                      </div>
                    ) : (
                      <div className="py-2 px-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs text-slate-400 text-center">Sin titular</div>
                    )}

                    {/* Stats */}
                    <div className="flex items-center gap-3 text-xs flex-wrap">
                      <span className="flex items-center gap-1 text-slate-500">
                        <LayoutGrid size={12} style={{ color: area.color }} />
                        <strong className="text-slate-700 dark:text-slate-300">{totalProjects}</strong> proyectos
                      </span>
                      <span className="flex items-center gap-1 text-slate-500">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                        <strong className="text-slate-700 dark:text-slate-300">{completedTasks}</strong>/{totalTasks} tareas
                      </span>
                      {projectMembers.length > 0 && (
                        <span className="ml-auto flex items-center gap-1.5">
                          <AvatarStack users={projectMembers} max={4} />
                        </span>
                      )}
                    </div>

                    {/* Progress */}
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-400">Progreso</span>
                        <span className="font-medium text-slate-600 dark:text-slate-400">{progress}%</span>
                      </div>
                      <ProgressBar percent={progress} color={area.color} />
                    </div>

                    {/* Footer CTA */}
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Users size={11} /> {area._count?.users || 0} miembro{(area._count?.users || 0) !== 1 ? "s" : ""}
                      </span>
                      <span className="text-xs font-medium flex items-center gap-1 transition-colors" style={{ color: area.color }}>
                        Ver detalle <ChevronRight size={12} className="transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Slide-in backdrop */}
      <AnimatePresence>
        {(showDetail || showForm) && (
          <motion.div key="backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
            onClick={() => { setShowDetail(false); setShowForm(false); }} />
        )}

        {/* Detail panel */}
        {showDetail && (
          <motion.div key="detail" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {detailLoading ? (
              <div className="fixed inset-y-0 right-0 w-full sm:w-[500px] z-50 flex items-center justify-center bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-1.5">
                  {[0, 0.15, 0.3].map((delay, i) => (
                    <motion.div key={i} className="w-2 h-2 rounded-full bg-brand-500"
                      animate={{ opacity: [0.3, 1, 0.3], y: [0, -5, 0] }}
                      transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut", delay }} />
                  ))}
                </div>
              </div>
            ) : selectedArea ? (
              <AreaDetailPanel
                key={selectedArea.id}
                area={selectedArea}
                isAdmin={isAdmin}
                onClose={() => setShowDetail(false)}
                onEdit={() => { setShowDetail(false); openEdit(selectedArea); }}
              />
            ) : null}
          </motion.div>
        )}

        {/* Form panel (ADMIN) */}
        {showForm && isAdmin && (
          <AreaFormPanel
            key="form"
            form={form}
            setForm={setForm}
            onSave={save}
            onCancel={() => { setShowForm(false); setEditing(null); }}
            editing={editing}
            users={users}
            isProcessing={isProcessing}
          />
        )}
      </AnimatePresence>

      <ConfirmModal
        {...confirmDialog}
        onClose={() => setConfirmDialog({ isOpen: false })}
      />

      <AnimatePresence>
        {isProcessing && (
          <motion.div
            key="areas-loader"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[80] flex flex-col items-center justify-center text-white"
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
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[90]" onClick={() => setErrorMsg("")} />
            <motion.div key="err-md"
              initial={{ opacity: 0, scale: 0.95, x: "-50%", y: "-50%" }}
              animate={{ opacity: 1, scale: 1, x: "-50%", y: "-50%" }}
              exit={{ opacity: 0, scale: 0.95, x: "-50%", y: "-50%" }}
              className="fixed left-1/2 top-1/2 w-[90%] max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl z-[90] overflow-hidden"
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
