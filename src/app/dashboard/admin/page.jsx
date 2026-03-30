// src/app/dashboard/admin/page.jsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  Users,
  Mail,
  Plus,
  Trash2,
  X,
  Check,
  Building2,
  Lock,
  Search,
  SlidersHorizontal,
  Crown,
  Loader2,
  UserCog,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";
import Select from "@/components/Select";
import LoadingScreen from "@/components/LoadingScreen";

/* ─── Role config ─────────────────────────────────────────────── */
const ROLE_CFG = {
  SUPERADMIN: {
    label: "Super Admin",
    color: "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400",
    icon: ShieldAlert,
  },
  ADMIN: {
    label: "Administrador",
    color:
      "bg-brand-100 text-brand-700 dark:bg-brand-950/60 dark:text-brand-400",
    icon: ShieldCheck,
  },
  TITULAR: {
    label: "Titular",
    color:
      "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
    icon: Crown,
  },
  MEMBER: {
    label: "Miembro",
    color: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
    icon: Users,
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.3, ease: [0.16, 1, 0.3, 1] },
  }),
};

/* ─── Shared small components ─────────────────────────────────── */
function UserAvatar({ user, size = 9 }) {
  const cls = `w-${size} h-${size} rounded-full flex-shrink-0 object-cover`;
  return user?.image ? (
    <img
      src={user.image}
      alt=""
      className={`${cls} ring-2 ring-white dark:ring-slate-800`}
      referrerPolicy="no-referrer"
    />
  ) : (
    <div
      className={`${cls} bg-gradient-to-br from-brand-600 to-brand-800 flex items-center justify-center text-white font-bold text-sm ring-2 ring-white dark:ring-slate-800`}
    >
      {user?.name?.charAt(0) || user?.email?.charAt(0) || "?"}
    </div>
  );
}

