import { useState } from "react";
import { ChatWindow } from "./ChatWindow";

export const ChatWidget: React.FC = () => {
    const [isOpen, setIsOpen] = useState<boolean>(false);

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end font-sans">
      {/* Open panel overlay context */}
      {isOpen && (
        <div className="mb-4 w-96 h-[520px] shadow-2xl rounded-2xl border border-gray-200 overflow-hidden bg-white flex flex-col transition-all duration-200 transform scale-100 origin-bottom-right">
          
          {/* Dashboard agent header */}
          <div className="bg-slate-900 text-white p-4 flex justify-between items-center shadow-md">
            <div>
              <h3 className="font-semibold text-sm tracking-wide">IntelliFin AI Copilot</h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 block animate-pulse" />
                <p className="text-[10px] text-slate-400 font-mono">Stateful Agentic Node Active</p>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white text-xs transition-colors p-1"
            >
              ✕
            </button>
          </div>
          
          {/* Chat interface body frame */}
          <div className="flex-1 overflow-hidden">
            <ChatWindow />
          </div>
        </div>
      )}

      {/* Floating action button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-slate-900 hover:bg-slate-800 text-white p-4 rounded-full shadow-xl transition-all duration-150 active:scale-95 focus:outline-none focus:ring-2 focus:ring-slate-400"
      >
        {isOpen ? (
          <span className="text-xs font-semibold uppercase tracking-wider px-1">Minimize</span>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        )}
      </button>
    </div>
    );
}