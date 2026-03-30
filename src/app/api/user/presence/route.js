import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const idsParam = searchParams.get("ids");
  if (!idsParam) return NextResponse.json({});

  const ids = idsParam.split(",").filter(Boolean);
  if (ids.length === 0) return NextResponse.json({});

  const users = await prisma.user.findMany({
    where: { id: { in: ids } },
    select: { id: true, lastSeen: true },
  });

  const result = {};
  for (const u of users) {
    result[u.id] = { lastSeen: u.lastSeen };
  }

  return NextResponse.json(result);
}
