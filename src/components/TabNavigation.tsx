import { PlusCircle, Calendar, MessageSquare, TrendingUp, Store } from "lucide-react";

export type TabType = "nueva" | "agenda" | "recordatorios" | "estado" | "negocio";

interface TabNavigationProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

export default function TabNavigation({ activeTab, setActiveTab }: TabNavigationProps) {
  const tabs = [
    {
      id: "nueva" as TabType,
      label: "Nueva",
      icon: PlusCircle,
    },
    {
      id: "agenda" as TabType,
      label: "Agenda",
      icon: Calendar,
    },
    {
      id: "recordatorios" as TabType,
      label: "Recordatorios",
      icon: MessageSquare,
    },
    {
      id: "estado" as TabType,
      label: "Estado",
      icon: TrendingUp,
    },
    {
      id: "negocio" as TabType,
      label: "Negocio",
      icon: Store,
    },
  ];

  return (
    <nav className="bg-white border-t border-slate-200 py-2 sticky bottom-0 z-50 shadow-md">
      <div className="max-w-md mx-auto flex items-center justify-around px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex flex-col items-center justify-center py-1 px-3 min-w-[70px] relative transition-all duration-200 focus:outline-none select-none"
            >
              {/* Active Pill Container around Icon */}
              <div
                className={`w-14 h-8 rounded-full flex items-center justify-center transition-all duration-250 ${
                  isActive ? "bg-[#d3e4fe] text-[#004ac6]" : "text-slate-500 hover:bg-slate-50"
                }`}
              >
                <Icon size={20} className={isActive ? "scale-110" : "scale-100"} />
              </div>

              {/* Text label */}
              <span
                className={`text-[11px] font-medium mt-1 tracking-wide transition-colors ${
                  isActive ? "text-[#004ac6] font-semibold" : "text-slate-500"
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
