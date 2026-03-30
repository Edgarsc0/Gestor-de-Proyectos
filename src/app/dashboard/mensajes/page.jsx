"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import LoadingScreen from "@/components/LoadingScreen";
import { Avatar } from "@/components/Badges";
import { MessageSquare, Send } from "lucide-react";
import Pusher from "pusher-js";

function fileIcon(type) {
  if (!type) return "📁";
  if (type.startsWith("image/")) return "🖼️";
  if (type === "application/pdf") return "📄";
  if (type.includes("word") || type.includes("document")) return "📝";
  if (type.includes("sheet") || type.includes("excel")) return "📊";
  if (type.includes("zip") || type.includes("rar")) return "🗜️";
  return "📁";
}

export default function MensajesPage() {
  const { data: session, status } = useSession();
  const [projects, setProjects] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [newMessageFile, setNewMessageFile] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [unreadInfo, setUnreadInfo] = useState({});
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (status === "loading") return;

    // Request notification permission on mount
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    const projectPromise = fetch("/api/projects").then((r) => r.json());
    const memberPromise = fetch("/api/members").then((r) =>
      r.json().catch(() => []),
    );
    const allUsersPromise =
      session?.user?.role === "TITULAR"
        ? fetch("/api/admin/users").then((r) => r.json().catch(() => []))
        : Promise.resolve([]);

    Promise.all([projectPromise, memberPromise, allUsersPromise]).then(
      ([pData, mData, allUsersData]) => {
        const mems = Array.isArray(mData)
          ? mData.filter((m) => m.role !== "SUPERADMIN" && m.role !== "ADMIN")
          : [];
        setMembers(mems);
        if (Array.isArray(pData) && mems.length > 0) {
          pData.forEach((p) => {
            if (!p.assignments) p.assignments = [];
            mems.forEach((m) => {
              const isInArea =
                p.areaId &&
                m.areas?.some(
                  (a) => a.areaId === p.areaId || a.area?.id === p.areaId,
                );
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
          });
        }
        setProjects(Array.isArray(pData) ? pData : []);

        // Si es Titular, agregar otros Titulares a la lista de miembros para que aparezcan en contactos
        if (session?.user?.role === "TITULAR" && Array.isArray(allUsersData)) {
          const otherTitulares = allUsersData.filter(
            (u) => u.role === "TITULAR" && u.id !== session.user.id,
          );
          setMembers((prevMembers) => {
            const existingIds = new Set(prevMembers.map((m) => m.id));
            const newTitulares = otherTitulares.filter(
              (t) => !existingIds.has(t.id),
            );
            return [...prevMembers, ...newTitulares];
          });
        }

        setLoading(false);
      },
    );
  }, [status, session]);

  const fetchMessages = useCallback(async () => {
    try {
      const [msgRes, unreadRes] = await Promise.all([
        fetch("/api/messages", { cache: "no-store" }),
        fetch("/api/messages/unread_info", { cache: "no-store" }),
      ]);
      if (msgRes.ok && unreadRes.ok) {
        const data = await msgRes.json();
        setMessages(data);
        const { unreadCounts } = await unreadRes.json();
        setUnreadInfo(unreadCounts || {});
      }
    } catch (error) {
      console.error("Error al cargar mensajes:", error);
    }
  }, [activeChat]);

  useEffect(() => {
    fetchMessages();

    if (!session?.user?.id) return;

    const pusherClient = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
      authEndpoint: "/api/pusher/auth",
    });

    const channel = pusherClient.subscribe(`private-user-${session.user.id}`);

    const handleNewMessage = (newMessage) => {
      setMessages((prev) => {
        // Evitar duplicados
        if (prev.find((msg) => msg.id === newMessage.id)) {
          return prev;
        }
        return [...prev, newMessage];
      });

      // Actualizar contador de no leídos si el chat no está activo
      if (activeChat?.user.id !== newMessage.senderId) {
        setUnreadInfo((prev) => ({
          ...prev,
          [newMessage.senderId]: (prev[newMessage.senderId] || 0) + 1,
        }));
      }
    };

    channel.bind("incoming-message", handleNewMessage);

    return () => {
      channel.unbind("incoming-message", handleNewMessage);
      pusherClient.unsubscribe(`private-user-${session.user.id}`);
    };
  }, [fetchMessages, session?.user?.id, activeChat]);

  useEffect(() => {
    // Marcar como leído automáticamente si el chat está abierto y llegan mensajes
    if (activeChat && unreadInfo[activeChat.user.id]) {
      setUnreadInfo((prev) => {
        const newUnread = { ...prev };
        delete newUnread[activeChat.user.id];
        return newUnread;
      });
      fetch("/api/messages/mark_as_read", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senderId: activeChat.user.id }),
      }).catch(() => {});
    }
  }, [activeChat, unreadInfo]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [messages, activeChat]);

  useEffect(() => {
    if (errorMsg) {
      const t = setTimeout(() => setErrorMsg(""), 4000);
      return () => clearTimeout(t);
    }
  }, [errorMsg]);

  const fileToBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });

  const handleSendMessage = async () => {
    if ((!newMessage.trim() && !newMessageFile) || !activeChat) return;

    if (!activeChat.project) {
      setErrorMsg(
        "Necesitas al menos un proyecto en el área para poder enviar mensajes.",
      );
      return;
    }

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
          receiverId: activeChat.user.id,
          projectId: activeChat.project.id,
        }),
      });
      if (!res.ok) throw new Error("Error al enviar el mensaje.");
      const savedMsg = await res.json();

      setMessages((prev) => [...prev, savedMsg]);
      setNewMessage("");
      setNewMessageFile(null);
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleContactClick = async (contact) => {
    setActiveChat({ project: contact.project, user: contact.user });

    // Mark messages as read optimistically and on backend
    if (unreadInfo[contact.user.id]) {
      setUnreadInfo((prev) => {
        const newUnread = { ...prev };
        delete newUnread[contact.user.id];
        return newUnread;
      });
      try {
        await fetch("/api/messages/mark_as_read", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ senderId: contact.user.id }),
        });
      } catch (error) {
        // If it fails, the next poll will fix the UI state
      }
    }
  };

  if (loading || status === "loading") return <LoadingScreen />;

  const filteredMessages = messages.filter(
    (m) =>
      (m.senderId === session?.user?.id &&
        m.receiverId === activeChat?.user.id) ||
      (m.senderId === activeChat?.user.id &&
        m.receiverId === session?.user?.id),
  );

  const projectsWithCoworkers = projects
    .map((p) => {
      const coworkers = Array.from(
        new Map(
          (p.assignments || [])
            .filter(
              (a) =>
                a.user &&
                a.user.id !== session?.user?.id &&
                !["SUPERADMIN", "ADMIN"].includes(a.user.role),
            )
            .map((a) => [a.user.id, a.user]),
        ).values(),
      );
      return { ...p, coworkers };
    })
    .filter((p) => p.coworkers.length > 0);

  // Extraer lista de contactos únicos (todos los de tu área + proyectos)
  const contactsMap = new Map();
  projectsWithCoworkers.forEach((p) => {
    p.coworkers.forEach((user) => {
      if (!contactsMap.has(user.id)) {
        contactsMap.set(user.id, { user, project: p });
      }
    });
  });

  // Asegurarnos de incluir a todos los miembros disponibles, usando un proyecto puente si es necesario
  members.forEach((m) => {
    if (m.id !== session?.user?.id && !contactsMap.has(m.id)) {
      contactsMap.set(m.id, {
        user: m,
        project: projects.length > 0 ? projects[0] : null,
      });
    }
  });

  const contactsList = Array.from(contactsMap.values()).filter((c) =>
    (c.user.name || c.user.email || "")
      .toLowerCase()
      .includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-120px)] gap-4">
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #475569; }
      `}</style>

      {/* ─── SIDEBAR (Contactos) ─── */}
      <div className="w-full md:w-1/3 lg:w-1/4 card flex flex-col overflow-hidden flex-shrink-0 h-full">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800/60 space-y-3">
          <div>
            <h2 className="font-display font-semibold text-lg text-slate-800 dark:text-slate-200">
              Mensajes Directos
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Contactos de tu área
            </p>
          </div>
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar contacto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field py-1.5 text-sm w-full pl-8"
            />
            <svg
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-4 custom-scrollbar">
          {contactsList.length === 0 ? (
            <p className="text-center text-xs text-slate-400 py-6">
              {searchTerm
                ? "No se encontraron contactos."
                : "No hay contactos disponibles."}
            </p>
          ) : (
            <div className="space-y-1">
              {contactsList.map((contact) => {
                const isActive = activeChat?.user.id === contact.user.id;
                const hasUnread = unreadInfo[contact.user.id] > 0;
                return (
                  <button
                    key={contact.user.id}
                    onClick={() => handleContactClick(contact)}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-all text-left border ${isActive ? "bg-brand-50 dark:bg-brand-900/20 border-transparent shadow-sm" : hasUnread ? "bg-brand-50/50 dark:bg-brand-900/20 border-brand-200 dark:border-brand-800/50" : "border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50"}`}
                  >
                    <Avatar
                      src={contact.user.image}
                      name={contact.user.name}
                      size="sm"
                    />
                    <div className="min-w-0 flex-1 relative">
                      <p
                        className={`text-sm truncate ${isActive ? "text-brand-700 dark:text-brand-300 font-medium" : hasUnread ? "text-brand-700 dark:text-brand-400 font-bold" : "text-slate-700 dark:text-slate-300 font-medium"}`}
                      >
                        {contact.user.name || contact.user.email}
                      </p>
                      {contact.user.role === "TITULAR" && (
                        <p className="text-[10px] text-brand-600 dark:text-brand-400 font-semibold mt-0.5">
                          Titular de Área
                        </p>
                      )}
                      {unreadInfo[contact.user.id] && (
                        <span className="absolute right-0 top-1/2 -translate-y-1/2 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full">
                          {unreadInfo[contact.user.id]}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ─── ÁREA DE CHAT ─── */}
      <div className="flex-1 card flex flex-col overflow-hidden h-full relative">
        {errorMsg && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10 bg-red-500 text-white text-xs px-4 py-1.5 rounded-full shadow-lg">
            {errorMsg}
          </div>
        )}
        {activeChat ? (
          <>
            <div className="p-4 border-b border-slate-100 dark:border-slate-800/60 flex items-center gap-3 bg-slate-50/50 dark:bg-slate-900/50">
              <Avatar
                src={activeChat.user.image}
                name={activeChat.user.name}
                size="md"
              />
              <div>
                <span className="font-semibold text-base text-slate-800 dark:text-slate-200 block leading-tight">
                  {activeChat.user.name}
                </span>
                <span className="text-[11px] text-brand-600 dark:text-brand-400 font-medium">
                  Chat privado
                </span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar flex flex-col">
              {filteredMessages.map((msg) => {
                const isMe = msg.senderId === session?.user?.id;
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] sm:max-w-[70%] px-4 py-2 rounded-2xl text-sm shadow-sm flex flex-col gap-1.5 ${isMe ? "bg-brand-600 text-white rounded-tr-sm" : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-sm"}`}
                    >
                      {msg.text && (
                        <p className="whitespace-pre-wrap">{msg.text}</p>
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
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
              {filteredMessages.length === 0 && (
                <p className="text-center text-xs text-slate-400 my-auto">
                  Escribe el primer mensaje a{" "}
                  {activeChat.user.name?.split(" ")[0]}
                </p>
              )}
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
                    ✕
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
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                  placeholder="Escribe un mensaje..."
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
              size={48}
              className="mb-4 text-slate-300 dark:text-slate-600"
            />
            <p className="text-base font-medium text-slate-500 dark:text-slate-400">
              Selecciona una conversación
            </p>
            <p className="text-sm text-slate-400 mt-1">
              Elige un compañero en el menú lateral para iniciar.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
