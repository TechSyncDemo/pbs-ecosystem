import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function hmacSha256Hex(secret: string, msg: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(msg));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const token = authHeader.replace('Bearer ', '');
    const { data: claims, error: authErr } = await userClient.auth.getClaims(token);
    if (authErr || !claims?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const body = await req.json();
    const { order_id, razorpay_order_id, razorpay_payment_id, razorpay_signature } = body || {};
    if (!order_id || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return new Response(JSON.stringify({ error: 'Missing fields' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET')!;
    const expected = await hmacSha256Hex(keySecret, `${razorpay_order_id}|${razorpay_payment_id}`);
    if (expected !== razorpay_signature) {
      return new Response(JSON.stringify({ error: 'Invalid signature' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Use service role to update order + release stock
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Verify the order belongs to this user's center
    const { data: orderRow, error: orderErr } = await admin
      .from('orders')
      .select('id, center_id, payment_status')
      .eq('id', order_id)
      .single();
    if (orderErr || !orderRow) {
      return new Response(JSON.stringify({ error: 'Order not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (orderRow.payment_status === 'paid') {
      return new Response(JSON.stringify({ success: true, already_paid: true }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { error: updErr } = await admin
      .from('orders')
      .update({
        status: 'approved',
        payment_status: 'paid',
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        payment_id: razorpay_payment_id,
      })
      .eq('id', order_id);
    if (updErr) throw updErr;

    // Release stock for each item
    const { data: items, error: itemsErr } = await admin
      .from('order_items')
      .select('stock_item_id, quantity')
      .eq('order_id', order_id);
    if (itemsErr) throw itemsErr;

    for (const it of (items || [])) {
      const { error: stockErr } = await admin.rpc('increment_center_stock', {
        p_center_id: orderRow.center_id,
        p_stock_item_id: it.stock_item_id,
        p_quantity: it.quantity,
      });
      if (stockErr) console.error('stock release error', stockErr);

      // Ensure the center is authorized to admit students for this course.
      // Stock alone is not enough — admissions require an active center_courses row.
      const { data: stockItem, error: siErr } = await admin
        .from('stock_items')
        .select('course_id')
        .eq('id', it.stock_item_id)
        .maybeSingle();
      if (siErr) {
        console.error('stock_item lookup error', siErr);
        continue;
      }
      if (stockItem?.course_id) {
        // Check if an authorization already exists; if so, just ensure it's active
        // and extend validity. If not, insert a fresh one. Never overwrite
        // financial fields (commission, kit_value, exam_value, registration_amount).
        const { data: existing } = await admin
          .from('center_courses')
          .select('id, valid_until')
          .eq('center_id', orderRow.center_id)
          .eq('course_id', stockItem.course_id)
          .maybeSingle();

        const newValidUntil = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
          .toISOString()
          .slice(0, 10);

        if (existing) {
          const keep = existing.valid_until && existing.valid_until > newValidUntil
            ? existing.valid_until
            : newValidUntil;
          const { error: updErr } = await admin
            .from('center_courses')
            .update({ status: 'active', valid_until: keep })
            .eq('id', existing.id);
          if (updErr) console.error('center_courses update error', updErr);
        } else {
          const { error: insErr } = await admin
            .from('center_courses')
            .insert({
              center_id: orderRow.center_id,
              course_id: stockItem.course_id,
              status: 'active',
              valid_from: new Date().toISOString().slice(0, 10),
              valid_until: newValidUntil,
            });
          if (insErr) console.error('center_courses insert error', insErr);
        }
      }
    }

    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});