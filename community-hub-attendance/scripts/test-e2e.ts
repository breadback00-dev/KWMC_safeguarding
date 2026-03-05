import { checkAbsences } from '../cron/checkAbsences';

async function run() {
    console.log('==============================================');
    console.log('       STARTING END-TO-END TEST FLOW          ');
    console.log('==============================================\n');

    try {
        // 1. Check in
        console.log('📲 [USER ACTION] Scanning Arrival QR Code & Checking In (Child ID: child_123)');
        const res1 = await fetch('http://localhost:3000/api/checkin/child_123', { method: 'POST' });
        console.log('   Response ->', await res1.json());
        console.log('   (Details are logged in the server terminal)\n');

        // 2. Absence cron runs
        console.log('⏰ [SYSTEM CRON] 15 minutes pass. Cron job runs for late detection.');
        await checkAbsences();
        console.log('\n');

        // 3. Parent replies
        console.log('✉️  [PARENT ACTION] Replies "LATE" to the SMS alert (Child ID: child_absent_456)');
        const res3 = await fetch('http://localhost:3000/api/webhooks/twilio', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: 'LATE', from: '+447700900000', childId: 'child_absent_456' })
        });
        console.log('   Response ->', await res3.json());
        console.log('   (Details are logged in the server terminal)\n');

        // 4. Checkout scan
        console.log('📲 [USER ACTION] Scanning Checkout QR Code (Child ID: child_123)');
        const res4 = await fetch('http://localhost:3000/api/checkout/child_123', { method: 'POST' });
        console.log('   Response ->', await res4.json());
        console.log('   (Details are logged in the server terminal)\n');

        console.log('==============================================');
        console.log('         E2E TEST FLOW COMPLETE               ');
        console.log('==============================================');

        process.exit(0);

    } catch (err) {
        console.error('Error during test execution:', err);
        process.exit(1);
    }
}

run();
