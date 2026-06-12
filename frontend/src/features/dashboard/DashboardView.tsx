import type { Transaction, TransactionSummary } from "../../types/financeTypes";

interface DashboardViewProps {
    userName: string;
    summary: TransactionSummary;
    recentTransactions: Transaction[];
    savingsGoalPercentage: number;
    aiInsightMessage: string;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
    userName,
    summary,
    recentTransactions,
    savingsGoalPercentage,
    aiInsightMessage
}) => {

    // Get current calendar month 
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = String(currentDate.getMonth() + 1).padStart(2, "0");
    const currentMonthCode = `${currentYear}-${currentMonth}`;
    
    // Find current month summary data
    const currentMonthData = summary?.chart_data?.find(
        (item) => item?.year_month === currentMonthCode
    );
    const currentIncomes = currentMonthData ? currentMonthData.Income : 0;
    const currentExpenses = currentMonthData ? currentMonthData.Expense : 0;
    const currentNetSavings = currentIncomes - currentExpenses;
    
    return (
        <div className="space-y-8 animate-fade-in">
            {/** Header segment */}
            <header>
                <h1 className="text-2xl font-bold text-gray-900">Welcome back, {userName.toUpperCase()}!</h1>
                <p className="text-gray-500 text-sm">Here is your automated financial pulse checklist.</p>
            </header>

            {/** Key metric data, from transaction summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 bg-white rounded-2xl border border-gray-100 shadow-sm">
                    <p className="text-sm text-gray-500 mb-1">Net Savings</p>
                    <h2 className={`text-3xl font-bold ${summary.net_savings >= 0 ? "text-indigo-600" : "text-rose-600"}`}>
                        {currentNetSavings < 0 ? "-" : ""}${Math.abs(currentNetSavings).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </h2>
                    <span className="text-xs text-gray-400 font-medium">Accumulated landscape balance</span>
                </div>
                
                <div className="p-6 bg-white rounded-2xl border border-gray-100 shadow-sm">
                    <p className="text-sm text-gray-500 mb-1">Monthly Expenses</p>
                    <h2 className="text-3xl font-bold text-gray-900">
                        ${currentExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </h2>
                    <span className="text-xs text-emerald-600 font-medium">
                        Offsetting ${currentIncomes.toLocaleString(undefined, { maximumFractionDigits: 2 })} income
                    </span>
                </div>

                <div className="p-6 bg-white rounded-2xl border border-gray-100 shadow-sm">
                    <p className="text-sm text-gray-500 mb-1">AI Goal Track</p>
                    <h2 className="text-3xl font-bold text-gray-900">{savingsGoalPercentage}%</h2>
                    <div className="w-full bg-gray-100 h-2 rounded-full mt-2">
                        <div 
                            className="bg-indigo-500 h-2 rounded-full transition-all duration-500" 
                            style={{ width: `${savingsGoalPercentage}%` }}
                        ></div>
                    </div>
                </div>
            </div>

            {/* Insights Block */}
            <div className="bg-indigo-600 rounded-2xl p-6 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                        <span>✨</span> Intelli-Insight
                    </h3>
                    <p className="text-indigo-100 text-sm max-w-2xl">{aiInsightMessage}</p>
                </div>
            </div>

            {/* Recent transaction ledger and chart */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <h4 className="font-bold mb-4 text-gray-900">Recent Activity</h4>
                    <div className="space-y-4 text-sm">
                        {recentTransactions.map((tx) => {
                            // Safe parsing because amount is declared as a string string
                            const absoluteAmount = parseFloat(tx.amount) || 0;
                            const isExpense = tx.type === "expense";

                            return (
                                <div key={tx.transaction_id} className="flex justify-between items-center pb-2 border-b border-gray-50 last:border-0 last:pb-0">
                                    <div>
                                        <p className="font-medium text-gray-800">{tx.description}</p>
                                        <div className="flex items-center gap-2 text-gray-400 text-xs mt-0.5">
                                            <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-[10px] font-medium capitalize">
                                                {tx.category}
                                            </span>
                                            <span>•</span>
                                            <span>{tx.date}</span>
                                        </div>
                                    </div>
                                    <p className={`font-bold ${isExpense ? "text-rose-600" : "text-emerald-600"}`}>
                                        {isExpense ? "-" : "+"}${absoluteAmount.toFixed(2)}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>
                
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
                    <h4 className="font-bold text-gray-900 mb-2">Incomes vs Expenses</h4>
                    <div className="h-36 w-full flex items-end justify-around gap-2 px-2 mt-2">
                        {summary.chart_data.map((data, index) => {
                            const total = data.Income + data.Expense || 1;
                            const incomeHeight = `${Math.max((data.Income / total) * 100, 15)}%`;
                            const expenseHeight = `${Math.max((data.Expense / total) * 100, 15)}%`;

                            return (
                                <div key={index} className="flex flex-col items-center gap-1 flex-1 group">
                                    <div className="w-full flex items-end gap-1 h-28 bg-gray-50/50 p-1 rounded-lg">
                                        <div 
                                            title={`Income: $${data.Income}`}
                                            className="bg-emerald-400 w-1/2 rounded-t-sm transition-all group-hover:bg-emerald-500"
                                            style={{ height: incomeHeight }}
                                        ></div>
                                        <div 
                                            title={`Expense: $${data.Expense}`}
                                            className="bg-rose-400 w-1/2 rounded-t-sm transition-all group-hover:bg-rose-500"
                                            style={{ height: expenseHeight }}
                                        ></div>
                                    </div>
                                    <span className="text-[10px] text-gray-400 font-medium truncate max-w-full">
                                        {data.name}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

            </div>
        </div>
    )
}