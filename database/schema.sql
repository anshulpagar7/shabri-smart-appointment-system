-- ============================================================
--  SHABRI SMART APPOINTMENT MANAGEMENT SYSTEM
--  Database Schema — PostgreSQL / Supabase
--  Version: 1.0
-- ============================================================

-- ── Extensions ───────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── Clean slate (for dev resets) ─────────────────────────────
DROP TABLE IF EXISTS notifications       CASCADE;
DROP TABLE IF EXISTS appointment_logs    CASCADE;
DROP TABLE IF EXISTS blocked_slots       CASCADE;
DROP TABLE IF EXISTS holidays            CASCADE;
DROP TABLE IF EXISTS appointments        CASCADE;
DROP TABLE IF EXISTS officer_schedules   CASCADE;
DROP TABLE IF EXISTS officers            CASCADE;
DROP TABLE IF EXISTS citizens            CASCADE;
DROP TABLE IF EXISTS users               CASCADE;
DROP TYPE  IF EXISTS user_role           CASCADE;
DROP TYPE  IF EXISTS appointment_status  CASCADE;
DROP TYPE  IF EXISTS notification_type   CASCADE;
DROP TYPE  IF EXISTS block_reason        CASCADE;
DROP TYPE  IF EXISTS slot_duration       CASCADE;

-- ============================================================
--  ENUMS
-- ============================================================

CREATE TYPE user_role AS ENUM (
  'admin',
  'staff',
  'madam'
);

CREATE TYPE appointment_status AS ENUM (
  'booked',
  'arrived',
  'in_meeting',
  'completed',
  'cancelled',
  'no_show',
  'rescheduled'
);

CREATE TYPE notification_type AS ENUM (
  'booking_confirmed',
  'booking_cancelled',
  'booking_rescheduled',
  'delay_alert',
  'reminder_day_before',
  'reminder_one_hour',
  'officer_ready',
  'no_show_alert'
);

CREATE TYPE block_reason AS ENUM (
  'meeting',
  'leave',
  'travel',
  'emergency',
  'holiday',
  'other'
);

-- ============================================================
--  USERS  (staff / madam / admin — login accounts)
-- ============================================================

