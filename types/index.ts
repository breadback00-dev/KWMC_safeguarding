export interface Child {
    id: string;
    name: string;
    parent_name: string;
    parent_phone: string;
    qr_code: string;
    active: boolean;
}

export interface Session {
    id: string;
    club_name: string;
    date: string; // ISO format YYYY-MM-DD
    start_time: string; // HH:MM:SS
    end_time: string; // HH:MM:SS
    capacity: number;
}

export interface Registration {
    id: string;
    child_id: string;
    session_id: string;
}

export interface Attendance {
    id: string;
    child_id: string;
    session_id: string;
    check_in_time: string | null;
    check_out_time: string | null;
    status: 'present' | 'late' | 'absent' | 'pending';
}

export interface SafeguardingEvent {
    id: string;
    child_id: string;
    event_type: 'CHECK_IN' | 'LATE_ARRIVAL' | 'ABSENCE_ALERT_SENT' | 'PARENT_REPLY' | 'CHECK_OUT';
    timestamp: string;
    details: string | null;
}
