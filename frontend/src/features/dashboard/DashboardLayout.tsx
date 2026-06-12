import { useEffect, useState } from "react";
import { DashboardView } from "./DashboardView";
import type { Transaction, TransactionSummary } from "../../types/financeTypes";
import { transactionService } from "../../services/financeService";

interface DashboardDataState {
    userName: string;
    summary: TransactionSummary;
    recentTransactions: Transaction[];
    savingsGoalPercentage: number;
    aiInsightMessage: string;
}

export const DashboardLayout = () => {
    const [data, setData] = useState<DashboardDataState | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchDashboardPayLoad = async () => {
            try {
                setLoading(true);
                setError(null);

                // Retrieve user data from local storage
                const loggedInUser = localStorage.getItem("user");
                const user = loggedInUser? JSON.parse(loggedInUser) : null;
                const firstName = user?.first_name || "User"

                const [tx_summary, latest_txs] = await Promise.all([
                    transactionService.getTransactionSummary(),
                    transactionService.getUserTransactions()
                ]) 

                setData({
                    userName: firstName,
                    summary: tx_summary,
                    recentTransactions: latest_txs.slice(0,5),
                    savingsGoalPercentage: 82,
                    aiInsightMessage: "Spend wisely"
                });
            } catch (err: any) {
                console.error("Dashboard load error:", err);
                setError("Failed to sync dashboard data.")
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardPayLoad();
    }, []);

    if (loading) return <div className="p-10 text-center">Syncing dashboard...</div>;
    if (error || !data) return <div className="p-10 text-rose-500">{error}</div>;

    return <DashboardView {...data} />
};