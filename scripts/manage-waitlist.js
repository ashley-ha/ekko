#!/usr/bin/env node

/**
 * Waitlist Management Script for Ekko
 *
 * Usage:
 *   node scripts/manage-waitlist.js list                    # Show all waitlist users
 *   node scripts/manage-waitlist.js invite-all             # Invite all pending users
 *   node scripts/manage-waitlist.js invite-batch 10        # Invite first 10 pending users
 *   node scripts/manage-waitlist.js invite user@email.com  # Invite specific user
 *   node scripts/manage-waitlist.js stats                  # Show waitlist statistics
 */

import { createClient } from '@supabase/supabase-js';

// Load environment variables from different sources
import { config } from 'dotenv';
config(); // Load from .env file if it exists

// Try multiple ways to get credentials
const supabaseUrl =
  process.env.VITE_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  'YOUR_SUPABASE_URL';

const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY ||
  'YOUR_SERVICE_ROLE_KEY';

// Debug what we found
console.log('🔍 Credential Check:');
console.log('  URL found:', supabaseUrl ? '✅' : '❌');
console.log(
  '  Service Key found:',
  supabaseServiceKey && !supabaseServiceKey.includes('YOUR_') ? '✅' : '❌'
);

if (
  !supabaseUrl ||
  !supabaseServiceKey ||
  supabaseUrl.includes('YOUR_') ||
  supabaseServiceKey.includes('YOUR_')
) {
  console.error('\n❌ Error: Missing Supabase credentials');
  console.log('Please set these environment variables:');
  console.log('  VITE_SUPABASE_URL=your_supabase_url');
  console.log('  SUPABASE_SERVICE_ROLE_KEY=your_service_role_key');
  console.log('\nOr create a .env file in your project root with:');
  console.log('  VITE_SUPABASE_URL=your_supabase_url');
  console.log('  SUPABASE_SERVICE_ROLE_KEY=your_service_role_key');
  console.log(
    '\nNote: You need the SERVICE ROLE key (not the anon key) for admin operations.'
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function listWaitlistUsers() {
  console.log('📋 Fetching waitlist users...\n');

  const { data, error } = await supabase
    .from('waitlist')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('❌ Error fetching users:', error.message);
    return;
  }

  if (!data || data.length === 0) {
    console.log('📭 No users on waitlist yet.');
    return;
  }

  console.log(`Found ${data.length} users on waitlist:\n`);

  data.forEach((user, index) => {
    const statusEmoji =
      {
        pending: '⏳',
        invited: '✉️',
        registered: '✅',
      }[user.status] || '❓';

    const date = new Date(user.created_at).toLocaleDateString();
    console.log(
      `${index + 1}. ${statusEmoji} ${user.email} (${user.status}) - ${date}`
    );
  });

  console.log('\nLegend: ⏳ Pending | ✉️ Invited | ✅ Registered');
}

async function getWaitlistStats() {
  console.log('📊 Waitlist Statistics\n');

  const { data, error } = await supabase.from('waitlist').select('status');

  if (error) {
    console.error('❌ Error fetching stats:', error.message);
    return;
  }

  const stats = data.reduce((acc, user) => {
    acc[user.status] = (acc[user.status] || 0) + 1;
    return acc;
  }, {});

  const total = data.length;

  console.log(`Total Users: ${total}`);
  console.log(
    `⏳ Pending: ${stats.pending || 0} (${Math.round(
      ((stats.pending || 0) / total) * 100
    )}%)`
  );
  console.log(
    `✉️ Invited: ${stats.invited || 0} (${Math.round(
      ((stats.invited || 0) / total) * 100
    )}%)`
  );
  console.log(
    `✅ Registered: ${stats.registered || 0} (${Math.round(
      ((stats.registered || 0) / total) * 100
    )}%)`
  );
}

async function inviteUser(email) {
  console.log(`✉️ Inviting ${email}...`);

  const { data, error } = await supabase
    .from('waitlist')
    .update({ status: 'invited', updated_at: new Date().toISOString() })
    .eq('email', email)
    .eq('status', 'pending') // Only update if currently pending
    .select();

  if (error) {
    console.error('❌ Error inviting user:', error.message);
    return;
  }

  if (!data || data.length === 0) {
    console.log(`⚠️ User ${email} not found or already invited/registered.`);
    return;
  }

  console.log(`✅ Successfully invited ${email}!`);

  // TODO: You could add email sending logic here
  console.log(
    '💡 Next step: Send them an email with instructions to access the app'
  );
}

async function inviteAllUsers() {
  console.log('✉️ Inviting ALL pending users...');

  const { data, error } = await supabase
    .from('waitlist')
    .update({ status: 'invited', updated_at: new Date().toISOString() })
    .eq('status', 'pending')
    .select();

  if (error) {
    console.error('❌ Error inviting users:', error.message);
    return;
  }

  console.log(`✅ Successfully invited ${data.length} users!`);

  if (data.length > 0) {
    console.log('\nInvited users:');
    data.forEach((user) => console.log(`  - ${user.email}`));
    console.log(
      '\n💡 Next step: Send them emails with instructions to access the app'
    );
  }
}

async function inviteBatch(count) {
  const num = parseInt(count);
  if (isNaN(num) || num <= 0) {
    console.error('❌ Please provide a valid number for batch size');
    return;
  }

  console.log(`✉️ Inviting first ${num} pending users...`);

  // Get the oldest pending users
  const { data: pendingUsers, error: fetchError } = await supabase
    .from('waitlist')
    .select('email')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(num);

  if (fetchError) {
    console.error('❌ Error fetching pending users:', fetchError.message);
    return;
  }

  if (!pendingUsers || pendingUsers.length === 0) {
    console.log('📭 No pending users to invite.');
    return;
  }

  const emails = pendingUsers.map((u) => u.email);

  const { data, error } = await supabase
    .from('waitlist')
    .update({ status: 'invited', updated_at: new Date().toISOString() })
    .in('email', emails)
    .select();

  if (error) {
    console.error('❌ Error inviting batch:', error.message);
    return;
  }

  console.log(`✅ Successfully invited ${data.length} users!`);

  console.log('\nInvited users:');
  data.forEach((user) => console.log(`  - ${user.email}`));
  console.log(
    '\n💡 Next step: Send them emails with instructions to access the app'
  );
}

// Main execution
const command = process.argv[2];
const arg = process.argv[3];

switch (command) {
  case 'list':
    await listWaitlistUsers();
    break;
  case 'stats':
    await getWaitlistStats();
    break;
  case 'invite':
    if (!arg) {
      console.error('❌ Please provide an email address');
      console.log(
        'Usage: node scripts/manage-waitlist.js invite user@email.com'
      );
    } else {
      await inviteUser(arg);
    }
    break;
  case 'invite-all':
    await inviteAllUsers();
    break;
  case 'invite-batch':
    if (!arg) {
      console.error('❌ Please provide batch size');
      console.log('Usage: node scripts/manage-waitlist.js invite-batch 10');
    } else {
      await inviteBatch(arg);
    }
    break;
  default:
    console.log('🎛️ Ekko Waitlist Management Tool\n');
    console.log('Available commands:');
    console.log('  list                     - Show all waitlist users');
    console.log('  stats                    - Show waitlist statistics');
    console.log('  invite user@email.com    - Invite specific user');
    console.log('  invite-batch 10          - Invite first 10 pending users');
    console.log('  invite-all               - Invite all pending users');
    console.log('\nExample:');
    console.log('  node scripts/manage-waitlist.js list');
}

process.exit(0);
