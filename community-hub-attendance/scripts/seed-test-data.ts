import { supabase } from '../lib/supabase/client';

async function seed() {
    console.log('Seeding data for E2E verification...');

    const childId = 'e3a28136-5445-4657-9b0e-0ec03c6c021d';
    const sessionId = '2b38aff5-33c0-412f-8c0e-4d9381c2277c';

    // 1. Create the child
    const { error: childError } = await supabase
        .from('children')
        .upsert({
            id: childId,
            name: 'Sam Taylor',
            parent_phone: '+447700000000',
            qr_code: 'child_sam_123',
            active: true
        });

    if (childError) {
        console.error('Error seeding child:', childError);
        return;
    }
    console.log('Seeded child:', childId);

    // 2. Create the session
    const { error: sessionError } = await supabase
        .from('sessions')
        .upsert({
            id: sessionId,
            club_name: 'After School Club',
            date: new Date().toISOString().split('T')[0],
            start_time: '15:00:00',
            end_time: '17:30:00',
            capacity: 30
        });

    if (sessionError) {
        console.error('Error seeding session:', sessionError);
        return;
    }
    console.log('Seeded session:', sessionId);

    console.log('Seed complete!');
}

seed();
