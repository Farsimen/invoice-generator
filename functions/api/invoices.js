const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function onRequestOptions(context) {
  return new Response(null, { headers: corsHeaders });
}

export async function onRequestPost(context) {
  try {
    const { deviceId, invoices } = await context.request.json();
    if (!deviceId || !Array.isArray(invoices)) {
      return new Response('Invalid data', { status: 400, headers: corsHeaders });
    }

    await context.env.INVOICE_DATA.put(`invoices:${deviceId}`, JSON.stringify({
      deviceId,
      invoices,
      lastSync: new Date().toISOString()
    }));

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  } catch (e) {
    return new Response('Internal Server Error', { status: 500, headers: corsHeaders });
  }
}

export async function onRequestGet(context) {
  try {
    const url = new URL(context.request.url);
    const deviceId = url.searchParams.get('device');
    if (!deviceId) return new Response('Device ID required', { status: 400, headers: corsHeaders });

    const data = await context.env.INVOICE_DATA.get(`invoices:${deviceId}`);
    const body = data ? data : JSON.stringify({ invoices: [] });

    return new Response(body, { headers: { 'Content-Type': 'application/json', ...corsHeaders } });
  } catch (e) {
    return new Response('Internal Server Error', { status: 500, headers: corsHeaders });
  }
}
