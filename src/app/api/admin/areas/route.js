// src/app/api/admin/areas/route.js
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireAccess } from "@/lib/adminGuard";

export async function GET() {
  const { error } = await requireAccess();
  if (error) return error;

  const areas = await prisma.area.findMany({
    include: {
      titular: { select: { id: true, name: true, email: true, image: true } },
      _count: { select: { users: true, projects: true } },
    },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(areas);
}

export async function POST(req) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { name, description, color, titularId } = await req.json();
  if (!name) return NextResponse.json({ error: "Nombre requerido" }, { status: 400 });

  const area = await prisma.area.create({
    data: { name, description, color: color || "#8B1515", titularId: titularId || null },
    include: {
      titular: { select: { id: true, name: true, email: true, image: true } },
      _count: { select: { users: true, projects: true } },
    },
  });
  return NextResponse.json(area, { status: 201 });
}
