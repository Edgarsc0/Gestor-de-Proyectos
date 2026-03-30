import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      areas: {
        include: {
          area: { select: { id: true, name: true, color: true } },
        },
      },
    },
  });

  const myAreas = user?.areas?.map((ua) => ua.area) || [];
  return NextResponse.json(myAreas);
}
