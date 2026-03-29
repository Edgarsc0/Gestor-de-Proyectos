// src/lib/auth.js
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "./prisma";

export const authOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      // Permitir si ya existe en la BD (fue admitido antes)
      const existing = await prisma.user.findUnique({ where: { email: user.email } });
      if (existing) return true;
      // Nuevo usuario: verificar whitelist
      const allowed = await prisma.whitelist.findUnique({ where: { email: user.email } });
      return !!allowed;
    },
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        session.user.role = user.role;
      }
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      // Al crear un usuario nuevo, aplicar el rol y área asignados en la whitelist
      const entry = await prisma.whitelist.findUnique({ where: { email: user.email } });
      if (!entry) return;

      const updates = {};
      if (entry.assignedRole) updates.role = entry.assignedRole;

      if (Object.keys(updates).length > 0) {
        await prisma.user.update({ where: { id: user.id }, data: updates });
      }

      if (entry.assignedAreaId) {
        // Agregar al área
        await prisma.userArea.upsert({
          where: { userId_areaId: { userId: user.id, areaId: entry.assignedAreaId } },
          create: { userId: user.id, areaId: entry.assignedAreaId },
          update: {},
        });
        // Si es TITULAR, actualizar el titular del área
        if (entry.assignedRole === "TITULAR") {
          await prisma.area.update({
            where: { id: entry.assignedAreaId },
            data: { titularId: user.id },
          });
        }
      }
    },
  },
  pages: {
    signIn: "/login",
  },
};
