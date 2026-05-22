import { useEffect, useState } from "react";
import { supabase, TrackerSite } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { Plus, Globe, Copy, Check, Trash2, X, ChevronDown, ChevronUp } from "lucide-react";

export default function SitesPage() {
  const { user } = useAuth();
  const [sites, setSites] = useState<TrackerSite[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDomain, setNewDomain] = useState("");
  const [saving, setSaving] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("tracker_sites")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setSites(data ?? []);
        setLoading(false);
      });
  }, [user]);

  const addSite = async () => {
    if (!newName.trim() || !newDomain.trim() || !user) return;
    setSaving(true);
    const { data, error } = await supabase
      .from("tracker_sites")
      .insert({ name: newName.trim(), domain: newDomain.trim(), user_id: user.id })
      .select()
      .single();
    if (!error && data) {
      setSites([data, ...sites]);
      setNewName("");
      setNewDomain("");
      setShowAdd(false);
      setExpandedId(data.id);
    }
    setSaving(false);
  };

  const deleteSite = async (id: string) => {
    await supabase.from("tracker_sites").delete().eq("id", id);
    setSites(sites.filter((s) => s.id !== id));
  };

  const copySnippet = (site: TrackerSite) => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const snippet = buildSnippet(site.tracking_key, supabaseUrl);
    navigator.clipboard.writeText(snippet);
    setCopiedId(site.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-950">
        <div className="w-6 h-6 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 pb-24">
      <div className="px-5 pt-12 pb-6 flex items-center justify-between">
        <div>
          <h1 className="text-white text-2xl font-bold tracking-tight">Sites</h1>
          <p className="text-gray-400 text-sm mt-0.5">Manage your tracked sites</p>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="w-10 h-10 bg-emerald-500 hover:bg-emerald-400 rounded-xl flex items-center justify-center transition-colors active:scale-95"
        >
          {showAdd ? <X className="w-5 h-5 text-white" /> : <Plus className="w-5 h-5 text-white" />}
        </button>
      </div>

      {/* Add site form */}
      {showAdd && (
        <div className="mx-5 mb-5 bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <h3 className="text-white font-semibold text-sm mb-4">New site</h3>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Site name (e.g. My Blog)"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
            <input
              type="text"
              placeholder="Domain (e.g. myblog.com)"
              value={newDomain}
              onChange={(e) => setNewDomain(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
            <button
              onClick={addSite}
              disabled={saving || !newName.trim() || !newDomain.trim()}
              className="w-full bg-emerald-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                "Add site"
              )}
            </button>
          </div>
        </div>
      )}

      {/* Sites list */}
      {sites.length === 0 ? (
        <div className="px-5 text-center py-16">
          <div className="w-14 h-14 bg-gray-900 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Globe className="w-7 h-7 text-gray-600" />
          </div>
          <p className="text-gray-300 font-semibold">No sites yet</p>
          <p className="text-gray-500 text-sm mt-1">Add a site to get your tracking snippet.</p>
        </div>
      ) : (
        <div className="px-5 space-y-3">
          {sites.map((site) => (
            <div key={site.id} className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
              <div className="px-4 py-4 flex items-center gap-3">
                <div className="w-9 h-9 bg-gray-800 rounded-xl flex items-center justify-center shrink-0">
                  <Globe className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-sm">{site.name}</p>
                  <p className="text-gray-500 text-xs truncate">{site.domain}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setExpandedId(expandedId === site.id ? null : site.id)}
                    className="text-gray-400 hover:text-white transition-colors p-1"
                  >
                    {expandedId === site.id ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => deleteSite(site.id)}
                    className="text-gray-600 hover:text-red-400 transition-colors p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {expandedId === site.id && (
                <div className="px-4 pb-4 border-t border-gray-800 pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-gray-400 text-xs font-medium">Tracking snippet</p>
                    <button
                      onClick={() => copySnippet(site)}
                      className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
                    >
                      {copiedId === site.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-gray-300" />
                          <span className="text-gray-300">Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="bg-gray-950 rounded-xl p-3 overflow-x-auto">
                    <pre className="text-xs text-gray-400 whitespace-pre-wrap break-all leading-relaxed">
                      {buildSnippetPreview(site.tracking_key)}
                    </pre>
                  </div>
                  <p className="text-gray-600 text-xs mt-2">
                    Paste this snippet before the &lt;/body&gt; tag on your site.
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function buildSnippet(trackingKey: string, supabaseUrl: string): string {
  return `<script>
(function(){
  var TRACKING_KEY="${trackingKey}";
  var ENDPOINT="${supabaseUrl}/functions/v1/track-visit";
  var start=Date.now(),active=0,lastActive=Date.now(),hidden=false;
  var title=document.title,url=location.href,path=location.pathname,domain=location.hostname;
  function tick(){if(!hidden)active+=Date.now()-lastActive;lastActive=Date.now();}
  document.addEventListener("visibilitychange",function(){
    if(document.hidden){tick();hidden=true;}
    else{lastActive=Date.now();hidden=false;}
  });
  function send(){
    tick();
    if(active<2000)return;
    var body=JSON.stringify({
      tracking_key:TRACKING_KEY,url:url,path:path,domain:domain,
      title:title,duration_seconds:Math.round(active/1000),
      started_at:new Date(start).toISOString(),ended_at:new Date().toISOString()
    });
    navigator.sendBeacon?navigator.sendBeacon(ENDPOINT,new Blob([body],{type:"application/json"})):fetch(ENDPOINT,{method:"POST",body:body,keepalive:true,headers:{"Content-Type":"application/json"}});
  }
  window.addEventListener("beforeunload",send);
  setInterval(function(){tick();send();start=Date.now();active=0;lastActive=Date.now();},30000);
})();
</script>`;
}

function buildSnippetPreview(trackingKey: string): string {
  return `<script>
(function(){
  var TRACKING_KEY="${trackingKey}";
  /* Dog Prints tracker — tracks active tab time only */
  ...paste full snippet from Copy button...
})();
</script>`;
}
