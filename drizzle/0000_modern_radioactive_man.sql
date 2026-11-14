CREATE TABLE "answer_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"eventId" uuid NOT NULL,
	"sessionId" uuid NOT NULL,
	"questionId" text NOT NULL,
	"attemptNumber" integer NOT NULL,
	"verdict" text NOT NULL,
	"originalVerdict" text,
	"corrected" boolean DEFAULT false NOT NULL,
	"responseTimeMs" integer,
	"hintUsed" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "attempt_event_unique" UNIQUE("sessionId","eventId"),
	CONSTRAINT "attempt_number_unique" UNIQUE("sessionId","questionId","attemptNumber"),
	CONSTRAINT "response_time_nonnegative" CHECK ("answer_attempts"."responseTimeMs" >= 0)
);
--> statement-breakpoint
CREATE TABLE "auth_sessions" (
	"tokenHash" text PRIMARY KEY NOT NULL,
	"userId" uuid NOT NULL,
	"expiresAt" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"color" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "child_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"name" text NOT NULL,
	"parentName" text DEFAULT 'Bunda' NOT NULL,
	"friendName" text DEFAULT 'Lala' NOT NULL,
	"petName" text DEFAULT 'Milo' NOT NULL,
	"age" integer,
	"lastLevel" integer DEFAULT 1 NOT NULL,
	"sensoryMode" boolean DEFAULT false NOT NULL,
	CONSTRAINT "child_level_range" CHECK ("child_profiles"."lastLevel" between 1 and 5),
	CONSTRAINT "child_age_range" CHECK ("child_profiles"."age" between 1 and 18)
);
--> statement-breakpoint
CREATE TABLE "learning_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"childId" uuid NOT NULL,
	"category" text NOT NULL,
	"level" integer NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"questionIds" jsonb NOT NULL,
	"cursor" integer DEFAULT 0 NOT NULL,
	"hintedQuestionIds" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"startedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"finishedAt" timestamp with time zone,
	CONSTRAINT "session_level_range" CHECK ("learning_sessions"."level" between 1 and 5)
);
--> statement-breakpoint
CREATE TABLE "questions" (
	"id" text PRIMARY KEY NOT NULL,
	"category" text NOT NULL,
	"level" integer NOT NULL,
	"story" text NOT NULL,
	"prompt" text NOT NULL,
	"expectedAnswer" text NOT NULL,
	"alternatives" jsonb NOT NULL,
	"hint" jsonb NOT NULL,
	CONSTRAINT "question_level_range" CHECK ("questions"."level" between 1 and 5)
);
--> statement-breakpoint
CREATE TABLE "rate_limits" (
	"key" text PRIMARY KEY NOT NULL,
	"count" integer NOT NULL,
	"resetAt" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"passwordHash" text NOT NULL,
	"name" text NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "answer_attempts" ADD CONSTRAINT "answer_attempts_sessionId_learning_sessions_id_fk" FOREIGN KEY ("sessionId") REFERENCES "public"."learning_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "answer_attempts" ADD CONSTRAINT "answer_attempts_questionId_questions_id_fk" FOREIGN KEY ("questionId") REFERENCES "public"."questions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth_sessions" ADD CONSTRAINT "auth_sessions_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "child_profiles" ADD CONSTRAINT "child_profiles_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_sessions" ADD CONSTRAINT "learning_sessions_childId_child_profiles_id_fk" FOREIGN KEY ("childId") REFERENCES "public"."child_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_sessions" ADD CONSTRAINT "learning_sessions_category_categories_id_fk" FOREIGN KEY ("category") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_category_categories_id_fk" FOREIGN KEY ("category") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "attempt_session_idx" ON "answer_attempts" USING btree ("sessionId");--> statement-breakpoint
CREATE INDEX "auth_user_idx" ON "auth_sessions" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "child_owner_idx" ON "child_profiles" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "session_child_date_idx" ON "learning_sessions" USING btree ("childId","startedAt");--> statement-breakpoint
CREATE INDEX "question_category_level_idx" ON "questions" USING btree ("category","level");