function RoleBadge({ role }) {
  const cfg = ROLE_CFG[role] || ROLE_CFG.MEMBER;
  const Icon = cfg.icon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.color}`}
    >
      <Icon size={11} />
      {cfg.label}
    </span>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="card p-4 flex items-center gap-3">
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}
      >
        <Icon size={18} />
      </div>
      <div>
        <p className="text-xl font-bold text-slate-800 dark:text-white">
          {value}
        </p>
        <p className="text-xs text-slate-400">{label}</p>
      </div>
    </div>
  );
}

/* ─── ConfirmModal ─────────────────────────────────────────────── */
function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirmar",
  isDanger = true,
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="bd"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[120]"
            onClick={onClose}
          />
          <motion.div
            key="md"
            initial={{ opacity: 0, scale: 0.95, x: "-50%", y: "-50%" }}
            animate={{ opacity: 1, scale: 1, x: "-50%", y: "-50%" }}
            exit={{ opacity: 0, scale: 0.95, x: "-50%", y: "-50%" }}
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
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                Cancelar
              </button>
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

/* ─── ActionOverlay ────────────────────────────────────────────── */
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
            key="loader"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex flex-col items-center justify-center text-white"
          >
            <Loader2 size={48} className="animate-spin text-brand-500 mb-4" />
            <p className="text-lg font-semibold">Procesando...</p>
            <p className="text-sm text-slate-300">
              Por favor, espera un momento
            </p>
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
      />
      {successMsg && (
        <ConfirmModal
          isOpen={!!successMsg}
          onClose={onSuccessClose}
          onConfirm={onSuccessClose}
          title="Listo"
          message={successMsg}
          confirmText="Continuar"
          isDanger={false}
        />
      )}
    </>
  );
}

/* ─── AccesosTab ───────────────────────────────────────────────── */
const ROLE_OPTIONS_ALL = [
  { value: "ADMIN", label: "Administrador" },
  { value: "TITULAR", label: "Titular de área" },
  { value: "MEMBER", label: "Miembro de área" },
];

function getRoleOptions(userRole) {
  if (userRole === "SUPERADMIN") return ROLE_OPTIONS_ALL;
  if (userRole === "ADMIN")
    return ROLE_OPTIONS_ALL.filter((r) => r.value !== "ADMIN");
  // TITULAR solo puede agregar miembros
  return ROLE_OPTIONS_ALL.filter((r) => r.value === "MEMBER");
}

function AccesosTab({ userRole }) {
  const isTitular = userRole === "TITULAR";
  const roleOptions = getRoleOptions(userRole);

  const [list, setList] = useState([]);
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  // TITULAR solo puede asignar MEMBER, pre-seleccionarlo
  const [selectedRole, setSelectedRole] = useState(isTitular ? "MEMBER" : "");
  const [areaId, setAreaId] = useState("");
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false });
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [search, setSearch] = useState("");

  const needsArea = selectedRole === "TITULAR" || selectedRole === "MEMBER";
  const canAdd = email.trim() && selectedRole && (!needsArea || areaId);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [wData, aData] = await Promise.all([
        fetch("/api/admin/whitelist").then((r) => r.json()),
        fetch("/api/admin/areas").then((r) => r.json().catch(() => [])),
      ]);
      setList(Array.isArray(wData) ? wData : []);
      setAreas(Array.isArray(aData) ? aData : []);
    } catch {
      setList([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const buildNote = () => {
    const roleName =
      ROLE_OPTIONS_ALL.find((r) => r.value === selectedRole)?.label ||
      selectedRole;
    const areaName = areas.find((a) => a.id === areaId)?.name;
    if (areaName) return `${roleName} — ${areaName}`;
    return roleName;
  };

  const add = async () => {
    if (!canAdd) return;
    setIsProcessing(true);
    const trimmedEmail = email.trim();
    try {
      const note = buildNote();

      // 1. Upsert whitelist entry (with role/area so they apply on first login)
      const wRes = await fetch("/api/admin/whitelist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: trimmedEmail,
          note,
          assignedRole: selectedRole || null,
          assignedAreaId: areaId || null,
        }),
      });
      if (!wRes.ok)
        throw new Error(
          (await wRes.json().catch(() => ({}))).error ||
            "Error al agregar el acceso.",
        );

      setEmail("");
      setSelectedRole("");
      setAreaId("");
      setSuccessMsg(`Acceso otorgado a ${trimmedEmail}.`);
      await load();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const remove = (em) => {
    setConfirmDialog({
      isOpen: true,
      title: "Revocar acceso",
      message: `¿Seguro que deseas revocar el acceso de ${em}? Si ya inició sesión, seguirá en el sistema hasta que lo elimines desde Usuarios.`,
      confirmText: "Sí, revocar",
      onConfirm: async () => {
        setIsProcessing(true);
        try {
          const res = await fetch("/api/admin/whitelist", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: em }),
          });
          if (!res.ok)
            throw new Error(
              (await res.json().catch(() => ({}))).error ||
                "Error al revocar el acceso.",
            );
          await load();
        } catch (err) {
          setErrorMsg(err.message);
        } finally {
          setIsProcessing(false);
        }
      },
    });
  };

  const filtered = list.filter(
    (e) =>
      !search ||
      e.email.toLowerCase().includes(search.toLowerCase()) ||
      e.note?.toLowerCase().includes(search.toLowerCase()),
  );

  const areaOptions = [
    { value: "", label: "Seleccionar área..." },
    ...areas.map((a) => ({ value: a.id, label: a.name })),
  ];

  return (
    <div className="space-y-5">
      {/* Add form */}
      <div className="card p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-7 h-7 rounded-lg bg-brand-100 dark:bg-brand-950/50 flex items-center justify-center">
            <Plus size={14} className="text-brand-600 dark:text-brand-400" />
          </div>
          <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm">
            Autorizar nuevo acceso
          </p>
        </div>

        {/* Email */}
        <div className="relative">
          <Mail
            size={15}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            className="input-field pl-10"
            placeholder="correo@ejemplo.com"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
          />
        </div>

        {/* Role + Area row */}
        <div className="flex gap-3 flex-wrap sm:flex-nowrap">
          {isTitular ? (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-medium text-slate-500 dark:text-slate-400 flex-shrink-0">
              <Users size={14} />
              Miembro de área
            </div>
          ) : (
            <div className="flex-1 min-w-[160px]">
              <Select
                value={selectedRole}
                onChange={(v) => {
                  setSelectedRole(v);
                  setAreaId("");
                }}
                options={[
                  { value: "", label: "Seleccionar rol..." },
                  ...roleOptions,
                ]}
              />
            </div>
          )}
          {needsArea && (
            <div className="flex-1 min-w-[160px]">
              <Select
                value={areaId}
                onChange={setAreaId}
                options={areaOptions}
              />
            </div>
          )}
          <button
            onClick={add}
            disabled={!canAdd || isProcessing}
            className="btn-primary px-5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 flex-shrink-0"
          >
            {isProcessing ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Plus size={15} />
            )}
            Agregar
          </button>
        </div>

        <p className="text-xs text-slate-400">
          Al agregar un correo, esa persona podrá iniciar sesión con Google. Si
          ya existe en el sistema, se asignará automáticamente al área
          seleccionada.
        </p>
      </div>

      {/* List */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            Accesos autorizados
            <span className="ml-2 text-xs font-normal text-slate-400">
              {list.length} registros
            </span>
          </p>
          {list.length > 5 && (
            <div className="relative w-56">
              <Search
                size={13}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 dark:text-white transition-all"
                placeholder="Buscar correo..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          )}
        </div>

        {loading ? (
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-14 shimmer rounded-xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="card p-10 text-center">
            <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Lock size={20} className="text-slate-400" />
            </div>
            <p className="font-medium text-slate-600 dark:text-slate-300 text-sm">
              {search ? "Sin resultados" : "Lista vacía"}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {search
                ? "Prueba con otro correo"
                : "Agrega correos para permitir el acceso al sistema"}
            </p>
          </div>
        ) : (
          <div className="card divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
            <AnimatePresence>
              {filtered.map((entry, i) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ delay: i * 0.02 }}
                  className="flex items-center gap-4 px-4 py-3.5 group hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-950/50 flex items-center justify-center flex-shrink-0">
                    <Mail
                      size={13}
                      className="text-brand-600 dark:text-brand-400"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
                      {entry.email}
                    </p>
                    {entry.note && (
                      <p className="text-xs text-slate-400 truncate">
                        {entry.note}
                      </p>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 hidden sm:block flex-shrink-0">
                    {new Date(entry.createdAt).toLocaleDateString("es-MX", {
                      day: "numeric",
                      month: "short",
                    })}
                  </p>
                  <button
                    onClick={() => remove(entry.email)}
                    className="opacity-0 group-hover:opacity-100 w-8 h-8 flex items-center justify-center rounded-lg
                               hover:bg-red-50 dark:hover:bg-red-950/30 text-slate-300 hover:text-red-500 transition-all"
                    title="Revocar acceso"
                  >
                    <Trash2 size={14} />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <ConfirmModal
        {...confirmDialog}
        onClose={() => setConfirmDialog({ isOpen: false })}
      />
      <ActionOverlay
        isProcessing={isProcessing}
        errorMsg={errorMsg}
        onErrorClose={() => setErrorMsg("")}
        successMsg={successMsg}
        onSuccessClose={() => setSuccessMsg("")}
      />
    </div>
  );
}

/* ─── UsersTab (SUPERADMIN only) ──────────────────────────────── */
function UsersTab() {
  const [users, setUsers] = useState([]);
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false });
  const [titularModal, setTitularModal] = useState({
    isOpen: false,
    userId: null,
    userName: null,
    areaId: "",
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [expandedUser, setExpandedUser] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [ur, ar] = await Promise.all([
        fetch("/api/admin/users"),
        fetch("/api/admin/areas"),
      ]);
      const uData = await ur.json();
      const aData = await ar.json();
      setUsers(Array.isArray(uData) ? uData : []);
      setAreas(Array.isArray(aData) ? aData : []);
    } catch {
      setUsers([]);
      setAreas([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const changeRole = async (userId, role) => {
    setIsProcessing(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role }),
      });
      if (!res.ok)
        throw new Error(
          (await res.json().catch(() => ({}))).error ||
            "Error al cambiar el rol.",
        );
      setUsers((u) => u.map((x) => (x.id === userId ? { ...x, role } : x)));
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const assignTitular = async (userId, areaId) => {
    setIsProcessing(true);
    try {
      // 1. Cambiar rol a TITULAR
      const roleRes = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: "TITULAR" }),
      });
      if (!roleRes.ok)
        throw new Error(
          (await roleRes.json().catch(() => ({}))).error ||
            "Error al cambiar el rol.",
        );

      // 2. Agregar al área
      await fetch(`/api/admin/areas/${areaId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action: "add" }),
      });

      // 3. Agregar como titular del área (manteniendo titulares existentes)
      const currentArea = areas.find(a => a.id === areaId);
      const existingIds = currentArea?.titulares?.map(t => t.userId) || [];
      const titularIds = [...new Set([...existingIds, userId])];
      await fetch(`/api/admin/areas/${areaId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ titularIds }),
      });

      await load();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRoleChange = (user, newRole) => {
    if (newRole === "SUPERADMIN") {
      setConfirmDialog({
        isOpen: true,
        title: "Promover a Super Admin",
        message: `¿Seguro que deseas dar acceso total a ${user.name || user.email}? Tendrá control completo del sistema.`,
        confirmText: "Sí, promover",
        isDanger: false,
        onConfirm: () => changeRole(user.id, "SUPERADMIN"),
      });
    } else if (newRole === "TITULAR" && areas.length > 0) {
      setTitularModal({
        isOpen: true,
        userId: user.id,
        userName: user.name || user.email,
        areaId: "",
      });
    } else {
      changeRole(user.id, newRole);
    }
  };

  const toggleArea = async (userId, areaId, currently) => {
    setIsProcessing(true);
    try {
      const res = await fetch(`/api/admin/areas/${areaId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action: currently ? "remove" : "add" }),
      });
      if (!res.ok)
        throw new Error(
          (await res.json().catch(() => ({}))).error ||
            "Error al actualizar el área.",
        );
      await load();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const deleteUser = (userId, name) => {
    setConfirmDialog({
      isOpen: true,
      title: "Eliminar usuario",
      message: `¿Eliminar definitivamente a ${name || "este usuario"}? Se perderán todos sus datos y asignaciones.`,
      confirmText: "Sí, eliminar",
      onConfirm: async () => {
        setIsProcessing(true);
        try {
          const res = await fetch("/api/admin/users", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId }),
          });
          if (!res.ok)
            throw new Error(
              (await res.json().catch(() => ({}))).error ||
                "Error al eliminar.",
            );
          await load();
        } catch (err) {
          setErrorMsg(err.message);
        } finally {
          setIsProcessing(false);
        }
      },
    });
  };

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    if (
      q &&
      !u.name?.toLowerCase().includes(q) &&
      !u.email?.toLowerCase().includes(q)
    )
      return false;
    if (roleFilter && u.role !== roleFilter) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-20 shimmer rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search + role filter */}
      <div className="card p-4 space-y-3">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              className="input-field pl-10"
              placeholder="Buscar por nombre o correo…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            { value: "", label: "Todos" },
            ...Object.entries(ROLE_CFG).map(([k, v]) => ({
              value: k,
              label: v.label,
            })),
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => setRoleFilter(opt.value)}
              className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
                roleFilter === opt.value
                  ? "bg-brand-700 text-white border-brand-700"
                  : "border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-brand-300 hover:text-brand-600"
              }`}
            >
              {opt.label}
            </button>
          ))}
          <span className="ml-auto text-xs text-slate-400 self-center">
            {filtered.length} de {users.length}
          </span>
        </div>
      </div>

      {/* User list */}
      {filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Users size={20} className="text-slate-400" />
          </div>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
            Sin resultados
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Ajusta los filtros de búsqueda
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((user, i) => {
            const isExpanded = expandedUser === user.id;
            const userAreaIds = user.areas.map((a) => a.area.id);
            const roleCfg = ROLE_CFG[user.role] || ROLE_CFG.MEMBER;

            return (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02 }}
                layout
                className="card overflow-hidden"
              >
                {/* Main row */}
                <div className="p-4 flex items-center gap-3">
                  <UserAvatar user={user} size={10} />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-800 dark:text-white text-sm truncate">
                      {user.name || "—"}
                    </p>
                    <p className="text-xs text-slate-400 truncate">
                      {user.email}
                    </p>
                  </div>

                  {/* Role selector */}
                  <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
                    <RoleBadge role={user.role} />
                    <Select
                      size="sm"
                      value={user.role}
                      onChange={(v) => handleRoleChange(user, v)}
                      options={Object.entries(ROLE_CFG).map(([k, v]) => ({
                        value: k,
                        label: v.label,
                      }))}
                      className="w-36"
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {areas.length > 0 &&
                      user.role !== "ADMIN" &&
                      user.role !== "SUPERADMIN" && (
                        <button
                          onClick={() =>
                            setExpandedUser(isExpanded ? null : user.id)
                          }
                          title="Gestionar áreas"
                          className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all text-slate-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-950/30 ${isExpanded ? "bg-brand-50 dark:bg-brand-950/30 text-brand-600 dark:text-brand-400" : ""}`}
                        >
                          <Building2 size={14} />
                        </button>
                      )}
                    <button
                      onClick={() => deleteUser(user.id, user.name)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-slate-300 hover:text-red-500 transition-all"
                      title="Eliminar usuario"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Mobile role selector */}
                <div className="sm:hidden px-4 pb-3 flex items-center gap-2">
                  <RoleBadge role={user.role} />
                  <Select
                    size="sm"
                    value={user.role}
                    onChange={(v) => handleRoleChange(user, v)}
                    options={Object.entries(ROLE_CFG).map(([k, v]) => ({
                      value: k,
                      label: v.label,
                    }))}
                    className="flex-1"
                  />
                </div>

                {/* Area assignment */}
                <AnimatePresence>
                  {isExpanded && areas.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
                          Áreas asignadas
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {areas.map((area) => {
                            const inArea = userAreaIds.includes(area.id);
                            return (
                              <button
                                key={area.id}
                                onClick={() =>
                                  toggleArea(user.id, area.id, inArea)
                                }
                                className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-all font-medium ${
                                  inArea
                                    ? "text-white border-transparent shadow-sm"
                                    : "border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-300"
                                }`}
                                style={inArea ? { background: area.color } : {}}
                              >
                                {inArea && <Check size={11} strokeWidth={3} />}
                                {area.name}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}

      <ConfirmModal
        {...confirmDialog}
        onClose={() => setConfirmDialog({ isOpen: false })}
      />

      {/* Modal: asignar área al nuevo Titular */}
      <AnimatePresence>
        {titularModal.isOpen && (
          <>
            <motion.div
              key="titular-bd"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[120]"
              onClick={() =>
                setTitularModal({
                  isOpen: false,
                  userId: null,
                  userName: null,
                  areaId: "",
                })
              }
            />
            <motion.div
              key="titular-modal"
              initial={{ opacity: 0, scale: 0.95, x: "-50%", y: "-50%" }}
              animate={{ opacity: 1, scale: 1, x: "-50%", y: "-50%" }}
              exit={{ opacity: 0, scale: 0.95, x: "-50%", y: "-50%" }}
              className="fixed left-1/2 top-1/2 w-[90%] max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-xl z-[130] overflow-hidden"
            >
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950/40 flex items-center justify-center flex-shrink-0">
                    <Crown
                      size={16}
                      className="text-amber-600 dark:text-amber-400"
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
                      Asignar como Titular
                    </h3>
                    <p className="text-xs text-slate-400">
                      {titularModal.userName}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Selecciona el área de la que será titular.
                </p>
                <Select
                  value={titularModal.areaId}
                  onChange={(v) =>
                    setTitularModal((m) => ({ ...m, areaId: v }))
                  }
                  options={[
                    { value: "", label: "Seleccionar área..." },
                    ...areas.map((a) => ({
                      value: a.id,
                      label: a.name,
                      color: a.color,
                    })),
                  ]}
                />
              </div>
              <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-3">
                <button
                  onClick={() =>
                    setTitularModal({
                      isOpen: false,
                      userId: null,
                      userName: null,
                      areaId: "",
                    })
                  }
                  className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  disabled={!titularModal.areaId}
                  onClick={() => {
                    const { userId, areaId } = titularModal;
                    setTitularModal({
                      isOpen: false,
                      userId: null,
                      userName: null,
                      areaId: "",
                    });
                    assignTitular(userId, areaId);
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Confirmar
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <ActionOverlay
        isProcessing={isProcessing}
        errorMsg={errorMsg}
        onErrorClose={() => setErrorMsg("")}
      />
    </div>
  );
}

/* ─── Main Page ─────────────────────────────────────────────────── */
export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState({ whitelist: 0, users: 0, areas: 0 });
  const [tab, setTab] = useState("accesos");

  const role = session?.user?.role;
  const isSuperAdmin = role === "SUPERADMIN";
  const hasAccess =
    role === "SUPERADMIN" || role === "ADMIN" || role === "TITULAR";

  useEffect(() => {
    if (status === "loading") return;
    if (!session || !hasAccess) router.push("/dashboard");
  }, [session, status, hasAccess, router]);

  useEffect(() => {
    if (!hasAccess) return;
    const reqs = [
      fetch("/api/admin/whitelist").then((r) => r.json().catch(() => [])),
    ];
    if (isSuperAdmin) {
      reqs.push(
        fetch("/api/admin/users").then((r) => r.json().catch(() => [])),
        fetch("/api/admin/areas").then((r) => r.json().catch(() => [])),
      );
    }
    Promise.all(reqs)
      .then(([w, u, a]) => {
        setStats({
          whitelist: Array.isArray(w) ? w.length : 0,
          users: Array.isArray(u) ? u.length : 0,
          areas: Array.isArray(a) ? a.length : 0,
        });
      })
      .catch(() => {});
  }, [isSuperAdmin, hasAccess, tab]);

  if (status === "loading" || !session || !hasAccess) return <LoadingScreen />;

  const ROLE_BADGE_CFG = ROLE_CFG[role];

  const TABS = isSuperAdmin
    ? [
        {
          id: "accesos",
          label: "Accesos",
          icon: Lock,
          desc: "Controla quién puede iniciar sesión en el sistema",
        },
        {
          id: "usuarios",
          label: "Usuarios",
          icon: UserCog,
          desc: "Gestión completa de usuarios, roles y áreas",
        },
      ]
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="show"
        custom={0}
        className="flex items-start gap-4"
      >
        <div className="w-12 h-12 rounded-2xl bg-brand-700 dark:bg-brand-800 flex items-center justify-center flex-shrink-0 shadow-lg shadow-brand-700/30">
          <Shield size={22} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              {isSuperAdmin ? "Panel de Control" : "Accesos"}
            </h1>
            {ROLE_BADGE_CFG && (
              <span
                className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${ROLE_BADGE_CFG.color}`}
              >
                <ROLE_BADGE_CFG.icon size={11} />
                {ROLE_BADGE_CFG.label}
              </span>
            )}
          </div>
          <p className="text-sm text-slate-400 mt-0.5">
            {isSuperAdmin
              ? "Control total del sistema — usuarios, accesos y roles"
              : "Gestiona quién puede iniciar sesión en el sistema"}
          </p>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="show"
        custom={1}
        className={`grid gap-4 ${isSuperAdmin ? "grid-cols-3" : "grid-cols-1 sm:grid-cols-2"}`}
      >
        <StatCard
          icon={Lock}
          label="En whitelist"
          value={stats.whitelist}
          color="bg-brand-100 text-brand-600 dark:bg-brand-950/50 dark:text-brand-400"
        />
        {isSuperAdmin && (
          <>
            <StatCard
              icon={Users}
              label="Usuarios registrados"
              value={stats.users}
              color="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
            />
            <StatCard
              icon={Building2}
              label="Áreas"
              value={stats.areas}
              color="bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400"
            />
          </>
        )}
      </motion.div>

      {/* Tab bar (solo SUPERADMIN) */}
      {TABS && (
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          custom={2}
          className="flex gap-1 border-b border-slate-100 dark:border-slate-800"
        >
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all border-b-2 -mb-px ${
                tab === t.id
                  ? "border-brand-600 text-brand-700 dark:text-brand-400 dark:border-brand-500"
                  : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600"
              }`}
            >
              <t.icon size={16} />
              {t.label}
            </button>
          ))}
        </motion.div>
      )}

      {/* Tab description */}
      {TABS && (
        <motion.p
          variants={fadeUp}
          initial="hidden"
          animate="show"
          custom={2}
          className="text-sm text-slate-400 -mt-2"
        >
          {TABS.find((t) => t.id === tab)?.desc}
        </motion.p>
      )}

      {/* Content */}
      <motion.div variants={fadeUp} initial="hidden" animate="show" custom={3}>
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
          >
            {(tab === "accesos" || !TABS) && <AccesosTab userRole={role} />}
            {tab === "usuarios" && isSuperAdmin && <UsersTab />}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
