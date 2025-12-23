ALTER TABLE "permissions" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "permissions" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "role_permissions" ALTER COLUMN "permission_id" SET DATA TYPE uuid;