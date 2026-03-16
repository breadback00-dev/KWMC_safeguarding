# Implementation Plan
_Based on product & architecture review, March 2026_

Steps are ordered by dependency and risk. Each step is self-contained and can be implemented and tested before moving to the next.

---

## Phase 1 — Code correctness (no new dependencies)

These are bugs or inconsistencies in the existing code. Do these first.

---

### Step 1 — Consistent revalidatePath across all actions

**Problem:** `checkOutChild` does not revalidate `/safeguarding`. If a safeguarding tab is open on another device, it won't update after a check-out. All three actions should revalidate the same set of paths.

**Files to change:**
- `lib/actions/checkout.ts` — add `revalidatePath('/safeguarding')`

**Test:** Log an incident, open the safeguarding tab in one browser window, check a child out in another — the safeguarding tab should reflect current state within the revalidation cycle.

---

### Step 2 — QR pages guard against no-session state

**Problem:** Scanning a QR code when no session exists silently creates one via `getOrCreateTodaySession()`. Staff have no way to know this happened. Phantom sessions appear in the list.

**Files to change:**
- `app/(staff)/checkin/[childId]/page.tsx`
- `app/(staff)/checkout/[childId]/page.tsx`

**Change:** Before rendering the check-in/out button, call `getActiveSession()`. If null, show "No session scheduled for today — ask a coordinator to start one" and do not render the action button. The QR page should never silently create a session.

---

### Step 3 — Extract shared service layer (remove API route duplication)

**Problem:** `app/api/checkin/[childId]/route.ts` and `lib/actions/checkin.ts` contain the same business logic. A bug fix in one won't automatically apply to the other.

**Files to create:**
- `lib/services/attendance.ts` — exports `performCheckIn(childId)` and `performCheckOut(childId)` with all business logic (session resolution, duplicate check, capacity, insert, SMS, audit log)

**Files to change:**
- `lib/actions/checkin.ts` — call `performCheckIn(childId)`, add revalidatePath
- `lib/actions/checkout.ts` — call `performCheckOut(childId)`, add revalidatePath
- `app/api/checkin/[childId]/route.ts` — call `performCheckIn(childId)`, wrap in NextResponse
- `app/api/checkout/[childId]/route.ts` — call `performCheckOut(childId)`, wrap in NextResponse

**Test:** Check in via the UI and via direct API POST — both should produce identical results.

---

## Phase 2 — Security & compliance (required before production)

These cannot be skipped for a safeguarding system handling children's data.

---

### Step 4 — Staff authentication

**Problem:** Any person who can access the URL can check children in/out and log safeguarding incidents. There is no identity tracking. `created_by` is hardcoded as `'staff'` on every incident.

**Approach:** Supabase Auth with email/password. Keep it simple — no OAuth, no magic links. Staff accounts are created by a coordinator in the Supabase dashboard.

**Files to create:**
- `app/(auth)/login/page.tsx` — login form (email + password)
- `lib/actions/auth.ts` — `signIn(email, password)`, `signOut()`
- `lib/supabase/client.ts` — browser Supabase client for auth state

**Files to change:**
- `app/(staff)/layout.tsx` — check session server-side; redirect to `/login` if unauthenticated
- `lib/actions/checkin.ts` — pass authenticated user's email to `safeguarding_logs`
- `lib/actions/safeguarding.ts` — replace `created_by: 'staff'` with `created_by: user.email`
- `lib/actions/checkout.ts` — pass user to audit log
- `lib/services/attendance.ts` (from Step 3) — accept `staffEmail` param

**Schema change needed:**
```sql
ALTER TABLE safeguarding_incidents
  ALTER COLUMN created_by DROP DEFAULT;
-- created_by will now always be a real staff identifier, never defaulted
```

**Test:** Log in as two different staff members. Check children in on both. Verify safeguarding_incidents table shows different `created_by` values. Log out and confirm the check-in page redirects to login.

---

### Step 5 — Row Level Security policies

**Problem:** RLS is enabled in the schema but all tables have no policies, meaning the service role key bypasses them. The schema file already has `ENABLE ROW LEVEL SECURITY` on all tables — policies just need writing.

**Files to create:**
- `supabase/migrations/rls-policies.sql` — one policy per table

**Policies needed:**
- `children` — authenticated staff can SELECT, INSERT, UPDATE. No DELETE (soft delete via `active = false`)
- `sessions` — authenticated staff can SELECT, INSERT. Coordinators only for UPDATE/DELETE
- `attendance` — authenticated staff can SELECT, INSERT, UPDATE (check_out_time only)
- `safeguarding_incidents` — authenticated staff can SELECT, INSERT. No UPDATE/DELETE (immutable)
- `safeguarding_logs` — authenticated staff can SELECT. INSERT only via service role (system events)
- `sms_messages` — authenticated staff can SELECT. INSERT only via service role

