// src/app/dashboard/areas/[id]/page.jsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import LoadingScreen from "@/components/LoadingScreen";
import {
  ProgressBar,
  AvatarStack,
  ProjectStatusBadge,
  Avatar,
} from "@/components/Badges";
import Modal from "@/components/Modal";
import Select from "@/components/Select";
import {
  ChevronRight,
  FolderOpen,
  CheckSquare,
  Users,
  Plus,
  Building2,
  Crown,
  ArrowRight,
  UserPlus,
  Trash2,
  Loader2,
} from "lucide-react";
import { useSession } from "next-auth/react";

const COLORS = [
  "#8B1515",
  "#A31B1B",
  "#1D4ED8",
  "#0F766E",
  "#6D28D9",
  "#B45309",
  "#065F46",
  "#9D174D",
];

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.38, ease: [0.16, 1, 0.3, 1] },
  }),
};

const STATUS_LABELS = {
  ACTIVE: "Activo",
  PAUSED: "Pausado",
  COMPLETED: "Completado",
  ARCHIVED: "Archivado",
};

export default function AreaDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { data: session } = useSession();

  const [area, setArea] = useState(null);
  const [loading, setLoading] = useState(true);

  // Create project modal
  const [showCreate, setShowCreate] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    color: COLORS[0],
  });
  const [creating, setCreating] = useState(false);

  // Add member modal
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [addingMember, setAddingMember] = useState(false);
  const [error, setError] = useState("");

  const fetchArea = useCallback(async () => {
    const res = await fetch(`/api/areas/${id}`);
    if (!res.ok) {
      router.push("/dashboard/areas");
      return;
    }
    const data = await res.json();
    setArea(data);
    setLoading(false);
  }, [id, router]);

  useEffect(() => {
    fetchArea();
  }, [fetchArea]);

  const createProject = async () => {
    if (!formData.name.trim()) return;
    setCreating(true);
    await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...formData, areaId: id }),
    });
    setFormData({ name: "", description: "", color: COLORS[0] });
    setShowCreate(false);
    setCreating(false);
    fetchArea();
  };

  const addMember = async () => {
    if (!newMemberEmail.trim()) return;
    setAddingMember(true);
    setError("");
    try {
      const res = await fetch(`/api/areas/${id}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newMemberEmail.trim() }),
      });
      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || "No se pudo agregar al miembro.");
      }
      setNewMemberEmail("");
      setShowAddMember(false);
      fetchArea(); // Refresh data
    } catch (err) {
      setError(err.message);
    } finally {
      setAddingMember(false);
    }
  };

  const getProgress = (p) => {
    const total = p.tasks?.length || 0;
    const done = p.tasks?.filter((t) => t.status === "COMPLETED").length || 0;
    return total > 0 ? Math.round((done / total) * 100) : 0;
  };

  if (loading) {
    return <LoadingScreen />;
  }

  if (!area) return null;

  const totalProjects = area.projects?.length || 0;
  const totalTasks =
    area.projects?.reduce((s, p) => s + (p.tasks?.length || 0), 0) || 0;
  const completedTasks =
    area.projects?.reduce(
      (s, p) =>
        s + (p.tasks?.filter((t) => t.status === "COMPLETED").length || 0),
      0,
    ) || 0;
  const inProgressTasks =
    area.projects?.reduce(
      (s, p) =>
        s + (p.tasks?.filter((t) => t.status === "IN_PROGRESS").length || 0),
      0,
    ) || 0;
  const overallProgress =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const memberMap = new Map();
  area.projects?.forEach((p) => {
    p.assignments?.forEach((a) => {
      if (a.user && !memberMap.has(a.user.id)) memberMap.set(a.user.id, a.user);
    });
  });
  const projectMembers = Array.from(memberMap.values());

  // Unique members from the area's user list
  const areaMembers = area.users?.map((u) => u.user) || [];

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="show"
        custom={0}
        className="flex items-center gap-2 text-sm"
      >
        <Link
          href="/dashboard/areas"
          className="text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors flex items-center gap-1"
        >
          <Building2 size={14} />
          Áreas
        </Link>
        <ChevronRight size={14} className="text-slate-300" />
        <span className="text-slate-700 dark:text-slate-300 font-medium truncate">
          {area.name}
        </span>
      </motion.div>

      {/* Area Header Card */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="show"
        custom={1}
        className="card overflow-hidden relative"
      >
        {/* Color stripe */}
        <div className="h-2" style={{ backgroundColor: area.color }} />

        <div className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-start gap-5">
            {/* Icon */}
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-display font-bold text-3xl flex-shrink-0 shadow-xl"
              style={{
                backgroundColor: area.color,
                boxShadow: `0 8px 24px ${area.color}50`,
              }}
            >
              {area.name.charAt(0)}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-3 mb-1">
                <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {area.name}
                </h1>
                <span
                  className="text-xs font-semibold px-2.5 py-1 rounded-full text-white"
                  style={{ backgroundColor: area.color }}
                >
                  Área institucional
                </span>
              </div>
              {area.description && (
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">
                  {area.description}
                </p>
              )}

              {/* Stats */}
              <div className="flex flex-wrap items-center gap-6 mb-4">
                <div className="text-center">
                  <p className="text-xl font-bold text-slate-900 dark:text-slate-100">
                    {totalProjects}
                  </p>
                  <p className="text-xs text-slate-400">Proyectos</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-slate-900 dark:text-slate-100">
                    {totalTasks}
                  </p>
                  <p className="text-xs text-slate-400">Tareas</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-emerald-600">
                    {completedTasks}
                  </p>
                  <p className="text-xs text-slate-400">Completadas</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-blue-600">
                    {inProgressTasks}
                  </p>
                  <p className="text-xs text-slate-400">En progreso</p>
                </div>
                {projectMembers.length > 0 && (
                  <AvatarStack users={projectMembers} max={6} />
                )}
              </div>

              {/* Progress */}
              <div className="max-w-sm">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-slate-500">Progreso general</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {overallProgress}%
                  </span>
                </div>
                <ProgressBar percent={overallProgress} color={area.color} />
              </div>
            </div>
          </div>

          {/* Titulares row */}
          {area.titulares?.length > 0 && (
            <div className="mt-5 pt-5 border-t border-slate-100 dark:border-slate-700/60 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Crown size={13} />
                <span>Titular{area.titulares.length !== 1 ? "es" : ""}</span>
              </div>
              {area.titulares.map((t) => (
                <div key={t.userId} className="flex items-center gap-2">
                  <Avatar src={t.user?.image} name={t.user?.name} size="xs" />
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {t.user?.name || t.user?.email}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* Projects section */}
      <motion.div variants={fadeUp} initial="hidden" animate="show" custom={2}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold text-slate-900 dark:text-slate-100">
              Proyectos del área
            </h2>
            <p className="text-sm text-slate-400 mt-0.5">
              {totalProjects} proyecto{totalProjects !== 1 ? "s" : ""}
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowCreate(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={15} />
            Nuevo proyecto
          </motion.button>
        </div>

        {totalProjects === 0 ? (
          <div className="card p-12 text-center">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: `${area.color}20` }}
            >
              <FolderOpen size={24} style={{ color: area.color }} />
            </div>
            <p className="font-medium text-slate-600 dark:text-slate-400">
              Sin proyectos en esta área
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Crea el primer proyecto para comenzar
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {area.projects.map((project, i) => {
              const progress = getProgress(project);
              const totalT = project.tasks?.length || 0;
              const doneT =
                project.tasks?.filter((t) => t.status === "COMPLETED").length ||
                0;

              return (
                <motion.div
                  key={project.id}
                  variants={fadeUp}
                  initial="hidden"
                  animate="show"
                  custom={i * 0.08}
                  whileHover={{ y: -3, transition: { duration: 0.2 } }}
                >
                  <Link
                    href={`/dashboard/proyectos/${project.id}`}
                    className="block card-hover p-5 group h-full"
                  >
                    {/* Color accent */}
                    <div
                      className="h-1 rounded-full mb-4 -mx-1"
                      style={{ backgroundColor: project.color }}
                    />

                    <div className="flex items-start gap-3 mb-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-base flex-shrink-0 shadow"
                        style={{
                          backgroundColor: project.color,
                          boxShadow: `0 3px 10px ${project.color}50`,
                        }}
                      >
                        {project.name.charAt(0)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-slate-900 dark:text-slate-100 truncate group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors text-sm">
                          {project.name}
                        </h3>
                        <div className="mt-1">
                          <ProjectStatusBadge status={project.status} />
                        </div>
                      </div>
                    </div>

                    {project.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 line-clamp-2">
                        {project.description}
                      </p>
                    )}

                    <div className="space-y-2 mb-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">
                          {doneT} de {totalT} tareas
                        </span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {progress}%
                        </span>
                      </div>
                      <ProgressBar percent={progress} color={project.color} />
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-700/60">
                      {project.assignments?.length > 0 ? (
                        <AvatarStack
                          users={project.assignments.map((a) => a.user)}
                          max={4}
                        />
                      ) : (
                        <span className="text-xs text-slate-400">
                          Sin miembros
                        </span>
                      )}
                      <span
                        className="text-[11px] font-medium flex items-center gap-1 transition-colors"
                        style={{ color: project.color }}
                      >
                        Ver tablero
                        <ArrowRight
                          size={11}
                          className="transition-transform group-hover:translate-x-0.5"
                        />
                      </span>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* Members section */}
      <motion.div variants={fadeUp} initial="hidden" animate="show" custom={3}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold text-slate-900 dark:text-slate-100">
              Miembros del área
            </h2>
            <p className="text-sm text-slate-400 mt-0.5">
              {areaMembers.length} miembro{areaMembers.length !== 1 ? "s" : ""}
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowAddMember(true)}
            className="btn-secondary flex items-center gap-2"
          >
            <UserPlus size={15} />
            Añadir miembro
          </motion.button>
        </div>
        {areaMembers.length === 0 ? (
          <div className="card p-12 text-center">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: `${area.color}20` }}
            >
              <Users size={24} style={{ color: area.color }} />
            </div>
            <p className="font-medium text-slate-600 dark:text-slate-400">
              Sin miembros en esta área
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Añade miembros para que puedan colaborar en los proyectos.
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {areaMembers.map((user, i) => {
              const userProjectCount =
                area.projects?.filter((p) =>
                  p.assignments?.some((a) => a.userId === user.id),
                ).length || 0;
              const isTitular = area.titulares?.some(
                (t) => t.user?.id === user.id || t.userId === user.id,
              );
              return (
                <motion.div
                  key={user.id}
                  variants={fadeUp}
                  initial="hidden"
                  animate="show"
                  custom={i * 0.06}
                  className="card p-4 flex items-center gap-3"
                >
                  <Avatar src={user.image} name={user.name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                      {user.name || "Sin nombre"}
                    </p>
                    <p className="text-xs text-slate-400 truncate">
                      {user.email}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    {isTitular && (
                      <span
                        className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full text-white"
                        style={{ backgroundColor: area.color }}
                      >
                        Titular
                      </span>
                    )}
                    <span className="text-[11px] text-slate-400">
                      {userProjectCount} proyecto
                      {userProjectCount !== 1 ? "s" : ""}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* Create Project Modal */}
      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="Nuevo proyecto"
      >
        <div className="space-y-4">
          {/* Area badge */}
          <div
            className="flex items-center gap-2 p-3 rounded-xl text-sm"
            style={{
              backgroundColor: `${area.color}15`,
              border: `1px solid ${area.color}30`,
            }}
          >
            <span
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: area.color }}
            />
            <span className="font-medium" style={{ color: area.color }}>
              Área: {area.name}
            </span>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
              Nombre del proyecto
            </label>
            <input
              className="input-field"
              placeholder="Ej: Rediseño del portal web"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              onKeyDown={(e) => e.key === "Enter" && createProject()}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
              Descripción (opcional)
            </label>
            <textarea
              className="input-field resize-none h-20"
              placeholder="¿De qué trata este proyecto?"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
              Color
            </label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map((c) => (
                <motion.button
                  key={c}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setFormData({ ...formData, color: c })}
                  className="w-8 h-8 rounded-lg transition-all"
                  style={{
                    backgroundColor: c,
                    outline: formData.color === c ? `2px solid ${c}` : "none",
                    outlineOffset: "3px",
                  }}
                />
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setShowCreate(false)}
              className="btn-secondary flex-1"
            >
              Cancelar
            </button>
            <button
              onClick={createProject}
              disabled={creating}
              className="btn-primary flex-1"
            >
              {creating ? "Creando…" : "Crear proyecto"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Add Member Modal */}
      <Modal
        open={showAddMember}
        onClose={() => {
          setShowAddMember(false);
          setError("");
        }}
        title="Añadir Miembro al Área"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Ingresa el correo del usuario. Si ya está registrado, se unirá
            inmediatamente a esta área. Si no, se le dará permiso de acceso.
          </p>
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
              Correo electrónico
            </label>
            <input
              type="email"
              className="input-field"
              placeholder="correo@ejemplo.com"
              value={newMemberEmail}
              onChange={(e) => setNewMemberEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addMember()}
            />
          </div>
          {error && (
            <p className="text-sm text-red-600 dark:text-red-500">{error}</p>
          )}
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => {
                setShowAddMember(false);
                setError("");
              }}
              className="btn-secondary flex-1"
            >
              Cancelar
            </button>
            <button
              onClick={addMember}
              disabled={addingMember || !newMemberEmail.trim()}
              className="btn-primary flex-1 disabled:opacity-50"
            >
              {addingMember ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 size={16} className="animate-spin" />
                  Añadiendo...
                </span>
              ) : (
                "Añadir miembro"
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
