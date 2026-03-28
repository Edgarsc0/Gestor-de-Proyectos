// src/components/Badges.jsx
"use client";

const STATUS_CONFIG = {
  PENDING:     { label: "Pendiente",   bg: "bg-slate-100 dark:bg-slate-800",          text: "text-slate-600 dark:text-slate-400",    dot: "bg-slate-400" },
  IN_PROGRESS: { label: "En progreso", bg: "bg-blue-50 dark:bg-blue-950/60",           text: "text-blue-700 dark:text-blue-400",      dot: "bg-blue-500" },
  IN_REVIEW:   { label: "En revisión", bg: "bg-amber-50 dark:bg-amber-950/60",         text: "text-amber-700 dark:text-amber-400",    dot: "bg-amber-500" },
  COMPLETED:   { label: "Completada",  bg: "bg-emerald-50 dark:bg-emerald-950/60",     text: "text-emerald-700 dark:text-emerald-400", dot: "bg-emerald-500" },
};

const PRIORITY_CONFIG = {
  LOW:    { label: "Baja",    bg: "bg-slate-100 dark:bg-slate-800",   text: "text-slate-500 dark:text-slate-400" },
  MEDIUM: { label: "Media",   bg: "bg-blue-50 dark:bg-blue-950/60",   text: "text-blue-600 dark:text-blue-400" },
  HIGH:   { label: "Alta",    bg: "bg-orange-50 dark:bg-orange-950/60", text: "text-orange-600 dark:text-orange-400" },
  URGENT: { label: "Urgente", bg: "bg-red-50 dark:bg-red-950/60",     text: "text-red-600 dark:text-red-400" },
};

const PROJECT_STATUS_CONFIG = {
  ACTIVE:    { label: "Activo",     bg: "bg-emerald-50 dark:bg-emerald-950/60", text: "text-emerald-700 dark:text-emerald-400" },
  PAUSED:    { label: "Pausado",    bg: "bg-amber-50 dark:bg-amber-950/60",     text: "text-amber-700 dark:text-amber-400" },
  COMPLETED: { label: "Completado", bg: "bg-blue-50 dark:bg-blue-950/60",       text: "text-blue-700 dark:text-blue-400" },
  ARCHIVED:  { label: "Archivado",  bg: "bg-slate-100 dark:bg-slate-800",       text: "text-slate-500 dark:text-slate-400" },
};

export function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
  return (
    <span className={`badge ${config.bg} ${config.text} gap-1.5`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${config.dot}`} />
      {config.label}
    </span>
  );
}

export function PriorityBadge({ priority }) {
  const config = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.MEDIUM;
  return (
    <span className={`badge ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  );
}

export function ProjectStatusBadge({ status }) {
  const config = PROJECT_STATUS_CONFIG[status] || PROJECT_STATUS_CONFIG.ACTIVE;
  return (
    <span className={`badge ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  );
}

export function ProgressBar({ percent, color }) {
  const pct = Math.min(100, Math.max(0, percent));
  return (
    <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-700 ease-out"
        style={{ width: `${pct}%`, backgroundColor: color || "#6366f1" }}
      />
    </div>
  );
}

export function Avatar({ src, name, size = "sm" }) {
  const sizes = { xs: "w-6 h-6 text-[10px]", sm: "w-8 h-8 text-xs", md: "w-10 h-10 text-sm" };
  const s = sizes[size];

  if (src) {
    return <img src={src} alt={name || ""} className={`${s} rounded-full object-cover flex-shrink-0`} referrerPolicy="no-referrer" />;
  }

  return (
    <div className={`${s} bg-gradient-to-br from-brand-400 to-violet-500 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0`}>
      {name?.charAt(0)?.toUpperCase() || "?"}
    </div>
  );
}

export function AvatarStack({ users, max = 3 }) {
  const shown = users.slice(0, max);
  const remaining = users.length - max;

  return (
    <div className="flex -space-x-2">
      {shown.map((u, i) => (
        <div key={i} className="ring-2 ring-white dark:ring-slate-900 rounded-full">
          <Avatar src={u.image} name={u.name} size="xs" />
        </div>
      ))}
      {remaining > 0 && (
        <div className="w-6 h-6 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white dark:ring-slate-900">
          +{remaining}
        </div>
      )}
    </div>
  );
}
