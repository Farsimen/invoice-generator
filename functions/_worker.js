export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Handle CORS
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };
    
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // API Routes
    if (url.pathname.startsWith('/api/')) {
      try {
        if (url.pathname === '/api/invoices') {
          if (request.method === 'POST') {
            // Save invoices to KV
            const { deviceId, invoices } = await request.json();
            
            if (!deviceId || !Array.isArray(invoices)) {
              return new Response('Invalid data', { status: 400, headers: corsHeaders });
            }

            await env.INVOICE_DATA.put(`invoices:${deviceId}`, JSON.stringify({
              deviceId,
              invoices,
              lastSync: new Date().toISOString()
            }));

            return new Response(JSON.stringify({ success: true }), {
              headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
          } 
          
          else if (request.method === 'GET') {
            // Get invoices from KV
            const deviceId = url.searchParams.get('device');
            
            if (!deviceId) {
              return new Response('Device ID required', { status: 400, headers: corsHeaders });
            }

            const data = await env.INVOICE_DATA.get(`invoices:${deviceId}`);
            
            if (data) {
              const parsed = JSON.parse(data);
              return new Response(JSON.stringify(parsed), {
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
              });
            } else {
              return new Response(JSON.stringify({ invoices: [] }), {
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
              });
            }
          }
        }
        
        else if (url.pathname === '/api/health') {
          return new Response(JSON.stringify({ 
            status: 'healthy', 
            timestamp: new Date().toISOString() 
          }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }
        
        return new Response('Not Found', { status: 404, headers: corsHeaders });
        
      } catch (error) {
        console.error('API Error:', error);
        return new Response('Internal Server Error', { status: 500, headers: corsHeaders });
      }
    }

    // Static file serving - fetch from GitHub or return 404
    return new Response('Not Found', { status: 404 });
  },
};
