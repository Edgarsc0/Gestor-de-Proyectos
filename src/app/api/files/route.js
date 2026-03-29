// src/app/api/files/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeFile, unlink, mkdir } from "fs/promises";
import path from "path";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

async function ensureUploadDir() {
  try {
    await mkdir(UPLOAD_DIR, { recursive: true });
  } catch {}
}

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  await ensureUploadDir();

  const formData = await req.formData();
  const file = formData.get("file");
  const projectId = formData.get("projectId");

  if (!file || !projectId) {
    return NextResponse.json({ error: "Archivo y proyecto son requeridos" }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const ext = path.extname(file.name);
  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  const filename = `${Date.now()}-${safeName}`;
  const filepath = path.join(UPLOAD_DIR, filename);

  await writeFile(filepath, buffer);

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });

  const dbFile = await prisma.projectFile.create({
    data: {
      name: file.name,
      url: `/uploads/${filename}`,
      size: file.size,
      type: file.type || "application/octet-stream",
      projectId,
      uploadedById: user.id,
    },
    include: {
      uploadedBy: { select: { id: true, name: true, image: true } },
    },
  });

  return NextResponse.json(dbFile, { status: 201 });
}

export async function DELETE(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID requerido" }, { status: 400 });

  const file = await prisma.projectFile.findUnique({ where: { id } });
  if (!file) return NextResponse.json({ error: "Archivo no encontrado" }, { status: 404 });

  // Delete from disk
  try {
    const filepath = path.join(process.cwd(), "public", file.url);
    await unlink(filepath);
  } catch {}

  await prisma.projectFile.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
