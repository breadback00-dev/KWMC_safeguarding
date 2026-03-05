# Project: Community Hub Child Attendance & Safeguarding System

## Purpose
Provide a simple system for tracking attendance at community hub after-school clubs and automatically notifying parents of important events.

The system prioritises safeguarding, reliability, and simplicity.

## Core Features
### QR Code Check-In
Each child has a unique QR code.
When scanned:
- attendance record is created
- check-in time recorded
- arrival SMS sent to parent
- safeguarding event logged

### Arrival Notification
Parents receive an SMS when their child arrives.
Example:
> Hi Sarah,
> Jack has arrived at Football Club at 16:02.

### Late Arrival Detection
Sessions have a 15 minute buffer.
Example:
Session start: 16:00
Late check: 16:15
At 16:15 the system:
- checks registered children
- finds those without check-ins
- sends absence SMS

### Absence Alert
Example SMS:
> Jack has not arrived at Football Club today.
> Please reply LATE or NOT COMING.

### Parent SMS Replies
Parents can reply with:
- LATE
- NOT COMING
- SICK

Replies are:
- stored
- visible to staff
- logged as safeguarding events

### QR Checkout
Children scan a second QR code when leaving.
System records:
- checkout time
- safeguarding event
- departure SMS

### Safe Departure Notification
Example SMS:
> Jack has left Football Club at 17:58.

### Session Capacity Tracking
Staff dashboard shows:
- Session capacity
- Registered children
- Checked-in children
- Remaining spaces

### Safeguarding Log
All important events are logged:
- CHECK_IN
- ABSENCE_ALERT_SENT
- PARENT_REPLY
- LATE_ARRIVAL
- CHECK_OUT

Each log entry contains:
- child_id
- event_type
- timestamp
- details

## Tech Stack
### Frontend
- Next.js (App Router)
- TypeScript
- TailwindCSS

### Backend
- Supabase (database)

### Messaging
- Twilio SMS

### Deployment
- Vercel

## Key Entities
- children
- sessions
- registrations
- attendance
- safeguarding_log
