# System Overview

The system consists of:
- Next.js frontend
- API routes for attendance events
- Supabase database
- Twilio SMS messaging
- Cron job for absence detection

## High Level Flow

### Child Arrival
QR Scan
↓
Check-in API
↓
Attendance record created
↓
Arrival SMS sent
↓
Safeguarding log entry created

### Absence Detection
Cron job runs
↓
Find registered children
↓
Compare against attendance
↓
Missing children flagged
↓
SMS alerts sent
↓
Safeguarding log created

### Child Departure
QR checkout scan
↓
Checkout API
↓
Attendance updated
↓
Departure SMS sent
↓
Safeguarding log entry

### Parent Replies
Parent replies to SMS
↓
Twilio webhook receives message
↓
Reply stored
↓
Safeguarding log created
↓
Staff dashboard updated

## Folder Structure
```
/app
  /dashboard
  /checkin
  /checkout
  /api
    /checkin
    /checkout
    /webhooks/twilio

/components

/lib
  /supabase
  /twilio
  /sms
  /qr

/cron

/types

/docs
```
