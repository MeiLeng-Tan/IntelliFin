import { useEffect, useState } from "react";
import { cn } from "../utils/cn";
import { AnalyticsLayout } from "../features/analytics/AnalyticsLayout";
import { PortfolioLayout } from "../features/portfolio/PortfolioLayout";

interface LayoutProps {
    onLogout: () => void;
}

// Declare views for router setup
type ActiveView = "dashboard" | "portfolio" | "analytics" | "settings";

export const Layout: React.FC<LayoutProps> = ({ onLogout }) => {
    // State to track which view is currently selected
    const [activeView, setActiveView] = useState<ActiveView>("dashboard");
    
    const renderView = () => {
        switch (activeView) {
            case "dashboard":
                return <div className="text_xl font-semibold">Dashboard Content View</div>;
            case "portfolio":
                return <PortfolioLayout />;
            case "analytics":
                return <AnalyticsLayout />;
            case "settings":
                return <div className="text_xl font-semibold">Settings View</div>;
            default:
                return <div className="text_xl font-semibold">Dashboard Content View</div>
        }
    };

    const navigationItems = [
        { id: 'dashboard' as const, label: 'Dashboard', icon: '📊' },
        { id: "portfolio" as const, label: "Portfolio", icon: "💼" },
        { id: "analytics" as const, label: "Analytics", icon: "📈" },
  ];

    return(
        <div className="flex flex-col h-screen w-screen bg-gray-50 text-gray-900 font-sans overflow-hidden">
            {/* Header Bar */}
            <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 z-10 shadow-sm">
                <div className="font-bold text-xl tracking-tight text-indigo-600">
                    IntelliFin
                </div>
                {/*Search bar */}
                <div className="w-80">
                    <input
                        type="text"
                        placeholder="Search assets, tools..."
                        className={cn(
                            "w-full bg-gray-100 text-sm text-gray-700 px-4 py-2 rounded-lg border border-transparent transition-all",
                            "focus:outline-none focus:bg-white focus:border-indigo-500" 
                        )}
                    />
                </div>
                
                {/*User profile thumbnails */}
                <div className="flex items-center gap-4">
                    <div className="w-9 h-9 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-semibold text-sm border border-indigo-100">
                        User
                    </div>
                    {/*Logout */}
                    <button
                        onClick={onLogout}
                        className="text-xs font-medium text-gray-400 hover:text-rose-600 transition-colors cursor-pointer"
                    >
                        Logout
                    </button>
                </div>
            </header>
            {/*Frame Layout */}
            <div className="flex flex-1 overflow-hidden">
                {/* Navigation Sidebar */}
                <aside className="w-64 bg-white border-r border-gray-200 p-4 flex flex-col justify-between">
                    <nav className="flex flex-col gap-1">
                        {navigationItems.map((item) => {
                            const isActive = activeView === item.id;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveView(item.id)}
                                    className={cn(
                                        "w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all flex items-center gap-2",
                                        isActive
                                            ? "bg-indigo-50 text-indigo-600 font-semibold"
                                            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                    )}
                                >
                                    <span>{item.icon}</span>
                                    {item.label}
                                </button>
                           );
                        })}
                    </nav>

                    {/*Settings button - bottom sidebar */}
                    <button
                        onClick={() => setActiveView("settings")}
                        className={cn(
                            "w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all flex items-center gapr-2",
                            activeView === "settings"
                                ? "bg-indigo-50 text-indigo-600 font-semibold"
                                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                            )}
                    >
                        <span>⚙️</span> Settings
                    </button>
                </aside>
                {/*Main display */}
                <main className="flex-1 p-8 overflow-y-auto">
                    <div className="max-w-6xl mx-auto">
                        {renderView()}
                    </div>
                </main>
            </div>

        </div>
    )
}