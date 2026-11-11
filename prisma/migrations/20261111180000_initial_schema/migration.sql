-- CreateTable
CREATE TABLE IF NOT EXISTS "members" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "designation" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "profile_photo_url" TEXT,
    "join_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "temp_role" TEXT,
    "temp_role_expires_at" TIMESTAMP(3),

    CONSTRAINT "members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "central_members" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "designation" TEXT NOT NULL,
    "join_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "central_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "sessions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "venue" TEXT,
    "starts_at" TIMESTAMP(3) NOT NULL,
    "ends_at" TIMESTAMP(3) NOT NULL,
    "qr_secret" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_pre_event" BOOLEAN NOT NULL DEFAULT false,
    "requires_feedback" BOOLEAN NOT NULL DEFAULT false,
    "recurrence" TEXT NOT NULL DEFAULT 'NONE',
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "pre_event_rsvps" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "dept" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "designation" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pre_event_rsvps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "attendance" (
    "id" TEXT NOT NULL,
    "member_id" TEXT NOT NULL,
    "member_name" TEXT,
    "session_id" TEXT NOT NULL,
    "check_in_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "check_out_requested_at" TIMESTAMP(3),
    "check_out_approved_at" TIMESTAMP(3),
    "approved_by" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PRESENT',
    "method" TEXT NOT NULL,
    "check_in_ip" TEXT,
    "device_type" TEXT,
    "notes" TEXT,
    "duration_minutes" INTEGER,

    CONSTRAINT "attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "signout_requests" (
    "id" TEXT NOT NULL,
    "attendance_id" TEXT NOT NULL,
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewed_by" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "action" TEXT NOT NULL DEFAULT 'PENDING',
    "rejection_reason" TEXT,
    "is_escalated" BOOLEAN NOT NULL DEFAULT false,
    "needs_review" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "signout_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "metadata_json" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "announcements" (
    "id" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "announcements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "audit_logs" (
    "id" TEXT NOT NULL,
    "actor_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "target_type" TEXT NOT NULL,
    "target_id" TEXT,
    "metadata" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "members_email_key" ON "members"("email");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "members_student_id_key" ON "members"("student_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "members_department_idx" ON "members"("department");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "members_role_idx" ON "members"("role");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "members_is_active_idx" ON "members"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "central_members_email_key" ON "central_members"("email");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "central_members_student_id_key" ON "central_members"("student_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "sessions_is_active_starts_at_idx" ON "sessions"("is_active", "starts_at");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "sessions_is_pre_event_is_active_starts_at_idx" ON "sessions"("is_pre_event", "is_active", "starts_at");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "sessions_is_pre_event_ends_at_idx" ON "sessions"("is_pre_event", "ends_at");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "pre_event_rsvps_session_id_status_idx" ON "pre_event_rsvps"("session_id", "status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "pre_event_rsvps_student_id_idx" ON "pre_event_rsvps"("student_id");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "pre_event_rsvps_session_id_student_id_key" ON "pre_event_rsvps"("session_id", "student_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "attendance_session_id_status_idx" ON "attendance"("session_id", "status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "attendance_member_id_check_in_at_idx" ON "attendance"("member_id", "check_in_at");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "attendance_status_idx" ON "attendance"("status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "attendance_check_in_at_idx" ON "attendance"("check_in_at");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "signout_requests_action_requested_at_idx" ON "signout_requests"("action", "requested_at");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "signout_requests_attendance_id_idx" ON "signout_requests"("attendance_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "notifications_user_id_is_read_idx" ON "notifications"("user_id", "is_read");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "notifications_user_id_created_at_idx" ON "notifications"("user_id", "created_at");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "announcements_is_active_created_at_idx" ON "announcements"("is_active", "created_at");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "audit_logs_actor_id_created_at_idx" ON "audit_logs"("actor_id", "created_at");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "audit_logs_action_created_at_idx" ON "audit_logs"("action", "created_at");



-- AddForeignKey
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sessions_created_by_fkey') THEN ALTER TABLE "sessions" ADD CONSTRAINT "sessions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "members"("id") ON DELETE RESTRICT ON UPDATE CASCADE; END IF; END $$;

-- AddForeignKey
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'pre_event_rsvps_session_id_fkey') THEN ALTER TABLE "pre_event_rsvps" ADD CONSTRAINT "pre_event_rsvps_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE; END IF; END $$;

-- AddForeignKey
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'attendance_member_id_fkey') THEN ALTER TABLE "attendance" ADD CONSTRAINT "attendance_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE RESTRICT ON UPDATE CASCADE; END IF; END $$;

-- AddForeignKey
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'attendance_session_id_fkey') THEN ALTER TABLE "attendance" ADD CONSTRAINT "attendance_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE; END IF; END $$;

-- AddForeignKey
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'signout_requests_attendance_id_fkey') THEN ALTER TABLE "signout_requests" ADD CONSTRAINT "signout_requests_attendance_id_fkey" FOREIGN KEY ("attendance_id") REFERENCES "attendance"("id") ON DELETE RESTRICT ON UPDATE CASCADE; END IF; END $$;

-- AddForeignKey
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'signout_requests_reviewed_by_fkey') THEN ALTER TABLE "signout_requests" ADD CONSTRAINT "signout_requests_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "members"("id") ON DELETE SET NULL ON UPDATE CASCADE; END IF; END $$;

-- AddForeignKey
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'notifications_user_id_fkey') THEN ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "members"("id") ON DELETE RESTRICT ON UPDATE CASCADE; END IF; END $$;

-- AddForeignKey
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'announcements_created_by_fkey') THEN ALTER TABLE "announcements" ADD CONSTRAINT "announcements_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "members"("id") ON DELETE RESTRICT ON UPDATE CASCADE; END IF; END $$;

-- AddForeignKey
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'audit_logs_actor_id_fkey') THEN ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "members"("id") ON DELETE SET NULL ON UPDATE CASCADE; END IF; END $$;

