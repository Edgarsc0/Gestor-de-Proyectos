import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json({ error: "Falta el ID del proyecto" }, { status: 400 });
    }

    const messages = await prisma.message.findMany({
      where: {
        projectId,
        OR: [
          { senderId: session.user.id },
          { receiverId: session.user.id }
        ]
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json({ error: "Error al obtener los mensajes" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const { text, fileUrl, fileName, receiverId, projectId } = await request.json();

    if ((!text && !fileUrl) || !receiverId || !projectId) {
      return NextResponse.json({ error: "Faltan datos requeridos" }, { status: 400 });
    }

    const message = await prisma.message.create({
      data: {
        text,
        fileUrl,
        fileName,
        senderId: session.user.id,
        receiverId,
        projectId,
      },
    });

    return NextResponse.json(message);
  } catch (error) {
    console.error("Error creating message:", error);
    return NextResponse.json({ error: "Error al enviar el mensaje" }, { status: 500 });
  }
}