CREATE TYPE "public"."condition_operator" AS ENUM('=', '!=', '>', '<', '>=', '<=', 'in', 'not_in', 'contains', 'not_contains', 'between', 'regex_match');--> statement-breakpoint
CREATE TYPE "public"."condition_type" AS ENUM('time_window', 'ip_range', 'risk_score', 'user_attribute', 'geolocation', 'device_fingerprint', 'security_level');--> statement-breakpoint
CREATE TABLE "abac_conditions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"permission_id" uuid NOT NULL,
	"condition_type" "condition_type" NOT NULL,
	"condition_key" text,
	"operator" "condition_operator" NOT NULL,
	"value_text" text,
	"value_number" numeric,
	"value_jsonb" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sessions" DROP CONSTRAINT "sessions_access_token_jti_unique";--> statement-breakpoint
ALTER TABLE "sessions" DROP CONSTRAINT "sessions_refresh_token_jti_unique";--> statement-breakpoint
ALTER TABLE "sessions" ALTER COLUMN "access_token_jti" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "audit_events" ADD COLUMN "event_hash" text;--> statement-breakpoint
ALTER TABLE "audit_events" ADD COLUMN "previous_event_hash" text;--> statement-breakpoint
ALTER TABLE "user_roles" ADD COLUMN "expires_at" timestamp;--> statement-breakpoint
ALTER TABLE "user_roles" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "abac_conditions" ADD CONSTRAINT "abac_conditions_permission_id_permissions_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE cascade ON UPDATE no action;