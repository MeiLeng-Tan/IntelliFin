import api from "./api";
import type { DisplayMessage, ChatNetworkPayload, ChatResponse } from "../types/chatTypes";

export const sendAgentMessage = async (messageText: string, uiHistory: DisplayMessage[], sessionId: string): Promise<ChatResponse> => {
    const formattedHistory: ChatNetworkPayload[] = uiHistory.map(msg => ({
        role: msg.sender === "user" ? "user" : "ai agent",
        content: msg.text
    }));

    const response = await api.post<ChatResponse>(
        "/chat/message", 
        {
            session_id: sessionId,
            message: messageText,
            history: formattedHistory
        }
    );

    return response.data;
};