CREATE TABLE users (
  id            UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name     TEXT          NOT NULL,
  email         TEXT          NOT NULL UNIQUE,
  password_hash TEXT          NOT NULL,
  role          user_role     NOT NULL DEFAULT 'staff',
  is_active     BOOLEAN       NOT NULL DEFAULT true,
  last_login_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  users              IS 'Internal system users — staff, officers (madams), and admins';
COMMENT ON COLUMN users.role         IS 'admin = full access | staff = receptionist | madam = officer view only';
COMMENT ON COLUMN users.password_hash IS 'bcrypt hash — never store plain text';

-- ============================================================
--  OFFICERS  (the officials citizens meet)
-- ============================================================

CREATE TABLE officers (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID        REFERENCES users(id) ON DELETE SET NULL,  -- linked login account
  name          TEXT        NOT NULL,
  designation   TEXT        NOT NULL,                -- e.g. "CEO", "Deputy Director"
  department    TEXT        NOT NULL,
  avatar_initials CHAR(2),                           -- e.g. "RS" for Rekha Sharma
  phone         VARCHAR(15),
  email         TEXT,
  is_active     BOOLEAN     NOT NULL DEFAULT true,
  display_order INT         NOT NULL DEFAULT 0,      -- sort order on citizen booking screen
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE officers IS 'Officers / Madams that citizens can book appointments with';

-- ============================================================
--  OFFICER SCHEDULES  (working hours per officer)
-- ============================================================

CREATE TABLE officer_schedules (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  officer_id      UUID        NOT NULL REFERENCES officers(id) ON DELETE CASCADE,
  day_of_week     INT         NOT NULL CHECK (day_of_week BETWEEN 1 AND 7),
  -- 1=Monday ... 7=Sunday
  start_time      TIME        NOT NULL DEFAULT '10:00',
  end_time        TIME        NOT NULL DEFAULT '17:00',
  slot_duration   INT         NOT NULL DEFAULT 30,   -- minutes per slot
  break_start     TIME        DEFAULT '13:00',
  break_end       TIME        DEFAULT '14:00',
  is_working_day  BOOLEAN     NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (officer_id, day_of_week)
);

COMMENT ON TABLE  officer_schedules             IS 'Weekly working schedule for each officer';
COMMENT ON COLUMN officer_schedules.day_of_week IS '1=Monday, 7=Sunday';
COMMENT ON COLUMN officer_schedules.slot_duration IS 'Duration in minutes; drives slot generation';

-- ============================================================
--  CITIZENS  (public visitors — no login)
-- ============================================================

CREATE TABLE citizens (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name     TEXT        NOT NULL,
  mobile        VARCHAR(15) NOT NULL,
  -- no unique constraint on mobile — family members may share a phone
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_citizens_mobile ON citizens (mobile);

COMMENT ON TABLE  citizens        IS 'Public visitors who book appointments — no login required';
COMMENT ON COLUMN citizens.mobile IS 'Used for SMS / WhatsApp notifications and status lookup';

-- ============================================================
--  HOLIDAYS
-- ============================================================

CREATE TABLE holidays (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT        NOT NULL,
  holiday_date  DATE        NOT NULL UNIQUE,
  is_national   BOOLEAN     NOT NULL DEFAULT false,
  created_by    UUID        REFERENCES users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_holidays_date ON holidays (holiday_date);

COMMENT ON TABLE holidays IS 'Public holidays — all appointments blocked system-wide on these dates';

-- ============================================================
--  BLOCKED SLOTS  (officer-level manual blocks)
-- ============================================================

CREATE TABLE blocked_slots (
  id            UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  officer_id    UUID          NOT NULL REFERENCES officers(id) ON DELETE CASCADE,
  block_date    DATE          NOT NULL,
  start_time    TIME,          -- NULL = full day block
  end_time      TIME,          -- NULL = full day block
  reason        block_reason  NOT NULL DEFAULT 'other',
  notes         TEXT,
  created_by    UUID          REFERENCES users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_blocked_slots_officer_date ON blocked_slots (officer_id, block_date);

COMMENT ON TABLE  blocked_slots            IS 'Manual slot blocks by staff — single slot, half day, or full day';
COMMENT ON COLUMN blocked_slots.start_time IS 'NULL means full-day block; set for partial-day blocks';

-- ============================================================
--  APPOINTMENTS  (core table)
-- ============================================================

CREATE TABLE appointments (
  id              UUID                PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_ref VARCHAR(12)         NOT NULL UNIQUE, -- human-readable e.g. SHA-00124
  citizen_id      UUID                NOT NULL REFERENCES citizens(id) ON DELETE RESTRICT,
  officer_id      UUID                NOT NULL REFERENCES officers(id) ON DELETE RESTRICT,
  purpose         TEXT                NOT NULL,
  purpose_category TEXT,              -- 'education' | 'scholarship' | 'employment' | 'grievance' | 'certificate' | 'other'
  notes           TEXT,               -- citizen's optional notes
  appointment_date DATE               NOT NULL,
  slot_start      TIME                NOT NULL,
  slot_end        TIME                NOT NULL,
  status          appointment_status  NOT NULL DEFAULT 'booked',
  is_walk_in      BOOLEAN             NOT NULL DEFAULT false,
  delay_minutes   INT                 NOT NULL DEFAULT 0,
  queue_position  INT,                -- position in today's queue

  -- Timestamps per lifecycle stage
  arrived_at      TIMESTAMPTZ,
  meeting_started_at TIMESTAMPTZ,
  meeting_ended_at   TIMESTAMPTZ,
  cancelled_at    TIMESTAMPTZ,

  -- Rescheduling
  rescheduled_from UUID               REFERENCES appointments(id) ON DELETE SET NULL,
  rescheduled_to   UUID               REFERENCES appointments(id) ON DELETE SET NULL,

  -- Staff who managed this
  handled_by      UUID               REFERENCES users(id) ON DELETE SET NULL,

  created_at      TIMESTAMPTZ        NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ        NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT slot_order          CHECK (slot_end > slot_start),
  CONSTRAINT delay_non_negative  CHECK (delay_minutes >= 0),
  CONSTRAINT arrival_after_creation CHECK (arrived_at IS NULL OR arrived_at >= created_at)
);

-- Indexes for common queries
CREATE INDEX idx_appt_officer_date  ON appointments (officer_id, appointment_date);
CREATE INDEX idx_appt_status        ON appointments (status);
CREATE INDEX idx_appt_date          ON appointments (appointment_date);
CREATE INDEX idx_appt_citizen       ON appointments (citizen_id);
CREATE INDEX idx_appt_ref           ON appointments (appointment_ref);

COMMENT ON TABLE  appointments                  IS 'Core appointments table — one row per booked slot';
COMMENT ON COLUMN appointments.appointment_ref  IS 'Human-readable ID shown to citizens e.g. SHA-00124';
COMMENT ON COLUMN appointments.is_walk_in       IS 'True when citizen booked same-day while physically at office';
COMMENT ON COLUMN appointments.delay_minutes    IS 'Cumulative delay in minutes applied by officer';
COMMENT ON COLUMN appointments.queue_position   IS 'Position in officer queue for the day';

-- ============================================================
--  APPOINTMENT LOGS  (audit trail — immutable)
-- ============================================================

CREATE TABLE appointment_logs (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id  UUID        NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  action          TEXT        NOT NULL,   -- 'status_changed' | 'rescheduled' | 'delay_added' etc.
  old_value       JSONB,
  new_value       JSONB,
  performed_by    UUID        REFERENCES users(id) ON DELETE SET NULL,
  performed_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address      INET,
  notes           TEXT
);

CREATE INDEX idx_logs_appointment ON appointment_logs (appointment_id);
CREATE INDEX idx_logs_performed_at ON appointment_logs (performed_at);

COMMENT ON TABLE appointment_logs IS 'Immutable audit trail — every status change, reschedule, delay is recorded here';

-- ============================================================
--  NOTIFICATIONS
-- ============================================================

CREATE TABLE notifications (
  id              UUID              PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id  UUID              REFERENCES appointments(id) ON DELETE CASCADE,
  citizen_id      UUID              REFERENCES citizens(id) ON DELETE CASCADE,
  type            notification_type NOT NULL,
  channel         TEXT              NOT NULL DEFAULT 'sms',  -- 'sms' | 'whatsapp' | 'email'
  recipient_mobile VARCHAR(15),
  message_body    TEXT              NOT NULL,
  is_sent         BOOLEAN           NOT NULL DEFAULT false,
  sent_at         TIMESTAMPTZ,
  failed_at       TIMESTAMPTZ,
  failure_reason  TEXT,
  retry_count     INT               NOT NULL DEFAULT 0,
  scheduled_for   TIMESTAMPTZ,     -- for reminder scheduling
  created_at      TIMESTAMPTZ       NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notif_appointment ON notifications (appointment_id);
CREATE INDEX idx_notif_pending     ON notifications (is_sent, scheduled_for) WHERE is_sent = false;

COMMENT ON TABLE  notifications               IS 'Outbound notification log — SMS, WhatsApp per appointment event';
COMMENT ON COLUMN notifications.scheduled_for IS 'NULL = send immediately; set for reminders';

-- ============================================================
--  FUNCTIONS & TRIGGERS
-- ============================================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_officers_updated_at
  BEFORE UPDATE ON officers
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_appointments_updated_at
  BEFORE UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Auto-generate appointment_ref  (SHA-XXXXX)
CREATE OR REPLACE FUNCTION generate_appointment_ref()
RETURNS TRIGGER AS $$
DECLARE
  new_ref VARCHAR(12);
  counter INT;
BEGIN
  SELECT COUNT(*) + 1 INTO counter FROM appointments;
  new_ref := 'SHA-' || LPAD(counter::TEXT, 5, '0');
  -- Ensure uniqueness (handles concurrent inserts)
  WHILE EXISTS (SELECT 1 FROM appointments WHERE appointment_ref = new_ref) LOOP
    counter := counter + 1;
    new_ref := 'SHA-' || LPAD(counter::TEXT, 5, '0');
  END LOOP;
  NEW.appointment_ref := new_ref;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_generate_ref
  BEFORE INSERT ON appointments
  FOR EACH ROW
  WHEN (NEW.appointment_ref IS NULL OR NEW.appointment_ref = '')
  EXECUTE FUNCTION generate_appointment_ref();

-- Auto-log status changes
CREATE OR REPLACE FUNCTION log_appointment_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO appointment_logs (appointment_id, action, old_value, new_value)
    VALUES (
      NEW.id,
      'status_changed',
      jsonb_build_object('status', OLD.status),
      jsonb_build_object('status', NEW.status)
    );
  END IF;

  IF OLD.delay_minutes IS DISTINCT FROM NEW.delay_minutes THEN
    INSERT INTO appointment_logs (appointment_id, action, old_value, new_value)
    VALUES (
      NEW.id,
      'delay_updated',
      jsonb_build_object('delay_minutes', OLD.delay_minutes),
      jsonb_build_object('delay_minutes', NEW.delay_minutes)
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_log_appointment_changes
  AFTER UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION log_appointment_status_change();

-- Prevent double-booking (same officer + date + slot)
CREATE OR REPLACE FUNCTION check_slot_conflict()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM appointments
    WHERE  officer_id       = NEW.officer_id
    AND    appointment_date = NEW.appointment_date
    AND    slot_start       = NEW.slot_start
    AND    status           NOT IN ('cancelled', 'no_show', 'rescheduled')
    AND    id               != NEW.id
  ) THEN
    RAISE EXCEPTION 'Slot already booked for this officer at this time';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_slot_conflict
  BEFORE INSERT OR UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION check_slot_conflict();

-- ============================================================
--  VIEWS
-- ============================================================

-- Today's full appointment list (for staff dashboard)
CREATE OR REPLACE VIEW v_today_appointments AS
SELECT
  a.id,
  a.appointment_ref,
  a.appointment_date,
  a.slot_start,
  a.slot_end,
  a.status,
  a.is_walk_in,
  a.delay_minutes,
  a.queue_position,
  a.purpose,
  a.purpose_category,
  a.notes,
  a.arrived_at,
  a.meeting_started_at,
  a.meeting_ended_at,
  c.full_name   AS citizen_name,
  c.mobile      AS citizen_mobile,
  o.name        AS officer_name,
  o.designation AS officer_designation,
  o.department  AS officer_department
FROM  appointments a
JOIN  citizens c  ON c.id = a.citizen_id
JOIN  officers o  ON o.id = a.officer_id
WHERE a.appointment_date = CURRENT_DATE
ORDER BY a.slot_start;

-- Officer's own schedule view (for madam dashboard)
CREATE OR REPLACE VIEW v_officer_schedule AS
SELECT
  a.id,
  a.appointment_ref,
  a.slot_start,
  a.slot_end,
  a.status,
  a.delay_minutes,
  a.purpose,
  a.notes,
  a.queue_position,
  a.arrived_at,
  a.meeting_started_at,
  c.full_name  AS citizen_name,
  c.mobile     AS citizen_mobile,
  o.id         AS officer_id,
  o.name       AS officer_name
FROM  appointments a
JOIN  citizens c ON c.id = a.citizen_id
JOIN  officers o ON o.id = a.officer_id
WHERE a.appointment_date = CURRENT_DATE
ORDER BY a.slot_start;

-- Daily summary stats
CREATE OR REPLACE VIEW v_daily_stats AS
SELECT
  appointment_date,
  officer_id,
  COUNT(*)                                            AS total,
  COUNT(*) FILTER (WHERE status = 'completed')        AS completed,
  COUNT(*) FILTER (WHERE status = 'cancelled')        AS cancelled,
  COUNT(*) FILTER (WHERE status = 'no_show')          AS no_shows,
  COUNT(*) FILTER (WHERE status = 'booked')           AS pending,
  COUNT(*) FILTER (WHERE status = 'arrived')          AS arrived,
  COUNT(*) FILTER (WHERE status = 'in_meeting')       AS in_meeting,
  COUNT(*) FILTER (WHERE is_walk_in = true)           AS walk_ins,
  ROUND(AVG(
    EXTRACT(EPOCH FROM (meeting_ended_at - meeting_started_at)) / 60
  ))                                                  AS avg_meeting_mins
FROM appointments
GROUP BY appointment_date, officer_id;

-- ============================================================
--  ROW LEVEL SECURITY (Supabase RLS)
-- ============================================================

ALTER TABLE users             ENABLE ROW LEVEL SECURITY;
ALTER TABLE officers          ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments      ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications     ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_slots     ENABLE ROW LEVEL SECURITY;
ALTER TABLE holidays          ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_logs  ENABLE ROW LEVEL SECURITY;

-- Helper: get role of authenticated user
CREATE OR REPLACE FUNCTION auth_user_role()
RETURNS user_role AS $$
  SELECT role FROM users WHERE id = auth.uid()::UUID;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper: get officer_id linked to authenticated user
CREATE OR REPLACE FUNCTION auth_officer_id()
RETURNS UUID AS $$
  SELECT id FROM officers WHERE user_id = auth.uid()::UUID LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ── users: only admins see all rows; others see own row ──
CREATE POLICY users_select_policy ON users FOR SELECT
  USING (id = auth.uid()::UUID OR auth_user_role() = 'admin');

CREATE POLICY users_update_policy ON users FOR UPDATE
  USING (id = auth.uid()::UUID OR auth_user_role() = 'admin');

-- ── officers: staff & admin see all; madam sees only self ──
CREATE POLICY officers_select_policy ON officers FOR SELECT
  USING (
    auth_user_role() IN ('admin', 'staff')
    OR user_id = auth.uid()::UUID
  );

CREATE POLICY officers_modify_policy ON officers FOR ALL
  USING (auth_user_role() = 'admin');

-- ── appointments: staff/admin see all; madam sees own officer only ──
CREATE POLICY appt_select_staff ON appointments FOR SELECT
  USING (
    auth_user_role() IN ('admin', 'staff')
    OR officer_id = auth_officer_id()
  );

CREATE POLICY appt_insert_staff ON appointments FOR INSERT
  WITH CHECK (auth_user_role() IN ('admin', 'staff'));

CREATE POLICY appt_update_staff ON appointments FOR UPDATE
  USING (auth_user_role() IN ('admin', 'staff'))
  WITH CHECK (auth_user_role() IN ('admin', 'staff'));

-- Madam can update status on own appointments
CREATE POLICY appt_update_madam ON appointments FOR UPDATE
  USING (
    auth_user_role() = 'madam'
    AND officer_id = auth_officer_id()
  );

-- ── holidays & blocked_slots: staff/admin write; all read ──
CREATE POLICY holidays_read ON holidays FOR SELECT USING (true);
CREATE POLICY holidays_write ON holidays FOR ALL USING (auth_user_role() IN ('admin', 'staff'));

CREATE POLICY blocked_read ON blocked_slots FOR SELECT USING (true);
CREATE POLICY blocked_write ON blocked_slots FOR ALL USING (auth_user_role() IN ('admin', 'staff'));

-- ── notifications: only staff/admin ──
CREATE POLICY notif_policy ON notifications FOR ALL
  USING (auth_user_role() IN ('admin', 'staff'));

-- ── logs: read-only for staff and admin ──
CREATE POLICY logs_select ON appointment_logs FOR SELECT
  USING (auth_user_role() IN ('admin', 'staff', 'madam'));

-- ============================================================
--  SEED DATA
-- ============================================================

-- Default admin user (change password immediately in production!)
INSERT INTO users (full_name, email, password_hash, role) VALUES
  ('System Admin',   'admin@shabri.gov.in',  crypt('Admin@1234', gen_salt('bf')), 'admin'),
  ('Nilesh Kumar',   'nilesh@shabri.gov.in', crypt('Staff@1234', gen_salt('bf')), 'staff'),
  ('Rekha Sharma',   'rekha@shabri.gov.in',  crypt('Madam@1234', gen_salt('bf')), 'madam'),
  ('Dinesh Patil',   'dinesh@shabri.gov.in', crypt('Madam@1234', gen_salt('bf')), 'madam'),
  ('Sunita Meshram', 'sunita@shabri.gov.in', crypt('Madam@1234', gen_salt('bf')), 'madam'),
  ('Rajesh Borde',   'rajesh@shabri.gov.in', crypt('Madam@1234', gen_salt('bf')), 'madam');

-- Officers (linked to madam user accounts)
INSERT INTO officers (user_id, name, designation, department, avatar_initials, display_order)
SELECT u.id, u.full_name,
  CASE u.email
    WHEN 'rekha@shabri.gov.in'  THEN 'Chief Executive Officer'
    WHEN 'dinesh@shabri.gov.in' THEN 'Deputy Director'
    WHEN 'sunita@shabri.gov.in' THEN 'Assistant Commissioner'
    WHEN 'rajesh@shabri.gov.in' THEN 'District Officer'
  END,
  CASE u.email
    WHEN 'rekha@shabri.gov.in'  THEN 'General Administration'
    WHEN 'dinesh@shabri.gov.in' THEN 'Education & Scholarships'
    WHEN 'sunita@shabri.gov.in' THEN 'Employment & Welfare'
    WHEN 'rajesh@shabri.gov.in' THEN 'Grievance Redressal'
  END,
  UPPER(LEFT(u.full_name, 1) || SPLIT_PART(u.full_name, ' ', 2) ),
  ROW_NUMBER() OVER (ORDER BY u.email)
FROM users u
WHERE u.role = 'madam';

-- Officer weekly schedules (Mon–Fri, 10 AM – 5 PM, lunch 1–2 PM)
INSERT INTO officer_schedules (officer_id, day_of_week, start_time, end_time, slot_duration, break_start, break_end)
SELECT o.id, d.day, '10:00', '17:00', 30, '13:00', '14:00'
FROM officers o
CROSS JOIN (SELECT generate_series(1, 5) AS day) d;

-- National holidays (2025)
INSERT INTO holidays (name, holiday_date, is_national) VALUES
  ('Republic Day',         '2025-01-26', true),
  ('Holi',                 '2025-03-14', false),
  ('Gudi Padwa',           '2025-03-30', false),
  ('Ambedkar Jayanti',     '2025-04-14', true),
  ('Maharashtra Day',      '2025-05-01', false),
  ('Independence Day',     '2025-08-15', true),
  ('Gandhi Jayanti',       '2025-10-02', true),
  ('Diwali',               '2025-10-20', false),
  ('Diwali',               '2025-10-21', false),
  ('Christmas',            '2025-12-25', true);
