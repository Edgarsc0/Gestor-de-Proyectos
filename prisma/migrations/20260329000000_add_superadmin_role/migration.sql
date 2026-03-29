-- AlterEnum: Add SUPERADMIN value (must be in its own transaction in PostgreSQL)
ALTER TYPE "Role" ADD VALUE 'SUPERADMIN';
