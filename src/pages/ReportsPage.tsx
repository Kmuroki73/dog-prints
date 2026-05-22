import { useEffect, useState } from "react";
import { supabase, PageVisit, TrackerSite } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { formatDuration, formatHours, startOfDay, startOfWeek } from "../lib/utils";
import { BarChart2, Download, Calendar, Globe, Clock, TrendingUp } from "lucide-react";

type Range = "today" | "week" | "month" | "all";

type DomainStat = {
  domain: string;
  total_seconds: number;
  visits: number;
  pages: Set<string>;
};

type PageStat = {
  url: string;
  title: string;
  total_seconds: number;
  visits: number;
};

export default function ReportsPage() {
  const { user } = useAuth();
  const [visits, setVisits] = useState<PageVisit[]>([]);
  const [sites, setSites] = useState<TrackerSite[]>([]);
  const [range, setRange] = useState<Range>("week");
  const [selectedSite, setSelectedSite] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"domains" | "pages">("domains");

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from("page_visits").select("*").eq("user_id", user.id).order("started_at", { ascending: false }),
      supabase.from("tracker_sites").select("*").eq("user_id", user.id),
    ]).then(([visitsRes, sitesRes]) => {
      setVisits(visitsRes.data ?? []);
      setSites(sitesRes.data ?? []);
      setLoading(false);
    });
  }, [user]);

  const rangeStart = getRangeStart(range);

  const filtered = visits.filter((v) => {
    const inRange = v.started_at >= rangeStart;
    const inSite = selectedSite === "all" || v.site_id === selectedSite;
    return inRange && inSite;
  });

  const totalSeconds = filtered.reduce((a, v) => a + v.duration_seconds, 0);

  // Domain stats
  const domainMap: Record<string, DomainStat> = {};
  for (const v of filtered) {
    const d = v.domain || "unknown";
    if (!domainMap[d]) domainMap[d] = { domain: d, total_seconds: 0, visits: 0, pages: new Set() };
    domainMap[d].total_seconds += v.duration_seconds;
    domainMap[d].visits += 1;
    domainMap[d].pages.add(v.path);
  }
  const topDomains = Object.values(domainMap).sort((a, b) => b.total_seconds - a.total_seconds);

  // Page stats
  const pageMap: Record<string, PageStat> = {};
  for (const v of filtered) {
    const key = v.url;
    if (!pageMap[key]) pageMap[key] = { url: v.url, title: v.title || v.path, total_seconds: 0, visits: 0 };
    pageMap[key].total_seconds += v.duration_seconds;
    pageMap[key].visits += 1;
  }
  const topPages = Object.values(pageMap).sort((a, b) => b.total_seconds - a.total_seconds).slice(0, 20);

  const maxSeconds = (activeTab === "domains" ? topDomains[0]?.total_seconds : topPages[0]?.total_seconds) ?? 1;

  const exportCSV = () => {
    const rows = [
      ["URL", "Title", "Domain", "Duration (seconds)", "Date"],
      ...filtered.map((v) => [v.url, v.title, v.domain, String(v.duration_seconds), v.started_at.slice(0, 10)]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dogprints-report-${range}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
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
      {/* Header */}
      <div className="px-5 pt-12 pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-white text-2xl font-bold tracking-tight">Reports</h1>
          <p className="text-gray-400 text-sm mt-0.5">Analyze your browsing time</p>
        </div>
        <button
          onClick={exportCSV}
          disabled={filtered.length === 0}
          className="flex items-center gap-1.5 bg-gray-800 hover:bg-gray-700 disabled:opacity-40 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          CSV
        </button>
      </div>

      {/* Filters */}
      <div className="px-5 mb-4 space-y-2">
        {/* Range pills */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {(["today", "week", "month", "all"] as Range[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`shrink-0 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                range === r
                  ? "bg-emerald-500 text-white"
                  : "bg-gray-900 border border-gray-800 text-gray-400 hover:text-white"
              }`}
            >
              {r === "today" ? "Today" : r === "week" ? "This week" : r === "month" ? "This month" : "All time"}
            </button>
          ))}
        </div>

        {/* Site filter */}
        {sites.length > 1 && (
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setSelectedSite("all")}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedSite === "all"
                  ? "bg-gray-700 text-white"
                  : "bg-gray-900 border border-gray-800 text-gray-500"
              }`}
            >
              All sites
            </button>
            {sites.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedSite(s.id)}
                className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  selectedSite === s.id
                    ? "bg-gray-700 text-white"
                    : "bg-gray-900 border border-gray-800 text-gray-500"
                }`}
              >
                {s.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Summary cards */}
      <div className="px-5 grid grid-cols-3 gap-2 mb-5">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-3 text-center">
          <Clock className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
          <p className="text-white font-bold text-base">{formatHours(totalSeconds)}</p>
          <p className="text-gray-500 text-xs">Total time</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-3 text-center">
          <Globe className="w-4 h-4 text-blue-400 mx-auto mb-1" />
          <p className="text-white font-bold text-base">{topDomains.length}</p>
          <p className="text-gray-500 text-xs">Domains</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-3 text-center">
          <TrendingUp className="w-4 h-4 text-amber-400 mx-auto mb-1" />
          <p className="text-white font-bold text-base">{filtered.length}</p>
          <p className="text-gray-500 text-xs">Visits</p>
        </div>
      </div>

      {/* Tab toggle */}
      <div className="px-5 mb-4">
        <div className="flex bg-gray-900 border border-gray-800 rounded-xl p-1">
          <button
            onClick={() => setActiveTab("domains")}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === "domains" ? "bg-gray-700 text-white" : "text-gray-500"
            }`}
          >
            By domain
          </button>
          <button
            onClick={() => setActiveTab("pages")}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === "pages" ? "bg-gray-700 text-white" : "text-gray-500"
            }`}
          >
            By page
          </button>
        </div>
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="px-5 text-center py-12">
          <BarChart2 className="w-10 h-10 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">No data for this period.</p>
        </div>
      ) : (
        <div className="px-5">
          {activeTab === "domains" ? (
            <div className="bg-gray-900 border border-gray-800 rounded-2xl divide-y divide-gray-800">
              {topDomains.map((d) => (
                <div key={d.domain} className="px-4 py-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{d.domain}</p>
                      <p className="text-gray-500 text-xs">{d.visits} visits · {d.pages.size} pages</p>
                    </div>
                    <div className="text-right ml-2 shrink-0">
                      <p className="text-emerald-400 text-sm font-semibold">{formatDuration(d.total_seconds)}</p>
                      <p className="text-gray-600 text-xs">{((d.total_seconds / totalSeconds) * 100).toFixed(0)}%</p>
                    </div>
                  </div>
                  <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${(d.total_seconds / maxSeconds) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-gray-900 border border-gray-800 rounded-2xl divide-y divide-gray-800">
              {topPages.map((p) => (
                <div key={p.url} className="px-4 py-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{p.title}</p>
                      <p className="text-gray-500 text-xs truncate">{p.url}</p>
                    </div>
                    <div className="text-right ml-2 shrink-0">
                      <p className="text-emerald-400 text-sm font-semibold">{formatDuration(p.total_seconds)}</p>
                      <p className="text-gray-600 text-xs">{p.visits}x</p>
                    </div>
                  </div>
                  <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${(p.total_seconds / maxSeconds) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function getRangeStart(range: Range): string {
  const now = new Date();
  if (range === "today") return startOfDay(now).toISOString();
  if (range === "week") return startOfWeek(now).toISOString();
  if (range === "month") {
    const d = new Date(now.getFullYear(), now.getMonth(), 1);
    return d.toISOString();
  }
  return new Date(0).toISOString();
}
