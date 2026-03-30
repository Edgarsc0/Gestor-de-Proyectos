// src/app/api/areas/[id]/route.js
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user)
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const area = await prisma.area.findUnique({
    where: { id: params.id },
    include: {
      titulares: { include: { user: { select: { id: true, name: true, email: true, image: true } } } },
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
        orderBy: { createdAt: "desc" },
      },
      users: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
              role: true,
            },
          },
        },
      },
    },
  });

  if (!area)
    return NextResponse.json({ error: "Área no encontrada" }, { status: 404 });

  return NextResponse.json(area);
}
