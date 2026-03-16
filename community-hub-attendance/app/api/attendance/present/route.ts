import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/server';

export async function GET() {
    try {
        const today = new Date().toISOString().split('T')[0];

        // 1. Get today's session ID
        const { data: sessionData, error: sessionError } = await supabase
            .from('sessions')
            .select('id')
            .eq('date', today)
            .limit(1)
            .single();

        if (sessionError || !sessionData) {
            return NextResponse.json([]);
        }

        // 2. Find children who checked in today but haven't checked out
        const { data, error } = await supabase
            .from('attendance')
            .select(`
                child_id,
                children (
                    id,
                    name
                )
            `)
            .eq('session_id', sessionData.id)
            .not('checked_in_at', 'is', null)
            .is('check_out_time', null);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Flatten the response for the frontend
        const presentChildren = data.map((item: any) => ({
            id: item.child_id,
            name: item.children.name
        }));

        return NextResponse.json(presentChildren);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
