import { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import AuthPage from "./pages/AuthPage";
import DashboardPage from "./pages/DashboardPage";
import SitesPage from "./pages/SitesPage";
import ReportsPage from "./pages/ReportsPage";
import SettingsPage from "./pages/SettingsPage";
import BottomNav from "./components/BottomNav";

type Tab = "dashboard" | "sites" | "reports" | "settings";

function AppInner() {
  const { user, loading } = useAuth();
  const [tab, setTab] = useState<Tab>("dashboard");

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
          <p className="text-gray-600 text-sm">Loading…</p>
        </div>
      </div>
    );
  }

  if (!user) return <AuthPage />;

  return (
    <div className="bg-gray-950 min-h-screen">
      {tab === "dashboard" && <DashboardPage onGoToSites={() => setTab("sites")} />}
      {tab === "sites" && <SitesPage />}
      {tab === "reports" && <ReportsPage />}
      {tab === "settings" && <SettingsPage />}
      <BottomNav active={tab} onChange={setTab} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}
