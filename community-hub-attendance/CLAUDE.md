# KWMC Community Hub Attendance — Claude Instructions

## 1. Product Mission

This system is an **after-school club attendance and safeguarding platform** used by staff to manage:

- Child check-in and check-out
- Parent SMS notifications
- Safeguarding incident logging
- Session capacity monitoring

**Primary constraint:** Staff must be able to check children in within seconds during busy arrival periods.

**Typical scenario:**

- 30–60 children arrive within 10 minutes
- Staff are using tablets in a noisy environment
- Parents expect SMS confirmation
- Safeguarding incidents must be logged accurately

**Risk profile:** Failure to record attendance correctly is a safeguarding risk. The system prioritises correctness, auditability, speed, and reliability.

---

## 2. Core Design Principles

### Check-in Reliability
Check-in must **never fail because of external services**. SMS failures must not block attendance recording.

### Staff Speed
Target interaction: **< 2 seconds per check-in**. Avoid unnecessary dialogs or multi-step flows.

### Safeguarding Traceability
The system must allow reconstruction of events for any child.

Example timeline:
```
16:02  Checked in
16:40  Behaviour incident
17:12  First aid incident
17:45  Checked out
```

### Simplicity over Abstraction
Staff use tablets under pressure. Prefer simple UI, minimal interactions, and visible status indicators.

---

## 3. Dev Server & Seed

```bash
cd community-hub-attendance
npm run dev          # http://localhost:3000 (or 3001 if port taken)
npm run seed         # tsx --env-file=.env.local scripts/seedTestData.ts
```

Seed creates 20 children with Ofcom-reserved test phone numbers (+447700900000–19) and past sessions. Idempotent — safe to re-run.

To start a session for today: open `http://localhost:3000` and click **"Start Today's Session"**.

---

## 4. Stack

- **Next.js 16** App Router, React 19, TypeScript 5
- **Supabase** (PostgreSQL) — service role key, RLS disabled in dev
- **Tailwind CSS 4** — `@import "tailwindcss"` in globals.css (not `@tailwind` directives)
- **Twilio** SMS — gracefully skipped if env vars absent

---

## 5. Environment

Requires `community-hub-attendance/.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
# Optional — SMS is a no-op without these:
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=...
```

---

## 6. Architecture

### Data Flow

```
Server Component
  → fetch data from Supabase (by sessionId from URL params)
  → pass serialisable props to client components
  → client triggers server action mutation
  → revalidatePath() invalidates cache
```

- **Server components** fetch Supabase directly and pass serialisable props to client components.
- **Server actions** (`'use server'`) handle all mutations; always call `revalidatePath('/')` and `revalidatePath('/sessions/${sessionId}')` after writes.
- **Client components** own UI state (optimistic updates via `Map<childId, RowStatus>`).
- `getOrCreateTodaySession()` is used **internally by mutations only** — check-in/out/incident actions resolve today's session themselves; the sessionId in the URL is for display and data fetching only.

### Route Structure

```
app/
  page.tsx                              → / (sessions list — today prominent, past below)
  layout.tsx                            → HTML shell
  (staff)/
    layout.tsx                          → NavBar wrapper (all staff routes)
    sessions/
      page.tsx                          → /sessions → redirect to /
      [sessionId]/page.tsx              → /sessions/:id (session hub with tabs)
                                            ?tab=overview  — stat cards, banners, incidents
                                            ?tab=checkin   — today only
                                            ?tab=checkout  — today only
                                            ?tab=safeguarding — incidents + log form
    checkin/
      page.tsx                          → /checkin (legacy — still functional)
      [childId]/page.tsx                → /checkin/:id (QR scan target)
    checkout/
      page.tsx                          → /checkout (legacy — still functional)
      [childId]/page.tsx                → /checkout/:id (QR scan target)
    safeguarding/page.tsx               → /safeguarding (global incident history)
    dashboard/page.tsx                  → /dashboard → redirect to /
  api/
    checkin/[childId]/route.ts          → POST (external/QR use)
    checkout/[childId]/route.ts         → POST (external/QR use)
    safeguarding/route.ts               → POST
    sessions/mark-absent/route.ts       → POST (absence detection)
```

### Component Structure

```
components/
  layout/NavBar.tsx               → Sticky nav: Community Hub logo + "All Incidents" link
  session/SessionBanner.tsx       → Session name + present count chip (used on legacy pages)
  attendance/OccupancyBar.tsx     → Progress bar
  ui/                             → Button, Badge, Spinner primitives
  children/
    ChildRow.tsx                  → Single child row (status dot + action button)
    ChildCheckInList.tsx          → Client: search + optimistic check-in + toast
    ChildCheckOutList.tsx         → Client: search + optimistic check-out + toast
    CheckInButton.tsx             → Client: QR page check-in button
    CheckOutButton.tsx            → Client: QR page check-out button
  safeguarding/
    LogIncidentForm.tsx           → Client: standalone incident log form
  dashboard/
    DashboardRefresh.tsx          → Client: auto-refresh every 60s via router.refresh()
```

---

