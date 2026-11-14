CREATE TABLE "pilot_cards" (
	"id" text PRIMARY KEY NOT NULL,
	"content" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "practice_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"childId" uuid NOT NULL,
	"state" jsonb NOT NULL,
	"startedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "practice_sessions" ADD CONSTRAINT "practice_sessions_childId_child_profiles_id_fk" FOREIGN KEY ("childId") REFERENCES "public"."child_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "practice_child_date_idx" ON "practice_sessions" USING btree ("childId","startedAt");