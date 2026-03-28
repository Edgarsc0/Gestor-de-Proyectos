// src/app/api/members/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const members = await prisma.user.findMany({
    include: {
      assignments: {
        include: { project: { select: { id: true, name: true, color: true } } },
      },
      createdTasks: {
        select: { id: true, title: true, status: true, priority: true },
      },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(members);
}

// Asignar miembro a proyecto
export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json();
  const { userId, projectId, role } = body;

  if (!userId || !projectId) {
    return NextResponse.json({ error: "userId y projectId son requeridos" }, { status: 400 });
  }

  const assignment = await prisma.assignment.upsert({
    where: { userId_projectId: { userId, projectId } },
    update: { role: role || "Colaborador" },
    create: { userId, projectId, role: role || "Colaborador" },
    include: {
      user: { select: { name: true } },
      project: { select: { name: true } },
    },
  });

  return NextResponse.json(assignment, { status: 201 });
}

// Quitar miembro de proyecto
export async function DELETE(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  const projectId = searchParams.get("projectId");

  if (!userId || !projectId) {
    return NextResponse.json({ error: "userId y projectId son requeridos" }, { status: 400 });
  }

  await prisma.assignment.delete({
    where: { userId_projectId: { userId, projectId } },
  });

  return NextResponse.json({ ok: true });
}
