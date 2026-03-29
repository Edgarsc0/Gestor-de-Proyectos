// src/app/dashboard/equipo/page.jsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import LoadingScreen from "@/components/LoadingScreen";
import { Avatar, StatusBadge, PriorityBadge } from "@/components/Badges";
import Modal from "@/components/Modal";
import { Plus, Loader2 } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.04, duration: 0.25, ease: [0.16, 1, 0.3, 1] },
  }),
};

export default function EquipoPage() {
  const { data: session } = useSession();
  const isTitular = session?.user?.role === "TITULAR";

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedMember, setExpandedMember] = useState(null);
  const [filter, setFilter] = useState("all");
  
  const [addMemberModal, setAddMemberModal] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const fetchData = useCallback(async () => {
    const res = await fetch("/api/members");
    const data = await res.json();
    setMembers(data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) {
    return (
      <LoadingScreen />
    );
  }

  const getActiveTasks = (m) => m.createdTasks?.filter((t) => t.status !== "COMPLETED") || [];
  
  const teamMembers = members.filter(m => m.role !== "ADMIN" && m.role !== "SUPERADMIN");
  
  const filteredMembers = teamMembers.filter((m) => {
    if (filter === "active") return getActiveTasks(m).length > 0;
    if (filter === "idle") return getActiveTasks(m).length === 0;
    return true;
  });

  const handleAddMember = async () => {
    if (!newMemberEmail.trim()) return;
    setIsProcessing(true);
    try {
      const res = await fetch("/api/dashboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newMemberEmail.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Error al agregar integrante.");
      
      setAddMemberModal(false);
      setNewMemberEmail("");
      setSuccessMsg(json.message || "Usuario agregado correctamente.");
      fetchData(); // Recargamos la lista
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div variants={fadeUp} initial="hidden" animate="show" custom={0} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-slate-100">Equipo</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Revisa qué hace cada miembro y en qué proyectos participa</p>
        </div>
        <div className="flex gap-2 items-center flex-wrap sm:flex-nowrap">
          {isTitular && (
            <button onClick={() => setAddMemberModal(true)} className="btn-primary text-xs py-2 px-3 sm:px-4 shadow-sm sm:mr-2 flex-shrink-0">
               <Plus size={14} className="mr-1" /> Añadir Integrante
            </button>
          )}
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
              {f === "all" && ` (${teamMembers.length})`}
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
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">{member.name || "Sin nombre"}</h3>
                    <span className="text-xs text-slate-400">{member.email}</span>
                  </div>

                  {member.assignments?.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {member.assignments.slice(0, 4).map((a) => (
                        <span
                          key={a.project.id}
                          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                        >
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: a.project.color }} />
                          <span className="truncate max-w-[120px]">{a.project.name}</span>
                        </span>
                      ))}
                      {member.assignments.length > 4 && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-500">
                          +{member.assignments.length - 4}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-[11px] text-slate-400 italic">No asignado a proyectos</span>
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
                    transition={{ duration: 0.15 }}
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
                    transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
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
                              transition={{ delay: ti * 0.02, duration: 0.15 }}
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

      <Modal open={addMemberModal} onClose={() => setAddMemberModal(false)} title="Añadir Integrante al Área">
        <div className="space-y-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Ingresa el correo del usuario. Si ya está registrado, se unirá inmediatamente a tu área. Si no, se le dará permiso de acceso.
          </p>
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Correo electrónico</label>
            <input
              type="email"
              className="input-field"
              placeholder="correo@ejemplo.com"
              value={newMemberEmail}
              onChange={(e) => setNewMemberEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddMember()}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setAddMemberModal(false)} className="btn-secondary flex-1">Cancelar</button>
            <button onClick={handleAddMember} disabled={!newMemberEmail} className="btn-primary flex-1 disabled:opacity-50">Agregar</button>
          </div>
        </div>
      </Modal>

      <ActionOverlay
        isProcessing={isProcessing}
        errorMsg={errorMsg}
        onErrorClose={() => setErrorMsg("")}
        successMsg={successMsg}
        onSuccessClose={() => { setSuccessMsg(""); }}
      />
    </div>
  );
}

function ActionOverlay({ isProcessing, errorMsg, onErrorClose, successMsg, onSuccessClose }) {
  return (
    <>
      <AnimatePresence>
        {isProcessing && (
          <motion.div
            key="action-loader"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex flex-col items-center justify-center text-white"
          >
            <Loader2 size={48} className="animate-spin text-brand-500 mb-4" />
            <p className="text-lg font-semibold">Procesando...</p>
          </motion.div>
        )}
      </AnimatePresence>
      <ConfirmModal
        isOpen={!!errorMsg}
        onClose={onErrorClose}
        onConfirm={onErrorClose}
        title="Atención"
        message={errorMsg}
        confirmText="Aceptar"
        isDanger={true}
        showCancel={false}
      />
      <ConfirmModal
        isOpen={!!successMsg}
        onClose={onSuccessClose}
        onConfirm={onSuccessClose}
        title="Éxito"
        message={successMsg}
        confirmText="Continuar"
        isDanger={false}
        showCancel={false}
      />
    </>
  );
}

function ConfirmModal({ isOpen, onClose, onConfirm, title, message, confirmText = "Confirmar", isDanger = true, showCancel = true }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="confirm-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[120]"
            onClick={onClose}
          />
          <motion.div
            key="confirm-modal"
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
              {showCancel && (
                <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                  Cancelar
                </button>
              )}
              <button onClick={() => { onConfirm(); onClose(); }} className={`px-4 py-2 text-sm font-medium text-white rounded-xl transition-colors ${isDanger ? 'bg-red-600 hover:bg-red-700' : 'bg-brand-600 hover:bg-brand-700'}`}>
                {confirmText}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
