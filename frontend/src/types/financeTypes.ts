export interface Transaction {
    transaction_id: string;
    date: string;
    type: "income" | "expense";
    description: string;
    category: string;
    amount: string;
    currency: string;
    method?: string;
    source?: string;
    doc_name?: string | null;
    subscription_id?: string | null;
}

export interface Subscription {
    subscription_id: string;
    subscription_name: string;
    fee: number;
    currency: string;
    billing_cycle: "weekly" | "monthly" | "quarterly" | "annual"
    next_billing_date: string;
    is_active: boolean;
    payment_method: string;
    category: string;
}

export interface TransactionSummary {
    total_incomes: number;
    total_expenses: number;
    net_savings: number;
    chart_data: Array<{
        name: string;
        Income: number;
        Expense: number;
    }>;
}