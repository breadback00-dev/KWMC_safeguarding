-- database schema for Supabase

CREATE TABLE children (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  parent_name text NOT NULL,
  parent_phone text NOT NULL,
  qr_code text NOT NULL UNIQUE,
  active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE sessions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  club_name text NOT NULL,
  date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  capacity integer NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE registrations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  child_id uuid REFERENCES children(id) ON DELETE CASCADE,
  session_id uuid REFERENCES sessions(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(child_id, session_id)
);

CREATE TABLE attendance (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  child_id uuid REFERENCES children(id) ON DELETE CASCADE,
  session_id uuid REFERENCES sessions(id) ON DELETE CASCADE,
  check_in_time timestamp with time zone,
  check_out_time timestamp with time zone,
  status text CHECK (status IN ('present', 'late', 'absent', 'pending')) DEFAULT 'pending',
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(child_id, session_id)
);

CREATE TABLE safeguarding_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  child_id uuid REFERENCES children(id) ON DELETE CASCADE,
  event_type text CHECK (event_type IN ('CHECK_IN', 'LATE_ARRIVAL', 'ABSENCE_ALERT_SENT', 'PARENT_REPLY', 'CHECK_OUT')),
  timestamp timestamp with time zone DEFAULT now(),
  details text
);
