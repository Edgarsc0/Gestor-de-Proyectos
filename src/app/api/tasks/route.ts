// src/app/api/tasks/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");
  const assigneeId = searchParams.get("assigneeId");
  const status = searchParams.get("status");

  const where: any = {};
  if (projectId) where.projectId = projectId;
  if (assigneeId) where.assigneeId = assigneeId;
  if (status) where.status = status;

  const tasks = await prisma.task.findMany({
    where,
    include: {
      project: { select: { name: true, color: true } },
      assignee: { select: { id: true, name: true, image: true } },
    },
    orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
  });

  return NextResponse.json(tasks);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json();
  const { title, description, projectId, assigneeId, priority, dueDate } = body;

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
    },
    include: {
      project: { select: { name: true, color: true } },
      assignee: { select: { id: true, name: true, image: true } },
    },
  });

  return NextResponse.json(task, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json();
  const { id, ...data } = body;

  if (data.dueDate) data.dueDate = new Date(data.dueDate);

  const task = await prisma.task.update({
    where: { id },
    data,
    include: {
      project: { select: { name: true, color: true } },
      assignee: { select: { id: true, name: true, image: true } },
    },
  });

  return NextResponse.json(task);
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) return NextResponse.json({ error: "ID requerido" }, { status: 400 });

  await prisma.task.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
