// src/app/api/admin/users/route.js
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin, requireAdmin } from "@/lib/adminGuard";

export async function GET() {
  const { error } = await requireSuperAdmin();
  if (error) return error;

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      createdAt: true,
      areas: {
        include: { area: { select: { id: true, name: true, color: true } } },
      },
    },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(users);
}

export async function PATCH(req) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { userId, role } = await req.json();
  const user = await prisma.user.update({
    where: { id: userId },
    data: { role },
    select: { id: true, name: true, email: true, role: true },
  });
  return NextResponse.json(user);
}

export async function DELETE(req) {
  const { error } = await requireSuperAdmin();
  if (error) return error;

  try {
    const { userId } = await req.json();
    if (!userId) {
      return NextResponse.json({ error: "User ID requerido" }, { status: 400 });
    }
    await prisma.user.delete({ where: { id: userId } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Error al eliminar el usuario." }, { status: 500 });
  }
}
