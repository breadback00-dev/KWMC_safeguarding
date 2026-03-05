# POST /api/checkin/:childId
Creates attendance record.

**Actions:**
- record check-in time
- send arrival SMS
- create safeguarding log entry

**Response**
```json
{
  "status": "checked_in"
}
```

# POST /api/checkout/:childId
Records child departure.

**Actions:**
- update checkout time
- send departure SMS
- log safeguarding event

# POST /api/webhooks/twilio
Receives inbound SMS replies.

**Actions:**
- store reply
- create safeguarding log entry
- mark response status

# Cron Job
`checkAbsences.ts`

**Runs:**
session_start + 15 minutes

**Logic:**
- get today's sessions
- find registered children
- compare with attendance
- mark missing children absent
- send SMS alerts
- log safeguarding events
