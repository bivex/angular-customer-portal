CREATE TYPE "public"."audit_event_type" AS ENUM('user_login', 'user_logout', 'user_register', 'password_change', 'token_refresh', 'token_revoked', 'session_created', 'session_revoked', 'permission_denied', 'step_up_required', 'step_up_completed', 'suspicious_activity', 'account_locked', 'account_unlocked');--> statement-breakpoint
CREATE TYPE "public"."event_result" AS ENUM('success', 'failure', 'denied');--> statement-breakpoint
CREATE TYPE "public"."event_severity" AS ENUM('info', 'warning', 'error', 'critical');--> statement-breakpoint
CREATE TABLE "audit_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" integer,
	"session_id" uuid,
	"event_type" "audit_event_type" NOT NULL,
	"event_severity" "event_severity" DEFAULT 'info' NOT NULL,
	"ip_address" "inet",
	"user_agent" text,
	"resource" text,
	"action" text,
	"result" "event_result",
	"metadata" jsonb,
	"risk_indicators" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "permissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"resource" text NOT NULL,
	"action" text NOT NULL,
	"conditions" jsonb,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "role_permissions" (
	"role_id" integer NOT NULL,
	"permission_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	PRIMARY KEY ("role_id", "permission_id")
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"is_system_role" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "roles_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" integer NOT NULL,
	"access_token_jti" text NOT NULL,
	"refresh_token_jti" text,
	"ip_address" "inet",
	"ip_hash" text,
	"user_agent" text,
	"user_agent_hash" text,
	"device_fingerprint" text,
	"geolocation" jsonb,
	"risk_score" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_activity_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL,
	"revoked_at" timestamp,
	"revoked_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sessions_access_token_jti_unique" UNIQUE("access_token_jti"),
	CONSTRAINT "sessions_refresh_token_jti_unique" UNIQUE("refresh_token_jti"),
	CONSTRAINT "risk_score_check" CHECK ("sessions"."risk_score" >= 0 AND "sessions"."risk_score" <= 100)
);
--> statement-breakpoint
CREATE TABLE "user_attributes" (
	"user_id" integer NOT NULL,
	"attribute_key" text NOT NULL,
	"attribute_value" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	PRIMARY KEY ("user_id", "attribute_key")
);
--> statement-breakpoint
CREATE TABLE "user_roles" (
	"user_id" integer NOT NULL,
	"role_id" integer NOT NULL,
	"granted_at" timestamp DEFAULT now() NOT NULL,
	"granted_by" integer,
	PRIMARY KEY ("user_id", "role_id")
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "last_login_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "failed_login_attempts" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "locked_until" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "require_step_up" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "security_level" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_permissions_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_attributes" ADD CONSTRAINT "user_attributes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_granted_by_users_id_fk" FOREIGN KEY ("granted_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "security_level_check" CHECK ("users"."security_level" >= 1 AND "users"."security_level" <= 5);--> statement-breakpoint
CREATE INDEX "idx_sessions_user_id" ON "sessions" ("user_id");--> statement-breakpoint
CREATE INDEX "idx_sessions_access_token_jti" ON "sessions" ("access_token_jti");--> statement-breakpoint
CREATE INDEX "idx_sessions_refresh_token_jti" ON "sessions" ("refresh_token_jti");--> statement-breakpoint
CREATE INDEX "idx_sessions_is_active" ON "sessions" ("is_active") WHERE "is_active" = true;--> statement-breakpoint
CREATE INDEX "idx_sessions_expires_at" ON "sessions" ("expires_at");--> statement-breakpoint
CREATE INDEX "idx_audit_events_user_id" ON "audit_events" ("user_id");--> statement-breakpoint
CREATE INDEX "idx_audit_events_session_id" ON "audit_events" ("session_id");--> statement-breakpoint
CREATE INDEX "idx_audit_events_event_type" ON "audit_events" ("event_type");--> statement-breakpoint
CREATE INDEX "idx_audit_events_created_at" ON "audit_events" ("created_at" DESC);--> statement-breakpoint
CREATE INDEX "idx_audit_events_event_severity" ON "audit_events" ("event_severity");