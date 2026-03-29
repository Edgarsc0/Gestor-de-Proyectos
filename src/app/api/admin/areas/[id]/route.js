// src/app/api/admin/areas/[id]/route.js
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminGuard";

export async function PATCH(req, { params }) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { name, description, color, titularId } = await req.json();
  const area = await prisma.area.update({
    where: { id: params.id },
    data: {
      ...(name && { name }),
      ...(description !== undefined && { description }),
      ...(color && { color }),
      titularId: titularId ?? null,
    },
    include: {
      titular: { select: { id: true, name: true, email: true, image: true } },
      _count: { select: { users: true, projects: true } },
    },
  });
  return NextResponse.json(area);
}

export async function DELETE(req, { params }) {
  const { error } = await requireAdmin();
  if (error) return error;

  await prisma.area.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}

// Asignar / quitar usuarios del área
export async function PUT(req, { params }) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { userId, action } = await req.json(); // action: "add" | "remove"
  if (action === "add") {
    await prisma.userArea.upsert({
      where: { userId_areaId: { userId, areaId: params.id } },
      create: { userId, areaId: params.id },
      update: {},
    });
  } else {
    await prisma.userArea.deleteMany({
      where: { userId, areaId: params.id },
    });
  }
  return NextResponse.json({ ok: true });
}
