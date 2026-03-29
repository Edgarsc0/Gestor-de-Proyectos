import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json(
        { error: "Falta el ID del proyecto" },
        { status: 400 },
      );
    }

    const posts = await prisma.post.findMany({
      where: { projectId },
      include: {
        author: {
          select: { id: true, name: true, image: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(posts);
  } catch (error) {
    console.error("Error fetching posts:", error);
    return NextResponse.json(
      { error: "Error al obtener las publicaciones" },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { title, content, fileUrl, fileName, projectId } = await request.json();

    if (!content || !projectId) {
      return NextResponse.json(
        { error: "Faltan datos requeridos" },
        { status: 400 },
      );
    }

    const post = await prisma.post.create({
      data: {
        title,
        content,
        fileUrl,
        fileName,
        projectId,
        authorId: session.user.id,
      },
      include: {
        author: {
          select: { id: true, name: true, image: true, email: true },
        },
      },
    });

    return NextResponse.json(post);
  } catch (error) {
    console.error("Error creating post:", error);
    return NextResponse.json(
      { error: "Error al crear la publicación" },
      { status: 500 },
    );
  }
}
