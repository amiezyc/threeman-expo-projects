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

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const token = authHeader.replace('Bearer ', '');
    const { data: { user: caller } } = await supabase.auth.getUser(token);
    if (!caller) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: callerRole } = await supabase.rpc('get_user_role', { _user_id: caller.id });
    if (callerRole !== 'admin') {
      return new Response(JSON.stringify({ error: 'Only admins can edit profiles' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { userId, name, role, daily_rate, hourly_rate } = await req.json();
    if (!userId) {
      return new Response(JSON.stringify({ error: 'userId required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const updates: Record<string, any> = {};
    if (name !== undefined) updates.name = name;
    if (role !== undefined) updates.role = role;
    if (daily_rate !== undefined) updates.daily_rate = daily_rate;
    if (hourly_rate !== undefined) updates.hourly_rate = hourly_rate;

    if (Object.keys(updates).length === 0) {
      return new Response(JSON.stringify({ error: 'No fields to update' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { error: updateError } = await supabase.from('profiles').update(updates).eq('id', userId);
    if (updateError) {
      return new Response(JSON.stringify({ error: updateError.message }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    await supabase.from('audit_logs').insert({
      action: 'profile_updated',
      target_user_id: userId,
      performed_by: caller.id,
      details: updates,
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
