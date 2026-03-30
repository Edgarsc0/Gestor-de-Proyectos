import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        areas: { include: { area: true } },
        lastSeen: true,
      },
    });
    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json(
      { error: "Error al obtener usuarios" },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  try {
    const { userId, projectId } = await request.json();

    if (!userId || !projectId) {
      return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
    }

    const assignment = await prisma.assignment.create({
      data: { userId, projectId },
    });

    return NextResponse.json(assignment);
  } catch (error) {
    return NextResponse.json(
      { error: "Error al asignar usuario" },
      { status: 500 },
    );
  }
}

export async function PATCH(request) {
  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  try {
    const { userId, role } = await request.json();

    if (!userId || !role) {
      return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: { id: true, name: true, email: true, role: true },
    });

    return NextResponse.json(user);
  } catch (error) {
    return NextResponse.json(
      { error: "Error al cambiar el rol" },
      { status: 500 },
    );
  }
}

export async function DELETE(request) {
  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
    }

    await prisma.$transaction([
      // Limpiar relaciones sin onDelete: Cascade
      prisma.task.updateMany({ where: { assigneeId: userId }, data: { assigneeId: null } }),
      prisma.projectFile.deleteMany({ where: { uploadedById: userId } }),
      // Eliminar el usuario (Account, Session, Assignment, UserArea, Post, Message tienen Cascade)
      prisma.user.delete({ where: { id: userId } }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Error al eliminar usuario" },
      { status: 500 },
    );
  }
}
