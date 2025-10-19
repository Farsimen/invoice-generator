/**
 * Enhanced Cloudflare Worker for Invoice Generator
 * Serves static files and provides API endpoints for invoice management
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = url.pathname;
    
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    };

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders
      });
    }

    try {
      // API Routes
      if (pathname.startsWith('/api/')) {
        return await handleAPI(request, env, pathname, corsHeaders);
      }

      // Static file serving
      const staticResponse = await handleStaticFiles(pathname, env);
      if (staticResponse) {
        // Add CORS headers to static responses too
        Object.entries(corsHeaders).forEach(([key, value]) => {
          staticResponse.headers.set(key, value);
        });
        return staticResponse;
      }

      // 404 for unmatched routes
      return new Response('Not Found', { 
        status: 404,
        headers: corsHeaders 
      });
      
    } catch (error) {
      console.error('Worker error:', error);
      return new Response(
        JSON.stringify({ 
          error: 'Internal Server Error',
          message: error.message 
        }), 
        {
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      );
    }
  }
};

/**
 * Handle static file requests
 */
async function handleStaticFiles(pathname, env) {
  // Normalize path
  let filePath = pathname === '/' ? '/index.html' : pathname;
  
  // Remove leading slash
  if (filePath.startsWith('/')) {
    filePath = filePath.substring(1);
  }
  
  // Security: prevent directory traversal
  if (filePath.includes('..') || filePath.includes('//')) {
    return null;
  }
  
  // Try to get static asset
  try {
    // For Cloudflare Workers Sites, you would use:
    // const asset = await getAssetFromKV({ request: new Request(url) });
    // return asset;
    
    // For now, serve files directly from the worker
    const fileContent = await getStaticAsset(filePath);
    if (fileContent) {
      const mimeType = getMimeType(filePath);
      return new Response(fileContent, {
        headers: {
          'Content-Type': mimeType,
          'Cache-Control': 'public, max-age=3600',
          'ETag': `"${await generateETag(fileContent)}"`,
        }
      });
    }
  } catch (error) {
    console.error('Error serving static file:', error);
  }
  
  return null;
}

/**
 * Get static asset content (placeholder implementation)
 * In production, this should be replaced with actual file content or Cloudflare Workers Sites
 */
async function getStaticAsset(filePath) {
  const staticAssets = {
    'index.html': `<!-- This should be replaced with actual file content -->`,
    'manifest.json': JSON.stringify({
      name: 'سامانه صدور فاکتور',
      short_name: 'فاکتور ساز',
      start_url: '/',
      display: 'standalone',
      theme_color: '#3b82f6',
      background_color: '#ffffff'
    }, null, 2),
    'sw.js': `// Service Worker placeholder`,
    'robots.txt': `User-agent: *\nDisallow: /api/\nAllow: /\n\nSitemap: ${self.location?.origin}/sitemap.xml`
  };
  
  return staticAssets[filePath] || null;
}

/**
 * Determine MIME type based on file extension
 */
function getMimeType(filePath) {
  const extension = filePath.split('.').pop()?.toLowerCase();
  
  const mimeTypes = {
    'html': 'text/html; charset=utf-8',
    'css': 'text/css; charset=utf-8',
    'js': 'application/javascript; charset=utf-8',
    'json': 'application/json; charset=utf-8',
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'gif': 'image/gif',
    'svg': 'image/svg+xml',
    'ico': 'image/x-icon',
    'woff': 'font/woff',
    'woff2': 'font/woff2',
    'ttf': 'font/ttf',
    'txt': 'text/plain; charset=utf-8',
    'xml': 'application/xml; charset=utf-8'
  };
  
  return mimeTypes[extension] || 'application/octet-stream';
}

/**
 * Generate ETag for caching
 */
async function generateETag(content) {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16);
}

/**
 * Handle API requests
 */
