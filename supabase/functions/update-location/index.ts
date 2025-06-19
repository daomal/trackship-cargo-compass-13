
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { 
      status: 405, 
      headers: corsHeaders 
    });
  }

  try {
    const { shipmentId, lat, lng } = await req.json();
    
    if (!shipmentId || lat === undefined || lng === undefined) {
      return new Response('Data tidak lengkap', { 
        status: 400, 
        headers: corsHeaders 
      });
    }
    
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { error } = await supabaseAdmin
      .from('shipments')
      .update({ 
        current_lat: lat, 
        current_lng: lng,
        updated_at: new Date().toISOString()
      })
      .eq('id', shipmentId);

    if (error) {
      console.error('Database update error:', error);
      throw error;
    }

    console.log(`Location updated for shipment ${shipmentId}: ${lat}, ${lng}`);

    return new Response(
      JSON.stringify({ message: 'Lokasi diperbarui', timestamp: new Date().toISOString() }), 
      { 
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (err) {
    console.error('Error in update-location function:', err);
    return new Response(
      JSON.stringify({ error: String(err?.message ?? err) }), 
      { 
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});
