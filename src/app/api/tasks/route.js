// src/app/api/tasks/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { pusher } from "@/lib/pusher";

function deriveStatusFromColumn(columns, columnId) {
  if (!columnId || !columns?.length) return null;
  const sorted = [...columns].sort((a, b) => a.order - b.order);
  const idx = sorted.findIndex((c) => c.id === columnId);
  if (idx < 0) return null;
  if (idx === 0) return "PENDING";
  if (idx === sorted.length - 1) return "COMPLETED";
  if (sorted.length >= 4 && idx === sorted.length - 2) return "IN_REVIEW";
  return "IN_PROGRESS";
}

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");
  const assigneeId = searchParams.get("assigneeId");
  const status = searchParams.get("status");

  const where = {};
  if (projectId) where.projectId = projectId;
  if (assigneeId) where.assigneeId = assigneeId;
  if (status) where.status = status;

  const tasks = await prisma.task.findMany({
    where,
    include: {
      project: { select: { name: true, color: true, columns: { select: { id: true, order: true } } } },
      assignee: { select: { id: true, name: true, image: true } },
    },
    orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
  });

  // Sync status with columnId position so tasks page always reflects Kanban position
  const result = tasks.map((t) => {
    const derived = deriveStatusFromColumn(t.project?.columns, t.columnId);
    return { ...t, status: derived ?? t.status };
  });

  return NextResponse.json(result);
}

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json();
  const { title, description, projectId, assigneeId, priority, dueDate, columnId, fileUrl, fileName } = body;

  if (!title || !projectId) {
    return NextResponse.json({ error: "Título y proyecto son requeridos" }, { status: 400 });
  }

  const task = await prisma.task.create({
    data: {
      title,
      description,
      projectId,
      assigneeId: assigneeId || null,
      priority: priority || "MEDIUM",
      dueDate: dueDate ? new Date(dueDate) : null,
      columnId: columnId || null,
      fileUrl: fileUrl || null,
      fileName: fileName || null,
    },
    include: {
      project: { select: { name: true, color: true } },
      assignee: { select: { id: true, name: true, image: true } },
    },
  });

  return NextResponse.json(task, { status: 201 });
}

export async function PUT(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json();
  const { id, ...data } = body;

  if (data.dueDate) data.dueDate = new Date(data.dueDate);

  // Auto-sync status from columnId when only columnId is provided
  if (data.columnId !== undefined && data.status === undefined) {
    const col = await prisma.projectColumn.findUnique({
      where: { id: data.columnId },
      include: { project: { include: { columns: { select: { id: true, order: true } } } } },
    });
    if (col) {
      data.status = deriveStatusFromColumn(col.project.columns, data.columnId) ?? "PENDING";
    }
  }

  const task = await prisma.task.update({
    where: { id },
    data,
    include: {
      project: { select: { name: true, color: true } },
      assignee: { select: { id: true, name: true, image: true } },
    },
  });

  // Notify all clients viewing this project to refetch
  await pusher.trigger(`project-${task.projectId}`, "task-updated", {
    taskId: task.id,
    status: task.status,
    columnId: task.columnId,
  }).catch(() => {});

  return NextResponse.json(task);
}

export async function DELETE(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) return NextResponse.json({ error: "ID requerido" }, { status: 400 });

  await prisma.task.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
