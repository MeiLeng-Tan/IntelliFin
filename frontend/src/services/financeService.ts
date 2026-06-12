import api from "./api";
import type { Transaction, TransactionSummary, Subscription } from "../types/financeTypes";

export const transactionService = {
    /**
     * Get /api/transactions
     * Get user's transaction collections from database. 
     */
    getUserTransactions: async (): Promise<Transaction[]> => {
        const response = await api.get<Transaction[]>("/transactions/");
        return response.data;
    },

    /**
     * GET /api/transactions/:tx_id
     * Get transaction details for a specific transaction
     */
    getTransactionById: async (tx_id: string) : Promise<Transaction> => {
        const response = await api.get<Transaction>(`/transactions/${tx_id}`);
        return response.data;
    },

    /**
     * GET /api/transactions/paginated?page=${page}&limit=${limit}
     * Get paginated transactions
     */
    getPaginatedTransactions: async (page: number, limit: number) => {
        const response = await api.get(`/transactions/paginated?page=${page}&limit=${limit}`);
        return response.data;
    },
    
    /**
     * GET /api/transactions/summary
     * Get transactions summary
     */
    getTransactionSummary: async (): Promise<TransactionSummary> => {
        const response = await api.get<TransactionSummary>("/transactions/summary");
        return response.data;
    },

    /**
     * POST /api/transactions/manual
     * Create a new transaction manually and send to database
     */
    createTransaction: async (transaction: Omit<Transaction, "transaction_id" | "source">): Promise<{ message: string; id:string }> => {
        const response = await api.post<{ message: string; id: string }>("/transactions/manual", transaction);
        return response.data;
    },

    /**
     * POST /api/transactions/parse
     * Uploads a bank statement PDF to trigger the backend execution pipeline
     */
    uploadStatement: async (file: File): Promise<Transaction[]> => {
        const formData = new FormData();
        formData.append("file", file);
        const response = await api.post<Transaction[]>("/transactions/parse", formData, {
            headers: { "Content-Type": "multipart/form-data" }
        });
        return response.data;
    },

    /**
     * PUT /api/transactions/:tx_id
     * Update transaction
     */
    updateTransaction: async (tx_id: string, updates: Partial<Transaction>): Promise<void> => {
        await api.put(`/transactions/${tx_id}`, updates);
    },

    /**
     * DELETE /api/transactions/:id
     * Delete a transaction
     */
    deleteTransaction: async (tx_id: string): Promise<void> => {
        await api.delete(`/transactions/${tx_id}`)
    },

    /**
     * GET /api/subscriptions
     * Retrieve user subscriptions
     */
    getUserSubscriptions: async (): Promise<Subscription[]> => {
        const response = await api.get<Subscription[]>("/subscriptions/");
        return response.data;
    },

    /**
     * GET /api/subscriptions/:sub_id
     * Get subscription details for a specific subscription
     */
    getSubscriptionById: async (sub_id: string) : Promise<Subscription> => {
        const response = await api.get<Subscription>(`/subscriptions/${sub_id}`);
        return response.data;
    },

    /**
     * POST /api/subscriptions/new
     * Create a new subscription and send to database
     */
    createSubscription: async (subscription: Omit<Subscription, "subscription_id">): Promise<{ message: string; id:string }> => {
        const response = await api.post<{ message: string; id: string }>("/subscriptions/new", subscription);
        return response.data;
    },

    /**
     * PUT /api/subscriptions/:sub_id
     * Update subscription
     */
    updateSubscription: async (sub_id: string, updates: Partial<Subscription>): Promise<void> => {
        await api.put(`/subscriptions/${sub_id}`, updates);
    }
}