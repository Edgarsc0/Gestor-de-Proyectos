// src/app/dashboard/page.jsx
"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import LoadingScreen from "@/components/LoadingScreen";
import {
  StatusBadge,
  ProgressBar,
  Avatar,
  AvatarStack,
} from "@/components/Badges";
import Modal from "@/components/Modal";
import { Plus, Loader2 } from "lucide-react";
import Link from "next/link";

// Animated counter hook
function useCounter(target, duration = 600) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (target === 0) return;
    let start = 0;
    const steps = 40;
    const increment = target / steps;
    const stepTime = duration / steps;
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setValue(target);
        clearInterval(timer);
      } else setValue(Math.floor(start));
    }, stepTime);
    return () => clearInterval(timer);
  }, [target, duration]);
  return value;
}

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.04, duration: 0.25, ease: [0.16, 1, 0.3, 1] },
  }),
};

const STAT_STYLES = {
  brand: {
    bar: "bg-brand-500",
    icon: "bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400",
    num: "text-brand-700 dark:text-brand-300",
  },
  emerald: {
    bar: "bg-emerald-500",
    icon: "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400",
    num: "text-emerald-700 dark:text-emerald-300",
  },
  amber: {
    bar: "bg-amber-500",
    icon: "bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400",
    num: "text-amber-700 dark:text-amber-300",
  },
  violet: {
    bar: "bg-violet-500",
    icon: "bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400",
    num: "text-violet-700 dark:text-violet-300",
  },
};

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [data, setData] = useState(null);
  const [adminData, setAdminData] = useState({
    areas: [],
    users: [],
    projects: [],
  });
  const [loading, setLoading] = useState(true);

  // Modal de KPIs
  const [kpiModal, setKpiModal] = useState({
    open: false,
    title: "",
    type: null,
  });

  // Modales de Titular
  const [addMemberModal, setAddMemberModal] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [assignProjectModal, setAssignProjectModal] = useState({
    open: false,
    member: null,
  });
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const isAdmin =
    session?.user?.role === "ADMIN" || session?.user?.role === "SUPERADMIN";
  const isTitular = session?.user?.role === "TITULAR";
  const isMember = session?.user?.role === "MEMBER";

  const loadData = useCallback(() => {
    if (!session) return;
    const fetchDashboard = fetch("/api/dashboard").then((r) => r.json());
    if (session.user.role === "ADMIN" || session.user.role === "SUPERADMIN") {
      Promise.all([
        fetchDashboard,
        fetch("/api/admin/areas").then((r) => r.json().catch(() => [])),
        fetch("/api/admin/users").then((r) => r.json().catch(() => [])),
        fetch("/api/projects").then((r) => r.json().catch(() => [])),
      ]).then(([dash, a, u, p]) => {
        setData(dash);
        setAdminData({
          areas: Array.isArray(a) ? a : [],
          users: Array.isArray(u) ? u : [],
          projects: Array.isArray(p) ? p : [],
        });
        setLoading(false);
      });
    } else {
      fetchDashboard.then(setData).finally(() => setLoading(false));
    }
  }, [session]);

  useEffect(() => {
    if (status === "loading") return;
    loadData();
  }, [session, status, loadData]);

  // Refrescar al volver a la pestaña
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible") loadData();
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibility);
  }, [loadData]);

  if (loading || status === "loading") {
    return <LoadingScreen />;
  }

  if (!data) return null;
  const { stats, recentTasks, projects, members } = data;

  // Cross-populate y asignación automática por Área
  if (projects && members) {
    projects.forEach((p) => {
      if (!p.assignments) p.assignments = [];

      members.forEach((m) => {
        const isInArea =
          p.areaId &&
          m.areas?.some(
            (a) => a.areaId === p.areaId || a.area?.id === p.areaId,
          );

        // Si el proyecto tiene área y el usuario pertenece a ella, se asigna automáticamente
        if (isInArea) {
          if (
            !p.assignments.some(
              (a) =>
                a.userId === m.id ||
                a.user?.id === m.id ||
                a.user?.email === m.email,
            )
          ) {
            p.assignments.push({
              id: `virtual-${m.id}-${p.id}`,
              role: m.role === "TITULAR" ? "Titular" : "Colaborador",
              user: m,
              userId: m.id,
              projectId: p.id,
            });
          }
        }
      });

      // Asegurar referencias cruzadas para asignaciones
      p.assignments.forEach((a) => {
        const uid = a.userId || a.user?.id;
        const member = members.find(
          (m) => m.id === uid || m.email === a.user?.email,
        );

        if (member) {
          if (!a.user) a.user = member;

          if (!member.assignments) member.assignments = [];
          if (
            !member.assignments.some(
              (ma) => ma.projectId === p.id || ma.project?.id === p.id,
            )
          ) {
            member.assignments.push({
              id: a.id || `assign-${uid}-${p.id}`,
              role: a.role || "Colaborador",
              project: p,
              projectId: p.id,
              userId: uid,
            });
          }
        }
      });
    });
  }

  // Filtramos los proyectos del miembro actual para su vista personal
  const myProjects = isMember
    ? projects?.filter((p) =>
        p.assignments?.some(
          (a) =>
            a.userId === session?.user?.id ||
            a.user?.id === session?.user?.id ||
            a.user?.email === session?.user?.email,
        ),
      ) || []
    : projects || [];

  // Filtramos a los administradores para que no salgan en las listas operativas del equipo
  const teamMembers =
    members?.filter((m) => m.role !== "ADMIN" && m.role !== "SUPERADMIN") || [];
  const membersInProjects = teamMembers.filter(
    (m) => m.assignments?.length > 0,
  ).length;

  const openKpi = (title, type) => {
    setKpiModal({ open: true, title, type });
  };

  const getModalContent = () => {
    if (!data) return null;

    // Modal: Proyectos Activos
    if (kpiModal.type === "PROJECTS") {
      const displayProjects = isMember ? myProjects : projects;
      return (
        <div className="space-y-3">
          {displayProjects.map((p) => (
            <Link
              href={`/dashboard/proyectos/${p.id}`}
              key={p.id}
              onClick={() => setKpiModal({ ...kpiModal, open: false })}
              className="flex items-center gap-4 p-3 card hover:shadow-md transition-all border border-slate-100 dark:border-slate-800/60"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-sm flex-shrink-0"
                style={{ backgroundColor: p.color }}
              >
                {p.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                  {p.name}
                </p>
                <div className="flex items-center gap-2 mt-1.5">
                  <div className="flex-1 max-w-[120px]">
                    <ProgressBar percent={p.progress} color={p.color} />
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium tabular-nums">
                    {p.progress}%
                  </span>
                </div>
              </div>
              <div className="text-slate-300 dark:text-slate-600">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </div>
            </Link>
          ))}
        </div>
      );
    }

    // Modal: Tareas (Completadas o En Progreso)
    if (
      kpiModal.type === "COMPLETED_TASKS" ||
      kpiModal.type === "PROGRESS_TASKS"
    ) {
      const taskMap = new Map();
      recentTasks?.forEach((t) => taskMap.set(t.id, t));
      teamMembers?.forEach((m) => {
        m.createdTasks?.forEach((t) =>
          taskMap.set(t.id, { ...t, assignee: m }),
        );
      });
      let tasks = Array.from(taskMap.values());

      if (kpiModal.type === "COMPLETED_TASKS") {
        tasks = tasks.filter((t) => t.status === "COMPLETED");
      } else {
        tasks = tasks.filter((t) => t.status !== "COMPLETED");
      }

      if (tasks.length === 0) {
        return (
          <div className="text-center py-8">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              No hay tareas en esta categoría actualmente.
            </p>
          </div>
        );
      }

      return (
        <div className="space-y-3">
          {tasks.map((t) => (
            <div
              key={t.id}
              className="flex items-center gap-3 p-3 card border border-slate-100 dark:border-slate-800/60"
            >
              <StatusBadge status={t.status} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">
                  {t.title}
                </p>
                <p className="text-[10px] text-slate-400 truncate mt-0.5">
                  {t.project?.name || "Sin proyecto"}
                </p>
              </div>
              {t.assignee && (
                <Avatar
                  src={t.assignee.image}
                  name={t.assignee.name}
                  size="xs"
                />
              )}
            </div>
          ))}
          <div className="pt-3 pb-1 text-center">
            <Link
              href="/dashboard/tareas"
              onClick={() => setKpiModal({ ...kpiModal, open: false })}
              className="text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 hover:underline"
            >
              Ver el tablero completo de tareas
            </Link>
          </div>
        </div>
      );
    }

    return null;
  };

  // Acciones de Titular
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
      if (!res.ok)
        throw new Error(json.error || "Error al agregar integrante.");

      setAddMemberModal(false);
      setNewMemberEmail("");
      setSuccessMsg(json.message || "Usuario agregado correctamente.");
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAssignProject = async () => {
    if (!selectedProjectId) return;
    setIsProcessing(true);
    try {
      const res = await fetch("/api/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: assignProjectModal.member.id,
          projectId: selectedProjectId,
        }),
      });
      if (!res.ok)
        throw new Error(
          (await res.json().catch(() => ({}))).error ||
            "Error al asignar al proyecto.",
        );
      setAssignProjectModal({ open: false, member: null });
      setSelectedProjectId("");
      setSuccessMsg("Miembro asignado al proyecto correctamente.");
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="show"
        custom={0}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <p className="text-xs font-semibold text-brand-600 dark:text-brand-400 uppercase tracking-widest mb-1">
            {isAdmin ? "Panel general" : isTitular ? "Tu área" : "Mi espacio"}
          </p>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-slate-100 leading-tight">
            Bienvenido, {session?.user?.name?.split(" ")[0]}
          </h1>
          <p className="text-slate-400 dark:text-slate-500 text-sm mt-0.5">
            {isAdmin
              ? "Visión general de todas las áreas de la institución."
              : isTitular
                ? "Métricas y resumen de actividad de tu área."
                : "Tus proyectos y tareas asignadas."}
          </p>
        </div>
        <div className="text-xs text-slate-400 dark:text-slate-500 sm:text-right flex-shrink-0">
          <p className="font-medium text-slate-600 dark:text-slate-400">
            {new Date().toLocaleDateString("es-MX", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </p>
        </div>
      </motion.div>

      {/* Stats Grid */}
      {!isAdmin && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label={
              isTitular
                ? "Proyectos del área"
                : isMember
                  ? "Mis proyectos"
                  : "Proyectos activos"
            }
            value={isMember ? myProjects.length : stats.activeProjects}
            sub={
              isMember ? "asignados a mí" : `de ${stats.totalProjects} totales`
            }
            icon={
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7-6H4a2 2 0 0 0-2 2v16z" />
                <path d="M14 2v6h6" />
              </svg>
            }
            color="brand"
            index={0}
            onClick={() =>
              openKpi(
                isTitular
                  ? "Proyectos del área"
                  : isMember
                    ? "Mis proyectos"
                    : "Proyectos activos",
                "PROJECTS",
              )
            }
          />
          <StatCard
            label={isMember ? "Mis tareas completadas" : "Tareas completadas"}
            value={stats.completedTasks}
            sub={`${stats.completionRate}% de avance`}
            icon={
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M9 11l3 3L22 4" />
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
              </svg>
            }
            color="emerald"
            index={1}
            onClick={() =>
              openKpi(
                isMember ? "Mis tareas completadas" : "Tareas completadas",
                "COMPLETED_TASKS",
              )
            }
          />
          <StatCard
            label={isTitular ? "Tareas en progreso" : "En progreso"}
            value={stats.inProgressTasks}
            sub={`${stats.pendingTasks} pendientes`}
            icon={
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            }
            color="amber"
            index={2}
            onClick={() =>
              openKpi(
                isTitular ? "Tareas en progreso" : "En progreso",
                "PROGRESS_TASKS",
              )
            }
          />
          <StatCard
            label={
              isTitular || isMember
                ? "Integrantes del área"
                : "Total de miembros"
            }
            value={teamMembers.length}
            sub="Registrados actualmente"
            icon={
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
              </svg>
            }
            color="violet"
            index={3}
            // Miembros dirige a su página respectiva en lugar de modal
            onClick={() => {
              window.location.href = "/dashboard/equipo";
            }}
          />
        </div>
      )}

      {isAdmin ? (
        /* ─── VISTA ADMINISTRADOR ─── */
        <div className="space-y-4">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            custom={4}
            className="flex items-center justify-between"
          >
            <h2 className="font-display font-semibold text-lg text-slate-900 dark:text-slate-100">
              Resumen por Áreas
            </h2>
            <Link
              href="/dashboard/admin?tab=areas"
              className="text-sm text-brand-600 hover:text-brand-500 dark:text-brand-400 font-medium flex items-center gap-1 group"
            >
              Gestionar áreas
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                className="transition-transform group-hover:translate-x-0.5"
              >
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </Link>
          </motion.div>

          {adminData.areas.length === 0 && (
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="show"
              custom={5}
              className="card p-14 text-center flex flex-col items-center gap-4"
            >
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center">
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#94a3b8"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-slate-700 dark:text-slate-300">
                  No hay áreas creadas
                </p>
                <p className="text-sm text-slate-400 mt-1">
                  Crea áreas institucionales para organizar los proyectos.
                </p>
              </div>
              <Link href="/dashboard/areas" className="btn-primary mt-2">
                Gestionar áreas
              </Link>
            </motion.div>
          )}

          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {adminData.areas.map((area, i) => {
              const areaUsers = adminData.users.filter((u) =>
                u.areas?.some((a) => a.area.id === area.id),
              );
              const areaProjects = adminData.projects.filter(
                (p) => p.areaId === area.id,
              );
              const completedProjects = areaProjects.filter(
                (p) => p.status === "COMPLETED" || p.status === "ARCHIVED",
              ).length;
              const activeProjects = areaProjects.length - completedProjects;

              return (
                <motion.div
                  key={area.id}
                  variants={fadeUp}
                  initial="hidden"
                  animate="show"
                  custom={5 + i}
                  className="card flex flex-col h-full hover:shadow-md transition-shadow overflow-hidden"
                >
                  <div
                    className="h-1.5 w-full"
                    style={{ backgroundColor: area.color }}
                  />
                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-bold text-lg text-slate-800 dark:text-white">
                          {area.name}
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                          {area.description || "Sin descripción"}
                        </p>
                      </div>
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shadow-sm flex-shrink-0"
                        style={{ backgroundColor: area.color }}
                      >
                        {area.name.charAt(0)}
                      </div>
                    </div>

                    <div className="mb-5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between border border-slate-100 dark:border-slate-800 gap-2">
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold flex-shrink-0">
                        Titular{area.titulares?.length !== 1 ? "es" : ""}
                      </div>
                      {area.titulares?.length > 0 ? (
                        <div className="flex flex-wrap items-center gap-2 justify-end">
                          {area.titulares.map((t) => (
                            <div
                              key={t.userId}
                              className="flex items-center gap-1.5"
                            >
                              <Avatar
                                src={t.user?.image}
                                name={t.user?.name}
                                size="xs"
                              />
                              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                {t.user?.name?.split(" ")[0] || "Titular"}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">
                          Sin asignar
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-5">
                      <div className="p-3 border border-slate-100 dark:border-slate-700/60 rounded-xl text-center">
                        <div className="text-2xl font-bold text-brand-600 dark:text-brand-400">
                          {activeProjects}
                        </div>
                        <div className="text-[11px] text-slate-500 uppercase tracking-wider font-medium mt-1">
                          Activos
                        </div>
                      </div>
                      <div className="p-3 border border-slate-100 dark:border-slate-700/60 rounded-xl text-center">
                        <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                          {completedProjects}
                        </div>
                        <div className="text-[11px] text-slate-500 uppercase tracking-wider font-medium mt-1">
                          Completados
                        </div>
                      </div>
                    </div>

                    <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-500">
                        {areaUsers.length} integrante
                        {areaUsers.length !== 1 ? "s" : ""}
                      </span>
                      {areaUsers.length > 0 && (
                        <AvatarStack users={areaUsers} max={5} />
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      ) : isTitular ? (
        /* ─── VISTA TITULAR (NUEVA UI GERENCIAL) ─── */
        <div className="space-y-6">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Portafolio de Proyectos */}
            <div className="lg:col-span-2 space-y-4">
              <motion.div
                variants={fadeUp}
                initial="hidden"
                animate="show"
                custom={4}
                className="flex items-center justify-between"
              >
                <h2 className="font-display font-semibold text-lg text-slate-900 dark:text-slate-100">
                  Portafolio de proyectos
                </h2>
                <Link
                  href="/dashboard/proyectos"
                  className="text-sm text-brand-600 hover:text-brand-500 dark:text-brand-400 font-medium flex items-center gap-1 group"
                >
                  Ver todos
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    className="transition-transform group-hover:translate-x-0.5"
                  >
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </Link>
              </motion.div>

              {projects.length === 0 ? (
                <motion.div
                  variants={fadeUp}
                  custom={5}
                  className="card p-12 text-center flex flex-col items-center gap-3"
                >
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <svg
                      width="22"
                      height="22"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#94a3b8"
                      strokeWidth="2"
                      strokeLinecap="round"
                    >
                      <path d="M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7-6H4a2 2 0 0 0-2 2v16z" />
                      <path d="M14 2v6h6" />
                    </svg>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">
                    No hay proyectos activos en tu área aún.
                  </p>
                  <Link
                    href="/dashboard/proyectos"
                    className="btn-primary text-xs py-1.5 px-3"
                  >
                    Crear proyecto
                  </Link>
                </motion.div>
              ) : (
                <div className="space-y-3">
                  {projects.map((project, i) => (
                    <motion.div
                      key={project.id}
                      variants={fadeUp}
                      initial="hidden"
                      animate="show"
                      custom={5 + i}
                      onClick={() =>
                        (window.location.href = `/dashboard/proyectos/${project.id}`)
                      }
                      className="card overflow-hidden hover:shadow-md transition-all group cursor-pointer"
                    >
                      {/* color bar */}
                      <div
                        className="h-1 w-full"
                        style={{ backgroundColor: project.color }}
                      />
                      <div className="p-4 flex items-center gap-4">
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm flex-shrink-0"
                          style={{ backgroundColor: project.color }}
                        >
                          {project.name.charAt(0)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold text-sm text-slate-800 dark:text-slate-100 truncate group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors cursor-pointer">
                              {project.name}
                            </p>
                            <span
                              className={`flex-shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                                project.status === "ACTIVE"
                                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400"
                                  : project.status === "PAUSED"
                                    ? "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400"
                                    : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                              }`}
                            >
                              {project.status === "ACTIVE"
                                ? "Activo"
                                : project.status === "PAUSED"
                                  ? "Pausado"
                                  : project.status === "COMPLETED"
                                    ? "Completado"
                                    : "Archivado"}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all"
                                style={{
                                  width: `${project.progress}%`,
                                  backgroundColor: project.color,
                                }}
                              />
                            </div>
                            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 tabular-nums flex-shrink-0">
                              {project.progress}%
                            </span>
                          </div>
                        </div>
                        <div className="hidden sm:flex flex-col items-end gap-1 flex-shrink-0">
                          <span className="text-xs font-medium text-slate-500">
                            {project.taskCount} tareas
                          </span>
                          {project.assignments?.length > 0 && (
                            <AvatarStack
                              users={project.assignments.map((a) => a.user)}
                              max={3}
                            />
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Actividad del Área */}
            <div className="space-y-4">
              <motion.div
                variants={fadeUp}
                initial="hidden"
                animate="show"
                custom={4}
                className="flex items-center justify-between"
              >
                <h2 className="font-display font-semibold text-lg text-slate-900 dark:text-slate-100">
                  Actividad reciente
                </h2>
                <Link
                  href="/dashboard/tareas"
                  className="text-sm text-brand-600 hover:text-brand-500 dark:text-brand-400 font-medium flex items-center gap-1 group"
                >
                  Ver tareas
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    className="transition-transform group-hover:translate-x-0.5"
                  >
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </Link>
              </motion.div>
              <motion.div
                variants={fadeUp}
                initial="hidden"
                animate="show"
                custom={5}
                className="card overflow-hidden"
              >
                {recentTasks.length === 0 ? (
                  <div className="p-10 text-center flex flex-col items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#94a3b8"
                        strokeWidth="2"
                        strokeLinecap="round"
                      >
                        <path d="M9 11l3 3L22 4" />
                        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                      </svg>
                    </div>
                    <p className="text-slate-400 text-sm">No hay tareas aún.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-50 dark:divide-slate-800/60">
                    {recentTasks.map((task) => (
                      <div
                        key={task.id}
                        className="px-4 py-3 hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors flex items-center gap-3"
                      >
                        <div
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{
                            backgroundColor: task.project?.color || "#94a3b8",
                          }}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate leading-snug">
                            {task.title}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <p className="text-[10px] text-slate-400 truncate">
                              {task.project?.name}
                            </p>
                            {task.assignee && (
                              <span className="text-[10px] text-slate-300 dark:text-slate-600">
                                ·
                              </span>
                            )}
                            {task.assignee && (
                              <p className="text-[10px] text-slate-400 truncate">
                                {task.assignee.name?.split(" ")[0]}
                              </p>
                            )}
                          </div>
                        </div>
                        <StatusBadge status={task.status} />
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            </div>
          </div>

          {/* Carga de Trabajo del Equipo */}
          <div className="space-y-4 pt-2">
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="show"
              custom={6}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <h2 className="font-display font-semibold text-lg text-slate-900 dark:text-slate-100">
                Carga de trabajo del equipo
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setAddMemberModal(true)}
                  className="btn-primary text-xs py-1.5 px-3"
                >
                  <Plus size={14} /> Añadir Integrante
                </button>
                <Link
                  href="/dashboard/equipo"
                  className="text-sm text-brand-600 hover:text-brand-500 dark:text-brand-400 font-medium flex items-center gap-1 group"
                >
                  Ver todos
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    className="transition-transform group-hover:translate-x-0.5"
                  >
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </Link>
              </div>
            </motion.div>

            <div className="card divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
              {teamMembers.length === 0 ? (
                <div className="p-10 text-center text-slate-400 text-sm">
                  Aún no hay integrantes en tu área.
                </div>
              ) : (
                teamMembers.map((member, i) => {
                  const mTasks = member.createdTasks || [];
                  const mTotal = mTasks.length;
                  const mDone = mTasks.filter(
                    (t) => t.status === "COMPLETED",
                  ).length;
                  const mProg =
                    mTotal > 0 ? Math.round((mDone / mTotal) * 100) : 0;
                  const activeTasks = mTasks.filter(
                    (t) => t.status !== "COMPLETED",
                  );

                  return (
                    <motion.div
                      key={member.id}
                      variants={fadeUp}
                      initial="hidden"
                      animate="show"
                      custom={7 + i}
                      className="flex flex-col gap-4 px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group"
                    >
                      {/* Encabezado del miembro */}
                      <div className="flex items-center gap-4">
                        <Avatar
                          src={member.image}
                          name={member.name}
                          size="md"
                        />

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className="font-semibold text-sm text-slate-800 dark:text-white truncate">
                              {member.name || "Sin nombre"}
                            </p>
                            {activeTasks.length > 0 && (
                              <span className="flex-shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-brand-100 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300">
                                {activeTasks.length} activa
                                {activeTasks.length > 1 ? "s" : ""}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {member.assignments?.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {member.assignments.slice(0, 3).map((a) => (
                                  <span
                                    key={a.project.id}
                                    className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-500 dark:text-slate-400"
                                  >
                                    <span
                                      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                                      style={{
                                        backgroundColor: a.project.color,
                                      }}
                                    />
                                    {a.project.name}
                                  </span>
                                ))}
                                {member.assignments.length > 3 && (
                                  <span className="text-[10px] text-slate-400">
                                    +{member.assignments.length - 3}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-[11px] text-slate-400 italic">
                                Sin proyectos asignados
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Progreso */}
                        <div className="hidden sm:flex flex-col items-end gap-1 flex-shrink-0 w-28">
                          <div className="flex items-center gap-1.5 w-full">
                            <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-emerald-500 rounded-full transition-all"
                                style={{ width: `${mProg}%` }}
                              />
                            </div>
                            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums w-8 text-right">
                              {mDone}/{mTotal}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400">
                            tareas hechas
                          </span>
                        </div>

                        <button
                          onClick={() =>
                            setAssignProjectModal({ open: true, member })
                          }
                          className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-slate-300 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-950/40 dark:hover:text-brand-400 transition-all opacity-0 group-hover:opacity-100"
                          title="Asignar a proyecto"
                        >
                          <Plus size={14} />
                        </button>
                      </div>

                      {/* Lista de tareas en curso del miembro (Generalizadas) */}
                      {activeTasks.length > 0 && (
                        <div className="pl-14">
                          <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold mb-2">
                            Tareas en curso
                          </p>
                          <div className="grid xl:grid-cols-2 gap-2">
                            {activeTasks.slice(0, 4).map((t) => (
                              <div
                                key={t.id}
                                className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700/50 bg-white dark:bg-slate-900/50 hover:border-brand-200 dark:hover:border-brand-800 transition-colors"
                              >
                                <span
                                  className="w-2 h-2 rounded-full flex-shrink-0"
                                  style={{
                                    backgroundColor:
                                      t.project?.color || "#94a3b8",
                                  }}
                                />
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">
                                    {t.title}
                                  </p>
                                  <p className="text-[10px] text-slate-400 truncate mt-0.5">
                                    {t.project?.name || "Proyecto general"}
                                  </p>
                                </div>
                                <StatusBadge status={t.status} />
                              </div>
                            ))}
                            {activeTasks.length > 4 && (
                              <div className="flex items-center justify-center p-2.5 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 text-xs text-slate-400 font-medium bg-slate-50/50 dark:bg-slate-800/20">
                                +{activeTasks.length - 4} tareas adicionales
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      ) : (
        /* ─── VISTA MIEMBRO ─── */
        <div className="space-y-6">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Projects */}
            <div className="lg:col-span-2 space-y-4">
              <motion.div
                variants={fadeUp}
                initial="hidden"
                animate="show"
                custom={4}
                className="flex items-center justify-between"
              >
                <h2 className="font-display font-semibold text-lg text-slate-900 dark:text-slate-100">
                  Mis proyectos activos
                </h2>
                <Link
                  href="/dashboard/proyectos"
                  className="text-sm text-brand-600 hover:text-brand-500 dark:text-brand-400 font-medium flex items-center gap-1 group"
                >
                  Ver todos
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    className="transition-transform group-hover:translate-x-0.5"
                  >
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </Link>
              </motion.div>

              <div className="space-y-3">
                {myProjects.length === 0 && (
                  <motion.div
                    variants={fadeUp}
                    initial="hidden"
                    animate="show"
                    custom={5}
                    className="card p-10 text-center"
                  >
                    <p className="text-slate-400 text-sm">
                      No tienes proyectos asignados aún.
                    </p>
                  </motion.div>
                )}
                {myProjects.map((project, i) => (
                  <motion.div
                    key={project.id}
                    variants={fadeUp}
                    initial="hidden"
                    animate="show"
                    custom={5 + i}
                    whileHover={{ y: -2, transition: { duration: 0.2 } }}
                    className="card-hover p-5 cursor-pointer"
                    onClick={() =>
                      (window.location.href = `/dashboard/proyectos/${project.id}`)
                    }
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-white font-display font-bold text-sm shadow-lg"
                        style={{
                          backgroundColor: project.color,
                          boxShadow: `0 4px 12px ${project.color}40`,
                        }}
                      >
                        {project.name.charAt(0)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate mb-2">
                          {project.name}
                        </h3>
                        {project.description && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 line-clamp-1">
                            {project.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4">
                          <div className="flex-1 max-w-[200px]">
                            <ProgressBar
                              percent={project.progress}
                              color={project.color}
                            />
                          </div>
                          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium tabular-nums">
                            {project.completedCount}/{project.taskCount}
                          </span>
                          {project.assignments?.length > 0 && (
                            <AvatarStack
                              users={project.assignments.map((a) => a.user)}
                            />
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
              <motion.div
                variants={fadeUp}
                initial="hidden"
                animate="show"
                custom={4}
                className="flex items-center justify-between"
              >
                <h2 className="font-display font-semibold text-lg text-slate-900 dark:text-slate-100">
                  Mi actividad reciente
                </h2>
                <Link
                  href="/dashboard/tareas"
                  className="text-sm text-brand-600 hover:text-brand-500 dark:text-brand-400 font-medium flex items-center gap-1 group"
                >
                  Ver todas
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    className="transition-transform group-hover:translate-x-0.5"
                  >
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </Link>
              </motion.div>
              <motion.div
                variants={fadeUp}
                initial="hidden"
                animate="show"
                custom={5}
                className="card overflow-hidden divide-y divide-slate-50 dark:divide-slate-800"
              >
                {recentTasks.length === 0 && (
                  <div className="p-8 text-center text-slate-400 text-sm">
                    No hay tareas aún.
                  </div>
                )}
                {recentTasks.map((task) => (
                  <div
                    key={task.id}
                    className="px-4 py-3 hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {task.assignee ? (
                        <Avatar
                          src={task.assignee.image}
                          name={task.assignee.name}
                          size="xs"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex-shrink-0" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-slate-700 dark:text-slate-300 truncate">
                          {task.title}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate flex items-center gap-1">
                          <span
                            className="inline-block w-1.5 h-1.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: task.project?.color }}
                          />
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
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="show"
              custom={6}
              className="flex items-center justify-between"
            >
              <h2 className="font-display font-semibold text-lg text-slate-900 dark:text-slate-100">
                ¿Quién hace qué?
              </h2>
            </motion.div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {teamMembers.map((member, i) => (
                <motion.div
                  key={member.id}
                  variants={fadeUp}
                  initial="hidden"
                  animate="show"
                  custom={7 + i}
                  whileHover={{ y: -3, transition: { duration: 0.2 } }}
                  className="card-hover p-5"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <Avatar src={member.image} name={member.name} size="md" />
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate">
                        {member.name || "Sin nombre"}
                      </p>
                      <p className="text-xs text-slate-400 truncate">
                        {member.email}
                      </p>
                    </div>
                  </div>

                  {member.assignments?.length > 0 && (
                    <div className="mb-3">
                      <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold mb-2">
                        Proyectos
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {member.assignments.map((a) => (
                          <Link
                            href={`/dashboard/proyectos/${a.project.id}`}
                            key={a.project.id}
                            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                          >
                            <span
                              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                              style={{ backgroundColor: a.project.color }}
                            />
                            {a.project.name}
                          </Link>
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
                            <span
                              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                              style={{ backgroundColor: t.project?.color }}
                            />
                            <span className="text-xs text-slate-600 dark:text-slate-400 truncate flex-1">
                              {t.title}
                            </span>
                            <StatusBadge status={t.status} />
                          </div>
                        ))}
                        {member.createdTasks.length > 3 && (
                          <p className="text-[11px] text-slate-400">
                            +{member.createdTasks.length - 3} más
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">
                      Sin tareas asignadas
                    </p>
                  )}
                </motion.div>
              ))}
              {teamMembers.length === 0 && (
                <motion.div
                  variants={fadeUp}
                  initial="hidden"
                  animate="show"
                  custom={7}
                  className="col-span-full card p-10 text-center text-slate-400 text-sm"
                >
                  Aún no hay miembros. Los usuarios de ANAM aparecerán aquí al
                  iniciar sesión con Google.
                </motion.div>
              )}
            </div>
          </div>
        </div>
      )}

      <Modal
        open={kpiModal.open}
        onClose={() => setKpiModal({ ...kpiModal, open: false })}
        title={kpiModal.title}
      >
        <div className="max-h-[60vh] overflow-y-auto pr-1">
          {getModalContent()}
        </div>
      </Modal>

      <Modal
        open={addMemberModal}
        onClose={() => setAddMemberModal(false)}
        title="Añadir Integrante al Área"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Ingresa el correo del usuario. Si ya está registrado, se unirá
            inmediatamente a tu área. Si no, se le dará permiso de acceso.
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
              onKeyDown={(e) => e.key === "Enter" && handleAddMember()}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setAddMemberModal(false)}
              className="btn-secondary flex-1"
            >
              Cancelar
            </button>
            <button
              onClick={handleAddMember}
              disabled={!newMemberEmail}
              className="btn-primary flex-1 disabled:opacity-50"
            >
              Agregar
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        open={assignProjectModal.open}
        onClose={() => setAssignProjectModal({ open: false, member: null })}
        title="Asignar a Proyecto"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Asigna a{" "}
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {assignProjectModal.member?.name ||
                assignProjectModal.member?.email}
            </span>{" "}
            a un proyecto de tu área.
          </p>
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
              Selecciona un proyecto
            </label>
            <select
              className="input-field"
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
            >
              <option value="">-- Seleccionar proyecto --</option>
              {projects
                .filter(
                  (p) =>
                    !p.assignments?.some(
                      (a) => a.user.id === assignProjectModal.member?.id,
                    ),
                )
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={() =>
                setAssignProjectModal({ open: false, member: null })
              }
              className="btn-secondary flex-1"
            >
              Cancelar
            </button>
            <button
              onClick={handleAssignProject}
              disabled={!selectedProjectId}
              className="btn-primary flex-1 disabled:opacity-50"
            >
              Asignar
            </button>
          </div>
        </div>
      </Modal>

      <ActionOverlay
        isProcessing={isProcessing}
        errorMsg={errorMsg}
        onErrorClose={() => setErrorMsg("")}
        successMsg={successMsg}
        onSuccessClose={() => {
          setSuccessMsg("");
          window.location.reload();
        }}
      />
    </div>
  );
}

function StatCard({ label, value, sub, icon, color, index, onClick }) {
  const count = useCounter(value, 500);
  const s = STAT_STYLES[color] || STAT_STYLES.brand;

  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="show"
      custom={index + 1}
      whileHover={{ y: -3, transition: { duration: 0.15, ease: "easeOut" } }}
      onClick={onClick}
      className={`card relative overflow-hidden group flex items-center gap-4 p-4 ${
        onClick
          ? "cursor-pointer hover:shadow-md transition-all"
          : "cursor-default"
      }`}
    >
      {/* colored left bar */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-1 ${s.bar} rounded-l-2xl`}
      />

      <div
        className={`w-10 h-10 rounded-xl ${s.icon} flex items-center justify-center flex-shrink-0 ml-1`}
      >
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <p className={`text-2xl font-bold tabular-nums leading-none ${s.num}`}>
          {count}
        </p>
        <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mt-0.5 truncate">
          {label}
        </p>
        <p className="text-xs text-slate-400 mt-0.5 truncate">{sub}</p>
      </div>

      {onClick && (
        <svg
          className="flex-shrink-0 text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity mr-1"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
      )}
    </motion.div>
  );
}

function ActionOverlay({
  isProcessing,
  errorMsg,
  onErrorClose,
  successMsg,
  onSuccessClose,
}) {
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

function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirmar",
  isDanger = true,
  showCancel = true,
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="confirm-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[120]"
            onClick={onClose}
          />
          <motion.div
            key="confirm-modal"
            initial={{ opacity: 0, scale: 0.95, x: "-50%", y: "-50%" }}
            animate={{ opacity: 1, scale: 1, x: "-50%", y: "-50%" }}
            exit={{ opacity: 0, scale: 0.95, x: "-50%", y: "-50%" }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="fixed left-1/2 top-1/2 w-[90%] max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl z-[120] overflow-hidden"
          >
            <div className="p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                {title}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {message}
              </p>
            </div>
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-3">
              {showCancel && (
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
              )}
              <button
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className={`px-4 py-2 text-sm font-medium text-white rounded-xl transition-colors ${isDanger ? "bg-red-600 hover:bg-red-700" : "bg-brand-600 hover:bg-brand-700"}`}
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
