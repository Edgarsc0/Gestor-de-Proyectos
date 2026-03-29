// src/app/api/columns/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { name, projectId, color, order: orderFromBody } = await req.json();
  if (!name || !projectId) return NextResponse.json({ error: "Faltan datos" }, { status: 400 });

  // Usar el orden enviado o calcular el siguiente
  let order = orderFromBody;
  if (order === undefined || order === null) {
    const last = await prisma.projectColumn.findFirst({
      where: { projectId },
      orderBy: { order: "desc" },
    });
    order = last ? last.order + 1 : 0;
  }

  const column = await prisma.projectColumn.create({
    data: { name, color: color || "#94a3b8", order, projectId },
  });

  return NextResponse.json(column, { status: 201 });
}

export async function PUT(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id, name, color } = await req.json();
  if (!id) return NextResponse.json({ error: "ID requerido" }, { status: 400 });

  const column = await prisma.projectColumn.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(color !== undefined && { color }),
    },
  });

  return NextResponse.json(column);
}

export async function DELETE(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID requerido" }, { status: 400 });

  // Mover las tareas de esta columna a la primera columna disponible del mismo proyecto
  const col = await prisma.projectColumn.findUnique({ where: { id } });
  if (!col) return NextResponse.json({ error: "Columna no encontrada" }, { status: 404 });

  const sibling = await prisma.projectColumn.findFirst({
    where: { projectId: col.projectId, id: { not: id } },
    orderBy: { order: "asc" },
  });

  // Reasignar tareas
  await prisma.task.updateMany({
    where: { columnId: id },
    data: { columnId: sibling?.id ?? null },
  });

  await prisma.projectColumn.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
