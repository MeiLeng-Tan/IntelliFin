import { useState } from "react";
import { ResponsiveContainer, BarChart, Bar, Cell, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";
import { ArrowUpRight, ArrowDownRight, X, CreditCard, Edit2, Trash2 } from "lucide-react";  
import { cn } from "../../utils/cn";
import type { Transaction, TransactionSummary, Subscription } from "../../types/financeTypes";

interface AnalyticsViewProps {
    transactions: Transaction[];
    monthFilter: string;                       
    onMonthFilterChange: (month: string) => void;
    summary: TransactionSummary | null,
    subscriptions: Subscription[];
    hasMore: boolean;
    loadingOlder: boolean;
    parsingFile: boolean;
    onLoadOlder: () => void;
    onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onAddTransaction: () => void;
    onEditTransaction: (tx: Transaction) => void;
    onDeleteTransaction: (id: string) => void;
    onAddSubscription: () => void;
    onEditSubscription: (sub: Subscription) => void;
}

// Get months filter tab, latest three months
const getMonthsFilterOptions = () => {
    const options = [{ value: "all", label: "All" }];
    const currentDate = new Date();

    for (let i = 0; i < 3; i++) {
        const d = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const value = `${year}-${month}`;
        
        // Format label as "MMM YYYY"
        const label = d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
    
        options.push({ value, label })
    }
    return options;
};

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ 
    transactions, 
    monthFilter, 
    onMonthFilterChange,
    summary, 
    subscriptions, 
    hasMore,
    loadingOlder, 
    parsingFile, 
    onLoadOlder,
    onFileUpload,
    onAddTransaction,
    onEditTransaction, 
    onDeleteTransaction,
    onAddSubscription,
    onEditSubscription,
}) => {
    const [viewingTransaction, setViewingTransaction]= useState<Transaction | null>(null);
    const [viewingSubscription, setViewingSubscription] = useState<Subscription | null>(null);

    const availableMonthTabs = getMonthsFilterOptions();

    const filteredTransactions = transactions;

    const categoryData = filteredTransactions.reduce((acc: any, t) => {
        const cat = t.category || "Other";
        const existing = acc.find((item: any) => item.name === cat);
        if (existing) {
            existing.value += Number(t.amount);
        } else {
            acc.push({ name: cat, value: Number(t.amount) });
        }
        return acc;
    }, []).sort((a: any, b: any) => b.value - a.value);

    const chartData = summary?.chart_data || [];
    const totalIncomes = summary?.total_incomes || 0;
    const totalExpenses = summary?.total_expenses || 0;

    const displayChartData = monthFilter === "all"
    ? chartData
    : chartData.filter(item => item.year_month === monthFilter)

    const selectedMonthData = chartData.find(item => item.year_month === monthFilter);

    const displayTotalIncomes = monthFilter === "all"
    ? totalIncomes
    : (selectedMonthData ? selectedMonthData.Income : 0)

    const displayTotalExpenses = monthFilter === "all"
    ? totalExpenses
    : (selectedMonthData ? selectedMonthData.Expense : 0)
    
    return (
        <div className="space-y-6">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-gray-200 pb-4 space-y-4 md:space-y-0">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">Financial Analytics</h1>
                    <p className="text-sm text-gray-500">Overview of your financial distributions.</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <div className="inline-flex rounded-lg bg-gray-100 p-1">
                        {availableMonthTabs.map((opt) => (
                            <button
                                key={opt.value}
                                onClick={() => onMonthFilterChange(opt.value)}
                                className={cn(
                                    "rounded-md px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer",
                                    monthFilter === opt.value ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-900"
                                )}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Operation ledger control section */}
            <div className="flex flex-wrap justify-between items-center bg-white border border-gray-200 p-4 rounded-xl gap-4 shadow-sm">
                <div>
                    <h2 className="text-base font-bold text-gray-900">Financial Ledger Engine</h2>
                    <p className="text-xs text-gray-400">Manage entries, evaluate subscription cycles, or map statements dynamically.</p>
                </div>
                <div className="flex items-center gap-3">
                    <label className={cn("px-4 py-2 border border-gray-200 text-xs font-semibold rounded-xl cursor-pointer hover:bg-gray-50 flex items-center gap-1.5 transition-all", parsingFile ? "opacity-50 pointer-events-none" : "")}>
                        {parsingFile ? "Parsing System Document..." : "📁 Upload Statement"}
                        <input type="file" accept=".pdf" onChange={onFileUpload} className="hidden" disabled={parsingFile} />
                    </label>
                    <button onClick={onAddTransaction} className="bg-indigo-600 text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-indigo-700 cursor-pointer shadow-sm">
                        ➕ Add Entry
                    </button>
                </div>
            </div>

            {/* Income/ Spending Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white border border-gray-200 p-5 rounded-2xl shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Incomes</p>
                        <p className="text-2xl font-black text-emerald-600 mt-1">${displayTotalIncomes.toLocaleString()}</p>
                    </div>
                    <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600"><ArrowUpRight className="w-6 h-6" /></div>
                </div>
                <div className="bg-white border border-gray-200 p-5 rounded-2xl shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Spending</p>
                        <p className="text-2xl font-black text-gray-900 mt-1">${displayTotalExpenses.toLocaleString()}</p>
                    </div>
                    <div className="p-3 bg-rose-50 rounded-xl text-rose-600"><ArrowDownRight className="w-6 h-6" /></div>
                </div>
            </div>

            {/* Spendign trends */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                        <h3 className="text-sm font-bold text-gray-900 mb-4">Income vs Expense Trends</h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={displayChartData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} />
                                    <YAxis fontSize={11} tickLine={false} axisLine={false} />
                                    <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }} />
                                    <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ fontSize: "11px", paddingBottom: "20px" }} />
                                    <Bar dataKey="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="Expense" fill="#6366f1" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Categories distribution tracking */}
                    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                        <h3 className="text-sm font-bold text-gray-900 mb-4">Spending by Category</h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={categoryData} layout="vertical" margin={{ left: 30 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                    <XAxis type="number" fontSize={11} hide />
                                    <YAxis dataKey="name" type="category" fontSize={11} tickLine={false} axisLine={false} />
                                    <Tooltip />
                                    <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={30}>
                                        {categoryData.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={index % 2 === 0 ? "#6366f1" : "#818cf8"} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/** Transaction ledger */}
                    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                        <h3 className="text-sm font-bold text-gray-900 mb-4">Transaction Ledger</h3>
                        <div className="divide-y divide-gray-100">
                            {filteredTransactions.length === 0 ? (
                                <div className="text-center py-8 text-xs text-gray-400">No transactions recorded for this selected metric profile.</div>
                            ) : (
                                filteredTransactions.map((t) => (
                                    <div key={t.transaction_id || t.id} onClick={() => setViewingTransaction(t)} className="flex items-center justify-between py-3 cursor-pointer hover:bg-gray-50/50 px-2 rounded-lg group transition-colors">
                                        <div className="flex flex-col">
                                            <span className="text-xs text-gray-400">{t.date ? new Date(t.date).toLocaleDateString() : ""}</span>
                                            <span className="text-sm font-medium text-gray-900">{t.description}</span>
                                            <span className="text-xs text-gray-400 capitalize">{t.category}</span>
                                        </div>
                                        <div className="flex items-center gap-4" onClick={(e) => e.stopPropagation()}>
                                            <span className={cn("text-sm font-bold", t.type === "income" ? "text-emerald-600" : "text-gray-700")}>
                                                {t.type === "income" ? "+" : "-"}${Number(t.amount).toFixed(2)}
                                            </span>
                                            <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                                                <button onClick={() => onEditTransaction(t)} className="p-1 text-gray-400 hover:text-indigo-600"><Edit2 className="w-3.5 h-3.5" /></button>
                                                <button onClick={() => onDeleteTransaction(t.transaction_id)} className="p-1 text-gray-400 hover:text-rose-600"><Trash2 className="w-3.5 h-3.5" /></button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}

                            {hasMore && (
                                <button onClick={onLoadOlder} disabled={loadingOlder} className="w-full mt-4 py-2 border border-dashed border-gray-200 rounded-xl text-xs text-gray-500 hover:bg-gray-50 transition-all flex items-center justify-center gap-2">
                                    {loadingOlder ? "Retrieving records..." : "📂 Fetch Older Ledger Segments"}
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Active subscriptions section */}
                <div className="space-y-6">
                    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
                            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Active Subscriptions</h3>
                            <button onClick={onAddSubscription} className="bg-indigo-600 text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-indigo-700 cursor-pointer shadow-sm">Add New</button>
                        </div>
                        <div className="space-y-3">
                            {subscriptions.map((sub) => (
                                <div key={sub.subscription_id} onClick={() => setViewingSubscription(sub)} className="flex items-center justify-between p-3 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer group">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><CreditCard className="w-4 h-4" /></div>
                                        <div>
                                            <p className="text-xs font-semibold text-gray-900">{sub.description}</p>
                                            <p className="text-[10px] text-gray-400">{sub.billing_cycle}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3" onClick={e => e.stopPropagation()}>
                                        <span className="text-xs font-bold text-gray-900">${sub.fee}</span>
                                        <button onClick={() => onEditSubscription(sub)} className="p-1 text-gray-400 hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"><Edit2 className="w-3.5 h-3.5" /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Transaction details modal overlays */}
            {viewingTransaction && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setViewingTransaction(null)}>
                    <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-lg font-bold">Transaction Details</h2>
                            <X className="w-5 h-5 cursor-pointer text-gray-400" onClick={() => setViewingTransaction(null)} />
                        </div>
                        <div className="space-y-4">
                            <div className="p-4 bg-gray-50 rounded-xl text-center">
                                <p className="text-xs text-gray-500 mb-1">Settled Value</p>
                                <p className={cn("text-3xl font-black", viewingTransaction.type === "income" ? "text-emerald-600" : "text-gray-900")}>
                                    ${viewingTransaction.amount}
                                </p>
                            </div>
                            <div><p className="text-gray-400 text-sm">Description</p><p className="font-medium">{viewingTransaction.description || "None Specified"}</p></div>
                            <div><p className="text-gray-400 text-sm">Amount</p><p className="font-medium">{viewingTransaction.currency.toUpperCase()} {viewingTransaction.amount}</p></div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div><p className="text-gray-400">Category</p><p className="font-semibold capitalize">{viewingTransaction.category}</p></div>
                                <div><p className="text-gray-400">Transaction Date</p><p className="font-semibold">{new Date(viewingTransaction.date).toLocaleDateString()}</p></div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/** Subscription details modal overlays */}
            {viewingSubscription && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setViewingSubscription(null)}>
                    <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-lg font-bold">Subscription Info</h2>
                            <button onClick={() => setViewingSubscription(null)} className="text-gray-400"><X /></button>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center gap-4 p-4 bg-indigo-50 rounded-xl">
                                <div className="p-3 bg-white text-indigo-600 rounded-xl shadow-sm"><CreditCard /></div>
                                <div>
                                    <p className="text-sm font-bold text-gray-900">{viewingSubscription.description}</p>
                                    <p className="text-xs text-indigo-500 font-medium capitalize">{viewingSubscription.billing_cycle}</p>
                                </div>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                <span className="text-xs text-gray-400 uppercase">Recurring Fee</span>
                                <span className="text-sm font-black text-gray-900">{viewingSubscription.currency.toUpperCase()} {viewingSubscription.fee}</span>
                            </div>
                            <div className="flex justify-between items-center py-2">
                                <span className="text-xs text-gray-400 uppercase">Next Billing Date</span>
                                <span className="text-sm font-medium capitalize">{new Date(viewingSubscription.next_billing_date).toLocaleDateString()}</span>
                            </div>
                            <div className="flex justify-between items-center py-2">
                                <span className="text-xs text-gray-400 uppercase">Category</span>
                                <span className="text-sm font-medium capitalize">{viewingSubscription.category || "others"}</span>
                            </div>
                            <button 
                                onClick={() => { onEditSubscription(viewingSubscription); setViewingSubscription(null); }}
                                className="w-full bg-gray-900 text-white py-2 rounded-xl text-xs font-bold mt-4"
                            >
                                Edit Subscription Details
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};