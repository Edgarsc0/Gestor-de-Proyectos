import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { pusher } from "@/lib/pusher";

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session)
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const { uploadId, chunkIndex, totalChunks, data, fileName, fileType, receiverId, projectId } =
      await request.json();

    if (!uploadId || chunkIndex == null || !totalChunks || !data || !fileName || !receiverId || !projectId) {
      return NextResponse.json({ error: "Faltan datos del chunk" }, { status: 400 });
    }

    // Guardar el chunk en la BD
    await prisma.fileChunk.upsert({
      where: { uploadId_chunkIndex: { uploadId, chunkIndex } },
      create: {
        uploadId,
        chunkIndex,
        totalChunks,
        data,
        fileName,
        fileType,
        senderId: session.user.id,
        receiverId,
        projectId,
      },
      update: { data },
    });

    // Verificar cuántos chunks han llegado
    const received = await prisma.fileChunk.count({ where: { uploadId } });

    if (received < totalChunks) {
      // Aún faltan chunks
      return NextResponse.json({ status: "partial", received, total: totalChunks });
    }

    // ── Todos los chunks llegaron: reconstruir el archivo ──
    const chunks = await prisma.fileChunk.findMany({
      where: { uploadId },
      orderBy: { chunkIndex: "asc" },
      select: { data: true, fileType: true, fileName: true },
    });

    // Decodificar y concatenar buffers binarios
    const buffers = chunks.map((c) => Buffer.from(c.data, "base64"));
    const combined = Buffer.concat(buffers);
    const mimeType = fileType || chunks[0]?.fileType || "application/octet-stream";
    const fileUrl = `data:${mimeType};base64,${combined.toString("base64")}`;

    // Crear el mensaje con el archivo completo
    const message = await prisma.message.create({
      data: {
        fileUrl,
        fileName,
        senderId: session.user.id,
        receiverId,
        projectId,
      },
    });

    // Limpiar chunks temporales
    await prisma.fileChunk.deleteMany({ where: { uploadId } });

    // Notificar al receptor por Pusher (solo metadata, sin fileUrl)
    await pusher.trigger(`private-user-${receiverId}`, "incoming-message", {
      id: message.id,
      senderId: message.senderId,
      receiverId: message.receiverId,
      projectId: message.projectId,
      text: message.text,
      fileName: message.fileName,
      isRead: message.isRead,
      createdAt: message.createdAt,
    });

    return NextResponse.json(message);
  } catch (error) {
    console.error("Error en upload-chunk:", error);
    return NextResponse.json({ error: "Error al procesar el chunk" }, { status: 500 });
  }
}