**Note:** The service role key bypasses RLS entirely. It is only used on the server. Browser-side calls (if ever added) would use the anon key and be subject to RLS.

---

## Phase 3 — Session management

---

### Step 6 — Configurable session creation

**Problem:** `getOrCreateTodaySession()` hardcodes `club_name`, `start_time`, `end_time`, and `capacity`. A coordinator cannot run a session with different parameters without editing the source code.

**Files to create:**
- `app/(staff)/sessions/new/page.tsx` — "Create session" form: club name, date, start time, end time, capacity
- `lib/actions/sessions.ts` — add `createSession(data)` action alongside existing `startTodaySession`

**Files to change:**
- `app/page.tsx` — replace "Start Today's Session" button with a link to `/sessions/new` pre-populated with today's date
- `lib/actions/sessions.ts` — keep `startTodaySession` working as a fast-path with defaults for backwards compat with QR pages

**Schema:** No changes needed. The `sessions` table already supports all these fields.

**Test:** Create a session with capacity 20 and end time 18:00. Verify it appears in the sessions list and the session hub shows the correct capacity and end time.

---

### Step 7 — Session scheduling (future sessions)

**Problem:** Sessions only exist after they are created on the day. A coordinator cannot plan the week in advance or mark days as closed.

**Files to change:**
- `app/(staff)/sessions/new/page.tsx` (from Step 6) — allow any date, not just today
- `app/page.tsx` — add an "Upcoming" section between Today and Past Sessions for sessions with `date > today`

**Behaviour rules:**
- Upcoming sessions are visible in the list but show "Scheduled" badge instead of "Today"
- Upcoming sessions have no Check In or Check Out tab (date is in the future)
- Upcoming sessions can be edited or deleted before the day
- On the session's date, it automatically becomes the active session

**Test:** Create a session for tomorrow. Verify it appears in Upcoming. At midnight, verify it appears in Today.

---

## Phase 4 — Reliability

---

### Step 8 — Real-time presence updates

**Problem:** The session hub refreshes every 60 seconds via `DashboardRefresh`. If two staff members are checking children in on separate tablets, each device is up to 60 seconds out of sync. The present count and roster can be stale.

**Approach:** Supabase Realtime subscriptions on the `attendance` table. When any insert or update happens, the client re-fetches the present children list.

**Files to change:**
- `components/dashboard/DashboardRefresh.tsx` — subscribe to `attendance` inserts/updates for the current session. On change event, call `router.refresh()` immediately instead of waiting for the 60s timer.

**Implementation:**
```typescript
// Subscribe to attendance changes for this session
const channel = supabase
  .channel(`session-${sessionId}`)
  .on('postgres_changes', {
    event: '*', schema: 'public', table: 'attendance',
    filter: `session_id=eq.${sessionId}`
  }, () => router.refresh())
  .subscribe();
```

**Files to change:**
- `components/dashboard/DashboardRefresh.tsx` — accept `sessionId` prop, set up subscription
- `app/(staff)/sessions/[sessionId]/page.tsx` — pass `sessionId` to `DashboardRefresh`

**Test:** Open session hub on two browser tabs. Check in a child on tab A. Within 2 seconds, tab B should show the updated count without manual refresh.

---

### Step 9 — Absence detection

**Problem:** The infrastructure is all there (schema has `ABSENCE_ALERT_SENT` event type, `sms_messages` supports `absence_alert` type, `getNotArrivedChildren()` query exists, `sessions/mark-absent` API route exists) but nothing actually triggers an alert.

**Approach:** A server action triggered manually (button in Overview tab) for MVP. Automatic scheduling can follow.

**Files to create:**
- `lib/actions/absence.ts` — `sendAbsenceAlerts(sessionId)`: gets not-arrived children, sends SMS to each parent ("We haven't seen [child] today — please contact us"), logs `ABSENCE_ALERT_SENT` in safeguarding_logs, records in sms_messages

**Files to change:**
- `app/(staff)/sessions/[sessionId]/page.tsx` — add "Send Absence Alerts" button in Overview tab, visible when `notArrived.length > 0` and session is today. Shows how many parents will be texted. Requires confirmation before sending.

**Future:** Schedule this to run automatically 30 minutes after session start time using Supabase Edge Functions or a Vercel cron job.

**Test:** Seed a session with 5 children. Check in 3. Click "Send Absence Alerts". Verify 2 SMS records appear in `sms_messages` with `message_type = 'absence_alert'`, and 2 `ABSENCE_ALERT_SENT` entries appear in `safeguarding_logs`.

---

## Phase 5 — Staff workflow

---

### Step 10 — Check-in undo

**Problem:** In a busy arrival, staff regularly check in the wrong child. Currently there is no recovery path — the only fix is a direct database query.

