import { useState } from "react";

// Declare views for router setup
type ActiveView = "dashboard" | "portfolio" | "analytics" | "settings";

export const Layout: React.FC = () => {
    // State to track which view is currently selected
    const [activeView, setActiveView] = useState<ActiveView>("dashboard");

    const renderView = () => {
        switch (activeView) {
            case "dashboard":
                break;
            case "portfolio":
                break;
            case "analytics":
                break;
            case "settings":
                break;
            default:
                return <div className="text_xl font-semibold">Dashboard Content View</div>
        }
    };

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
                        className="w-full bg-gray-100 text-sm text-gray-700 px-4 py-2 rounded-lg border border-transparent focus:outline-none focus:bg-white focus:border-indigo-500 transition-all"
                    />
                </div>
                {/*User thumbnails */}
                <div className="w-9 h-9 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-semibold text-sm border border-indigo-100">
                    User
                </div>
            </header>
            {/*Frame Layout */}
            <div className="flex flex-1 overflow-hidden">
                {/* Navigation Sidebar */}
                <aside className="w-64 bg-white border-r border-gray-200 p-4 flex flex-col justify-between">
                    <nav className="flex flex-col gap-1">
                        {/*Dashboard button */}
                        <button
                            onClick={() => setActiveView("dashboard")}
                            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all 
                                ${activeView === "dashboard"
                                    ? "bg-indigo-50 text-indigo-600 font-semibold"
                                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                }`}
                        >
                            Dashboard
                        </button>
                        {/*Portfolio button */}
                        <button
                            onClick={() => setActiveView("portfolio")}
                            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all 
                                ${activeView === "portfolio"
                                    ? "bg-indigo-50 text-indigo-600 font-semibold"
                                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                }`}
                        >
                            Portfolio
                        </button>
                        {/*Analytics button */}
                        <button
                            onClick={() => setActiveView("analytics")}
                            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all 
                                ${activeView === "analytics"
                                    ? "bg-indigo-50 text-indigo-600 font-semibold"
                                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                }`}
                        >
                            Analytics
                        </button>
                    </nav>
                    {/*Settings button - bottom sidebar */}
                    <button
                        onClick={() => setActiveView("settings")}
                        className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all 
                            ${activeView === "settings"
                                ? "bg-indigo-50 text-indigo-600 font-semibold"
                                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                            }`}
                    >
                        Analytics
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