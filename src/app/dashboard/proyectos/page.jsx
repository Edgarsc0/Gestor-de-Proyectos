// src/app/dashboard/proyectos/page.jsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import LoadingScreen from "@/components/LoadingScreen";
import Modal from "@/components/Modal";
import {
  ProgressBar,
  AvatarStack,
  ProjectStatusBadge,
  Avatar,
} from "@/components/Badges";
import Select from "@/components/Select";
import {
  Plus,
  FolderOpen,
  ArrowRight,
  Building2,
  UserCog,
  ChevronDown,
  Loader2,
} from "lucide-react";

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
  hidden: { opacity: 0, y: 20 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.04, duration: 0.25, ease: [0.16, 1, 0.3, 1] },
  }),
};

function ProjectCard({ project, index }) {
  const total = project.tasks?.length || 0;
  const done =
    project.tasks?.filter((t) => t.status === "COMPLETED").length || 0;
  const progress = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="show"
      custom={index}
      whileHover={{ y: -3, transition: { duration: 0.15 } }}
    >
      <Link
        href={`/dashboard/proyectos/${project.id}`}
        className="block card-hover p-5 group h-full"
      >
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

        <div className="space-y-1.5 mb-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">
              {done}/{total} tareas
            </span>
            <span className="font-semibold text-slate-600 dark:text-slate-400">
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
            <span className="text-xs text-slate-400">Sin miembros</span>
          )}
          <span className="text-[11px] font-medium flex items-center gap-1 text-slate-400 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
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
}