**Rules:**
- Undo is available for 5 minutes after check-in
- After 5 minutes the record is immutable
- Undo deletes the attendance record and logs `CHECK_IN_UNDONE` in safeguarding_logs
- SMS is not recalled (Twilio does not support this) but the undo is logged

**Files to create:**
- `lib/actions/checkin.ts` — add `undoCheckIn(attendanceId)` action. Checks `checked_in_at` is within last 5 minutes. Deletes attendance record. Logs to safeguarding_logs.

**Files to change:**
- `components/children/ChildCheckInList.tsx` — when a child moves to `done` state, start a 5-minute countdown. Show "Undo" button on that child's row until the window expires. On click, call `undoCheckIn(attendanceId)`.
- `types/index.ts` — `PresentChild` already has `attendance_id`; used here to identify which record to undo

**Test:** Check in a child. Immediately click Undo. Verify the attendance record is deleted and the child reappears in the pending list. Check in again, wait 6 minutes, verify Undo button is gone.

---

### Step 11 — Incident amendment

**Problem:** Staff log incidents against the wrong child or make typos in notes. Once submitted there is no correction path. The record is permanent and incorrect.

**Rules:**
- Incidents can only be amended within the session they were created
- Amendments are logged — original values preserved, amendment timestamped and attributed
- Incident type and notes can be changed. Child cannot be changed (create a new incident instead)
- No delete — correction creates a new version, marks old as superseded

**Schema changes needed:**
```sql
ALTER TABLE safeguarding_incidents
  ADD COLUMN superseded_by UUID REFERENCES safeguarding_incidents(id),
  ADD COLUMN amended_at TIMESTAMPTZ,
  ADD COLUMN amended_by TEXT;
```

**Files to create:**
- `lib/actions/safeguarding.ts` — add `amendIncident(incidentId, type, notes, staffEmail)`: inserts new incident with corrected values, updates original row's `superseded_by` to point at new row

**Files to change:**
- `app/(staff)/sessions/[sessionId]/page.tsx` — Safeguarding tab: show "Amend" button on incidents from today's session. Opens inline edit form. Superseded incidents shown with strikethrough + "Amended" badge.

**Test:** Log an incident. Click Amend. Change the type. Verify the original row has `superseded_by` set, and the new row appears with correct values and the same child/session.

---

## Phase 6 — Reporting

---

### Step 12 — Session attendance export (CSV)

**Problem:** Coordinators need to submit attendance registers for funding and compliance. Currently there is no way to export data from the UI.

**Files to create:**
- `app/api/sessions/[sessionId]/export/route.ts` — GET endpoint. Returns CSV: child name, checked_in_at, check_out_time, duration, parent name, parent phone, incidents count.

**Files to change:**
- `app/(staff)/sessions/[sessionId]/page.tsx` — Overview tab: "Export Register" button. Links to the API route. Browser downloads the file.

**CSV format:**
```
Name,Checked In,Checked Out,Duration,Parent,Phone,Incidents
Alice Smith,15:04,17:22,2h18m,Jane Smith,+44...,0
Bob Jones,15:06,–,–,Mark Jones,+44...,1
```

**Test:** Create a session with 5 children, check in 4, check out 2. Export CSV. Verify all 4 checked-in children appear, correct times, correct incident count.

---

### Step 13 — Safeguarding report export

**Problem:** A safeguarding lead reviewing a concern needs a summary of all incidents for a given child — across all sessions, with dates, types, and notes. There is no way to generate this from the UI.

**Files to create:**
- `app/api/children/[childId]/safeguarding-report/route.ts` — GET endpoint. Returns CSV of all incidents for a child: date, session, incident type, notes, logged by.

**Files to change:**
- `app/(staff)/safeguarding/page.tsx` — per-child row: "Export Report" button. Download link to the API route.

**Test:** Log 3 incidents across 2 sessions for one child. Export report. Verify all 3 incidents appear with correct session dates and logged-by values.

---

## Summary table

| Step | Phase | Area | Effort |
|------|-------|------|--------|
| 1 | 1 | Consistent revalidatePath | 15 mins |
| 2 | 1 | QR no-session guard | 30 mins |
| 3 | 1 | Extract service layer | 1–2 hrs |
| 4 | 2 | Staff authentication | 3–4 hrs |
| 5 | 2 | RLS policies | 1 hr |
| 6 | 3 | Configurable session creation | 1–2 hrs |
| 7 | 3 | Session scheduling | 1–2 hrs |
| 8 | 4 | Real-time updates | 1–2 hrs |
| 9 | 4 | Absence detection | 2 hrs |
| 10 | 5 | Check-in undo | 2 hrs |
| 11 | 5 | Incident amendment | 2–3 hrs |
| 12 | 6 | Session CSV export | 1 hr |
| 13 | 6 | Safeguarding report export | 1 hr |
