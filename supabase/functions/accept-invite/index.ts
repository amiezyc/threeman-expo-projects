import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { token, password } = await req.json();
    if (!token || !password) {
      return new Response(JSON.stringify({ error: 'Token and password required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (password.length < 6) {
      return new Response(JSON.stringify({ error: 'Password must be at least 6 characters' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify the OTP token (magic link token)
    const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
      token_hash: token,
      type: 'magiclink',
    });

    if (verifyError || !verifyData.user) {
      return new Response(JSON.stringify({ error: verifyError?.message || 'Invalid or expired token' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const user = verifyData.user;

    // Set the user's password via admin API
    const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
      password,
    });

    if (updateError) {
      return new Response(JSON.stringify({ error: updateError.message }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Ensure profile exists
    const { data: profile } = await supabase.from('profiles').select('id').eq('id', user.id).single();
    if (!profile) {
      await supabase.from('profiles').insert({
        id: user.id,
        name: user.user_metadata?.name || user.email || '',
        role: user.user_metadata?.role || 'employee',
      });
    }

    // Sign in the user with the new password to get a session
    const anonClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!);
    const { data: signInData, error: signInError } = await anonClient.auth.signInWithPassword({
      email: user.email!,
      password,
    });

    return new Response(JSON.stringify({
      success: true,
      email: user.email,
      role: user.user_metadata?.role || 'employee',
      session: signInData?.session || null,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
