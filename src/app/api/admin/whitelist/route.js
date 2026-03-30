// src/app/api/admin/whitelist/route.js
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAccess } from "@/lib/adminGuard";

export async function GET() {
  const { error } = await requireAccess();
  if (error) return error;

  const list = await prisma.whitelist.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(list);
}

// Roles que cada nivel puede conceder
const ALLOWED_ROLES = {
  SUPERADMIN: ["SUPERADMIN", "ADMIN", "TITULAR", "MEMBER"],
  ADMIN:      ["TITULAR", "MEMBER"],
  TITULAR:    ["MEMBER"],
};

export async function POST(req) {
  const { error, session } = await requireAccess();
  if (error) return error;

  const { email, note, assignedRole, assignedAreaId } = await req.json();
  if (!email) return NextResponse.json({ error: "Email requerido" }, { status: 400 });

  // Validar que el rol solicitado esté permitido para quien lo concede
  const granterRole = session.user.role;
  if (assignedRole && !ALLOWED_ROLES[granterRole]?.includes(assignedRole)) {
    return NextResponse.json({ error: "No tienes permiso para asignar ese rol." }, { status: 403 });
  }

  const entry = await prisma.whitelist.upsert({
    where: { email },
    create: { email, note, assignedRole: assignedRole || null, assignedAreaId: assignedAreaId || null },
    update: { note, assignedRole: assignedRole || null, assignedAreaId: assignedAreaId || null },
  });

  // Si el usuario ya existe, aplicar rol y área de inmediato (sin esperar al primer login)
  if (assignedRole || assignedAreaId) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      // Actualizar rol solo si no tiene uno superior
      if (assignedRole && !["ADMIN", "SUPERADMIN"].includes(existing.role)) {
        await prisma.user.update({ where: { id: existing.id }, data: { role: assignedRole } });
      }
      // Asignar al área
      if (assignedAreaId) {
        await prisma.userArea.upsert({
          where: { userId_areaId: { userId: existing.id, areaId: assignedAreaId } },
          create: { userId: existing.id, areaId: assignedAreaId },
          update: {},
        });
        // Si es titular, agregar como titular del área
        if (assignedRole === "TITULAR") {
          await prisma.areaTitular.upsert({
            where: { areaId_userId: { areaId: assignedAreaId, userId: existing.id } },
            create: { areaId: assignedAreaId, userId: existing.id },
            update: {},
          });
        }
      }
    }
  }

  return NextResponse.json(entry, { status: 201 });
}

export async function DELETE(req) {
  const { error } = await requireAccess();
  if (error) return error;

  const { email } = await req.json();
  await prisma.whitelist.delete({ where: { email } });
  return NextResponse.json({ ok: true });
}
