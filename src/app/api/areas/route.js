// src/app/api/areas/route.js
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user)
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const areas = await prisma.area.findMany({
    include: {
      titular: { select: { id: true, name: true, email: true, image: true } },
      projects: {
        include: {
          tasks: { select: { id: true, status: true } },
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

  return NextResponse.json(areas);
}
