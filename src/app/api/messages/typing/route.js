import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { pusher } from "@/lib/pusher";

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { receiverId } = await request.json();
  if (!receiverId)
    return NextResponse.json({ error: "Falta receiverId" }, { status: 400 });

  // Disparar evento de Pusher
  await pusher.trigger(`private-user-${receiverId}`, "incoming-typing", {
    senderId: session.user.id,
  });

  return NextResponse.json({ ok: true });
}
