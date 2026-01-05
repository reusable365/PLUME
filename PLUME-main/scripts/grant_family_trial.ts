
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load .env.local manually
const envPath = path.resolve(__dirname, '../.env.local');
const envConfig: Record<string, string> = {};

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
const supabaseKey = envConfig['VITE_SUPABASE_ANON_KEY']; // Or SERVICE_ROLE if available, but Anon might work if policy allows, otherwise we need service role.
// Actually, subscription updates usually require Service Role or passing the user's token.
// If RLS is on, Anon key won't let me update SOMEONE ELSE'S subscription without their token.
// However, assuming this is a local dev or I have the Service Role key in .env.local...
// Let's check if there is a SERVICE_ROLE key.
const serviceRoleKey = envConfig['SUPABASE_SERVICE_ROLE_KEY'];

const supabase = createClient(supabaseUrl, serviceRoleKey || supabaseKey);

async function main() {
    console.log("🚀 Granting Family Trial & Fetching Invite...");

    // 1. Fetch latest invite
    const { data: invites, error: inviteError } = await supabase
        .from('guest_invites')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);

    if (inviteError) {
        console.error("Error fetching invites:", inviteError);
    } else if (invites && invites.length > 0) {
        const invite = invites[0];
        // Construct link: http://localhost:5173/?mode=guest&token=...
        // We assume localhost:5173 for dev
        const link = `http://localhost:5173/?mode=guest&token=${invite.token}`;
        console.log("\n💌 DERNIÈRE INVITATION FAMILLE :");
        console.log(link);
        console.log(`(Créée le: ${new Date(invite.created_at).toLocaleString()})`);
    } else {
        console.log("\n💌 Aucune invitation trouvée.");
    }

    // 2. Grant Family Trial
    // Fetch all users or subscriptions
    const { data: subs, error: subError } = await supabase
        .from('subscriptions')
        .select('*');

    if (subError) {
        console.error("Error fetching subscriptions:", subError);
        return;
    }

    if (!subs || subs.length === 0) {
        console.log("No subscriptions found to update.");
        // Try to create one for the first user if users exist?
        // Too risky without user ID.
        return;
    }

    console.log(`\nFound ${subs.length} subscriptions. Updating to 'family' for 15 days...`);

    const fifteenDaysFromNow = new Date();
    fifteenDaysFromNow.setDate(fifteenDaysFromNow.getDate() + 15);

    for (const sub of subs) {
        const { error: updateError } = await supabase
            .from('subscriptions')
            .update({
                plan_id: 'family',
                status: 'active',
                current_period_end: fifteenDaysFromNow.toISOString(),
                is_lifetime: false
            })
            .eq('id', sub.id);

        if (updateError) {
            console.error(`Failed to update subscription ${sub.id}:`, updateError);
        } else {
            console.log(`✅ Subscription ${sub.id} updated to FAMILY (expires ${fifteenDaysFromNow.toISOString()})`);
        }
    }
}

main().catch(console.error);
