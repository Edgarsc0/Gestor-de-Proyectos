// src/lib/adminGuard.js
import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { NextResponse } from "next/server";

/** Solo SUPERADMIN */
export async function requireSuperAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return { error: NextResponse.json({ error: "No autenticado" }, { status: 401 }) };
  }
  if (session.user.role !== "SUPERADMIN") {
    return { error: NextResponse.json({ error: "Sin permisos" }, { status: 403 }) };
  }
  return { session };
}

/** SUPERADMIN o ADMIN */
export async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return { error: NextResponse.json({ error: "No autenticado" }, { status: 401 }) };
  }
  if (session.user.role !== "SUPERADMIN" && session.user.role !== "ADMIN") {
    return { error: NextResponse.json({ error: "Sin permisos" }, { status: 403 }) };
  }
  return { session };
}

/** SUPERADMIN, ADMIN o TITULAR (para whitelist) */
export async function requireAccess() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return { error: NextResponse.json({ error: "No autenticado" }, { status: 401 }) };
  }
  const allowed = ["SUPERADMIN", "ADMIN", "TITULAR"];
  if (!allowed.includes(session.user.role)) {
    return { error: NextResponse.json({ error: "Sin permisos" }, { status: 403 }) };
  }
  return { session };
}
