-- Final Database Schema as per User Requirements

-- 1. Children table
DROP TABLE IF EXISTS registrations CASCADE;
DROP TABLE IF EXISTS attendance CASCADE;
DROP TABLE IF EXISTS safeguarding_logs CASCADE;
DROP TABLE IF EXISTS children CASCADE;

CREATE TABLE children (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    parent_name TEXT,
    parent_phone TEXT NOT NULL,
    qr_code TEXT UNIQUE NOT NULL,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Sessions table
DROP TABLE IF EXISTS sessions CASCADE;
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_name TEXT NOT NULL,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    capacity INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT unique_session UNIQUE (club_name, date, start_time)
);

-- 3. Attendance table
CREATE TABLE attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    child_id UUID REFERENCES children(id) ON DELETE CASCADE,
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    checked_in_at TIMESTAMPTZ,
    check_out_time TIMESTAMPTZ,
    status TEXT CHECK (status IN ('present', 'late', 'absent', 'pending')) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(child_id, session_id)
);

-- 4. Safeguarding Logs table
CREATE TABLE safeguarding_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    child_id UUID REFERENCES children(id) ON DELETE SET NULL,
    session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
    event_type TEXT CHECK (event_type IN ('CHECK_IN', 'LATE_ARRIVAL', 'ABSENCE_ALERT_SENT', 'PARENT_REPLY', 'CHECK_OUT')) NOT NULL,
    description TEXT,
    timestamp TIMESTAMPTZ DEFAULT now()
);

-- 5. Safeguarding Incidents table
-- Separate from safeguarding_logs (which is a system audit trail for CHECK_IN/OUT events).
-- This table holds staff-recorded welfare incidents and concerns.
DROP TABLE IF EXISTS safeguarding_incidents CASCADE;
CREATE TABLE safeguarding_incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    attendance_id UUID REFERENCES attendance(id) ON DELETE SET NULL,
    incident_type TEXT NOT NULL CHECK (incident_type IN (
        'late_pickup', 'early_collection', 'injury',
        'behaviour', 'safeguarding_concern', 'other'
    )),
    notes TEXT NOT NULL,
    created_by TEXT NOT NULL DEFAULT 'staff',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ON safeguarding_incidents (child_id);
CREATE INDEX ON safeguarding_incidents (session_id);
CREATE INDEX ON safeguarding_incidents (created_at DESC);

-- 6. SMS Messages table
-- Records every SMS attempted (sent or failed) for auditing and deduplication.
-- attendance_id + message_type is the idempotency key: one SMS per event per record.
DROP TABLE IF EXISTS sms_messages CASCADE;
CREATE TABLE sms_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    child_id UUID REFERENCES children(id) ON DELETE SET NULL,
    attendance_id UUID REFERENCES attendance(id) ON DELETE SET NULL,
    phone_number TEXT NOT NULL,
    message TEXT NOT NULL,
    message_type TEXT NOT NULL CHECK (message_type IN ('check_in', 'check_out', 'absence_alert')),
    status TEXT NOT NULL CHECK (status IN ('sent', 'failed')) DEFAULT 'sent',
    twilio_sid TEXT,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ON sms_messages (attendance_id, message_type);
CREATE INDEX ON sms_messages (child_id);
CREATE INDEX ON sms_messages (created_at DESC);

-- Enable RLS as per security audit
ALTER TABLE children ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE safeguarding_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE safeguarding_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_messages ENABLE ROW LEVEL SECURITY;
