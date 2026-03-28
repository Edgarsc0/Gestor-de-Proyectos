// src/components/Badges.tsx
"use client";

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  PENDING:     { label: "Pendiente",    bg: "bg-slate-100",  text: "text-slate-600",  dot: "bg-slate-400" },
  IN_PROGRESS: { label: "En progreso",  bg: "bg-blue-50",    text: "text-blue-700",   dot: "bg-blue-500" },
  IN_REVIEW:   { label: "En revisión",  bg: "bg-amber-50",   text: "text-amber-700",  dot: "bg-amber-500" },
  COMPLETED:   { label: "Completada",   bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
};

const PRIORITY_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  LOW:    { label: "Baja",    bg: "bg-slate-100",  text: "text-slate-500" },
  MEDIUM: { label: "Media",   bg: "bg-blue-50",    text: "text-blue-600" },
  HIGH:   { label: "Alta",    bg: "bg-orange-50",  text: "text-orange-600" },
  URGENT: { label: "Urgente", bg: "bg-red-50",     text: "text-red-600" },
};

const PROJECT_STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  ACTIVE:    { label: "Activo",     bg: "bg-emerald-50", text: "text-emerald-700" },
  PAUSED:    { label: "Pausado",    bg: "bg-amber-50",   text: "text-amber-700" },
  COMPLETED: { label: "Completado", bg: "bg-blue-50",    text: "text-blue-700" },
  ARCHIVED:  { label: "Archivado",  bg: "bg-slate-100",  text: "text-slate-500" },
};

export function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
  return (
    <span className={`badge ${config.bg} ${config.text} gap-1.5`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: string }) {
  const config = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.MEDIUM;
  return (
    <span className={`badge ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  );
}

export function ProjectStatusBadge({ status }: { status: string }) {
  const config = PROJECT_STATUS_CONFIG[status] || PROJECT_STATUS_CONFIG.ACTIVE;
  return (
    <span className={`badge ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  );
}

export function ProgressBar({ percent, color }: { percent: number; color?: string }) {
  return (
    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-500 ease-out"
        style={{
          width: `${Math.min(100, Math.max(0, percent))}%`,
          backgroundColor: color || "#6366f1",
        }}
      />
    </div>
  );
}

export function Avatar({ src, name, size = "sm" }: { src?: string | null; name?: string | null; size?: "xs" | "sm" | "md" }) {
  const sizes = { xs: "w-6 h-6 text-[10px]", sm: "w-8 h-8 text-xs", md: "w-10 h-10 text-sm" };
  const s = sizes[size];

  if (src) {
    return <img src={src} alt={name || ""} className={`${s} rounded-full object-cover flex-shrink-0`} referrerPolicy="no-referrer" />;
  }

  return (
    <div className={`${s} bg-brand-100 text-brand-600 rounded-full flex items-center justify-center font-bold flex-shrink-0`}>
      {name?.charAt(0)?.toUpperCase() || "?"}
    </div>
  );
}

export function AvatarStack({ users, max = 3 }: { users: { name?: string | null; image?: string | null }[]; max?: number }) {
  const shown = users.slice(0, max);
  const remaining = users.length - max;

  return (
    <div className="flex -space-x-2">
      {shown.map((u, i) => (
        <div key={i} className="ring-2 ring-white rounded-full">
          <Avatar src={u.image} name={u.name} size="xs" />
        </div>
      ))}
      {remaining > 0 && (
        <div className="w-6 h-6 bg-slate-200 text-slate-500 text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">
          +{remaining}
        </div>
      )}
    </div>
  );
}
