/**
 * Seed script — realistic test data for 2 sessions and 20 children.
 *
 * Run: npm run seed
 *
 * Idempotent: uses upsert on natural keys so it is safe to run multiple times
 * without creating duplicates.
 *
 * Requires .env.local to contain:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from '@supabase/supabase-js';

// ── Supabase client ───────────────────────────────────────────────────────────

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error(
    '\n  ERROR: Missing environment variables.\n' +
    '  Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local\n'
  );
  process.exit(1);
}

const supabase = createClient(url, key);

// ── Dates ─────────────────────────────────────────────────────────────────────

const today    = new Date().toISOString().split('T')[0];
const tomorrow = new Date(Date.now() + 86_400_000).toISOString().split('T')[0];

// ── Sessions ──────────────────────────────────────────────────────────────────
// Upsert key: UNIQUE(club_name, date, start_time)

const SESSIONS = [
  {
    club_name:  'Maker City – Monday',
    date:       today,
    start_time: '15:00:00',
    end_time:   '17:30:00',
    capacity:   20,
  },
  {
    club_name:  'Creative Hub – Tuesday',
    date:       tomorrow,
    start_time: '15:00:00',
    end_time:   '17:30:00',
    capacity:   20,
  },
];

// ── Children ──────────────────────────────────────────────────────────────────
// 20 children with realistic UK names, parent contacts, and unique QR codes.
// Upsert key: qr_code (UNIQUE NOT NULL in schema).
// Phone numbers use the Ofcom-reserved test range +447700 900 000–999.

const CHILDREN = [
  { name: 'Ava Smith',     parent_name: 'Sarah Smith',    parent_phone: '+447700900001', qr_code: 'qr-ava-smith' },
  { name: 'Jay Patel',     parent_name: 'Ravi Patel',     parent_phone: '+447700900002', qr_code: 'qr-jay-patel' },
  { name: 'Mia Johnson',   parent_name: 'Claire Johnson', parent_phone: '+447700900003', qr_code: 'qr-mia-johnson' },
  { name: 'Ethan Brown',   parent_name: 'David Brown',    parent_phone: '+447700900004', qr_code: 'qr-ethan-brown' },
  { name: 'Lily Wilson',   parent_name: 'Emma Wilson',    parent_phone: '+447700900005', qr_code: 'qr-lily-wilson' },
  { name: 'Noah Davis',    parent_name: 'Mark Davis',     parent_phone: '+447700900006', qr_code: 'qr-noah-davis' },
  { name: 'Isla Ahmed',    parent_name: 'Fatima Ahmed',   parent_phone: '+447700900007', qr_code: 'qr-isla-ahmed' },
  { name: 'Oscar Taylor',  parent_name: 'James Taylor',   parent_phone: '+447700900008', qr_code: 'qr-oscar-taylor' },
  { name: 'Amelia Khan',   parent_name: 'Zara Khan',      parent_phone: '+447700900009', qr_code: 'qr-amelia-khan' },
  { name: 'Lucas Roberts', parent_name: 'Helen Roberts',  parent_phone: '+447700900010', qr_code: 'qr-lucas-roberts' },
  { name: 'Grace Harris',  parent_name: 'Paula Harris',   parent_phone: '+447700900011', qr_code: 'qr-grace-harris' },
  { name: 'Charlie Lewis', parent_name: 'Tom Lewis',      parent_phone: '+447700900012', qr_code: 'qr-charlie-lewis' },
  { name: 'Sophia Walker', parent_name: 'Nina Walker',    parent_phone: '+447700900013', qr_code: 'qr-sophia-walker' },
  { name: 'Finn Clarke',   parent_name: 'Liam Clarke',    parent_phone: '+447700900014', qr_code: 'qr-finn-clarke' },
  { name: 'Poppy Hall',    parent_name: 'Susan Hall',     parent_phone: '+447700900015', qr_code: 'qr-poppy-hall' },
  { name: 'Zara Young',    parent_name: 'Aisha Young',    parent_phone: '+447700900016', qr_code: 'qr-zara-young' },
  { name: 'Freddie Allen', parent_name: 'Mike Allen',     parent_phone: '+447700900017', qr_code: 'qr-freddie-allen' },
  { name: 'Ruby Scott',    parent_name: 'Karen Scott',    parent_phone: '+447700900018', qr_code: 'qr-ruby-scott' },
  { name: 'Teddy Green',   parent_name: 'Laura Green',    parent_phone: '+447700900019', qr_code: 'qr-teddy-green' },
  { name: 'Bella Adams',   parent_name: 'Amy Adams',      parent_phone: '+447700900020', qr_code: 'qr-bella-adams' },
];

// ── Seed function ─────────────────────────────────────────────────────────────

async function seed() {
  console.log('\n  Community Hub — Seed Script');
  console.log('  ───────────────────────────\n');

  // ── Sessions ────────────────────────────────────────────────────────────────
  let sessionsCreated = 0;

  for (const session of SESSIONS) {
    const { error } = await supabase
      .from('sessions')
      .upsert(session, { onConflict: 'club_name,date,start_time' });

    if (error) {
      console.error(`  [ERROR] Failed to upsert session "${session.club_name}":`, error.message);
    } else {
      sessionsCreated++;
      console.log(`  [session] ${session.club_name} — ${session.date}`);
    }
  }

  // ── Children ────────────────────────────────────────────────────────────────
  let childrenCreated = 0;

  for (const child of CHILDREN) {
    const { error } = await supabase
      .from('children')
      .upsert(
        { ...child, active: true },
        { onConflict: 'qr_code' }
      );

    if (error) {
      console.error(`  [ERROR] Failed to upsert child "${child.name}":`, error.message);
    } else {
      childrenCreated++;
      console.log(`  [child]   ${child.name} — ${child.parent_name}`);
    }
  }

  // ── Summary ─────────────────────────────────────────────────────────────────
  console.log('\n  ───────────────────────────');
  console.log('  Seed complete');
  console.log(`  Sessions created: ${sessionsCreated}`);
  console.log(`  Children created: ${childrenCreated}`);
  console.log('');
}

seed().catch(err => {
  console.error('\n  Unexpected error:', err);
  process.exit(1);
});
