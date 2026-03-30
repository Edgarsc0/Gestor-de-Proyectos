import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const role = session.user.role;
  const isAdmin = role === "SUPERADMIN" || role === "ADMIN";
  const isTitular = role === "TITULAR";

  if (!isAdmin && !isTitular) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  try {
    const { email, areaId } = await req.json();
    if (!email) return NextResponse.json({ error: "Email requerido" }, { status: 400 });
    if (!areaId) return NextResponse.json({ error: "Área requerida" }, { status: 400 });

    // Verificar que el área existe
    const area = await prisma.area.findUnique({ where: { id: areaId } });
    if (!area) {
      return NextResponse.json({ error: "Área no encontrada" }, { status: 404 });
    }

    // Si es TITULAR, verificar que sea titular de ese área específica
    if (isTitular) {
      const esTitularDeArea = await prisma.areaTitular.findUnique({
        where: { areaId_userId: { areaId, userId: session.user.id } },
      });
      if (!esTitularDeArea) {
        return NextResponse.json({ error: "No eres titular de esta área." }, { status: 403 });
      }
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      // Verificar que no sea ya miembro
      const yaMiembro = await prisma.userArea.findUnique({
        where: { userId_areaId: { userId: existingUser.id, areaId } },
      });
      if (yaMiembro) {
        return NextResponse.json({ error: "Este usuario ya es miembro del área." }, { status: 400 });
      }

      await prisma.userArea.create({ data: { userId: existingUser.id, areaId } });
      return NextResponse.json({
        success: true,
        message: `${existingUser.name || existingUser.email} ha sido agregado al área exitosamente.`,
      });
    } else {
      // Invitar por whitelist
      await prisma.whitelist.upsert({
        where: { email: email.toLowerCase() },
        create: { email: email.toLowerCase(), assignedAreaId: areaId, note: `Miembro - ${area.name}` },
        update: { assignedAreaId: areaId, note: `Miembro - ${area.name}` },
      });
      return NextResponse.json({
        success: true,
        message: "El correo fue invitado. Se unirá al área automáticamente cuando inicie sesión.",
      });
    }
  } catch (error) {
    return NextResponse.json({ error: "Ocurrió un error al procesar la solicitud." }, { status: 500 });
  }
}

export async function DELETE(req) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const role = session.user.role;
  const isAdmin = role === "SUPERADMIN" || role === "ADMIN";
  const isTitular = role === "TITULAR";

  if (!isAdmin && !isTitular) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  try {
    const { userId, areaId } = await req.json();
    if (!userId || !areaId) {
      return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
    }

    // Si es TITULAR, verificar que sea titular de ese área
    if (isTitular) {
      const esTitularDeArea = await prisma.areaTitular.findUnique({
        where: { areaId_userId: { areaId, userId: session.user.id } },
      });
      if (!esTitularDeArea) {
        return NextResponse.json({ error: "No eres titular de esta área." }, { status: 403 });
      }
    }

    await prisma.userArea.deleteMany({ where: { userId, areaId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Error al eliminar miembro." }, { status: 500 });
  }
}