async function handleAPI(request, env, pathname, corsHeaders) {
  const method = request.method;
  
  // Health check
  if (pathname === '/api/health' && method === 'GET') {
    return new Response(
      JSON.stringify({ 
        status: 'healthy', 
        version: '2.0.0',
        timestamp: new Date().toISOString()
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
  
  // Save invoice
  if (pathname === '/api/invoices' && method === 'POST') {
    return await handleSaveInvoice(request, env, corsHeaders);
  }
  
  // Get invoice
  if (pathname.startsWith('/api/invoices/') && method === 'GET') {
    const invoiceId = pathname.split('/').pop();
    return await handleGetInvoice(invoiceId, env, corsHeaders);
  }
  
  // List invoices
  if (pathname === '/api/invoices' && method === 'GET') {
    return await handleListInvoices(request, env, corsHeaders);
  }
  
  // Delete invoice
  if (pathname.startsWith('/api/invoices/') && method === 'DELETE') {
    const invoiceId = pathname.split('/').pop();
    return await handleDeleteInvoice(invoiceId, env, corsHeaders);
  }
  
  // Generate invoice number
  if (pathname === '/api/invoice-number' && method === 'GET') {
    return await handleGenerateInvoiceNumber(env, corsHeaders);
  }
  
  // Analytics endpoint (placeholder)
  if (pathname === '/api/analytics' && method === 'POST') {
    return await handleAnalytics(request, env, corsHeaders);
  }
  
  // 404 for unknown API endpoints
  return new Response(
    JSON.stringify({ 
      error: 'Not Found', 
      message: 'API endpoint not found' 
    }),
    {
      status: 404,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    }
  );
}

/**
 * Handle saving an invoice
 */
async function handleSaveInvoice(request, env, corsHeaders) {
  try {
    const invoiceData = await request.json();
    
    // Validate required fields
    if (!invoiceData.number || !invoiceData.services) {
      return new Response(
        JSON.stringify({ 
          error: 'Bad Request', 
          message: 'Missing required fields: number, services' 
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      );
    }
    
    // Add metadata
    const enhancedData = {
      ...invoiceData,
      id: generateInvoiceId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: '2.0.0'
    };
    
    // Save to KV storage if available
    if (env.INVOICE_DATA) {
      await env.INVOICE_DATA.put(
        `invoice:${enhancedData.id}`,
        JSON.stringify(enhancedData),
        {
          expirationTtl: 86400 * 365, // 1 year
          metadata: {
            number: enhancedData.number,
            customerName: enhancedData.customerName || 'Unknown',
            total: enhancedData.grandTotal || 0,
            createdAt: enhancedData.createdAt
          }
        }
      );
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        id: enhancedData.id,
        number: enhancedData.number
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
    
  } catch (error) {
    console.error('Error saving invoice:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal Server Error', 
        message: 'Failed to save invoice' 
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
}

/**
 * Handle retrieving an invoice
 */
async function handleGetInvoice(invoiceId, env, corsHeaders) {
  try {
    if (!env.INVOICE_DATA) {
      return new Response(
        JSON.stringify({ 
          error: 'Service Unavailable', 
          message: 'Storage not configured' 
        }),
        {
          status: 503,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      );
    }
    
    const invoiceData = await env.INVOICE_DATA.get(`invoice:${invoiceId}`);
    
    if (!invoiceData) {
      return new Response(
        JSON.stringify({ 
          error: 'Not Found', 
          message: 'Invoice not found' 
        }),
        {
          status: 404,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      );
    }
    
    return new Response(invoiceData, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Cache-Control': 'private, max-age=300'
      }
    });
    
  } catch (error) {
    console.error('Error getting invoice:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal Server Error', 
        message: 'Failed to retrieve invoice' 
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
}

/**
 * Handle listing invoices with pagination
 */
async function handleListInvoices(request, env, corsHeaders) {
  try {
    const url = new URL(request.url);
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);
    const cursor = url.searchParams.get('cursor') || undefined;
    
    if (!env.INVOICE_DATA) {
      return new Response(
        JSON.stringify({ 
          invoices: [],
          cursor: null,
          hasMore: false
        }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      );
    }
    
    const { keys, list_complete, cursor: nextCursor } = await env.INVOICE_DATA.list({
      prefix: 'invoice:',
      limit,
      cursor
    });
    
    const invoices = [];
    
    for (const key of keys) {
      if (key.metadata) {
        invoices.push({
          id: key.name.replace('invoice:', ''),
          number: key.metadata.number,
          customerName: key.metadata.customerName,
          total: key.metadata.total,
          createdAt: key.metadata.createdAt
        });
      }
    }
    
    return new Response(
      JSON.stringify({
        invoices,
        cursor: list_complete ? null : nextCursor,
        hasMore: !list_complete
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Cache-Control': 'private, max-age=60'
        }
      }
    );
    
  } catch (error) {
    console.error('Error listing invoices:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal Server Error', 
        message: 'Failed to list invoices' 
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
}

/**
 * Handle deleting an invoice
 */
async function handleDeleteInvoice(invoiceId, env, corsHeaders) {
  try {
    if (!env.INVOICE_DATA) {
      return new Response(
        JSON.stringify({ 
          error: 'Service Unavailable', 
          message: 'Storage not configured' 
        }),
        {
          status: 503,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      );
    }
    
    await env.INVOICE_DATA.delete(`invoice:${invoiceId}`);
    
    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Invoice deleted successfully'
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
    
  } catch (error) {
    console.error('Error deleting invoice:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal Server Error', 
        message: 'Failed to delete invoice' 
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
}

/**
 * Handle generating invoice number
 */
async function handleGenerateInvoiceNumber(env, corsHeaders) {
  try {
    // Get current counter from KV
    let counter = 1;
    if (env.INVOICE_DATA) {
      const counterData = await env.INVOICE_DATA.get('global:counter');
      if (counterData) {
        counter = parseInt(counterData) + 1;
      }
      
      // Update counter
      await env.INVOICE_DATA.put('global:counter', counter.toString());
    }
    
    // Generate Persian date code
    const now = new Date();
    const persianDate = new Intl.DateTimeFormat('fa-IR-u-ca-persian-nu-latn', {
      year: '2-digit',
      month: '2-digit', 
      day: '2-digit'
    });
    
    const parts = persianDate.formatToParts(now);
    const year = parts.find(p => p.type === 'year')?.value || '04';
    const month = parts.find(p => p.type === 'month')?.value || '07';
    const day = parts.find(p => p.type === 'day')?.value || '27';
    
    const dateCode = `${year}${month}${day}`;
    const invoiceNumber = `${dateCode}-${counter.toString().padStart(3, '0')}`;
    
    return new Response(
      JSON.stringify({ 
        number: invoiceNumber,
        counter,
        dateCode
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
    
  } catch (error) {
    console.error('Error generating invoice number:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal Server Error', 
        message: 'Failed to generate invoice number' 
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
}

/**
 * Handle analytics (placeholder)
 */
async function handleAnalytics(request, env, corsHeaders) {
  try {
    const analyticsData = await request.json();
    
    // In a real implementation, you would:
    // 1. Validate the analytics data
    // 2. Store it in a database or analytics service
    // 3. Process it for insights
    
    console.log('Analytics data received:', analyticsData);
    
    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Analytics data recorded'
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
    
  } catch (error) {
    console.error('Error handling analytics:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal Server Error', 
        message: 'Failed to process analytics' 
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
}

/**
 * Generate unique invoice ID
 */
function generateInvoiceId() {
  return 'inv_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 9);
}