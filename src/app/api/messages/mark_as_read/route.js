import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { senderId } = await request.json();
  if (!senderId) {
    return NextResponse.json({ error: "Falta senderId" }, { status: 400 });
  }

  await prisma.message.updateMany({
    where: {
      receiverId: session.user.id,
      senderId: senderId,
      isRead: false,
    },
    data: {
      isRead: true,
    },
  });

  return NextResponse.json({ ok: true });
}
