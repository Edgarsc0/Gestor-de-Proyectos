// src/app/dashboard/layout.jsx
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Sidebar from "@/components/Sidebar";

export default async function DashboardLayout({ children }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 relative">
      {/* Malla — light mode (líneas oscuras) */}
      <div
        className="pointer-events-none fixed inset-0 dark:hidden"
        style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,0.07) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(0,0,0,0.07) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />
      {/* Malla — dark mode (líneas claras) */}
      <div
        className="pointer-events-none fixed inset-0 hidden dark:block"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Orbe rojo ANAM */}
      <div
        className="pointer-events-none fixed -top-40 -right-40 w-[700px] h-[700px] rounded-full opacity-20 dark:opacity-25"
        style={{
          background: "radial-gradient(circle, #8B1515 0%, transparent 70%)",
        }}
      />
      {/* Orbe dorado ANAM */}
      <div
        className="pointer-events-none fixed -bottom-40 -left-40 w-[600px] h-[600px] rounded-full opacity-10 dark:opacity-15"
        style={{
          background: "radial-gradient(circle, #D4A020 0%, transparent 70%)",
        }}
      />

      <Sidebar />
      <main className="relative z-10 lg:pl-[72px] transition-all duration-300">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pt-16 lg:pt-12">
          {children}
        </div>
      </main>
    </div>
  );
}
