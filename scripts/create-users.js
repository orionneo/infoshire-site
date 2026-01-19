import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DEFAULT_PASSWORD = process.env.DEFAULT_PASSWORD || 'info123';

if (!SUPABASE_URL) throw new Error('Missing env VITE_SUPABASE_URL');
if (!SERVICE_ROLE) throw new Error('Missing env SUPABASE_SERVICE_ROLE_KEY');

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function run() {
  // Puxa clientes da sua tabela profiles
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id,email,role')
    .eq('role', 'client');

  if (error) throw error;

  let created = 0, skipped = 0, failed = 0;

  for (const p of profiles || []) {
    if (!p.email) { skipped++; continue; }

    const { error: createErr } = await supabase.auth.admin.createUser({
      id: p.id,                 // IMPORTANTÍSSIMO: casa com profiles.id
      email: p.email,
      password: DEFAULT_PASSWORD,
      email_confirm: true,
    });

    if (createErr) {
      // Se já existe, normalmente vem "User already registered"
      if (String(createErr.message || '').toLowerCase().includes('already')) {
        skipped++;
      } else {
        failed++;
        console.log(`❌ ${p.email}: ${createErr.message}`);
      }
    } else {
      created++;
      console.log(`✅ Criado: ${p.email}`);
    }
  }

  console.log(`\nResumo: created=${created} skipped=${skipped} failed=${failed}`);
  if (failed > 0) process.exit(1);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
