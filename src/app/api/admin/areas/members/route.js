import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "TITULAR") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: "Email requerido" }, { status: 400 });

    // Buscar el área del que este usuario es Titular
    const titularArea = await prisma.area.findFirst({
      where: { titularId: session.user.id }
    });

    if (!titularArea) {
      return NextResponse.json({ error: "No tienes un área asignada como Titular." }, { status: 400 });
    }

    // Revisar si el usuario que queremos agregar ya existe en la Base de Datos
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingUser) {
      // Lo unimos al área inmediatamente
      await prisma.userArea.upsert({
        where: { userId_areaId: { userId: existingUser.id, areaId: titularArea.id } },
        create: { userId: existingUser.id, areaId: titularArea.id },
        update: {}
      });
      return NextResponse.json({ success: true, message: "El usuario ha sido agregado a tu área exitosamente." });
    } else {
      // Si no tiene cuenta, lo agregamos a Accesos Permitidos (Whitelist)
      await prisma.whitelist.upsert({
        where: { email: email.toLowerCase() },
        create: { email: email.toLowerCase(), note: `Miembro - ${titularArea.name}` },
        update: { note: `Miembro - ${titularArea.name}` }
      });
      return NextResponse.json({ success: true, message: "El correo fue invitado. Se unirá al área automáticamente cuando inicie sesión." });
    }
  } catch (error) {
    return NextResponse.json({ error: "Ocurrió un error al procesar la solicitud." }, { status: 500 });
  }
}