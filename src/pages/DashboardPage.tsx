import { useEffect, useState } from "react";
import { supabase, PageVisit, TrackerSite } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { formatDuration, formatHours, startOfDay, startOfWeek } from "../lib/utils";
import { Clock, TrendingUp, Globe, Flame, ChevronRight, Plus } from "lucide-react";

type Props = {
  onGoToSites: () => void;
};

type DomainStat = {
  domain: string;
  total_seconds: number;
  visits: number;
};

type StatCardProps = {
  label: string;
  value: string;
  sub: string;
  Icon: React.ElementType;
  color: string;
};

function StatCard({ label, value, sub, Icon, color }: StatCardProps) {
  return (
    <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${color}`}>
        <Icon className="w-4 h-4 text-white" />
      </div>
      <p className="text-2xl font-bold text-white tracking-tight">{value}</p>
      <p className="text-xs text-gray-400 mt-0.5">{label}</p>
      <p className="text-xs text-gray-600 mt-1">{sub}</p>
    </div>
  );
}

export default function DashboardPage({ onGoToSites }: Props) {
  const { user } = useAuth();
  const [visits, setVisits] = useState<PageVisit[]>([]);
  const [sites, setSites] = useState<TrackerSite[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const weekAgo = startOfWeek(new Date()).toISOString();

    Promise.all([
      supabase
        .from("page_visits")
        .select("*")
        .eq("user_id", user.id)
        .gte("started_at", weekAgo)
        .order("started_at", { ascending: false }),
      supabase.from("tracker_sites").select("*").eq("user_id", user.id),
    ]).then(([visitsRes, sitesRes]) => {
      setVisits(visitsRes.data ?? []);
      setSites(sitesRes.data ?? []);
      setLoading(false);
    });
  }, [user]);

  const todayStart = startOfDay(new Date()).toISOString();
  const todayVisits = visits.filter((v) => v.started_at >= todayStart);
  const todaySeconds = todayVisits.reduce((a, v) => a + v.duration_seconds, 0);
  const weekSeconds = visits.reduce((a, v) => a + v.duration_seconds, 0);

  // Top domains this week
  const domainMap: Record<string, DomainStat> = {};
  for (const v of visits) {
    const d = v.domain || "unknown";
    if (!domainMap[d]) domainMap[d] = { domain: d, total_seconds: 0, visits: 0 };
    domainMap[d].total_seconds += v.duration_seconds;
    domainMap[d].visits += 1;
  }
  const topDomains = Object.values(domainMap)
    .sort((a, b) => b.total_seconds - a.total_seconds)
    .slice(0, 6);

  const maxSeconds = topDomains[0]?.total_seconds ?? 1;

  // Recent visits
  const recentVisits = visits.slice(0, 8);

  const firstName = user?.user_metadata?.full_name?.split(" ")[0] ?? "there";

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
      <div className="px-5 pt-12 pb-6">
        <p className="text-gray-400 text-sm">Good {getGreeting()},</p>
        <h1 className="text-white text-2xl font-bold tracking-tight">{firstName}</h1>
      </div>

      {/* No sites state */}
      {sites.length === 0 && (
        <div className="mx-5 mb-6 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-5">
          <p className="text-emerald-400 font-semibold text-sm mb-1">Get started</p>
          <p className="text-gray-400 text-xs mb-3">
            Add a site and paste the tracking snippet to start recording your time.
          </p>
          <button
            onClick={onGoToSites}
            className="flex items-center gap-1.5 bg-emerald-500 text-white text-xs font-semibold px-4 py-2 rounded-lg"
          >
            <Plus className="w-3.5 h-3.5" /> Add your first site
          </button>
        </div>
      )}

      {/* Stats grid */}
      <div className="px-5 grid grid-cols-2 gap-3 mb-6">
        <StatCard
          label="Today"
          value={formatHours(todaySeconds)}
          sub={`${todayVisits.length} page visits`}
          Icon={Clock}
          color="bg-emerald-500"
        />
        <StatCard
          label="This week"
          value={formatHours(weekSeconds)}
          sub={`${visits.length} total visits`}
          Icon={TrendingUp}
          color="bg-blue-500"
        />
        <StatCard
          label="Sites tracked"
          value={String(sites.length)}
          sub="active trackers"
          Icon={Globe}
          color="bg-amber-500"
        />
        <StatCard
          label="Top streak"
          value={getStreakDays(visits) + "d"}
          sub="days active"
          Icon={Flame}
          color="bg-rose-500"
        />
      </div>

      {/* Top domains */}
      {topDomains.length > 0 && (
        <section className="px-5 mb-6">
          <h2 className="text-white font-semibold text-sm mb-3">Top sites this week</h2>
          <div className="bg-gray-900 rounded-2xl border border-gray-800 divide-y divide-gray-800">
            {topDomains.map((d) => (
              <div key={d.domain} className="px-4 py-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-white text-sm font-medium truncate max-w-[180px]">{d.domain}</span>
                  <span className="text-gray-400 text-xs ml-2 shrink-0">{formatDuration(d.total_seconds)}</span>
                </div>
                <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all"
                    style={{ width: `${(d.total_seconds / maxSeconds) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recent activity */}
      {recentVisits.length > 0 && (
        <section className="px-5">
          <h2 className="text-white font-semibold text-sm mb-3">Recent activity</h2>
          <div className="bg-gray-900 rounded-2xl border border-gray-800 divide-y divide-gray-800">
            {recentVisits.map((v) => (
              <div key={v.id} className="px-4 py-3 flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center shrink-0">
                  <Globe className="w-4 h-4 text-gray-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{v.title || v.path}</p>
                  <p className="text-gray-500 text-xs truncate">{v.domain}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-emerald-400 text-sm font-semibold">{formatDuration(v.duration_seconds)}</p>
                  <p className="text-gray-600 text-xs">{timeAgo(v.started_at)}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {visits.length === 0 && sites.length > 0 && (
        <div className="px-5 text-center py-12">
          <div className="w-12 h-12 bg-gray-900 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Clock className="w-6 h-6 text-gray-600" />
          </div>
          <p className="text-gray-400 text-sm">No visits recorded yet.</p>
          <p className="text-gray-600 text-xs mt-1">Make sure the snippet is installed on your site.</p>
        </div>
      )}
    </div>
  );
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function getStreakDays(visits: PageVisit[]): number {
  if (visits.length === 0) return 0;
  const days = new Set(visits.map((v) => v.started_at.slice(0, 10)));
  let streak = 0;
  const d = new Date();
  while (days.has(d.toISOString().slice(0, 10))) {
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}
