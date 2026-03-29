-- Upgrade existing ADMIN users to SUPERADMIN
UPDATE "User" SET role = 'SUPERADMIN' WHERE role = 'ADMIN';
