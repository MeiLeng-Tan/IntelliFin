import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { sendAgentMessage } from "../../services/chatService";
import type { DisplayMessage } from "../../types/chatTypes";

export const ChatWindow: React.FC = () => {
    const [input, setInput] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);
    const [activeActions, setActiveActions] = useState<string[]>([]);
    
    // Initialize or retrieve a distinct session_id for LangGraph
    const [sessionId] = useState<string>(() => {
        const existingSession = sessionStorage.getItem("intellifin_session_id");
        if (existingSession) return existingSession;

        const newSession = crypto.randomUUID();
        sessionStorage.setItem("intellifin_session_id", newSession);
        return newSession;
    });

    // Using sessionStorage history 
    const [messages, setMessages] = useState<DisplayMessage[]>(() => {
        const saved = sessionStorage.getItem("intellifin_chat");
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                return parsed.map((m: any) => ({ 
                    ...m, 
                    timestamp: new Date(m.timestamp) 
                }));
            } catch (e) {
                return [];
            }
        }
        return [
            { 
                id: "init-msg",
                sender: "ai agent",
                text: "Hello! I'm your IntelliFin AI assistant. Ask me anything about your current asset distribution or risk profile.",
                timestamp: new Date()
            }
        ];
    });

    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        sessionStorage.setItem("intellifin_chat", JSON.stringify(messages));
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const userMessage: DisplayMessage = {
            id: `msg-user-${Date.now()}`,
            sender: "user",
            text: input.trim(),
            timestamp: new Date()
        };
        
        setMessages(prev => [...prev, userMessage]);
        setInput("");
        setLoading(true);
        setActiveActions(["Initializing AI agent..."]);
        
        try {
            const data = await sendAgentMessage(userMessage.text, [...messages, userMessage], sessionId);

            if (data.status === "success") {
                setActiveActions(data.actions);
                setMessages(prev => [...prev, {
                    id: `msg-agent-${Date.now()}`,
                    sender: "ai agent",
                    text: data.response,
                    actions: data.actions,
                    timestamp: new Date()
                }]);
            } else {
                throw new Error("Grah computation failed.");
            }
        } catch (err) {
            setMessages(prev => [...prev, {
                id: `msg-err-${Date.now()}`,
                sender: "ai agent",
                text: "Sorry, I encountered an issue updating the execution context.",
                timestamp: new Date()
            }]);
        } finally {
            setLoading(false);
            setActiveActions([])
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-50">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className="max-w-[85%]">
                            
                            {/* Core Text Bubble */}
                            <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                                msg.sender === 'user' 
                                    ? 'bg-indigo-600 text-white rounded-tr-none' 
                                    : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
                            }`}>
                                {msg.sender === 'user' ? (
                                    // Simple text format for user messages
                                    msg.text
                                ) : (
                                    <div className="markdown-content space-y-3 text-slate-700">
                                        {msg.sender === 'ai agent' && msg.actions && msg.actions.length > 0 && (
                                            <div className="mb-4 space-y-2">
                                                <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">
                                                    Execution Steps
                                                </div>
                                                <div className="flex flex-col gap-1.5">
                                                    {msg.actions.map((action, index) => (
                                                        <div 
                                                            key={index} 
                                                            className="flex items-center gap-2 text-[11px] bg-slate-50 border border-slate-200 text-slate-600 px-2 py-1 rounded-md animate-in fade-in slide-in-from-left-1"
                                                        >
                                                            <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]" />
                                                            {action}
                                                        </div>
                                                    ))}
                                                </div>
                                                <hr className="border-slate-100 my-3" />
                                            </div>
                                        )}
                                        <ReactMarkdown 
                                            components={{
                                                // Custom styling
                                                strong: ({node, ...props}) => (
                                                    <span className="font-semibold text-slate-900 bg-amber-50 px-1 py-0.5 rounded border border-amber-200/60" {...props} />
                                                ),
                                                // Style lists
                                                ul: ({node, ...props}) => <ul className="list-disc pl-5 space-y-1 my-2" {...props} />,
                                                ol: ({node, ...props}) => <ol className="list-decimal pl-5 space-y-1 my-2" {...props} />,
                                                li: ({node, ...props}) => <li className="text-slate-600" {...props} />,
                                                // Style line breaks / sections
                                                p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                                            }}
                                        >
                                            {msg.text}
                                        </ReactMarkdown>
                                    </div>
                                )}
                            </div>

                            <span className={`text-[10px] text-gray-400 mt-1 block px-1 ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
                                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    </div>
                ))}
                {/* Dynamic Action Logger */}
                {loading && activeActions.length > 0 && (
                    <div className="flex justify-start items-start space-x-3 mb-4 animate-in fade-in duration-500">
                        <div className="flex flex-col space-y-2 w-full max-w-[80%]">
                            <div className="bg-slate-100 border border-slate-200 rounded-2xl rounded-tl-none p-3 shadow-sm">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="flex space-x-1">
                                        <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                        <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                        <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce"></span>
                                    </div>
                                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">Agent Progress</span>
                                </div>
                                
                                <div className="space-y-1.5">
                                    {activeActions.map((action, idx) => (
                                        <div key={idx} className="flex items-center gap-2 text-xs text-slate-600 transition-all">
                                            <svg className="w-3 h-3 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                            </svg>
                                            {action}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={chatEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-gray-200 flex gap-2">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Talk to AI assistant..."
                    disabled={loading}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-slate-900 disabled:bg-gray-50"
                />
                <button
                    type="submit"
                    disabled={loading}
                    className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors disabled:bg-gray-400"
                >
                    Send
                </button>
            </form>
        </div>
  );
};