// src/app/api/dashboard/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const [
    totalProjects,
    activeProjects,
    totalTasks,
    completedTasks,
    inProgressTasks,
    pendingTasks,
    totalMembers,
    recentTasks,
    projects,
    members,
  ] = await Promise.all([
    prisma.project.count(),
    prisma.project.count({ where: { status: "ACTIVE" } }),
    prisma.task.count(),
    prisma.task.count({ where: { status: "COMPLETED" } }),
    prisma.task.count({ where: { status: "IN_PROGRESS" } }),
    prisma.task.count({ where: { status: "PENDING" } }),
    prisma.user.count(),
    prisma.task.findMany({
      take: 8,
      orderBy: { updatedAt: "desc" },
      include: {
        project: { select: { name: true, color: true } },
        assignee: { select: { name: true, image: true } },
      },
    }),
    prisma.project.findMany({
      where: { status: "ACTIVE" },
      include: {
        tasks: { select: { status: true, columnId: true } },
        columns: { select: { id: true, order: true } },
        assignments: {
          include: { user: { select: { name: true, image: true } } },
        },
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.user.findMany({
      include: {
        assignments: {
          include: { project: { select: { name: true, color: true } } },
        },
        createdTasks: {
          where: { status: { not: "COMPLETED" } },
          select: { id: true, title: true, status: true, priority: true, project: { select: { name: true, color: true } } },
          orderBy: { updatedAt: "desc" },
        },
      },
      orderBy: { name: "asc" },
    }),
  ]);

  // Calcular progreso por proyecto (usa la última columna o status COMPLETED)
  const projectsWithProgress = projects.map((p) => {
    const sortedCols = (p.columns || []).sort((a, b) => a.order - b.order);
    const lastColId = sortedCols[sortedCols.length - 1]?.id;
    const total = p.tasks.length;
    const done = p.tasks.filter((t) =>
      t.status === "COMPLETED" || (lastColId && t.columnId === lastColId)
    ).length;
    return {
      ...p,
      progress: total > 0 ? Math.round((done / total) * 100) : 0,
      taskCount: total,
      completedCount: done,
    };
  });

  return NextResponse.json({
    stats: {
      totalProjects,
      activeProjects,
      totalTasks,
      completedTasks,
      inProgressTasks,
      pendingTasks,
      totalMembers,
      completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
    },
    recentTasks,
    projects: projectsWithProgress,
    members,
  });
}
