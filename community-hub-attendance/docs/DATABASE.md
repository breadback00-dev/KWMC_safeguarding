# children
Stores child information.

**Fields**
- id
- name
- parent_name
- parent_phone
- qr_code
- active
- created_at

# sessions
Club sessions.

**Fields**
- id
- club_name
- date
- start_time
- end_time
- capacity
- created_at

# registrations
Children registered to sessions.

**Fields**
- id
- child_id
- session_id
- created_at

# attendance
Tracks check-in and checkout.

**Fields**
- id
- child_id
- session_id
- check_in_time
- check_out_time
- status
- created_at

**Status values**
- present
- late
- absent

# safeguarding_log
Record of important safeguarding events.

**Fields**
- id
- child_id
- event_type
- timestamp
- details

**Event types**
- CHECK_IN
- ABSENCE_ALERT_SENT
- PARENT_REPLY
- LATE_ARRIVAL
- CHECK_OUT
