import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { sendAgentMessage } from "../../services/chatService";
import type { DisplayMessage } from "../../types/chatTypes";

export const ChatWindow: React.FC = () => {
    const [input, setInput] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);
    
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
        
        try {
            const data = await sendAgentMessage(userMessage.text, [...messages, userMessage], sessionId);

            if (data.status === "success") {
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
                <div ref={chatEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-gray-200 flex gap-2">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask about allocation updates..."
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