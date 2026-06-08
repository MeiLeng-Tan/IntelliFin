import { useState, useEffect } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { X, FileText, Link, CreditCard } from "lucide-react";  //ArrowUpRight, ArrowDownRight, Wallet, Calendar, Trash2, 
import { cn } from "../../utils/cn";
import { transactionService } from "../../services/financeService";
import type { Transaction, TransactionSummary, Subscription } from "../../types/financeTypes";

interface AnalyticsViewProps {
    transactions: Transaction[];
    summary: TransactionSummary | null,
    subscriptions: Subscription[];
    onEditTransaction: (tx: Transaction) => void;
    onDeleteTransaction: (id: string) => void;
    // onEditSubscription: (sub: Subscription) => void;
}

//onEditSubscription
export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ transactions, summary, subscriptions, onEditTransaction, onDeleteTransaction }) => {
    const [typeFilter, setTypeFilter] = useState<"all" | "income" | "expense">("all");
    const [selectedTxId, setSelectedTxId] = useState<string | null>(null);
    const [detailedTx, setDetailedTx] = useState<Transaction | null>(null);
    const [loadingDetail, setLoadingDetail] = useState<boolean>(false);
    
    const chartData = summary?.chart_data || [];
    const totalIncome = summary?.total_incomes || 0;
    const totalExpense = summary?.total_expenses || 0;

    const filteredTransactions = transactions.filter(t => {
        if (typeFilter === "income") return t.type === "income";
        if (typeFilter === "expense") return t.type === "expense";
        return true;
    });

    useEffect(() => {
        if (!selectedTxId) {
            setDetailedTx(null);
            return;
        }

        const fetchDetail = async () => {
            setLoadingDetail(true);
            try {
                const txData = await transactionService.getTransactionById(selectedTxId);
                setDetailedTx(txData);
            } catch (err) {
                console.error("Failed to load transaction data:", err);
            } finally {
                setLoadingDetail(false);
            }
        };
        fetchDetail();
    }, [selectedTxId]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/**Left and center region: Analytics and tables */}
            <div className="lg:col-span-2 space-y-6">
                {/**Metric card row */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white border border-gray-200 p-4 rounded-xl">
                        <span className="text-xs font-semibold text-gray-400 block uppercase tracking-wider">
                            Total Inflow
                        </span>
                        <h3 className="text-xl font-bold text-emerald-600 mt-0.5">
                            ${totalIncome}
                        </h3>
                    </div>
                    <div className="bg-white border border-gray-200 p-4 rounded-xl">
                        <span className="text-xs font-semibold text-gray-400 block uppercase tracking-wider">
                            Total Outflow
                        </span>
                        <h3 className="text-xl font-semibold text-rose-600 mt-0.5">
                            ${totalExpense}
                        </h3>
                    </div>
                </div>
                {/** Chart frame */}
                <div className="bg-white border border-gray-200 p-4 rounded-xl">
                    <div className="h-60 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F4F4F6" />
                                <XAxis dataKey="name" stroke="#9CA3AF" fontSize={10} tickLine={false} />
                                <YAxis stroke="#9CA3AF" fontSize={10} axisLine={false} tickLine={false} />
                                <Tooltip />
                                <Bar dataKey="Income" fill="#10B981" radius={[2, 2, 0, 0]} maxBarSize={20} />
                                <Bar dataKey="Expense" fill="#F43F5E" radius={[2, 2, 0, 0]} maxBarSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/**Dynamic Interactve Ledger Data Matrix */}
                <div className="bg-white border border-gray-200 rounded-xl shadow-xs overflow-hidden">
                    <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                        <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                            Categorized Ledger Entries
                        </h3>
                        <div className="flex bg-gray-200 p-0.5 rounded-md text-[10px]">
                            {(["all", "income", "expense"] as const).map((type) => (
                                <button
                                    key={type}
                                    onClick={() => setTypeFilter(type)}
                                    className={cn("px-2.5 py-1 font-medium capitalize rounded cursor-pointer", typeFilter === type ? "bg-white text-gray-900 shahow-xs" : "text-gray-500")}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead>
                                <tr className="bg-gray-50 text-gray-400 border-b border-gray-200 font-semibold  uppercase tracking-wide" >
                                    <th className="px-4 py-2.5">Description</th>
                                    <th className="px-4 py-2.5">Category</th>
                                    <th className="px-4 py-2.5">Date</th>
                                    <th className="px-4 py-2.5 text-right">Amount</th>
                                    <th className="px-4 py-2.5 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-gray-600">
                                {filteredTransactions.map((t) => (
                                    <tr
                                        key={t.transaction_id}
                                        onClick={() => setSelectedTxId(t.transaction_id)}
                                        className={cn(
                                            "hover:bg-indigo-50/20 cursor-pointer transition-colors",
                                            selectedTxId === t.transaction_id ? "bg-indigo-50/40" : ""
                                        )}
                                    >
                                        <td className="px-4 py-3 font-semibold text-gray-900">
                                            <div className="flex items-center gap-1.5">
                                                {t.description}
                                                {t.subscription_id && <span className="bg-emerald-50 text-emerald-600 text-[9px] px-1/5 py-0.2 rounded font=bold uppercase tracking-wide">Sub</span>}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-gray-400"><span className="bg-gray-100 text-gray-60 txt-xs px-2.5 py-1 rounded-lg font-medium capitalize">{t.category}</span></td>
                                        <td className="px-4 py-3 text-gray-400">{t.date.split("T")[0]}</td>
                                        <td className={cn("px-4 py-3 text-right font-bold", t.type === "income" ? "text-emerald-600" : "text-gray-900")}>
                                            {t.type === "income" ? "+" : "-"} ${t.amount}
                                        </td>
                                        <td className="px-4 py-3 text-center space-x-2" onClick={(e) => e.stopPropagation()}>
                                            <button
                                                onClick={() => onEditTransaction(t)}
                                                className="text-indigo-600 font-medium hover:underline cursor-pointer"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => onDeleteTransaction(t.transaction_id)}
                                                className="text-rose-600 font-medium hover:underline cursor-pointer"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/**Right Subscriptions */}
            <div className="space-y-6">
                {/**Subscription monitoring */}
                <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-xs space-y-3">
                    <div className="border-b border-gray-100 pb-2">
                        <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                                Identified Susbcriptions
                        </h4>
                        <p className="text-[10px] text-gray-400 mt-0.5">Automated tracking maps extracted via recurring backend AI sweeps.</p>
                    </div>
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                        {subscriptions.length === 0 ? (
                            <div className="text-center py-6 text-[11px] text-gray-400 border border-dashed rounded-lg">No subscription tracks found.</div>
                        ) : (
                            subscriptions.map((sub) => (
                                <div key={sub.subscription_id} className="p-2.5 border border-gray-100 rounded-lg flex justify-between items-center bg-gray-50/50 text-xs">
                                    <div>
                                        <span className="font-bold text-gray-900 block capitalize">{sub.subscription_name}</span>
                                        <span className="text-[10px] text-gray-400 block mt-0.5 capitalize">{sub.billing_cycle} • Next: {sub.next_billing_date.split("T")[0]}</span>
                                    </div>
                                    <span className="font-bold text-indigo-600">${sub.fee.toFixed(2)}</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

            {/**Right: Sliding side drawer detail workspace panel */}
            {selectedTxId && (
                <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3 animate-fade-in text-xs">
                    <div className="flex justify-between border-b pb-2 border-gray-100 items-center">
                        <h4 className="font-bold text-gray-400 uppercase tracking-wider text-[11px]">
                            Extended Properties
                        </h4>
                        <button onClick={() => setSelectedTxId(null)} className="text-gray-400 font-bold hover:text-gray-900">
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {loadingDetail ? (
                        <div>
                            <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-xs text-gray-400 font-medium">Resolving data fields...</span>
                        </div>
                    ) : detailedTx ? (
                        <div className="space-y-3">
                            <div>
                                <span className="text-gray-400 block">Transaction Target Token</span>
                                <span className="font-mono text-[10px] bg-gray-50 p-1.5 rounded block text-gray-500 truncate select-all">{detailedTx.transaction_id}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Currency Index</span> 
                                    <span className="font-semibold text-gray-900 bg-gray-50 px-2.5 py-1.5 rounded-xl block text-center uppercase">{detailedTx.currency || "SGD"}</span>
                                </div>
                                <div>
                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Payment Method</span>
                                    <span className="font-semibold text-gray-700 flex items-center gap-1.5 bg-gray-50 px-2.5 py-1.5 rounded-xl block justify-center capitalize"><CreditCard className="w-3.5 h-3.5 text-gray-400" />{detailedTx.method || 'Cash'}</span>
                                </div>
                            </div>   

                            <div>
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Source Pipeline Origin</span>
                                <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 uppercase tracking-wide inline-block">{detailedTx.source || "manual"}</span>
                            </div> 
                            
                            {detailedTx.doc_name && (
                                <div className="border border-indigo-100 bg-indigo-50/30 p-3 rounded-xl flex items-start gap-2.5">
                                    <FileText className="w-4 h-4 text-indigo-500 mt-0.5 flex-shrink-0" />
                                    <div className="min-w-0">
                                        <span className="text-xs  font-bold text-indigo-900 block">AI Extracted PDF Document</span>
                                        <span className="text-xs text-indigo-700 block truncate font-medium mt-0.5">{detailedTx.doc_name}</span>
                                    </div>
                                </div>    
                            )}

                            {detailedTx.subscription_id && (
                                <div className="border vorder-emerald-100 bg-emerald-50/30 p-3 rounded-xl flex items-start gap-2.5">
                                    <Link className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                                    <div className="min-w-0">
                                        <span className="text-xs font-bold text-emerald-900 block">Linked Subscription Cluster</span>
                                        <span className="text-xs font-mono text-emerald-700 block truncate mt-0.5">{detailedTx.subscription_id}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-xs text-gray-400">Failed to reconstruct vector detail context hooks.</div>
                    )}
                </div>
            )}
        </div>
        </div>
    );
};