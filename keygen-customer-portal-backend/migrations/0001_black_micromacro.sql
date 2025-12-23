ALTER TABLE "users" ALTER COLUMN "auth0_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "password" text;