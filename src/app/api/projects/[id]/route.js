// src/app/api/projects/[id]/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: {
      area: { select: { id: true, name: true, color: true } },
      columns: { orderBy: { order: "asc" } },
      tasks: {
        include: {
          assignee: {
            select: { id: true, name: true, image: true, email: true },
          },
        },
        orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      },
      assignments: {
        include: {
          user: { select: { id: true, name: true, image: true, email: true } },
        },
      },
      files: {
        include: {
          uploadedBy: { select: { id: true, name: true, image: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!project)
    return NextResponse.json(
      { error: "Proyecto no encontrado" },
      { status: 404 },
    );

  return NextResponse.json(project);
}
