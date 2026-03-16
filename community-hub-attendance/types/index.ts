// ─── Domain Types ─────────────────────────────────────────────────────────────

export interface Child {
  id: string;
  name: string;
  parent_name: string | null;
  parent_phone: string;
  qr_code: string;
  active: boolean;
  created_at: string;
}

export interface Session {
  id: string;
  club_name: string;
  date: string;        // "YYYY-MM-DD"
  start_time: string;  // "HH:MM:SS"
  end_time: string;    // "HH:MM:SS"
  capacity: number;
  created_at: string;
}

export interface Attendance {
  id: string;
  child_id: string;
  session_id: string;
  checked_in_at: string | null;
  check_out_time: string | null;
  status: 'present' | 'late' | 'absent' | 'pending';
  created_at: string;
}

export interface SafeguardingLog {
  id: string;
  child_id: string;
  session_id: string;
  event_type: 'CHECK_IN' | 'LATE_ARRIVAL' | 'ABSENCE_ALERT_SENT' | 'PARENT_REPLY' | 'CHECK_OUT';
  description: string | null;
  timestamp: string;
}

// ─── Safeguarding Incidents ────────────────────────────────────────────────────

export const INCIDENT_TYPES = {
  late_pickup:           'Late Pickup',
  early_collection:      'Early Collection',
  injury:                'Injury',
  behaviour:             'Behaviour',
  safeguarding_concern:  'Safeguarding Concern',
  other:                 'Other',
} as const;

export type IncidentType = keyof typeof INCIDENT_TYPES;

export interface SafeguardingIncident {
  id: string;
  child_id: string;
  session_id: string;
  attendance_id: string | null;
  incident_type: IncidentType;
  notes: string;
  created_by: string;
  created_at: string;
  // Amendment fields (null until amended)
  amended_notes: string | null;
  amended_by: string | null;
  amended_at: string | null;
}

/** Incident row joined with child name for display. */
export interface SafeguardingIncidentRow extends SafeguardingIncident {
  child_name: string;
}

// ─── SMS Messages ──────────────────────────────────────────────────────────────

export type SmsMessageType = 'check_in' | 'check_out' | 'absence_alert';
export type SmsStatus = 'sent' | 'failed';

export interface SmsMessage {
  id: string;
  child_id: string | null;
  attendance_id: string | null;
  phone_number: string;
  message: string;
  message_type: SmsMessageType;
  status: SmsStatus;
  twilio_sid: string | null;
  error_message: string | null;
  created_at: string;
}

// ─── View / Derived Types ──────────────────────────────────────────────────────

/** A child currently checked in and not yet checked out. */
export interface PresentChild {
  id: string;
  name: string;
  attendance_id: string;
}

/** Result returned by server actions. */
export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };
