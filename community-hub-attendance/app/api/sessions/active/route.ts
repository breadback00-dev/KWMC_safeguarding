import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/server';

export async function GET() {
    try {
        const today = new Date().toISOString().split('T')[0];

        // Fetch the most recent or upcoming session for today
        const { data, error } = await supabase
            .from('sessions')
            .select('*')
            .eq('date', today)
            .order('start_time', { ascending: true })
            .limit(1)
            .single();

        if (error) {
            // If no session found for today, return a 404
            if (error.code === 'PGRST116') {
                return NextResponse.json({ error: 'No session found for today' }, { status: 404 });
            }
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
