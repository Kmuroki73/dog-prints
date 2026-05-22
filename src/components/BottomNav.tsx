import { LayoutDashboard, Globe, BarChart2, Settings } from "lucide-react";

type Tab = "dashboard" | "sites" | "reports" | "settings";

type Props = {
  active: Tab;
  onChange: (tab: Tab) => void;
};

const tabs: { id: Tab; label: string; Icon: React.ElementType }[] = [
  { id: "dashboard", label: "Home", Icon: LayoutDashboard },
  { id: "sites", label: "Sites", Icon: Globe },
  { id: "reports", label: "Reports", Icon: BarChart2 },
  { id: "settings", label: "Settings", Icon: Settings },
];

export default function BottomNav({ active, onChange }: Props) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 z-50">
      <div className="flex">
        {tabs.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => onChange(id)}
            className={`flex-1 flex flex-col items-center gap-1 py-3 transition-colors ${
              active === id ? "text-emerald-400" : "text-gray-500 hover:text-gray-300"
            }`}
          >
            <Icon className="w-5 h-5" strokeWidth={active === id ? 2.5 : 2} />
            <span className="text-xs font-medium">{label}</span>
          </button>
        ))}
      </div>
      {/* iOS safe area */}
      <div className="h-safe-area-inset-bottom bg-gray-900" />
    </nav>
  );
}
