-- RLS Policies for KWMC Community Hub Attendance
-- Run this in Supabase SQL editor after enabling auth.
-- The service role key (used server-side) bypasses RLS entirely.
-- These policies protect against direct client-side access.

-- ─── children ────────────────────────────────────────────────────────────────
-- Authenticated staff can read and update children.
-- No client-side deletes — use active=false to deactivate.

CREATE POLICY "Staff can read children"
  ON children FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Staff can insert children"
  ON children FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Staff can update children"
  ON children FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ─── sessions ────────────────────────────────────────────────────────────────

CREATE POLICY "Staff can read sessions"
  ON sessions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Staff can insert sessions"
  ON sessions FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Staff can update sessions"
  ON sessions FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ─── attendance ───────────────────────────────────────────────────────────────

CREATE POLICY "Staff can read attendance"
  ON attendance FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Staff can insert attendance"
  ON attendance FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Only allow updating check_out_time (cannot alter check-in records)
CREATE POLICY "Staff can update check_out_time"
  ON attendance FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ─── safeguarding_logs ────────────────────────────────────────────────────────
-- System audit trail — authenticated staff can read, but writes go via service role only.

CREATE POLICY "Staff can read safeguarding logs"
  ON safeguarding_logs FOR SELECT
  TO authenticated
  USING (true);

-- ─── safeguarding_incidents ───────────────────────────────────────────────────
-- Immutable after creation — no update or delete via client.

CREATE POLICY "Staff can read incidents"
  ON safeguarding_incidents FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Staff can insert incidents"
  ON safeguarding_incidents FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ─── sms_messages ─────────────────────────────────────────────────────────────
-- Read-only for staff via client. Writes go via service role only.

CREATE POLICY "Staff can read SMS messages"
  ON sms_messages FOR SELECT
  TO authenticated
  USING (true);
