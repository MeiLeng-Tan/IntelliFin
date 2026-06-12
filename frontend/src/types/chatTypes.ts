export interface DisplayMessage {
    id: string;
    sender: "user" | "ai agent";
    text: string;
    timestamp: Date;
    actions?: string[];
}

export interface ChatNetworkPayload {
    role: "user" | "ai agent";
    content: string;
}

export interface ChatResponse {
    status: "success" | "error";
    response: string;
    actions?: string[];
}