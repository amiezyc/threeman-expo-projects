import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const admins = [
    { email: 'amiezyc@gmail.com', name: 'Amie' },
    { email: 'kylelamkw@gmail.com', name: 'Kyle' },
  ];

  const results = [];

  for (const admin of admins) {
    // Check if user already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existing = existingUsers?.users?.find(u => u.email === admin.email);

    if (existing) {
      // Ensure profile is admin
      await supabase.from('profiles').upsert({
        id: existing.id,
        name: admin.name,
        role: 'admin',
      });
      results.push({ email: admin.email, status: 'exists, profile updated to admin', userId: existing.id });
      continue;
    }

    // Create user with a temporary password
    const { data, error } = await supabase.auth.admin.createUser({
      email: admin.email,
      password: 'TempAdmin2026!',
      email_confirm: true,
      user_metadata: { name: admin.name, role: 'admin' },
    });

    if (error) {
      results.push({ email: admin.email, status: 'error', error: error.message });
      continue;
    }

    // Set profile as admin
    await supabase.from('profiles').upsert({
      id: data.user.id,
      name: admin.name,
      role: 'admin',
    });

    results.push({ email: admin.email, status: 'created', userId: data.user.id });
  }

  return new Response(JSON.stringify({ results }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
