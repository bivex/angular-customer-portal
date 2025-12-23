ALTER TABLE "abac_conditions" ALTER COLUMN "permission_id" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "permissions" ALTER COLUMN "id" SET DATA TYPE serial;--> statement-breakpoint
ALTER TABLE "permissions" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "role_permissions" ALTER COLUMN "permission_id" SET DATA TYPE integer;