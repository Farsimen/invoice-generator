export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // Handle static files
    if (pathname === '/' || pathname === '/index.html') {
      return new Response(await getAsset('index.html'), {
        headers: { 'content-type': 'text/html;charset=UTF-8' },
      });
    }

    if (pathname === '/styles.css') {
      return new Response(await getAsset('styles.css'), {
        headers: { 'content-type': 'text/css' },
      });
    }

    if (pathname === '/script.js') {
      return new Response(await getAsset('script.js'), {
        headers: { 'content-type': 'application/javascript' },
      });
    }

    // Handle API endpoints
    if (pathname.startsWith('/api/')) {
      return handleAPI(request, env, pathname);
    }

    // 404 for unmatched routes
    return new Response('Not Found', { status: 404 });
  },
};

async function handleAPI(request, env, pathname) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (pathname === '/api/save-invoice' && request.method === 'POST') {
      const data = await request.json();
      const invoiceId = data.invoiceNumber || generateInvoiceId();
      
      // Save to Cloudflare KV
      await env.INVOICE_DATA.put(`invoice:${invoiceId}`, JSON.stringify(data));
      
      return new Response(JSON.stringify({ success: true, id: invoiceId }), {
        headers: { ...corsHeaders, 'content-type': 'application/json' },
      });
    }

    if (pathname.startsWith('/api/get-invoice/') && request.method === 'GET') {
      const invoiceId = pathname.split('/').pop();
      const data = await env.INVOICE_DATA.get(`invoice:${invoiceId}`);
      
      if (data) {
        return new Response(data, {
          headers: { ...corsHeaders, 'content-type': 'application/json' },
        });
      } else {
        return new Response(JSON.stringify({ error: 'Invoice not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'content-type': 'application/json' },
        });
      }
    }

    return new Response(JSON.stringify({ error: 'Invalid API endpoint' }), {
      status: 400,
      headers: { ...corsHeaders, 'content-type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'content-type': 'application/json' },
    });
  }
}

function generateInvoiceId() {
  return 'INV-' + Date.now().toString(36) + '-' + Math.random().toString(36).substr(2, 5);
}

// This function would need to be implemented to serve static assets
// For Cloudflare Workers, you typically use Workers Sites or R2
async function getAsset(path) {
  // This is a placeholder - in a real deployment, you'd serve from Workers Sites or R2
  const assets = {
    'index.html': `<!-- Your HTML content here -->`,
    'styles.css': `/* Your CSS content here */`,
    'script.js': `// Your JavaScript content here`
  };
  
  return assets[path] || '';
}