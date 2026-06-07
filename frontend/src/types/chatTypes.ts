export interface Message {
    sender: "user" | "ai agent";
    text: string;
    timestamp: Date;
}