function AdminProjectCard({ project }) {
  return (
    <div className="border border-slate-100 dark:border-slate-800 rounded-xl p-5 flex flex-col h-full bg-white dark:bg-slate-900 shadow-sm hover:shadow-md hover:border-slate-200 dark:hover:border-slate-700 transition-all">
      <div className="flex items-start justify-between mb-4 gap-4">
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-slate-800 dark:text-slate-100 truncate text-base">
            {project.name}
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
            {project.description || "Sin descripción"}
          </p>
        </div>
        <ProjectStatusBadge status={project.status} />
      </div>

      <div className="flex-1 space-y-3 mt-2">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2">
          Avance por integrante
        </p>
        {project.assignments?.length > 0 ? (
          <div className="space-y-3.5 pt-1">
            {project.assignments.map(({ user }) => {
              const userTasks =
                project.tasks?.filter((t) => t.assigneeId === user.id) || [];
              const doneTasks = userTasks.filter(
                (t) => t.status === "COMPLETED",
              ).length;
              const progress =
                userTasks.length > 0
                  ? Math.round((doneTasks / userTasks.length) * 100)
                  : 0;

              return (
                <div key={user.id} className="flex items-center gap-3">
                  <Avatar
                    src={user?.image}
                    name={user?.name || user?.email}
                    size="sm"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1.5 text-xs">
                      <span className="font-medium text-slate-700 dark:text-slate-300 truncate">
                        {user?.name || user?.email}
                      </span>
                      <span className="text-slate-500 font-semibold">
                        {progress}%
                      </span>
                    </div>
                    <ProgressBar percent={progress} color={project.color} />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic py-2">
            No hay integrantes asignados.
          </p>
        )}
      </div>
    </div>
  );
}

export default function ProyectosPage() {
  const { data: session } = useSession();
  const [projects, setProjects] = useState([]);
  const [areas, setAreas] = useState([]);
  const [memberAreas, setMemberAreas] = useState([]); // áreas del MEMBER actual
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("areas"); // "areas" | "all"
  const [areaFilter, setAreaFilter] = useState("all");
  const [showCreate, setShowCreate] = useState(false);
  const [expandedAreaId, setExpandedAreaId] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    color: COLORS[0],
    areaId: "",
  });

  const fetchData = useCallback(async () => {
    const role = session?.user?.role;
    const areasUrl = role === "MEMBER" ? "/api/user/areas" : "/api/admin/areas";
    const [pr, ar] = await Promise.all([
      fetch("/api/projects"),
      fetch(areasUrl).catch(() => ({ json: () => [] })),
    ]);
    const pData = await pr.json();
    const aData = await ar.json().catch(() => []);
    setProjects(pData);
    if (role === "MEMBER") {
      setMemberAreas(Array.isArray(aData) ? aData : []);
    } else {
      setAreas(Array.isArray(aData) ? aData : []);
    }
    setLoading(false);
  }, [session?.user?.role]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Lógica de personalización por Rol
  const userRole = session?.user?.role || "MEMBER";
  const userId = session?.user?.id;
  const isAdminLike = userRole === "ADMIN" || userRole === "SUPERADMIN";

  const myArea = areas.find(
    (a) => a.titulares?.some(t => t.userId === userId || t.user?.id === userId),
  );

  // Pre-seleccionar el área del MEMBER al abrir el modal
  useEffect(() => {
    if (showCreate && userRole === "MEMBER" && memberAreas.length > 0) {
      setFormData((prev) => ({ ...prev, areaId: memberAreas[0].id }));
    }
  }, [showCreate, userRole, memberAreas]);

  const createProject = async () => {
    if (!formData.name.trim()) return;
    setIsProcessing(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, areaId: formData.areaId || null }),
      });
      if (!res.ok)
        throw new Error(
          (await res.json().catch(() => ({}))).error ||
            "Error al crear el proyecto.",
        );
      setFormData({ name: "", description: "", color: COLORS[0], areaId: "" });
      setShowCreate(false);
      fetchData();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // El backend ya filtra los proyectos según el rol (ADMIN ve todos, TITULAR/MEMBER ven los de su área o asignados).
  const myProjects = projects;

  // Filtered projects for "all" view
  const filtered =
    areaFilter === "all"
      ? myProjects
      : areaFilter === "none"
        ? myProjects.filter((p) => !p.areaId)
        : myProjects.filter((p) => p.areaId === areaFilter);

  // Construir los grupos de áreas dinámicamente
  const areaMap = new Map();
  areas.forEach((a) => {
    areaMap.set(a.id, {
      id: a.id,
      name: a.name,
      color: a.color,
      titular: a.titular,
      isArea: true,
      projects: [],
    });
  });
  myProjects.forEach((p) => {
    if (p.area && !areaMap.has(p.area.id)) {
      areaMap.set(p.area.id, {
        id: p.area.id,
        name: p.area.name,
        color: p.area.color,
        titular: null,
        isArea: true,
        projects: [],
      });
    }
    if (p.areaId && areaMap.has(p.areaId)) {
      areaMap.get(p.areaId).projects.push(p);
    }
  });

  const areaGroups = [
    ...Array.from(areaMap.values()),
    {
      id: "none",
      name: "Sin área",
      color: "#94a3b8",
      titular: null,
      isArea: false,
      projects: myProjects.filter((p) => !p.areaId),
    },
  ].filter((g) => (isAdminLike ? true : g.projects.length > 0));

  const filterAreas = areaGroups.filter((g) => g.isArea);

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="show"
        custom={0}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-slate-100">
            {isAdminLike
              ? "Visión Global de Proyectos"
              : userRole === "TITULAR"
                ? "Proyectos de tu Área"
                : "Mis Proyectos"}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            {userRole === "ADMIN"
              ? `${areas.length} área${areas.length !== 1 ? "s" : ""} · ${myProjects.length} proyecto${myProjects.length !== 1 ? "s" : ""} en total`
              : `${myProjects.length} proyecto${myProjects.length !== 1 ? "s" : ""} en curso`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          {!isAdminLike && (
            <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl mr-2">
              {[
                {
                  mode: "areas",
                  title: "Por área",
                  icon: <Building2 size={15} />,
                },
                { mode: "all", title: "Todos", icon: <FolderOpen size={15} /> },
              ].map(({ mode, title, icon }) => (
                <button
                  key={mode}
                  title={title}
                  onClick={() => setViewMode(mode)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-all ${
                    viewMode === mode
                      ? "bg-white dark:bg-slate-700 shadow-sm text-slate-800 dark:text-slate-200"
                      : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  }`}
                >
                  {icon}
                  <span className="hidden sm:inline">{title}</span>
                </button>
              ))}
            </div>
          )}
          {(isAdminLike || userRole === "TITULAR" || userRole === "MEMBER") && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                setFormData((f) => ({ ...f, areaId: myArea?.id || "" }));
                setShowCreate(true);
              }}
              className="btn-primary"
            >
              <Plus size={16} />
              Nuevo
            </motion.button>
          )}
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        {/* ─── VISTA ADMINISTRADOR / SUPERADMIN ─── */}
        {isAdminLike && (
          <motion.div
            key="admin-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="space-y-6"
          >
            {areaGroups.map((group, gi) => (
              <motion.div
                key={group.id}
                variants={fadeUp}
                initial="hidden"
                animate="show"
                custom={gi * 0.1}
                className="card overflow-hidden bg-slate-50/30 dark:bg-slate-900/20"
              >
                {/* Area Header */}
                <div
                  className="p-5 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer"
                  onClick={() =>
                    setExpandedAreaId(
                      expandedAreaId === group.id ? null : group.id,
                    )
                  }
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm text-white font-bold text-lg"
                      style={{ backgroundColor: group.color }}
                    >
                      {group.name.charAt(0)}
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-800 dark:text-white">
                        {group.name}
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {group.projects.length} proyecto
                        {group.projects.length !== 1 ? "s" : ""} activo
                        {group.projects.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                  {/* Titular Info */}
                  <div className="flex items-center gap-4">
                    {group.isArea && (
                      <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 px-4 py-2 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
                        <div className="text-right">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            Titular de Área
                          </p>
                          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            {group.titular?.name || "Sin asignar"}
                          </p>
                        </div>
                        {group.titular ? (
                          <Avatar
                            src={group.titular.image}
                            name={group.titular.name}
                            size="sm"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full border-2 border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center">
                            <UserCog size={14} className="text-slate-400" />
                          </div>
                        )}
                      </div>
                    )}
                    <motion.div
                      animate={{
                        rotate: expandedAreaId === group.id ? -180 : 0,
                      }}
                      transition={{ duration: 0.15 }}
                    >
                      <ChevronDown size={20} className="text-slate-400" />
                    </motion.div>
                  </div>
                </div>

                {/* Projects Grid */}
                <AnimatePresence>
                  {expandedAreaId === group.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="p-5">
                        {group.projects.length > 0 ? (
                          <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-4">
                            {group.projects.map((project) => (
                              <AdminProjectCard
                                key={project.id}
                                project={project}
                              />
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-10 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-xl">
                            <p className="text-slate-500 dark:text-slate-400 text-sm">
                              No hay proyectos activos en esta área.
                            </p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* ─── VISTA POR ÁREAS (Titular / Miembro) ─── */}
        {!isAdminLike && viewMode === "areas" && (
          <motion.div
            key="areas-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="space-y-8"
          >
            {areaGroups.length === 0 ? (
              <div className="card p-12 text-center">
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-1">
                  No hay proyectos todavía
                </p>
                <p className="text-slate-400 text-xs">
                  Crea tu primer proyecto para comenzar
                </p>
              </div>
            ) : (
              areaGroups.map((group, gi) => (
                <motion.section
                  key={group.id}
                  variants={fadeUp}
                  initial="hidden"
                  animate="show"
                  custom={gi * 0.1}
                >
                  {/* Section header */}
                  <div className="flex items-center gap-3 mb-4">
                    {group.isArea ? (
                      <Link
                        href={`/dashboard/areas/${group.id}`}
                        className="flex items-center gap-2.5 group/link flex-shrink-0"
                      >
                        <div
                          className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow"
                          style={{ backgroundColor: group.color }}
                        >
                          {group.name.charAt(0)}
                        </div>
                        <span className="font-semibold text-slate-800 dark:text-slate-200 group-hover/link:text-brand-600 dark:group-hover/link:text-brand-400 transition-colors">
                          {group.name}
                        </span>
                        <ArrowRight
                          size={13}
                          className="text-slate-300 group-hover/link:text-brand-500 transition-colors"
                        />
                      </Link>
                    ) : (
                      <div className="flex items-center gap-2.5 flex-shrink-0">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-600" />
                        <span className="font-semibold text-slate-500 dark:text-slate-400">
                          Sin área
                        </span>
                      </div>
                    )}
                    <span className="text-xs text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full flex-shrink-0">
                      {group.projects.length}
                    </span>
                    <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
                  </div>

                  {/* Projects grid */}
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {group.projects.map((project, pi) => (
                      <ProjectCard
                        key={project.id}
                        project={project}
                        index={gi * 0.1 + pi * 0.06}
                      />
                    ))}
                  </div>
                </motion.section>
              ))
            )}
          </motion.div>
        )}

        {/* ─── VISTA TODOS ─── */}
        {!isAdminLike && viewMode === "all" && (
          <motion.div
            key="all-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="space-y-4"
          >
            {/* Area filter pills */}
            {filterAreas.length > 0 && (
              <motion.div
                variants={fadeUp}
                initial="hidden"
                animate="show"
                custom={0}
                className="flex gap-2 flex-wrap"
              >
                {[
                  { id: "all", name: "Todos" },
                  { id: "none", name: "Sin área" },
                  ...filterAreas,
                ].map((a) => (
                  <button
                    key={a.id}
                    onClick={() => setAreaFilter(a.id)}
                    className={`text-xs px-4 py-1.5 rounded-full border transition-all font-medium ${
                      areaFilter === a.id
                        ? "text-white border-transparent shadow-sm"
                        : "border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-300"
                    }`}
                    style={
                      areaFilter === a.id && a.color
                        ? { background: a.color }
                        : areaFilter === a.id
                          ? { background: "#8B1515" }
                          : {}
                    }
                  >
                    {a.name}
                  </button>
                ))}
              </motion.div>
            )}

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map((project, i) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  index={i * 0.06}
                />
              ))}
              {filtered.length === 0 && (
                <div className="col-span-full card p-12 text-center">
                  <p className="text-slate-500 dark:text-slate-400 text-sm">
                    No hay proyectos en este filtro
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Processing overlay */}
      <AnimatePresence>
        {isProcessing && (
          <motion.div
            key="proj-loader"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex flex-col items-center justify-center text-white"
          >
            <Loader2 size={48} className="animate-spin text-brand-500 mb-4" />
            <p className="text-lg font-semibold">Creando proyecto...</p>
            <p className="text-sm text-slate-300">
              Por favor, espera un momento
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error modal */}
      <AnimatePresence>
        {errorMsg && (
          <>
            <motion.div
              key="err-bd"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[110]"
              onClick={() => setErrorMsg("")}
            />
            <motion.div
              key="err-md"
              initial={{ opacity: 0, scale: 0.95, x: "-50%", y: "-50%" }}
              animate={{ opacity: 1, scale: 1, x: "-50%", y: "-50%" }}
              exit={{ opacity: 0, scale: 0.95, x: "-50%", y: "-50%" }}
              className="fixed left-1/2 top-1/2 w-[90%] max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl z-[110] overflow-hidden"
            >
              <div className="p-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                  Atención
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {errorMsg}
                </p>
              </div>
              <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 flex justify-end">
                <button
                  onClick={() => setErrorMsg("")}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors"
                >
                  Aceptar
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Create Project Modal */}
      <Modal
        open={showCreate}
        onClose={() => !isProcessing && setShowCreate(false)}
        title="Nuevo proyecto"
      >
        <div className="space-y-4">
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
          {(areas.length > 0 || memberAreas.length > 0) && (
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
                Área
              </label>
              {userRole === "TITULAR" ? (
                <div className="input-field flex items-center gap-2 cursor-not-allowed opacity-70">
                  {myArea?.color && (
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: myArea.color }} />
                  )}
                  <span className="text-sm text-slate-700 dark:text-slate-300">{myArea?.name || "Sin área"}</span>
                </div>
              ) : userRole === "MEMBER" ? (
                memberAreas.length === 1 ? (
                  <div className="input-field flex items-center gap-2 cursor-not-allowed opacity-70">
                    {memberAreas[0]?.color && (
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: memberAreas[0].color }} />
                    )}
                    <span className="text-sm text-slate-700 dark:text-slate-300">{memberAreas[0]?.name || "Sin área"}</span>
                  </div>
                ) : (
                  <Select
                    value={formData.areaId}
                    onChange={(v) => setFormData({ ...formData, areaId: v })}
                    placeholder="Seleccionar área"
                    options={memberAreas.map((a) => ({ value: a.id, label: a.name, color: a.color }))}
                  />
                )
              ) : (
                <Select
                  value={formData.areaId}
                  onChange={(v) => setFormData({ ...formData, areaId: v })}
                  placeholder="Sin área"
                  options={[
                    { value: "", label: "Sin área" },
                    ...areas.map((a) => ({ value: a.id, label: a.name, color: a.color })),
                  ]}
                />
              )}
            </div>
          )}
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
              disabled={isProcessing}
            >
              Cancelar
            </button>
            <button
              onClick={createProject}
              disabled={isProcessing || !formData.name.trim()}
              className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 size={15} className="animate-spin" /> Creando...
                </>
              ) : (
                "Crear proyecto"
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
