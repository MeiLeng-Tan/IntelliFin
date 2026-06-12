import { useEffect, useState } from "react";
import { cn } from "../utils/cn";
import { DashboardLayout } from "../features/dashboard/DashboardLayout";
import { AnalyticsLayout } from "../features/analytics/AnalyticsLayout";
import { PortfolioLayout } from "../features/portfolio/PortfolioLayout";
import { ChatWidget } from "../features/chat/ChatWidget";

interface LayoutProps {
    onLogout: () => void;
}

// Declare views for router setup
type ActiveView = "dashboard" | "portfolio" | "analytics" | "settings";

interface LocalUser {
    firstName: string;
    lastName: string;
    email: string;
}
export const Layout: React.FC<LayoutProps> = ({ onLogout }) => {
    // State to track which view is currently selected
    const [activeView, setActiveView] = useState<ActiveView>("dashboard");
    const [profile, setProfile] = useState<LocalUser | null>(null)

    // Retrieve user profile from localStorage
    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            try {
                const parsedUser = JSON.parse(storedUser);
                const localUser: LocalUser = {
                    firstName: parsedUser.first_name || "User",
                    lastName: parsedUser.last_name || "",
                    email: parsedUser.email || ""
                };
                setProfile(localUser);
            } catch (err) {
                console.error("Error parsing user from localStorage", err);
                setProfile({
                    firstName: "",
                    lastName: "",
                    email: ""
                });
            }
        }
    }, []);

    // Generate initials for avatar badge 
    const getInitials = () => {
        if (!profile) return "U";
        const f = profile.firstName?.[0] || "";
        const l = profile.lastName?.[0] || "";
        return (f+l).toUpperCase() || "U";
    };
    
    const renderView = () => {
        switch (activeView) {
            case "dashboard":
                return <DashboardLayout />;
            case "portfolio":
                return <PortfolioLayout />;
            case "analytics":
                return <AnalyticsLayout />;
            case "settings":
                return (
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Settings</h2>
                        <p className="text-gray-500 text-sm">Configure your personal preferences and system syncs.</p>
                    </div>
                );
            default:
                return <DashboardLayout />
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
                <div className="flex items-center gap-3">
                    <div className="font-bold text-xl tracking-tight text-indigo-600">
                        IntelliFin
                    </div>
                </div>
                {/* *Actions: Notification bell indicator 
                <div className="flex items-center gap-2">
                    <button className="p-2 text-gray-400 hover:text-gray-600 rounded-xl relative transition-colors cursor-pointer">
                        <span className="text-lg">🔔</span>
                        <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white"></span>
                    </button>
                </div> */}
            </header>
            {/* Main application frame */}
            <div className="flex flex-1 overflow-hidden">
                {/* Navigation Sidebar */}
                <aside className="w-64 bg-white border-r border-gray-200 p-4 flex flex-col justify-between">
                    <div className="space-y-6">
                        <div>
                            <p className="px-4 text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                                Workspace
                            </p>
                            <nav className="flex flex-col gap-1">
                                {navigationItems.map((item) => {
                                    const isActive = activeView === item.id;
                                    return (
                                        <button
                                            key={item.id}
                                            onClick={() => setActiveView(item.id)}
                                            className={cn(
                                                "w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all flex items-center justify-between group cursor-pointer",
                                                isActive
                                                    ? "bg-indigo-50 text-indigo-600 font-semibold"
                                                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                            )}
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className={cn(
                                                    "transition-transform group-hover:scale-110",
                                                    isActive ? "text-indigo-600" : "text-gray-400"
                                                )}>
                                                    {item.icon}
                                                </span>
                                                {item.label}
                                            </div>
                                            
                                            {/* AI Activity alert badge
                                            {item.id === 'dashboard' && (
                                                <span className="h-2 w-2 rounded-full bg-indigo-600 ring-4 ring-indigo-50 animate-pulse"></span>
                                            )} */}
                                        </button>
                                    );
                                })}
                            </nav>
                        </div>
                    </div>

                    {/*Settings button - bottom sidebar */}
                    <div className="space-y-4 pt-4 border-t border-gray-100">
                        {/** Setting Tab */}
                        <button
                            onClick={() => setActiveView("settings")}
                            className={cn(
                                "w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all flex items-center gap-3 group cursor-pointer",
                                activeView === "settings"
                                    ? "bg-indigo-50 text-indigo-600 font-semibold"
                                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                            )}
                        >
                            <span className="text-gray-400 group-hover:rotate-45 transition-transform duration-300">⚙️</span> 
                            Settings
                        </button>

                        {/** User profile */}
                        <div className="flex items-center justify-between p-2 rounded-xl bg-gray-50 border border-gray-100">
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div className="w-8 h-8 shrink-0 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                                    {getInitials()}
                                </div>
                                <div className="flex flex-col overflow-hidden">
                                    <span className="text-xs font-semibold text-gray-700 leading-tight truncate">
                                        {profile ? `${profile.firstName} ${profile.lastName}` : "Loading..."}
                                    </span>
                                    <span className="text-[10px] text-gray-400 truncate">
                                        {profile?.email || "Premium Tier"}
                                    </span>
                                </div>
                            </div>
                            <button 
                                onClick={onLogout}
                                className="text-gray-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-white transition-all cursor-pointer shrink-0 ml-1"
                                title="Logout"
                            >
                                ➜]
                            </button>
                        </div>
                    </div>
                </aside>
                {/*Main display */}
                <main className="flex-1 p-8 overflow-y-auto bg-gray-50">
                    <div className="max-w-6xl mx-auto">
                        {renderView()}
                    </div>
                </main>
            </div>

            {/** Floating chat widget */}
            <ChatWidget />

        </div>
    );
};