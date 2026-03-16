import { supabase } from '../lib/supabase/client';

async function inspect() {
    console.log('Inspecting attendance...');
    // Fetch a row if it exists, or try to insert a dummy row to see error or schema
    const { data, error } = await supabase.from('attendance').select('*').limit(1);
    console.log('Attendance:', data);

    console.log('Inspecting sessions...');
    const { data: sData } = await supabase.from('sessions').select('*').limit(1);
    console.log('Sessions:', sData);
}

inspect();
