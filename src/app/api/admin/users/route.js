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

export async function DELETE(request) {
  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const projectId = searchParams.get("projectId");

    if (!userId || !projectId) {
      return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
    }

    await prisma.assignment.deleteMany({ where: { userId, projectId } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Error al remover usuario" },
      { status: 500 },
    );
  }
}