## 7. Key Files & Queries

| Path | Purpose |
|------|---------|
| `types/index.ts` | All shared types: Child, Session, Attendance, PresentChild, SafeguardingIncident, SmsMessage |
| `lib/supabase/server.ts` | Service-role Supabase client (server-only, throws if env vars missing) |
| `lib/queries/sessions.ts` | `getSessionById()`, `getActiveSession()`, `getOrCreateTodaySession()`, `getAllSessions()` |
| `lib/queries/attendance.ts` | `getPresentChildren()`, `getCollectedCount()` |
| `lib/queries/children.ts` | `getActiveChildren()`, `getChildById()`, `getNotArrivedChildren()` |
| `lib/queries/safeguarding.ts` | `getSessionIncidents()`, `getSessionIncidentRows()`, `getAllIncidents()`, `getChildrenWithPriorConcerns()` |
| `lib/queries/sms.ts` | `getSmsStatusForAttendances()`, `getSmsSummaryToday()` |
| `lib/actions/sessions.ts` | `startTodaySession()` — creates today's session and redirects to hub |
| `lib/actions/checkin.ts` | `checkInChild(childId)` — resolves session, dedupes, enforces capacity, sends SMS |
| `lib/actions/checkout.ts` | `checkOutChild(childId)` — validates active record, sends SMS |
| `lib/actions/safeguarding.ts` | `recordIncident(childId, type, notes)` |
| `lib/sms/sendSms.ts` | Twilio helper — no-op if creds absent, deduplicates via sms_messages table |

---

## 8. Database Schema

See `docs/schema.sql` for full DDL.

**Tables:**
- `children` — id, name, parent_name, parent_phone, qr_code, active
- `sessions` — id, club_name, date, start_time, end_time, capacity; `UNIQUE(club_name, date, start_time)`
- `attendance` — id, child_id, session_id, checked_in_at, check_out_time, status; `UNIQUE(child_id, session_id)`
- `safeguarding_logs` — system audit trail (CHECK_IN / CHECK_OUT events)
- `safeguarding_incidents` — staff-recorded welfare concerns with incident_type CHECK constraint
- `sms_messages` — Twilio log; `(attendance_id, message_type)` index for deduplication

---

## 9. Critical Implementation Patterns

### Session Resolution
**Mutations** (`checkInChild`, `checkOutChild`, `recordIncident`, `startTodaySession`) use `getOrCreateTodaySession()` internally — they never receive a sessionId from the frontend.

**Reads** (server components) use `getSessionById(params.sessionId)` from the URL. This enables viewing past sessions without affecting today's data.

### Non-serialisable Map → Plain Object
Server components cannot pass `Map` to client components. Convert before passing:
```typescript
// In Server Component
const smsMap = await getSmsStatusForAttendances(ids);
return <ClientComponent smsStatus={Object.fromEntries(smsMap)} />
```

### Optimistic UI
Client state uses `Map<childId, RowStatus>`. States: `pending → optimistic → done | error`. This allows concurrent check-ins without UI lag.

### SMS Failure Handling
`sendSms` must **never throw**. If Twilio fails: log error, return `{ sent: false }`, continue check-in. Attendance recording always succeeds regardless of SMS status.

### Revalidation
Every server action calls `revalidatePath('/')` and `revalidatePath('/sessions/${session.id}')` after a write to invalidate the Next.js router cache. The safeguarding action also revalidates `/safeguarding`.

### Check In / Check Out tabs
The session hub only shows Check In and Check Out tabs for **today's sessions** (checked via `session.date === today`). Past sessions show Overview and Safeguarding only. This prevents mutations to historical records while still allowing review.

---

## 10. Real-World Constraints

The system must handle:
- Slow WiFi
- Multiple staff devices
- 50+ children arriving simultaneously
- Tablet usage with touch interfaces
- QR code scanning

**Future improvements** should consider: offline check-in queue with sync on reconnect, attendance analytics, late pickup alerts, absence detection, parent communication dashboard, safeguarding report exports, and session scheduling UI.

---

## 11. Security

**Development:** Supabase service role key with RLS disabled.

**Production expectations:**
- Enable RLS
- Restrict API routes
- Enforce staff authentication
- Secure safeguarding data (sensitive records)

---

## 12. AI Assistant Instructions

When analysing this repository, focus on improving:
- Staff workflow speed
- Safeguarding reliability
- Database integrity
- Scalability

**Avoid:**
- Complex UI flows
- Unnecessary abstractions
- Breaking optimistic UI patterns

**Never introduce changes that risk:**
- Duplicate attendance records
- Lost safeguarding records
- Blocking check-ins

Always consider real after-school club usage conditions (slow WiFi, distracted staff, tablet interfaces, noisy environments).

---

## 13. Code Review Checklist

Before merging changes ensure:
- No direct Supabase calls from UI components
- Server actions handle all mutations
- Errors do not break check-in flows
- Audit logs remain intact
- `revalidatePath('/')` and `revalidatePath('/sessions/${id}')` called after every write
- Performance impact is minimal
- Safeguarding data integrity is preserved
