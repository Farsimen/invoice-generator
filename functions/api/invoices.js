const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function onRequestOptions() {
  return new Response(null, { headers: corsHeaders });
}

export async function onRequestPost(context) {
  try {
    const { deviceId, invoices } = await context.request.json();
    
    if (!deviceId || !Array.isArray(invoices)) {
      return new Response('Invalid data', { status: 400, headers: corsHeaders });
    }

    const db = context.env.DB;

    for (const inv of invoices) {
      await db.prepare(`
        INSERT INTO invoices (
          id, device_id, number, date, persian_date, company_name, customer_name,
          services_json, subtotal, total_discount, tax, grand_total,
          services_count, notes, has_pdf, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
        ON CONFLICT(id) DO UPDATE SET
          device_id=excluded.device_id,
          number=excluded.number,
          date=excluded.date,
          persian_date=excluded.persian_date,
          company_name=excluded.company_name,
          customer_name=excluded.customer_name,
          services_json=excluded.services_json,
          subtotal=excluded.subtotal,
          total_discount=excluded.total_discount,
          tax=excluded.tax,
          grand_total=excluded.grand_total,
          services_count=excluded.services_count,
          notes=excluded.notes,
          has_pdf=excluded.has_pdf,
          updated_at=datetime('now')
      `).bind(
        String(inv.id || Date.now()),
        deviceId,
        inv.number || '',
        inv.date || new Date().toISOString(),
        inv.persianDate || '',
        inv.companyName || '',
        inv.customerName || '',
        JSON.stringify(inv.services || []),
        Number(inv.subtotal || 0),
        Number(inv.totalDiscount || 0),
        Number(inv.tax || 0),
        Number(inv.grandTotal || 0),
        Number(inv.servicesCount || 0),
        inv.notes || '',
        inv.hasPDF ? 1 : 0
      ).run();
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  } catch (e) {
    console.error('D1 POST error:', e);
    return new Response('Internal Server Error', { status: 500, headers: corsHeaders });
  }
}

export async function onRequestGet(context) {
  try {
    const url = new URL(context.request.url);
    const deviceId = url.searchParams.get('device');
    
    if (!deviceId) {
      return new Response('Device ID required', { status: 400, headers: corsHeaders });
    }

    const db = context.env.DB;

    const result = await db.prepare(`
      SELECT * FROM invoices 
      WHERE device_id = ? 
      ORDER BY date DESC 
      LIMIT 1000
    `).bind(deviceId).all();

    const invoices = (result.results || []).map(row => ({
      id: row.id,
      number: row.number,
      date: row.date,
      persianDate: row.persian_date,
      companyName: row.company_name,
      customerName: row.customer_name,
      services: JSON.parse(row.services_json || '[]'),
      subtotal: row.subtotal,
      totalDiscount: row.total_discount,
      tax: row.tax,
      grandTotal: row.grand_total,
      servicesCount: row.services_count,
      servicesText: (JSON.parse(row.services_json || '[]')).map(s => s.name).join('، '),
      notes: row.notes,
      hasPDF: !!row.has_pdf
    }));

    return new Response(JSON.stringify({ deviceId, invoices }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  } catch (e) {
    console.error('D1 GET error:', e);
    return new Response('Internal Server Error', { status: 500, headers: corsHeaders });
  }
}
