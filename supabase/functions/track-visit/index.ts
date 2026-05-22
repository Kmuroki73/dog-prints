import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json();
    const { tracking_key, url, path, domain, title, duration_seconds, started_at, ended_at } = body;

    if (!tracking_key || !url || duration_seconds === undefined) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Look up site by tracking_key
    const { data: site, error: siteError } = await supabase
      .from("tracker_sites")
      .select("id, user_id")
      .eq("tracking_key", tracking_key)
      .maybeSingle();

    if (siteError || !site) {
      return new Response(JSON.stringify({ error: "Invalid tracking key" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { error: insertError } = await supabase.from("page_visits").insert({
      site_id: site.id,
      user_id: site.user_id,
      url,
      path: path || new URL(url).pathname,
      domain: domain || new URL(url).hostname,
      title: title || "",
      duration_seconds: Math.max(0, Math.round(duration_seconds)),
      started_at: started_at || new Date().toISOString(),
      ended_at: ended_at || new Date().toISOString(),
    });

    if (insertError) {
      return new Response(JSON.stringify({ error: insertError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
