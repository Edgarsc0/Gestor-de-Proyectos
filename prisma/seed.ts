// prisma/seed.ts
// Datos de ejemplo para probar el sistema

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Sembrando datos de ejemplo...");

  // Crear proyectos
  const proyecto1 = await prisma.project.create({
    data: {
      name: "Rediseño Sitio Web",
      description: "Actualizar el sitio web institucional con nuevo diseño y contenido",
      color: "#6366f1",
      status: "ACTIVE",
    },
  });

  const proyecto2 = await prisma.project.create({
    data: {
      name: "App de Inventario",
      description: "Desarrollar aplicación para control de inventario del almacén",
      color: "#f59e0b",
      status: "ACTIVE",
    },
  });

  const proyecto3 = await prisma.project.create({
    data: {
      name: "Capacitación Digital",
      description: "Programa de capacitación en herramientas digitales para el personal",
      color: "#10b981",
      status: "ACTIVE",
    },
  });

  console.log("✅ Proyectos creados:", proyecto1.name, proyecto2.name, proyecto3.name);

  // Crear tareas para cada proyecto
  await prisma.task.createMany({
    data: [
      // Rediseño Sitio Web
      { title: "Diseñar wireframes", description: "Crear wireframes de las páginas principales", status: "COMPLETED", priority: "HIGH", projectId: proyecto1.id },
      { title: "Maquetación HTML/CSS", description: "Implementar los diseños aprobados", status: "IN_PROGRESS", priority: "HIGH", projectId: proyecto1.id },
      { title: "Migrar contenido", description: "Trasladar el contenido del sitio anterior", status: "PENDING", priority: "MEDIUM", projectId: proyecto1.id },
      { title: "Pruebas de usabilidad", description: "Realizar pruebas con usuarios reales", status: "PENDING", priority: "LOW", projectId: proyecto1.id },

      // App de Inventario
      { title: "Definir modelo de datos", status: "COMPLETED", priority: "HIGH", projectId: proyecto2.id },
      { title: "API de productos", description: "Endpoints CRUD para gestión de productos", status: "IN_PROGRESS", priority: "HIGH", projectId: proyecto2.id },
      { title: "Pantalla de escaneo", description: "Integrar lector de código de barras", status: "PENDING", priority: "MEDIUM", projectId: proyecto2.id },
      { title: "Reportes PDF", description: "Generar reportes de inventario en PDF", status: "PENDING", priority: "LOW", projectId: proyecto2.id },

      // Capacitación
      { title: "Crear temario", status: "COMPLETED", priority: "HIGH", projectId: proyecto3.id },
      { title: "Grabar videos módulo 1", description: "Videos introductorios de la plataforma", status: "IN_PROGRESS", priority: "MEDIUM", projectId: proyecto3.id },
      { title: "Elaborar evaluaciones", description: "Cuestionarios para cada módulo", status: "PENDING", priority: "MEDIUM", projectId: proyecto3.id },
    ],
  });

  console.log("✅ Tareas de ejemplo creadas");
  console.log("\n🎉 ¡Listo! Inicia sesión con Google para comenzar a usar el sistema.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
