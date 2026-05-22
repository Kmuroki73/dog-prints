import { useAuth } from "../context/AuthContext";
import { User, Mail, LogOut, Shield, Clock, Info } from "lucide-react";

export default function SettingsPage() {
  const { user, signOut } = useAuth();

  const name = user?.user_metadata?.full_name ?? "—";
  const email = user?.email ?? "—";

  return (
    <div className="min-h-screen bg-gray-950 pb-24">
      <div className="px-5 pt-12 pb-6">
        <h1 className="text-white text-2xl font-bold tracking-tight">Settings</h1>
      </div>

      {/* Profile */}
      <section className="px-5 mb-5">
        <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2 px-1">Account</p>
        <div className="bg-gray-900 border border-gray-800 rounded-2xl divide-y divide-gray-800">
          <div className="px-4 py-3.5 flex items-center gap-3">
            <div className="w-9 h-9 bg-emerald-500/10 rounded-xl flex items-center justify-center">
              <User className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Name</p>
              <p className="text-white text-sm font-medium">{name}</p>
            </div>
          </div>
          <div className="px-4 py-3.5 flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-500/10 rounded-xl flex items-center justify-center">
              <Mail className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Email</p>
              <p className="text-white text-sm font-medium">{email}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Tracking info */}
      <section className="px-5 mb-5">
        <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2 px-1">How tracking works</p>
        <div className="bg-gray-900 border border-gray-800 rounded-2xl divide-y divide-gray-800">
          {[
            {
              Icon: Clock,
              color: "text-amber-400",
              bg: "bg-amber-500/10",
              title: "Active-tab time only",
              desc: "We only count time when the tab is in focus. Backgrounded tabs are paused.",
            },
            {
              Icon: Shield,
              color: "text-emerald-400",
              bg: "bg-emerald-500/10",
              title: "Private by default",
              desc: "Only you can see your data. Each site uses a unique anonymous tracking key.",
            },
            {
              Icon: Info,
              color: "text-blue-400",
              bg: "bg-blue-500/10",
              title: "30-second heartbeats",
              desc: "Long sessions are flushed every 30s so data is never lost on crash.",
            },
          ].map(({ Icon, color, bg, title, desc }) => (
            <div key={title} className="px-4 py-3.5 flex items-start gap-3">
              <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center shrink-0 mt-0.5`}>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              <div>
                <p className="text-white text-sm font-medium">{title}</p>
                <p className="text-gray-500 text-xs mt-0.5 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Sign out */}
      <section className="px-5">
        <button
          onClick={signOut}
          className="w-full bg-gray-900 border border-gray-800 hover:border-red-500/30 hover:bg-red-500/5 rounded-2xl px-4 py-4 flex items-center gap-3 transition-all"
        >
          <div className="w-9 h-9 bg-red-500/10 rounded-xl flex items-center justify-center">
            <LogOut className="w-4 h-4 text-red-400" />
          </div>
          <span className="text-red-400 font-semibold text-sm">Sign out</span>
        </button>
      </section>
    </div>
  );
}
