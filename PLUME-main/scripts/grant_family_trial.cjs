
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load .env.local manually
const envPath = path.resolve(__dirname, '../.env.local');
const envConfig = {};

try {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
            envConfig[match[1].trim()] = match[2].trim();
        }
    });
} catch (e) {
    console.error("Could not read .env.local", e);
    process.exit(1);
}

const supabaseUrl = envConfig['VITE_SUPABASE_URL'];
const supabaseKey = envConfig['VITE_SUPABASE_ANON_KEY'];
const serviceRoleKey = envConfig['SUPABASE_SERVICE_ROLE_KEY'];

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials in .env.local");
    process.exit(1);
}

// Prefer service role if available for admin updates
const supabase = createClient(supabaseUrl, serviceRoleKey || supabaseKey);

async function main() {
    console.log("🚀 Granting Family Trial & Fetching Invite...");

    // 1. Fetch latest invite to get Link AND UserId
    const { data: invites, error: inviteError } = await supabase
        .from('guest_invites')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);

    let targetUserId = null;

    if (inviteError) {
        console.error("Error fetching invites:", inviteError);
    } else if (invites && invites.length > 0) {
        const invite = invites[0];
        targetUserId = invite.user_id;

        const link = `http://localhost:5173/?mode=guest&token=${invite.token}`;
        console.log("\n💌 DERNIERE INVITATION FAMILLE :");
        console.log(link);
        console.log(`(Créée le: ${new Date(invite.created_at).toLocaleString()})`);
    } else {
        console.log("\n💌 Aucune invitation trouvée.");
    }

    // 2. Grant Family Trial
    if (!targetUserId) {
        // Fallback: try to find any user or subscription
        const { data: subs } = await supabase.from('subscriptions').select('user_id').limit(1);
        if (subs && subs.length > 0) targetUserId = subs[0].user_id;
    }

    if (!targetUserId) {
        console.error("❌ No user identified to grant trial (no invites or subscriptions found).");
        return;
    }

    console.log(`\nGranting Family Trial to User ID: ${targetUserId}...`);

    const fifteenDaysFromNow = new Date();
    fifteenDaysFromNow.setDate(fifteenDaysFromNow.getDate() + 15);

    // Upsert subscription
    const { data, error: upsertError } = await supabase
        .from('subscriptions')
        .upsert({
            user_id: targetUserId,
            plan_id: 'family',
            status: 'active',
            current_period_end: fifteenDaysFromNow.toISOString(),
            is_lifetime: false
        }, { onConflict: 'user_id' })
        .select();

    if (upsertError) {
        console.error("Failed to upsert subscription:", upsertError);
    } else {
        console.log(`✅ Subscription UPDATED to FAMILY (expires ${fifteenDaysFromNow.toISOString()})`);
    }
}

main().catch(console.error);
