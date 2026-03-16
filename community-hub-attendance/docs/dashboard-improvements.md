# Dashboard Improvement Plan
**Goal:** Make the `/dashboard` the highest-quality administrative screen possible for a client pitch — surfacing the right safeguarding data, removing noise, and making critical information unmissable.

---

## Step 1 — Fix the stat cards
**Problem:** Three of the four stat cards show low-value information.
- "Session Status: Active" → staff already know the session is active
- "Occupancy: 40%" → percentages are less intuitive than absolute numbers
- There's no "Collected" count — you can't tell if 12 present means 12 arrived or 15 arrived with 3 already collected

**Changes:**
- Replace "Session Status" → **"Ends at HH:MM"** (time the session ends)
- Replace "Occupancy %" → **"Spaces Left: N"** (`capacity - presentCount`)
- Add a 4th stat: **"Collected: N"** (attendance records with `check_out_time IS NOT NULL`)
- Make the 4 cards: Currently Present · Collected · Spaces Left · Ends At

**Files:** `lib/queries/attendance.ts` (new query), `app/(staff)/dashboard/page.tsx`

---

## Step 2 — Red safeguarding concern banner
**Problem:** A `safeguarding_concern` incident (the most serious type) shows as the same amber text as a `late_pickup`. In a children's welfare context, this is dangerous.

**Changes:**
- If ANY incident of type `safeguarding_concern` exists today, show a prominent **red banner at the very top of the dashboard** that cannot be missed
- Banner text: "⚠ Active safeguarding concern logged today — review required"
- Link to the safeguarding page

**Files:** `app/(staff)/dashboard/page.tsx`

---

## Step 3 — Incident type breakdown in safeguarding panel
**Problem:** "2 incidents today" gives no context. A manager needs to know what kind of incidents.

**Changes:**
- Replace the single count with a breakdown by type
- Each type shown as a coloured badge: `safeguarding_concern` = red, `injury` = orange, `behaviour` = amber, `late_pickup` / `early_collection` = grey, `other` = grey
- Show child name(s) affected alongside each incident

**Files:** `lib/queries/safeguarding.ts` (extend to return type breakdown), `app/(staff)/dashboard/page.tsx`

---

## Step 4 — "Expected but not arrived" panel
**Problem:** The most important safeguarding data point is missing entirely. If a registered, active child has not checked in and no one has called, staff need to know immediately.

**Changes:**
- New query: active children with NO attendance record (or status = 'absent') for today's session
- Show as a panel: "Not yet arrived" with child names listed
- If the count is 0, show nothing (no noise when all children are accounted for)
- If > 0, show with amber background (not as severe as safeguarding concern, but needs attention)

**Files:** `lib/queries/children.ts` (new query), `app/(staff)/dashboard/page.tsx`

---

## Step 5 — Prior concerns indicator
**Problem:** If a child with a historical safeguarding incident is currently in the building, staff should be aware. Currently there's no way to see this on the dashboard.

**Changes:**
- New query: for each present child, check if they have ANY `safeguarding_incidents` records from BEFORE today
- If yes, show a small "Prior concern on record" note on the dashboard
- Not alarming — informational — but important for context

**Files:** `lib/queries/safeguarding.ts` (new query), `app/(staff)/dashboard/page.tsx`

---

## Step 6 — End-of-session countdown prompt
**Problem:** As session end time approaches, staff need a prompt to ensure all children are collected. Currently there's nothing.

**Changes:**
- Calculate minutes remaining until `session.end_time`
- If < 30 minutes remaining AND children are still present: show amber warning banner
- Text: "Session ends in X minutes — N children still in the building"
- If session has passed end_time with children still present: red "Session overrun" banner

**Files:** `app/(staff)/dashboard/page.tsx` (server-side time calculation)

---

## Step 7 — Auto-refresh every 60 seconds
**Problem:** Dashboard is a server component — it shows a snapshot from when the page loaded. Staff looking at it won't see new check-ins or check-outs without manually refreshing.

**Changes:**
- Wrap page content in a thin client component (`DashboardRefresh`) that calls `router.refresh()` every 60 seconds
- Show a subtle "Last updated: just now" indicator that counts up
- No full page reload — Next.js router refresh re-runs server component data fetching silently

**Files:** `components/dashboard/DashboardRefresh.tsx` (new client component), `app/(staff)/dashboard/page.tsx`

---

## Step 8 — Hide SMS panel when Twilio not configured
**Problem:** Three zeros with a grey note is visual noise that makes the dashboard look incomplete during the pitch.

**Changes:**
- Only render the SMS panel if `smsSummary.sent + smsSummary.failed > 0` OR if Twilio env vars are set
- Add a small "SMS notifications disabled" chip in the session detail card instead, so there's still an affordance to enable it

**Files:** `app/(staff)/dashboard/page.tsx`, `lib/queries/sms.ts` (add `isTwilioConfigured()` check)

---

## Execution Order
1. Step 1 — Stat cards (foundation, everything builds on this)
2. Step 8 — Hide SMS panel (quick win, removes noise before pitch)
3. Step 2 — Red concern banner (highest safeguarding priority)
4. Step 3 — Incident type breakdown (visible improvement)
5. Step 4 — Expected but not arrived (biggest new feature)
6. Step 5 — Prior concerns indicator (safeguarding depth)
7. Step 6 — End-of-session countdown (polish)
8. Step 7 — Auto-refresh (final touch)
