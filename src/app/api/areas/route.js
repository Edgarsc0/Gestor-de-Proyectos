// src/app/api/areas/route.js
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

function deriveStatusFromColumn(columns, columnId) {
  if (!columnId || !columns?.length) return null;
  const sorted = [...columns].sort((a, b) => a.order - b.order);
  const idx = sorted.findIndex((c) => c.id === columnId);
  if (idx < 0) return null;
  if (idx === 0) return "PENDING";
  if (idx === sorted.length - 1) return "COMPLETED";
  if (sorted.length >= 4 && idx === sorted.length - 2) return "IN_REVIEW";
  return "IN_PROGRESS";
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user)
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const areas = await prisma.area.findMany({
    include: {
      titular: { select: { id: true, name: true, email: true, image: true } },
      projects: {
        include: {
          tasks: { select: { id: true, status: true, columnId: true } },
          columns: { select: { id: true, order: true } },
          assignments: {
            select: {
              userId: true,
              user: { select: { id: true, name: true, image: true } },
            },
          },
        },
      },
      _count: { select: { users: true, projects: true } },
    },
    orderBy: { name: "asc" },
  });

  // Normalize task statuses using columnId position
  const normalized = areas.map((area) => ({
    ...area,
    projects: area.projects.map((project) => ({
      ...project,
      tasks: project.tasks.map((t) => ({
        ...t,
        status: deriveStatusFromColumn(project.columns, t.columnId) ?? t.status,
      })),
    })),
  }));

  return NextResponse.json(normalized);
}
