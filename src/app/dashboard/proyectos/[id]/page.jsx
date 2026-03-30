// src/app/dashboard/proyectos/[id]/page.jsx
"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import LoadingScreen from "@/components/LoadingScreen";
import Modal from "@/components/Modal";
import {
  StatusBadge,
  PriorityBadge,
  ProgressBar,
  Avatar,
  AvatarStack,
  ProjectStatusBadge,
} from "@/components/Badges";
import {
  Building2,
  ChevronRight,
  ChevronLeft,
  Plus,
  Loader2,
  MessageSquare,
  Megaphone,
  Send,
  CalendarDays,
} from "lucide-react";
import Select from "@/components/Select";
import PusherClient from "pusher-js";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.03, duration: 0.2, ease: [0.16, 1, 0.3, 1] },
  }),
};

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileIcon(type) {
  if (type.startsWith("image/")) return "🖼️";
  if (type === "application/pdf") return "📄";
  if (type.includes("word") || type.includes("document")) return "📝";
  if (type.includes("sheet") || type.includes("excel")) return "📊";
  if (type.includes("zip") || type.includes("rar")) return "🗜️";
  return "📁";
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
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
            onClick={onClose}
          />
          <motion.div
            key="confirm-modal"
            initial={{ opacity: 0, scale: 0.95, x: "-50%", y: "-50%" }}
            animate={{ opacity: 1, scale: 1, x: "-50%", y: "-50%" }}
            exit={{ opacity: 0, scale: 0.95, x: "-50%", y: "-50%" }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="fixed left-1/2 top-1/2 w-[90%] max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl z-[100] overflow-hidden"
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

function ActionOverlay({ isProcessing, errorMsg, onErrorClose }) {
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
        showCancel={false}
      />
    </>
  );
}

export default function ProjectDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { data: session } = useSession();

  const userRole = session?.user?.role;
  const isSuperAdmin = userRole === "SUPERADMIN";
  const TABS_FOR_ROLE = ["Tablero", "Equipo", "Archivos", "Foro", "Mensajes"];

  const [project, setProject] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(TABS_FOR_ROLE[0]);

  // Task state
  const [editTask, setEditTask] = useState(null);
  const [addingToCol, setAddingToCol] = useState(null);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskFile, setNewTaskFile] = useState(null);
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    assigneeId: "",
    priority: "MEDIUM",
    dueDate: "",
    columnId: "",
  });
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showCreateDatePicker, setShowCreateDatePicker] = useState(false);
  const [showEditDatePicker, setShowEditDatePicker] = useState(false);
  const [addingColumn, setAddingColumn] = useState(false);
  const [newColumnName, setNewColumnName] = useState("");
  const [draggingTaskId, setDraggingTaskId] = useState(null);
  const [draggingColId, setDraggingColId] = useState(null);
  const [editingCol, setEditingCol] = useState({ id: null, name: "" });

  // Foro & Mensajes state
  const [forumPosts, setForumPosts] = useState([]);
  const [newPostTitle, setNewPostTitle] = useState("");
  const [newPostContent, setNewPostContent] = useState("");
  const [newPostFile, setNewPostFile] = useState(null);
  const [activeChatUser, setActiveChatUser] = useState(null);
  const [privateMessages, setPrivateMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [newMessageFile, setNewMessageFile] = useState(null);
  const messagesEndRef = useRef(null);

  // Kanban scroll
  const kanbanRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = kanbanRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }, []);

  const scrollKanban = useCallback((dir) => {
    kanbanRef.current?.scrollBy({ left: dir * 316, behavior: "smooth" });
  }, []);

  const handleKanbanDragOver = useCallback(
    (e) => {
      e.preventDefault();
      if (!kanbanRef.current || !draggingTaskId) return;

      const container = kanbanRef.current;
      const { left, right } = container.getBoundingClientRect();
      const scrollZone = 100;
      const scrollSpeed = 15;

      if (e.clientX > right - scrollZone) {
        container.scrollLeft += scrollSpeed;
      } else if (e.clientX < left + scrollZone) {
        container.scrollLeft -= scrollSpeed;
      }
    },
    [draggingTaskId],
  );

  // File state
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  // Project status edit
  const [kanbanFilter, setKanbanFilter] = useState("all");

  // Modal & Overlay states
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false });
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const fetchProject = useCallback(async () => {
    const [pRes, mRes] = await Promise.all([
      fetch(`/api/projects/${id}`),
      fetch("/api/members"),
    ]);
    if (!pRes.ok) {
      router.push("/dashboard/proyectos");
      return;
    }
    const [pData, mData] = await Promise.all([pRes.json(), mRes.json()]);

    // Helper para incluir a los miembros del área virtualmente si no están en la base de datos
    const injectAreaMembers = (proj, mems) => {
      if (!proj.assignments) proj.assignments = [];

      mems.forEach((m) => {
        const isInArea =
          proj.areaId &&
          m.areas?.some(
            (a) => a.areaId === proj.areaId || a.area?.id === proj.areaId,
          );

        if (isInArea) {
          if (
            !proj.assignments.some(
              (a) => a.user?.id === m.id || a.user?.email === m.email,
            )
          ) {
            proj.assignments.push({
              id: `virtual-${m.id}`,
              role: m.role === "TITULAR" ? "Titular" : "Colaborador",
              user: m,
              userId: m.id,
              projectId: proj.id,
              assignedAt: new Date().toISOString(),
            });
          }
        }
      });

      // Ordenar para que el Titular salga primero
      proj.assignments.sort((a, b) =>
        a.role === "Titular" ? -1 : b.role === "Titular" ? 1 : 0,
      );
      return proj;
    };

    // Si el proyecto no tiene columnas, crear las por defecto automáticamente
    if (!pData.columns || pData.columns.length === 0) {
      const DEFAULT_COLUMNS = [
        { name: "Pendiente", color: "#94a3b8", order: 0 },
        { name: "En Progreso", color: "#3b82f6", order: 1 },
        { name: "En Revisión", color: "#f59e0b", order: 2 },
        { name: "Completado", color: "#10b981", order: 3 },
      ];
      await Promise.all(
        DEFAULT_COLUMNS.map((c) =>
          fetch("/api/columns", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...c, projectId: id }),
          }),
        ),
      );
      // Recargar con columnas creadas
      const refreshed = await fetch(`/api/projects/${id}`);
      const refreshedData = await refreshed.json();
      setProject(injectAreaMembers(refreshedData, mData));
    } else {
      setProject(injectAreaMembers(pData, mData));
    }

    // Filtramos para que no puedas asignar tareas o proyectos a los Administradores
    setMembers(
      mData.filter((m) => m.role !== "ADMIN" && m.role !== "SUPERADMIN"),
    );
    setLoading(false);
  }, [id, router]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  // Escuchar cambios en tareas del proyecto en tiempo real (Pusher)
  useEffect(() => {
    if (!id) return;
    const client = new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
    });
    const channel = client.subscribe(`project-${id}`);
    channel.bind("task-updated", () => {
      fetchProject();
    });
    return () => {
      channel.unbind_all();
      client.unsubscribe(`project-${id}`);
      client.disconnect();
    };
  }, [id, fetchProject]);

  // Actualizar botones de scroll cuando cambien las columnas
  useEffect(() => {
    setTimeout(updateScrollState, 50);
  }, [project?.columns?.length]);

  // Manejar el desplazamiento del Kanban con las teclas del teclado
  useEffect(() => {
    const handleKeyDown = (e) => {
      // No hacer nada si el usuario está escribiendo o si no estamos en la pestaña "Tablero"
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA" ||
        activeTab !== "Tablero"
      ) {
        return;
      }

      if (e.key === "ArrowLeft" || e.key === "<") scrollKanban(-1);
      if (e.key === "ArrowRight" || e.key === ">") scrollKanban(1);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeTab, scrollKanban]);

  // Cargar publicaciones del foro
  const fetchPosts = useCallback(async () => {
    try {
      const res = await fetch(`/api/posts?projectId=${id}`);
      if (res.ok) {
        const data = await res.json();
        setForumPosts(data);
      }
    } catch (error) {
      console.error("Error al cargar publicaciones:", error);
    }
  }, [id]);

  useEffect(() => {
    if (activeTab === "Foro") fetchPosts();
  }, [activeTab, fetchPosts]);

  // Cargar mensajes privados
  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/messages?projectId=${id}`);
      if (res.ok) {
        const data = await res.json();
        setPrivateMessages(data);
      }
    } catch (error) {
      console.error("Error al cargar mensajes:", error);
    }
  }, [id]);

  useEffect(() => {
    if (activeTab === "Mensajes") fetchMessages();
  }, [activeTab, fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [privateMessages, activeChatUser]);

  // ─── Task actions ────────────────────────────────────────────

  const quickAddTask = async (columnId) => {
    if (!newTaskTitle.trim()) {
      setAddingToCol(null);
      return;
    }
    setIsProcessing(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTaskTitle,
          projectId: id,
          columnId,
          priority: "MEDIUM",
        }),
      });
      if (!res.ok)
        throw new Error(
          (await res.json().catch(() => ({}))).error ||
            "Error al crear la tarea.",
        );
      setNewTaskTitle("");
      setAddingToCol(null);
      await fetchProject();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const createTask = async () => {
    if (!taskForm.title.trim()) {
      setErrorMsg("El título de la tarea es obligatorio.");
      return;
    }
    const colId = taskForm.columnId || columns[0]?.id || null;
    setIsProcessing(true);
    try {
      let fileUrl = null;
      let fileName = null;
      if (newTaskFile) {
        if (newTaskFile.size > 5 * 1024 * 1024) {
          throw new Error("El archivo no debe superar los 5MB.");
        }
        fileUrl = await fileToBase64(newTaskFile);
        fileName = newTaskFile.name;
      }

      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...taskForm,
          projectId: id,
          columnId: colId,
          assigneeId: taskForm.assigneeId || null,
          fileUrl,
          fileName,
        }),
      });
      if (!res.ok)
        throw new Error(
          (await res.json().catch(() => ({}))).error ||
            "Error al crear la tarea.",
        );
      setTaskForm({
        title: "",
        description: "",
        assigneeId: "",
        priority: "MEDIUM",
        dueDate: "",
        columnId: "",
      });
      setNewTaskFile(null);
      setShowTaskModal(false);
      await fetchProject();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const updateTask = async (taskId, data) => {
    setIsProcessing(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: taskId, ...data }),
      });
      if (!res.ok)
        throw new Error(
          (await res.json().catch(() => ({}))).error ||
            "Error al actualizar la tarea.",
        );
      await fetchProject();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const deleteTask = async (taskId) => {
    setConfirmDialog({
      isOpen: true,
      title: "Eliminar tarea",
      message:
        "¿Estás seguro de que deseas eliminar esta tarea de forma permanente?",
      onConfirm: async () => {
        setIsProcessing(true);
        try {
          const res = await fetch(`/api/tasks?id=${taskId}`, {
            method: "DELETE",
          });
          if (!res.ok)
            throw new Error(
              (await res.json().catch(() => ({}))).error ||
                "Error al eliminar la tarea.",
            );
          setEditTask(null);
          await fetchProject();
        } catch (err) {
          setErrorMsg(err.message);
        } finally {
          setIsProcessing(false);
        }
      },
    });
  };

  // Calcula el status según la posición de la columna para mantener sincronía con el dashboard
  const getStatusForColumn = (colId) => {
    const cols = (project?.columns || []).sort((a, b) => a.order - b.order);
    const idx = cols.findIndex((c) => c.id === colId);
    if (idx <= 0) return "PENDING";
    if (idx === cols.length - 1) return "COMPLETED";
    if (cols.length >= 4 && idx === cols.length - 2) return "IN_REVIEW";
    return "IN_PROGRESS";
  };

  const moveTask = (taskId, newColumnId) =>
    updateTask(taskId, { columnId: newColumnId, status: getStatusForColumn(newColumnId) });

  const createColumn = async () => {
    if (!newColumnName.trim()) {
      setAddingColumn(false);
      return;
    }
    setIsProcessing(true);
    try {
      const res = await fetch("/api/columns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newColumnName,
          projectId: id,
          color: "#94a3b8",
        }),
      });
      if (!res.ok) throw new Error("Error al crear la columna.");
      setNewColumnName("");
      setAddingColumn(false);
      await fetchProject();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const renameColumn = async (colId, name) => {
    if (!name.trim()) {
      setEditingCol({ id: null, name: "" });
      return;
    }
    try {
      await fetch("/api/columns", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: colId, name: name.trim() }),
      });
      setEditingCol({ id: null, name: "" });
      await fetchProject();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const deleteColumn = (colId, colName) => {
    setConfirmDialog({
      isOpen: true,
      title: "Eliminar columna",
      message: `¿Eliminar la columna "${colName}"? Las tareas que contenga se moverán a la primera columna disponible.`,
      onConfirm: async () => {
        setIsProcessing(true);
        try {
          const res = await fetch(`/api/columns?id=${colId}`, {
            method: "DELETE",
          });
          if (!res.ok) throw new Error("Error al eliminar la columna.");
          await fetchProject();
        } catch (err) {
          setErrorMsg(err.message);
        } finally {
          setIsProcessing(false);
        }
      },
    });
  };

  const handleColumnDrop = async (targetColId, draggedColId) => {
    if (!draggedColId || draggedColId === targetColId) return;

    const draggedIdx = columns.findIndex((c) => c.id === draggedColId);
    const targetIdx = columns.findIndex((c) => c.id === targetColId);

    if (draggedIdx === -1 || targetIdx === -1) return;

    const newColumns = [...columns];
    const [draggedCol] = newColumns.splice(draggedIdx, 1);
    newColumns.splice(targetIdx, 0, draggedCol);

    const updatedColumns = newColumns.map((c, idx) => ({ ...c, order: idx }));
    setProject((prev) => ({ ...prev, columns: updatedColumns }));

    try {
      await Promise.all(
        updatedColumns.map((col) =>
          fetch("/api/columns", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: col.id, order: col.order }),
          }),
        ),
      );
      await fetchProject();
    } catch (err) {
      setErrorMsg("Error al reordenar las columnas.");
      await fetchProject();
    }
  };

  // ─── Team actions ─────────────────────────────────────────────

  const assignMember = async (userId) => {
    setIsProcessing(true);
    try {
      const res = await fetch("/api/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, projectId: id }),
      });
      if (!res.ok)
        throw new Error(
          (await res.json().catch(() => ({}))).error ||
            "Error al asignar al miembro.",
        );
      await fetchProject();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const removeMember = async (userId) => {
    setConfirmDialog({
      isOpen: true,
      title: "Remover miembro",
      message: "¿Quitar a este usuario del proyecto?",
      onConfirm: async () => {
        setIsProcessing(true);
        try {
          const res = await fetch(
            `/api/members?userId=${userId}&projectId=${id}`,
            { method: "DELETE" },
          );
          if (!res.ok)
            throw new Error(
              (await res.json().catch(() => ({}))).error ||
                "Error al remover al miembro.",
            );
          await fetchProject();
        } catch (err) {
          setErrorMsg(err.message);
        } finally {
          setIsProcessing(false);
        }
      },
    });
  };

  // ─── Project actions ──────────────────────────────────────────

  const updateProjectStatus = async (status) => {
    setIsProcessing(true);
    try {
      const res = await fetch("/api/projects", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (!res.ok)
        throw new Error(
          (await res.json().catch(() => ({}))).error ||
            "Error al actualizar el estado del proyecto.",
        );
      await fetchProject();
      setEditingStatus(false);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const deleteProject = async () => {
    setConfirmDialog({
      isOpen: true,
      title: "Eliminar proyecto",
      message:
        "¿Estás seguro de eliminar este proyecto y todas sus tareas permanentemente? Esta acción no se puede deshacer.",
      onConfirm: async () => {
        setIsProcessing(true);
        try {
          const res = await fetch(`/api/projects?id=${id}`, {
            method: "DELETE",
          });
          if (!res.ok)
            throw new Error(
              (await res.json().catch(() => ({}))).error ||
                "Error al eliminar el proyecto.",
            );
          router.push("/dashboard/proyectos");
        } catch (err) {
          setErrorMsg(err.message);
        } finally {
          setIsProcessing(false);
        }
      },
    });
  };

  // ─── File actions ─────────────────────────────────────────────

  const uploadFile = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("projectId", id);
      const res = await fetch("/api/files", { method: "POST", body: fd });
      if (!res.ok)
        throw new Error(
          (await res.json().catch(() => ({}))).error ||
            "Error al subir el archivo.",
        );
      await fetchProject();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setUploading(false);
    }
  };

  const deleteFile = async (fileId) => {
    setConfirmDialog({
      isOpen: true,
      title: "Eliminar archivo",
      message: "¿Eliminar este archivo del proyecto de forma permanente?",
      onConfirm: async () => {
        setIsProcessing(true);
        try {
          const res = await fetch(`/api/files?id=${fileId}`, {
            method: "DELETE",
          });
          if (!res.ok)
            throw new Error(
              (await res.json().catch(() => ({}))).error ||
                "Error al eliminar el archivo.",
            );
          await fetchProject();
        } catch (err) {
          setErrorMsg(err.message);
        } finally {
          setIsProcessing(false);
        }
      },
    });
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  };

  // ─── Foro & Chat actions ───────────────

  const fileToBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });

  const handleCreatePost = async () => {
    if (!newPostContent.trim()) return;
    setIsProcessing(true);
    try {
      let fileUrl = null;
      let fileName = null;
      if (newPostFile) {
        if (newPostFile.size > 5 * 1024 * 1024)
          throw new Error("El archivo no debe superar los 5MB.");
        fileUrl = await fileToBase64(newPostFile);
        fileName = newPostFile.name;
      }

      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newPostTitle,
          content: newPostContent,
          fileUrl,
          fileName,
          projectId: id,
        }),
      });
      if (!res.ok) throw new Error("Error al publicar en el foro.");
      const savedPost = await res.json();

      setForumPosts([savedPost, ...forumPosts]);
      setNewPostTitle("");
      setNewPostContent("");
      setNewPostFile(null);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSendMessage = async () => {
    if ((!newMessage.trim() && !newMessageFile) || !activeChatUser) return;

    let fileUrl = null;
    let fileName = null;
    if (newMessageFile) {
      if (newMessageFile.size > 5 * 1024 * 1024) {
        setErrorMsg("El archivo no debe superar los 5MB.");
        return;
      }
      fileUrl = await fileToBase64(newMessageFile);
      fileName = newMessageFile.name;
    }

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: newMessage,
          fileUrl,
          fileName,
          receiverId: activeChatUser.id,
          projectId: id,
        }),
      });
      if (!res.ok) throw new Error("Error al enviar el mensaje.");
      const savedMsg = await res.json();

      setPrivateMessages((prev) => [...prev, savedMsg]);
      setNewMessage("");
      setNewMessageFile(null);
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  // ─── Render ───────────────────────────────────────────────────

  if (loading) {
    return <LoadingScreen />;
  }

  if (!project) return null;

  // Columnas dinámicas ordenadas
  const columns = project.columns?.sort((a, b) => a.order - b.order) || [];
  const completadoCol =
    columns.find((c) => c.name.trim().toLowerCase() === "completado") ||
    (columns.length > 0 ? columns[columns.length - 1] : null);
  const lastColumnId = completadoCol ? completadoCol.id : null;

  const totalTasks = project.tasks.length;
  const completedTasks = lastColumnId
    ? project.tasks.filter((t) => t.columnId === lastColumnId).length
    : 0;

  const progress =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const assignedIds = new Set(project.assignments.map((a) => a.user.id));

  return (
    <div className="space-y-6">
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { display: none; }
        .custom-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* Breadcrumb */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="show"
        custom={0}
        className="flex items-center gap-1.5 text-sm flex-wrap"
      >
        <Link
          href="/dashboard/proyectos"
          className="text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
        >
          Proyectos
        </Link>
        {project.area && (
          <>
            <ChevronRight size={13} className="text-slate-300 flex-shrink-0" />
            <Link
              href={`/dashboard/areas/${project.area.id}`}
              className="flex items-center gap-1.5 text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
            >
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: project.area.color }}
              />
              {project.area.name}
            </Link>
          </>
        )}
        <ChevronRight size={13} className="text-slate-300 flex-shrink-0" />
        <span className="text-slate-700 dark:text-slate-300 font-medium truncate">
          {project.name}
        </span>
      </motion.div>

      {/* Header */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="show"
        custom={1}
        className="card p-6 relative overflow-hidden"
      >
        {/* Color accent bar */}
        <div
          className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl"
          style={{ backgroundColor: project.color }}
        />

        <div className="flex flex-col sm:flex-row sm:items-start gap-5 pt-2">
          {/* Icon */}
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-display font-bold text-2xl flex-shrink-0 shadow-xl"
            style={{
              backgroundColor: project.color,
              boxShadow: `0 8px 24px ${project.color}50`,
            }}
          >
            {project.name.charAt(0)}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3 mb-1">
              <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-slate-100">
                {project.name}
              </h1>
              <ProjectStatusBadge status={project.status} />
              {project.area && (
                <Link
                  href={`/dashboard/areas/${project.area.id}`}
                  className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full text-white hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: project.area.color }}
                >
                  <Building2 size={11} />
                  {project.area.name}
                </Link>
              )}
            </div>
            {project.description && (
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">
                {project.description}
              </p>
            )}

            {/* Stats row */}
            <div className="flex flex-wrap items-center gap-6 mb-4">
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
                  {totalTasks - completedTasks}
                </p>
                <p className="text-xs text-slate-400">En proceso</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-slate-700 dark:text-slate-300">
                  {project.assignments.length}
                </p>
                <p className="text-xs text-slate-400">Miembros</p>
              </div>
              {project.assignments.length > 0 && (
                <AvatarStack
                  users={project.assignments.map((a) => a.user)}
                  max={5}
                />
              )}
            </div>

            {/* Progress */}
            <div className="max-w-sm">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-slate-500 dark:text-slate-400">
                  Progreso general
                </span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {progress}%
                </span>
              </div>
              <ProgressBar percent={progress} color={project.color} />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="w-36">
              <Select
                size="sm"
                value={project.status}
                onChange={(v) => updateProjectStatus(v)}
                options={[
                  { value: "ACTIVE", label: "Activo" },
                  { value: "PAUSED", label: "Pausado" },
                  { value: "COMPLETED", label: "Completado" },
                  { value: "ARCHIVED", label: "Archivado" },
                ]}
              />
            </div>
            <button
              onClick={deleteProject}
              className="btn-ghost text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
            >
              Eliminar
            </button>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="show"
        custom={2}
        className="flex gap-1 bg-slate-100 dark:bg-slate-800/60 p-1 rounded-xl w-fit"
      >
        {TABS_FOR_ROLE.map((tab) => (
          <motion.button
            key={tab}
            whileTap={{ scale: 0.96 }}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200
              ${
                activeTab === tab
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
          >
            {tab}
          </motion.button>
        ))}
      </motion.div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        {/* ─── TABLERO ─── */}
        {activeTab === "Tablero" && (
          <motion.div
            key="tablero"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-4">
                <p className="text-sm text-slate-500 dark:text-slate-400 hidden sm:block">
                  {totalTasks} tarea{totalTasks !== 1 ? "s" : ""} ·{" "}
                  {completedTasks} completada{completedTasks !== 1 ? "s" : ""}
                </p>
                {userRole !== "ADMIN" && (
                  <div className="w-56">
                    <Select
                      value={kanbanFilter}
                      onChange={setKanbanFilter}
                      options={[
                        { value: "all", label: "Tablero global del equipo" },
                        {
                          value: session?.user?.id || "me",
                          label: "Mi tablero (Mis tareas)",
                        },
                        ...project.assignments
                          .filter((a) => a.user.id !== session?.user?.id)
                          .map((a) => ({
                            value: a.user.id,
                            label: `Tablero de ${a.user.name?.split(" ")[0] || a.user.email}`,
                          })),
                      ]}
                    />
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {userRole !== "ADMIN" && (
                  <div className="flex items-center gap-2 border-r border-slate-200 dark:border-slate-800 pr-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setAddingColumn(true)}
                      className="btn-secondary text-xs"
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                      >
                        <rect x="3" y="3" width="7" height="18" rx="1" />
                        <rect x="14" y="3" width="7" height="18" rx="1" />
                      </svg>
                      Añadir columna
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setShowTaskModal(true)}
                      className="btn-primary text-xs"
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                      >
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                      Nueva tarea
                    </motion.button>
                  </div>
                )}

                {/* Botones de navegación horizontal */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => scrollKanban(-1)}
                    disabled={!canScrollLeft}
                    className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    onClick={() => scrollKanban(1)}
                    disabled={!canScrollRight}
                    className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>

            <div
              ref={kanbanRef}
              onScroll={updateScrollState}
              onDragOver={handleKanbanDragOver}
              className="flex gap-4 pb-4 custom-scrollbar"
              style={{ overflowX: "auto" }}
            >
              {columns.map((col, colIdx) => {
                const isFirstCol = colIdx === 0;
                const isCompletado =
                  col.name.trim().toLowerCase() === "completado";
                const colTasks = project.tasks.filter(
                  (t) =>
                    (t.columnId === col.id || (isFirstCol && !t.columnId)) &&
                    (kanbanFilter === "all" || t.assigneeId === kanbanFilter),
                );
                return (
                  <motion.div
                    key={col.id}
                    variants={fadeUp}
                    initial="hidden"
                    animate="show"
                    custom={colIdx * 0.3}
                    className={`w-[300px] flex-shrink-0 flex flex-col ${draggingColId === col.id ? "opacity-40 scale-95" : "transition-transform duration-200"}`}
                    onDragOver={(e) => {
                      if (draggingColId) e.preventDefault();
                    }}
                    onDrop={(e) => {
                      const type = e.dataTransfer.getData("type");
                      if (type === "column" || draggingColId) {
                        e.preventDefault();
                        e.stopPropagation();
                        handleColumnDrop(
                          col.id,
                          draggingColId || e.dataTransfer.getData("colId"),
                        );
                        setDraggingColId(null);
                      }
                    }}
                  >
                    {/* Column header */}
                    <div
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/60 group/col ${userRole !== "ADMIN" ? "cursor-grab active:cursor-grabbing" : ""}`}
                      draggable={
                        userRole !== "ADMIN" && editingCol.id !== col.id
                      }
                      onDragStart={(e) => {
                        e.dataTransfer.setData("type", "column");
                        e.dataTransfer.setData("colId", col.id);
                        setDraggingColId(col.id);
                      }}
                      onDragEnd={() => setDraggingColId(null)}
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: col.color || "#94a3b8" }}
                      />
                      {userRole !== "ADMIN" &&
                      editingCol.id === col.id &&
                      !isCompletado ? (
                        <input
                          autoFocus
                          className="text-sm font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-0.5 flex-1 min-w-0 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                          value={editingCol.name}
                          onChange={(e) =>
                            setEditingCol({ id: col.id, name: e.target.value })
                          }
                          onBlur={() => renameColumn(col.id, editingCol.name)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter")
                              renameColumn(col.id, editingCol.name);
                            if (e.key === "Escape")
                              setEditingCol({ id: null, name: "" });
                          }}
                        />
                      ) : (
                        <span
                          className={`text-sm font-semibold text-slate-700 dark:text-slate-200 flex-1 truncate ${userRole !== "ADMIN" && !isCompletado ? "cursor-pointer hover:text-brand-600 dark:hover:text-brand-400" : ""}`}
                          onDoubleClick={() =>
                            userRole !== "ADMIN" &&
                            !isCompletado &&
                            setEditingCol({ id: col.id, name: col.name })
                          }
                          title={
                            userRole !== "ADMIN" && !isCompletado
                              ? "Doble click para renombrar"
                              : col.name
                          }
                        >
                          {col.name}
                        </span>
                      )}
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400 bg-white/60 dark:bg-slate-900/60 px-1.5 py-0.5 rounded-md flex-shrink-0">
                        {colTasks.length}
                      </span>
                      {userRole !== "ADMIN" && (
                        <>
                          <button
                            onClick={() => {
                              setAddingToCol(col.id);
                              setNewTaskTitle("");
                            }}
                            className="w-5 h-5 flex items-center justify-center rounded-md hover:bg-white/80 dark:hover:bg-slate-900/60 transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                            title="Añadir tarea"
                          >
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                            >
                              <line x1="12" y1="5" x2="12" y2="19" />
                              <line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                          </button>
                          {!isCompletado && (
                            <button
                              onClick={() => deleteColumn(col.id, col.name)}
                              className="w-5 h-5 flex items-center justify-center rounded-md opacity-0 group-hover/col:opacity-100 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all text-slate-300 hover:text-red-500"
                              title="Eliminar columna"
                            >
                              <svg
                                width="11"
                                height="11"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                              >
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6l-1 14H6L5 6" />
                                <path d="M10 11v6M14 11v6" />
                                <path d="M9 6V4h6v2" />
                              </svg>
                            </button>
                          )}
                        </>
                      )}
                    </div>

                    {/* Quick add input */}
                    <AnimatePresence>
                      {addingToCol === col.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.15 }}
                        >
                          <div className="card p-3 space-y-2">
                            <input
                              autoFocus
                              className="input-field text-sm py-1.5"
                              placeholder="Título de la tarea…"
                              value={newTaskTitle}
                              onChange={(e) => setNewTaskTitle(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") quickAddTask(col.id);
                                if (e.key === "Escape") setAddingToCol(null);
                              }}
                            />
                            <div className="flex gap-1.5">
                              <button
                                onClick={() => quickAddTask(col.id)}
                                className="btn-primary text-xs flex-1 py-1.5"
                              >
                                Añadir
                              </button>
                              <button
                                onClick={() => setAddingToCol(null)}
                                className="btn-secondary text-xs py-1.5 px-3"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Task cards */}
                    <div
                      className="space-y-2 flex-1 overflow-y-auto p-1 -mx-1 -mb-1 mt-3 rounded-xl transition-colors custom-scrollbar"
                      style={{
                        minHeight: 120,
                        maxHeight: "calc(100vh - 420px)",
                      }}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const type = e.dataTransfer.getData("type") || "task";
                        if (type === "task") {
                          const taskId = e.dataTransfer.getData("taskId");
                          if (taskId && taskId !== "") moveTask(taskId, col.id);
                        }
                      }}
                    >
                      {colTasks.map((task, ti) => (
                        <motion.div
                          key={task.id}
                          variants={fadeUp}
                          initial="hidden"
                          animate="show"
                          custom={colIdx * 0.15 + ti * 0.04}
                          whileHover={{ y: -2, transition: { duration: 0.1 } }}
                          className={`card-hover p-4 cursor-pointer ${draggingTaskId === task.id ? "opacity-50 scale-95 shadow-none" : ""}`}
                          onClick={() => setEditTask(task)}
                          draggable
                          onDragStart={(e) => {
                            e.stopPropagation();
                            e.dataTransfer.setData("type", "task");
                            e.dataTransfer.setData("taskId", task.id);
                            setDraggingTaskId(task.id);
                          }}
                          onDragEnd={() => setDraggingTaskId(null)}
                        >
                          <p
                            className={`text-sm font-medium mb-3 line-clamp-2
                            ${task.columnId === lastColumnId ? "line-through text-slate-400" : "text-slate-800 dark:text-slate-200"}`}
                          >
                            {task.title}
                          </p>
                          <div className="flex items-center justify-between gap-2">
                            <PriorityBadge priority={task.priority} />
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {task.fileName && (
                                <span
                                  className="text-slate-400"
                                  title="Contiene archivo adjunto"
                                >
                                  <svg
                                    width="12"
                                    height="12"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                  >
                                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
                                  </svg>
                                </span>
                              )}
                              {task.dueDate && (
                                <span className="text-[11px] text-slate-400">
                                  {new Date(task.dueDate).toLocaleDateString(
                                    "es-MX",
                                    { month: "short", day: "numeric" },
                                  )}
                                </span>
                              )}
                              {task.assignee ? (
                                <Avatar
                                  src={task.assignee.image}
                                  name={task.assignee.name}
                                  size="xs"
                                />
                              ) : (
                                <div className="w-6 h-6 rounded-full border-2 border-dashed border-slate-200 dark:border-slate-600" />
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                      {colTasks.length === 0 && addingToCol !== col.id && (
                        <div className="h-20 rounded-xl border-2 border-dashed border-slate-100 dark:border-slate-800 flex items-center justify-center">
                          <p className="text-xs text-slate-300 dark:text-slate-700">
                            Vacío
                          </p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}

              {/* Input nueva columna (se abre desde el botón de la toolbar) */}
              {userRole !== "ADMIN" && addingColumn && (
                <div className="w-80 flex-shrink-0 snap-center pt-2">
                  <div className="card p-3 space-y-2">
                    <input
                      autoFocus
                      className="input-field text-sm py-1.5"
                      placeholder="Nombre de la columna..."
                      value={newColumnName}
                      onChange={(e) => setNewColumnName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") createColumn();
                        if (e.key === "Escape") setAddingColumn(false);
                      }}
                    />
                    <div className="flex gap-1.5">
                      <button
                        onClick={createColumn}
                        className="btn-primary text-xs flex-1 py-1.5"
                      >
                        Guardar
                      </button>
                      <button
                        onClick={() => setAddingColumn(false)}
                        className="btn-secondary text-xs py-1.5 px-3"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ─── EQUIPO ─── */}
        {activeTab === "Equipo" && (
          <motion.div
            key="equipo"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="space-y-6"
          >
            {/* Assigned members */}
            {project.assignments.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                  Miembros asignados ({project.assignments.length})
                </h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  {project.assignments.map(({ user }, i) => {
                    const userTasks = project.tasks.filter(
                      (t) => t.assigneeId === user.id,
                    );
                    const done = userTasks.filter(
                      (t) => t.columnId === lastColumnId,
                    ).length;
                    const targetRole =
                      user.role || members.find((m) => m.id === user.id)?.role;
                    return (
                      <motion.div
                        key={user.id}
                        variants={fadeUp}
                        initial="hidden"
                        animate="show"
                        custom={i * 0.08}
                        className="card p-4"
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <Avatar src={user.image} name={user.name} size="md" />
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate">
                              {user.name || "Sin nombre"}
                            </p>
                            <p className="text-xs text-slate-400 truncate">
                              {user.email}
                            </p>
                          </div>
                          {targetRole !== "TITULAR" && userRole !== "MEMBER" && (
                            <button
                              onClick={() => removeMember(user.id)}
                              className="text-xs text-red-400 hover:text-red-600 font-medium flex-shrink-0 transition-colors"
                            >
                              Quitar
                            </button>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                          <span>
                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                              {userTasks.length}
                            </span>{" "}
                            tareas
                          </span>
                          <span>
                            <span className="font-semibold text-emerald-600">
                              {done}
                            </span>{" "}
                            completadas
                          </span>
                        </div>
                        {userTasks.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {userTasks.slice(0, 3).map((t) => (
                              <div
                                key={t.id}
                                className="flex items-center gap-2"
                              >
                                <span
                                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                                  style={{
                                    backgroundColor:
                                      columns.find((c) => c.id === t.columnId)
                                        ?.color || "#94a3b8",
                                  }}
                                />
                                <span
                                  className={`text-xs truncate flex-1 ${t.columnId === lastColumnId ? "line-through text-slate-400" : "text-slate-600 dark:text-slate-400"}`}
                                >
                                  {t.title}
                                </span>
                              </div>
                            ))}
                            {userTasks.length > 3 && (
                              <p className="text-[11px] text-slate-400">
                                +{userTasks.length - 3} más
                              </p>
                            )}
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Add members */}
            {userRole !== "MEMBER" && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                  Añadir al proyecto
                </h3>
                <div className="space-y-2">
                  {members
                    .filter((m) => !assignedIds.has(m.id))
                    .map((m, i) => (
                      <motion.div
                        key={m.id}
                        variants={fadeUp}
                        initial="hidden"
                        animate="show"
                        custom={i * 0.06}
                        className="flex items-center gap-3 p-3 card hover:shadow-md transition-shadow"
                      >
                        <Avatar src={m.image} name={m.name} size="sm" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">
                            {m.name || m.email}
                          </p>
                          <p className="text-xs text-slate-400 truncate">
                            {m.email}
                          </p>
                        </div>
                        <button
                          onClick={() => assignMember(m.id)}
                          className="btn-primary text-xs py-1.5"
                        >
                          Asignar
                        </button>
                      </motion.div>
                    ))}
                  {members.filter((m) => !assignedIds.has(m.id)).length === 0 && (
                    <p className="text-sm text-slate-400 text-center py-6">
                      Todos los miembros ya están en este proyecto.
                    </p>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ─── ARCHIVOS ─── */}
        {activeTab === "Archivos" && (
          <motion.div
            key="archivos"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="space-y-5"
          >
            {/* Drop zone */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="show"
              custom={0}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleFileDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-200
                ${
                  dragOver
                    ? "border-brand-400 bg-brand-50/60 dark:bg-brand-950/20 scale-[1.01]"
                    : "border-slate-200 dark:border-slate-700 hover:border-brand-300 dark:hover:border-brand-700 hover:bg-slate-50 dark:hover:bg-slate-800/30"
                }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={(e) => uploadFile(e.target.files[0])}
              />
              {uploading ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    {[0, 0.15, 0.3].map((delay, i) => (
                      <motion.div
                        key={i}
                        className="w-2 h-2 rounded-full bg-brand-500"
                        animate={{ opacity: [0.3, 1, 0.3], y: [0, -5, 0] }}
                        transition={{
                          duration: 0.8,
                          repeat: Infinity,
                          ease: "easeInOut",
                          delay,
                        }}
                      />
                    ))}
                  </div>
                  <p className="text-sm text-slate-500">Subiendo archivo…</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center">
                    <svg
                      width="22"
                      height="22"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#94a3b8"
                      strokeWidth="2"
                      strokeLinecap="round"
                    >
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Arrastra un archivo aquí
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      o haz clic para seleccionar
                    </p>
                  </div>
                </div>
              )}
            </motion.div>

            {/* File list */}
            {project.files.length > 0 ? (
              <div className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {project.files.length} archivo
                  {project.files.length !== 1 ? "s" : ""}
                </h3>
                {project.files.map((file, i) => (
                  <motion.div
                    key={file.id}
                    variants={fadeUp}
                    initial="hidden"
                    animate="show"
                    custom={i * 0.06}
                    className="card-hover flex items-center gap-4 p-4"
                  >
                    <div className="text-2xl flex-shrink-0">
                      {fileIcon(file.type)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-slate-400">
                        {formatBytes(file.size)} ·{" "}
                        {new Date(file.createdAt).toLocaleDateString("es-MX", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                        {file.uploadedBy &&
                          ` · ${file.uploadedBy.name?.split(" ")[0]}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-secondary text-xs py-1.5 px-3"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Ver
                      </a>
                      <button
                        onClick={() => deleteFile(file.id)}
                        className="btn-ghost text-xs text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 py-1.5 px-2"
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                        >
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                          <path d="M10 11v6" />
                          <path d="M14 11v6" />
                        </svg>
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              !uploading && (
                <motion.div
                  variants={fadeUp}
                  initial="hidden"
                  animate="show"
                  custom={1}
                  className="text-center py-4 text-sm text-slate-400"
                >
                  No hay archivos adjuntos aún.
                </motion.div>
              )
            )}
          </motion.div>
        )}

        {/* ─── FORO ─── */}
        {activeTab === "Foro" && (
          <motion.div
            key="foro"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="space-y-6"
          >
            <div className="card p-0 overflow-hidden mb-6 border border-slate-200 dark:border-slate-800">
              <div className="p-4 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/50">
                <input
                  value={newPostTitle}
                  onChange={(e) => setNewPostTitle(e.target.value)}
                  placeholder="Título de la publicación (opcional)"
                  className="w-full bg-transparent text-lg font-semibold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none"
                />
              </div>
              <div className="p-4">
                <textarea
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  placeholder="Escribe tu anuncio, actualización o comparte una idea..."
                  className="w-full bg-transparent resize-none h-24 text-slate-700 dark:text-slate-300 placeholder:text-slate-400 focus:outline-none"
                />
                {newPostFile && (
                  <div className="mt-3 flex items-center gap-3 bg-brand-50/50 dark:bg-brand-900/10 border border-brand-100 dark:border-brand-900/30 text-brand-700 dark:text-brand-300 px-3 py-2 rounded-xl text-sm w-fit">
                    <span className="text-xl">
                      {fileIcon(newPostFile.type)}
                    </span>
                    <span className="max-w-[200px] truncate font-medium">
                      {newPostFile.name}
                    </span>
                    <button
                      onClick={() => setNewPostFile(null)}
                      className="hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-1 rounded-md ml-1 transition-colors"
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M18 6L6 18M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
              <div className="p-3 border-t border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
                <label className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-lg cursor-pointer transition-colors">
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => setNewPostFile(e.target.files[0])}
                  />
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
                  </svg>
                  Adjuntar archivo
                </label>
                <button
                  onClick={handleCreatePost}
                  disabled={!newPostContent.trim()}
                  className="btn-primary flex items-center gap-2 py-1.5 px-4 disabled:opacity-50"
                >
                  <Megaphone size={16} />
                  Publicar
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Publicaciones recientes
              </h3>
              {forumPosts.map((post) => (
                <motion.div
                  key={post.id}
                  variants={fadeUp}
                  initial="hidden"
                  animate="show"
                  className="card p-5 flex gap-4"
                >
                  <Avatar
                    src={post.author?.image}
                    name={post.author?.name}
                    size="md"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                        {post.author?.name || "Usuario"}
                      </span>
                      <span className="text-xs text-slate-400">
                        {new Date(post.createdAt).toLocaleString("es-MX", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </span>
                    </div>
                    {post.title && (
                      <h4 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-1">
                        {post.title}
                      </h4>
                    )}
                    <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap mb-3">
                      {post.content}
                    </p>
                    {post.fileName && (
                      <a
                        href={post.fileUrl}
                        download={post.fileName}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 hover:border-brand-300 dark:hover:border-brand-700 hover:shadow-sm p-2 pr-4 rounded-xl text-sm transition-all w-fit max-w-full group"
                      >
                        <div className="w-10 h-10 rounded-lg bg-white dark:bg-slate-900 flex items-center justify-center text-xl flex-shrink-0 group-hover:bg-brand-50 dark:group-hover:bg-brand-900/20 shadow-sm border border-slate-100 dark:border-slate-800">
                          {post.fileUrl?.startsWith("data:image") ? "🖼️" : "📎"}
                        </div>
                        <span className="truncate font-medium text-slate-700 dark:text-slate-300">
                          {post.fileName}
                        </span>
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          className="text-slate-400 ml-1 group-hover:text-brand-500"
                        >
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="7 10 12 15 17 10" />
                          <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                      </a>
                    )}
                  </div>
                </motion.div>
              ))}
              {forumPosts.length === 0 && (
                <div className="text-center py-12 card bg-slate-50/50 dark:bg-slate-800/20 shadow-none border border-dashed border-slate-200 dark:border-slate-800">
                  <Megaphone
                    size={32}
                    className="mx-auto text-slate-300 dark:text-slate-600 mb-3"
                  />
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Aún no hay publicaciones en el foro.
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Sé el primero en compartir algo con el equipo.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ─── MENSAJES PRIVADOS ─── */}
        {activeTab === "Mensajes" && (
          <motion.div
            key="mensajes"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="flex flex-col sm:flex-row h-[600px] gap-4"
          >
            {/* Sidebar for users */}
            <div className="w-full sm:w-1/3 card flex flex-col overflow-hidden flex-shrink-0">
              <div className="p-4 border-b border-slate-100 dark:border-slate-800/60">
                <h3 className="font-semibold text-sm text-slate-800 dark:text-slate-200">
                  Compañeros del proyecto
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Chat privado cifrado
                </p>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                {project.assignments
                  .filter((a) => a.user.id !== session?.user?.id)
                  .map(({ user }) => (
                    <button
                      key={user.id}
                      onClick={() => setActiveChatUser(user)}
                      className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-colors text-left
                      ${activeChatUser?.id === user.id ? "bg-brand-50 dark:bg-brand-900/20 shadow-sm" : "hover:bg-slate-50 dark:hover:bg-slate-800/50"}`}
                    >
                      <Avatar src={user.image} name={user.name} size="sm" />
                      <span
                        className={`text-sm font-medium truncate ${activeChatUser?.id === user.id ? "text-brand-700 dark:text-brand-300" : "text-slate-700 dark:text-slate-300"}`}
                      >
                        {user.name || user.email}
                      </span>
                    </button>
                  ))}
                {project.assignments.filter(
                  (a) => a.user.id !== session?.user?.id,
                ).length === 0 && (
                  <p className="text-center text-xs text-slate-400 py-4">
                    No hay otros miembros en este proyecto.
                  </p>
                )}
              </div>
            </div>

            {/* Chat area */}
            <div className="flex-1 card flex flex-col overflow-hidden">
              {activeChatUser ? (
                <>
                  <div className="p-4 border-b border-slate-100 dark:border-slate-800/60 flex items-center gap-3 bg-slate-50/50 dark:bg-slate-900/50">
                    <Avatar
                      src={activeChatUser.image}
                      name={activeChatUser.name}
                      size="sm"
                    />
                    <div>
                      <span className="font-semibold text-sm text-slate-800 dark:text-slate-200 block leading-tight">
                        {activeChatUser.name}
                      </span>
                      <span className="text-[11px] text-brand-600 dark:text-brand-400 font-medium">
                        Chat privado
                      </span>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar flex flex-col">
                    {privateMessages
                      .filter(
                        (m) =>
                          (m.senderId === session?.user?.id &&
                            m.receiverId === activeChatUser.id) ||
                          (m.senderId === activeChatUser.id &&
                            m.receiverId === session?.user?.id),
                      )
                      .map((msg) => {
                        const isMe = msg.senderId === session?.user?.id;
                        return (
                          <div
                            key={msg.id}
                            className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm shadow-sm flex flex-col gap-1.5 ${isMe ? "bg-brand-600 text-white rounded-tr-sm" : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-sm"}`}
                            >
                              {msg.text && (
                                <p className="whitespace-pre-wrap">
                                  {msg.text}
                                </p>
                              )}
                              {msg.fileName && (
                                <a
                                  href={msg.fileUrl}
                                  download={msg.fileName}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`mt-0.5 inline-flex items-center gap-2 p-1.5 pr-3 rounded-xl text-xs transition-all w-fit max-w-full group border ${isMe ? "bg-brand-700/50 border-brand-500/50 hover:bg-brand-700 text-white" : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-brand-300 dark:hover:border-brand-700"}`}
                                >
                                  <div
                                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm flex-shrink-0 shadow-sm border ${isMe ? "bg-brand-600 border-brand-500" : "bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700"}`}
                                  >
                                    {msg.fileUrl?.startsWith("data:image")
                                      ? "🖼️"
                                      : "📎"}
                                  </div>
                                  <span className="truncate font-medium">
                                    {msg.fileName}
                                  </span>
                                  <svg
                                    width="14"
                                    height="14"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    className={`ml-1 flex-shrink-0 ${isMe ? "text-brand-300 group-hover:text-white" : "text-slate-400 group-hover:text-brand-500"}`}
                                  >
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                    <polyline points="7 10 12 15 17 10" />
                                    <line x1="12" y1="15" x2="12" y2="3" />
                                  </svg>
                                </a>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    <div ref={messagesEndRef} />
                  </div>

                  <div className="p-3 border-t border-slate-100 dark:border-slate-800/60 flex flex-col gap-2 bg-slate-50/30 dark:bg-slate-900/30">
                    {newMessageFile && (
                      <div className="flex items-center gap-2 bg-brand-50/50 dark:bg-brand-900/10 border border-brand-100 dark:border-brand-900/30 text-brand-700 dark:text-brand-300 px-3 py-1.5 rounded-lg text-xs w-fit">
                        <span className="text-base">
                          {fileIcon(newMessageFile.type)}
                        </span>
                        <span className="max-w-[150px] truncate font-medium">
                          {newMessageFile.name}
                        </span>
                        <button
                          onClick={() => setNewMessageFile(null)}
                          className="hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-1 rounded-md ml-1 transition-colors"
                        >
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M18 6L6 18M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    )}
                    <div className="flex gap-2 items-center">
                      <label className="flex items-center justify-center p-2.5 text-slate-500 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-xl cursor-pointer transition-colors">
                        <input
                          type="file"
                          className="hidden"
                          onChange={(e) => setNewMessageFile(e.target.files[0])}
                        />
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
                        </svg>
                      </label>
                      <input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) =>
                          e.key === "Enter" && handleSendMessage()
                        }
                        placeholder={`Mensaje a ${activeChatUser.name?.split(" ")[0]}...`}
                        className="input-field py-2.5"
                      />
                      <button
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim() && !newMessageFile}
                        className="btn-primary px-4 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Send size={18} />
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-slate-50/30 dark:bg-slate-900/20">
                  <MessageSquare
                    size={40}
                    className="mb-3 text-slate-300 dark:text-slate-600"
                  />
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    Selecciona un compañero
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    para iniciar una conversación privada
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Create Task Modal ─── */}
      <Modal
        open={showTaskModal}
        onClose={() => setShowTaskModal(false)}
        title="Nueva tarea"
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
              Título
            </label>
            <input
              className="input-field"
              placeholder="¿Qué hay que hacer?"
              value={taskForm.title}
              onChange={(e) =>
                setTaskForm({ ...taskForm, title: e.target.value })
              }
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
              Descripción (opcional)
            </label>
            <textarea
              className="input-field resize-none h-20"
              placeholder="Detalles…"
              value={taskForm.description}
              onChange={(e) =>
                setTaskForm({ ...taskForm, description: e.target.value })
              }
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
              Columna
            </label>
            <div className="flex flex-wrap gap-2">
              {columns.map((c) => {
                const isSelected =
                  taskForm.columnId === c.id ||
                  (!taskForm.columnId && c.id === columns[0]?.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setTaskForm({ ...taskForm, columnId: c.id })}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-colors
                      ${isSelected ? "bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600 shadow-sm" : "bg-slate-50 border-slate-200 dark:bg-slate-800/30 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"}`}
                  >
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: c.color }}
                    />
                    <span
                      className={
                        isSelected
                          ? "text-slate-900 dark:text-white"
                          : "text-slate-600 dark:text-slate-400"
                      }
                    >
                      {c.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
              Prioridad
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                {
                  value: "LOW",
                  label: "Baja",
                  cls: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-400 dark:border-blue-800",
                },
                {
                  value: "MEDIUM",
                  label: "Media",
                  cls: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-400 dark:border-emerald-800",
                },
                {
                  value: "HIGH",
                  label: "Alta",
                  cls: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/40 dark:text-amber-400 dark:border-amber-800",
                },
                {
                  value: "URGENT",
                  label: "Urgente",
                  cls: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/40 dark:text-red-400 dark:border-red-800",
                },
              ].map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() =>
                    setTaskForm({ ...taskForm, priority: p.value })
                  }
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${taskForm.priority === p.value ? p.cls + " shadow-sm" : "bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-800/30 dark:text-slate-400 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"}`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
                Asignar a
              </label>
              <Select
                value={taskForm.assigneeId}
                onChange={(v) => setTaskForm({ ...taskForm, assigneeId: v })}
                placeholder="Sin asignar"
                options={[
                  { value: "", label: "Sin asignar" },
                  ...project.assignments.map(({ user: m }) => ({
                    value: m.id,
                    label: m.name || m.email,
                  })),
                ]}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
                Fecha límite
              </label>
              <button
                type="button"
                onClick={() => setShowCreateDatePicker(!showCreateDatePicker)}
                className="input-field w-full text-left flex items-center gap-3"
              >
                <CalendarDays size={16} className="text-slate-400" />
                <span
                  className={
                    taskForm.dueDate
                      ? "text-slate-800 dark:text-slate-200"
                      : "text-slate-400"
                  }
                >
                  {taskForm.dueDate
                    ? format(new Date(taskForm.dueDate + "T00:00:00"), "PPP", {
                        locale: es,
                      })
                    : "Seleccionar fecha"}
                </span>
              </button>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
              Archivo adjunto
            </label>
            {newTaskFile ? (
              <div className="flex items-center gap-3 bg-brand-50/50 dark:bg-brand-900/10 border border-brand-100 dark:border-brand-900/30 text-brand-700 dark:text-brand-300 px-3 py-2 rounded-xl text-sm w-fit">
                <span className="text-xl">{fileIcon(newTaskFile.type)}</span>
                <span className="max-w-[200px] truncate font-medium">
                  {newTaskFile.name}
                </span>
                <button
                  onClick={() => setNewTaskFile(null)}
                  className="hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-1 rounded-md ml-1 transition-colors"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <label className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer transition-colors w-fit">
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => setNewTaskFile(e.target.files[0])}
                />
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
                </svg>
                Seleccionar archivo
              </label>
            )}
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setShowTaskModal(false)}
              className="btn-secondary flex-1"
            >
              Cancelar
            </button>
            <button onClick={createTask} className="btn-primary flex-1">
              Crear tarea
            </button>
          </div>
        </div>
      </Modal>

      {/* ─── Edit Task Modal ─── */}
      <Modal
        open={!!editTask}
        onClose={() => setEditTask(null)}
        title="Detalle de tarea"
      >
        {editTask && (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
                Título
              </label>
              <input
                className="input-field"
                value={editTask.title}
                onChange={(e) =>
                  setEditTask({ ...editTask, title: e.target.value })
                }
                onBlur={() =>
                  updateTask(editTask.id, { title: editTask.title })
                }
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
                Descripción
              </label>
              <textarea
                className="input-field resize-none h-20"
                value={editTask.description || ""}
                placeholder="Sin descripción…"
                onChange={(e) =>
                  setEditTask({ ...editTask, description: e.target.value })
                }
                onBlur={() =>
                  updateTask(editTask.id, { description: editTask.description })
                }
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
                Columna
              </label>
              <div className="flex flex-wrap gap-2">
                {columns.map((c) => {
                  const isSelected = editTask.columnId === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        const newStatus = getStatusForColumn(c.id);
                        updateTask(editTask.id, { columnId: c.id, status: newStatus });
                        setEditTask({ ...editTask, columnId: c.id, status: newStatus });
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-colors
                        ${isSelected ? "bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600 shadow-sm" : "bg-slate-50 border-slate-200 dark:bg-slate-800/30 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"}`}
                    >
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: c.color }}
                      />
                      <span
                        className={
                          isSelected
                            ? "text-slate-900 dark:text-white"
                            : "text-slate-600 dark:text-slate-400"
                        }
                      >
                        {c.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
                Prioridad
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  {
                    value: "LOW",
                    label: "Baja",
                    cls: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-400 dark:border-blue-800",
                  },
                  {
                    value: "MEDIUM",
                    label: "Media",
                    cls: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-400 dark:border-emerald-800",
                  },
                  {
                    value: "HIGH",
                    label: "Alta",
                    cls: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/40 dark:text-amber-400 dark:border-amber-800",
                  },
                  {
                    value: "URGENT",
                    label: "Urgente",
                    cls: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/40 dark:text-red-400 dark:border-red-800",
                  },
                ].map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => {
                      updateTask(editTask.id, { priority: p.value });
                      setEditTask({ ...editTask, priority: p.value });
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${editTask.priority === p.value ? p.cls + " shadow-sm" : "bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-800/30 dark:text-slate-400 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"}`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
                  Asignado a
                </label>
                <Select
                  value={editTask.assigneeId || ""}
                  onChange={(v) => {
                    updateTask(editTask.id, { assigneeId: v || null });
                    setEditTask({ ...editTask, assigneeId: v });
                  }}
                  placeholder="Sin asignar"
                  options={[
                    { value: "", label: "Sin asignar" },
                    ...project.assignments.map(({ user: m }) => ({
                      value: m.id,
                      label: m.name || m.email,
                    })),
                  ]}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
                  Fecha límite
                </label>
                <button
                  type="button"
                  onClick={() => setShowEditDatePicker(!showEditDatePicker)}
                  className="input-field w-full text-left flex items-center gap-3"
                >
                  <CalendarDays size={16} className="text-slate-400" />
                  <span
                    className={
                      editTask.dueDate
                        ? "text-slate-800 dark:text-slate-200"
                        : "text-slate-400"
                    }
                  >
                    {editTask.dueDate
                      ? format(new Date(editTask.dueDate), "PPP", {
                          locale: es,
                        })
                      : "Seleccionar fecha"}
                  </span>
                </button>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
                Archivo adjunto
              </label>
              {editTask.fileName ? (
                <div className="flex items-center gap-3 bg-brand-50/50 dark:bg-brand-900/10 border border-brand-100 dark:border-brand-900/30 text-brand-700 dark:text-brand-300 px-3 py-2 rounded-xl text-sm w-fit">
                  <span className="text-xl">
                    {editTask.fileUrl?.startsWith("data:image") ? "🖼️" : "📎"}
                  </span>
                  <a
                    href={editTask.fileUrl}
                    download={editTask.fileName}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="max-w-[200px] truncate font-medium hover:underline"
                  >
                    {editTask.fileName}
                  </a>
                  <button
                    onClick={() => {
                      updateTask(editTask.id, {
                        fileUrl: null,
                        fileName: null,
                      });
                      setEditTask({
                        ...editTask,
                        fileUrl: null,
                        fileName: null,
                      });
                    }}
                    className="hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-1 rounded-md ml-1 transition-colors"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : (
                <label className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer transition-colors w-fit">
                  <input
                    type="file"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files[0];
                      if (!file) return;
                      if (file.size > 5 * 1024 * 1024) {
                        setErrorMsg("El archivo no debe superar los 5MB.");
                        return;
                      }
                      const fileUrl = await fileToBase64(file);
                      const fileName = file.name;
                      updateTask(editTask.id, { fileUrl, fileName });
                      setEditTask({ ...editTask, fileUrl, fileName });
                    }}
                  />
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
                  </svg>
                  Adjuntar archivo
                </label>
              )}
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => deleteTask(editTask.id)}
                className="btn-ghost text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600"
              >
                Eliminar
              </button>
              <button
                onClick={() => setEditTask(null)}
                className="btn-primary ml-auto"
              >
                Listo
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ─── Modales de Fecha (Independientes) ─── */}
      <Modal
        open={showCreateDatePicker}
        onClose={() => setShowCreateDatePicker(false)}
        title="Seleccionar fecha límite"
      >
        <div className="flex justify-center p-2">
          <DayPicker
            mode="single"
            selected={
              taskForm.dueDate
                ? new Date(taskForm.dueDate + "T00:00:00")
                : undefined
            }
            onSelect={(date) => {
              setTaskForm({
                ...taskForm,
                dueDate: date ? format(date, "yyyy-MM-dd") : "",
              });
              setShowCreateDatePicker(false);
            }}
            locale={es}
            initialFocus
            disabled={{ before: new Date(new Date().setHours(0, 0, 0, 0)) }}
            className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3"
          />
        </div>
      </Modal>

      <Modal
        open={showEditDatePicker}
        onClose={() => setShowEditDatePicker(false)}
        title="Modificar fecha límite"
      >
        <div className="flex justify-center p-2">
          <DayPicker
            mode="single"
            selected={
              editTask?.dueDate ? new Date(editTask.dueDate) : undefined
            }
            onSelect={(date) => {
              const newDate = date ? format(date, "yyyy-MM-dd") : null;
              if (editTask) {
                updateTask(editTask.id, { dueDate: newDate });
                setEditTask({ ...editTask, dueDate: newDate });
              }
              setShowEditDatePicker(false);
            }}
            locale={es}
            initialFocus
            disabled={{ before: new Date(new Date().setHours(0, 0, 0, 0)) }}
            className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3"
          />
        </div>
      </Modal>

      <ConfirmModal
        {...confirmDialog}
        onClose={() => setConfirmDialog({ isOpen: false })}
      />
      <ActionOverlay
        isProcessing={isProcessing}
        errorMsg={errorMsg}
        onErrorClose={() => setErrorMsg("")}
      />
    </div>
  );
}
