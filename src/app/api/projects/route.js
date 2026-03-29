// src/app/api/projects/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { areas: { select: { areaId: true } } },
  });

  // SUPERADMIN y ADMIN ven todos; el resto solo proyectos de sus áreas (o sin área)
  const where = (user.role === "ADMIN" || user.role === "SUPERADMIN") ? {} : {
    OR: [
      { areaId: null },
      { areaId: { in: user.areas.map(a => a.areaId) } },
    ],
  };

  const projects = await prisma.project.findMany({
    where,
    include: {
      tasks: true,
      area: { select: { id: true, name: true, color: true } },
      assignments: {
        include: { user: { select: { id: true, name: true, image: true, email: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(projects);
}

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json();
  const { name, description, color } = body;

  if (!name) return NextResponse.json({ error: "El nombre es requerido" }, { status: 400 });

  const { areaId } = body;
  const project = await prisma.project.create({
    data: { name, description, color: color || "#8B1515", areaId: areaId || null },
  });

  // Crear columnas Kanban por defecto
  const DEFAULT_COLUMNS = [
    { name: "Pendiente",    color: "#94a3b8", order: 0 },
    { name: "En Progreso",  color: "#3b82f6", order: 1 },
    { name: "En Revisión",  color: "#f59e0b", order: 2 },
    { name: "Completado",   color: "#10b981", order: 3 },
  ];
  await prisma.projectColumn.createMany({
    data: DEFAULT_COLUMNS.map((c) => ({ ...c, projectId: project.id })),
  });

  return NextResponse.json(project, { status: 201 });
}

export async function PUT(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json();
  const { id, ...data } = body;

  const project = await prisma.project.update({
    where: { id },
    data,
  });

  return NextResponse.json(project);
}

export async function DELETE(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) return NextResponse.json({ error: "ID requerido" }, { status: 400 });

  await prisma.project.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
