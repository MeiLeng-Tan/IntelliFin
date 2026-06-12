import { useState, useEffect } from "react";
import { cn } from "../../../utils/cn"; 
import type { Transaction } from "../../../types/financeTypes";

interface TransactionModalProps {
    transaction: Transaction | null;
    onClose: () => void;
    onSave: (payload: any) => Promise<void>;
}

const EXPENSE_CATEGORIES = [
    { value: "rent", label: "Rent" },
    { value: "utilities", label: "Utilities" },
    { value: "food", label: "Food" },
    { value: "transport", label: "Transport" },
    { value: "shopping", label: "Shopping" },
    { value: "subscription", label: "Subscription" },
    { value: "others", label: "Others" }
];

const INCOME_CATEGORIES = [
    { value: "salary", label: "Salary" },
    { value: "freelance", label: "Freelance" },
    { value: "investments", label: "Investments" },
    { value: "gifts", label: "Gifts" },
    { value: "others", label: "Others" }
];

export const TransactionModal: React.FC<TransactionModalProps> = ({ transaction, onClose, onSave }) => {
    const [type, setType] = useState<"income" | "expense">("expense");
    const [amount, setAmount] = useState("");
    const [currency, setCurrency] = useState<string>("SGD");
    const [method, setMethod] = useState("cash");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState("others");
    const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
    const [isSaving, setIsSaving] = useState<boolean>(false);
    
    useEffect(() => {
        if (transaction) {
            setType(transaction.type);
            setAmount(transaction.amount.toString());
            setCurrency(transaction.currency);
            setMethod(transaction.method || "cash");
            setDescription(transaction.description);
            setCategory(transaction.category || "others");
            setDate(transaction.date ? transaction.date.split("T")[0] : new Date().toISOString().split("T")[0]);
        }
    }, [transaction]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSaving) return;
        setIsSaving(true);

        try {
            await onSave({
                date: new Date(date).toISOString(),
                type: type,
                description: description.trim(),
                amount: parseFloat(amount),
                currency: currency,
                method: method,
                category: category.toLowerCase().trim(),
                source: "manual"
            });
        } catch (err) {
            console.error("Unable to save: ", err);
            setIsSaving(false);
        }
    };

    // Select category list source dynamically
    const activeCategories = type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/30 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl w-full max-w-sm p-5 border shadow-xl space-y-4">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                    {transaction ? "Modify Transaction Record" : "New Transaction Entry"}
                </h3>
                <form onSubmit={handleSubmit} className="space-y-3 text-xs">
                    <div className="flex bg-gray-100 p-0.5 rounded-lg">
                        <button type="button" onClick={() => setType("expense")} className={cn("flex-1 py-1 font-semibold rounded-md", type === "expense" ? "bg-white text-rose-600 shadow-sm" : "text-gray-500")}>Expense</button>
                        <button type="button" onClick={() => setType("income")} className={cn("flex-1 py-1 font-semibold rounded-md", type === "income" ? "bg-white text-emerald-600 shadow-sm" : "text-gray-500")}>Income</button>
                    </div>
                    <div>
                        <label className="block font-bold text-gray-400 uppercase tracking-wider mb-0.5">Description</label>
                        <input type="text" required value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. AWS Instance" className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500" />
                    </div>
                    <div>
                        <label className="block font-bold text-gray-400 uppercase tracking-wider mb-0.5">Amount ($)</label>
                        <input type="number" step="0.01" required value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500" />
                    </div>
                    <div>
                        <label className="block font-bold text-gray-400 uppercase tracking-wider mb-0.5">Currency</label>
                        <input type="text" required value={currency.toUpperCase()} onChange={(e) => setCurrency(e.target.value)} placeholder="SGD" className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500" />
                    </div>
                    <div>
                        <label className="block font-bold text-gray-400 uppercase tracking-wider mb-0.5">Payment Method</label>
                        <select value={method} onChange={(e) => setMethod(e.target.value)} className="w-full px-2.5 py-1.5 border border-gray-200 bg-white rounded-lg focus:outline-none focus:border-indigo-500">
                            <option value="cash">Cash</option>
                            <option value="credit_card">Credit Card</option>
                            <option value="bank_transfer">Bank Transfer</option>
                        </select>
                    </div>
                    <div>
                        <label className="block font-bold text-gray-400 uppercase tracking-wider mb-0.5">Category</label>
                        <select 
                            value={category} 
                            onChange={(e) => setCategory(e.target.value)} 
                            className="w-full px-2.5 py-1.5 border border-gray-200 bg-white rounded-lg focus:outline-none focus:border-indigo-500 text-xs capitalize"
                        >
                            {activeCategories.map((cat) => (
                                <option key={cat.value} value={cat.value}>
                                    {cat.label}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block font-bold text-gray-400 uppercase tracking-wider mb-0.5">Transaction Date</label>
                        <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg" />
                    </div>
                    <div className="pt-2 flex gap-2">
                        <button type="button" onClick={onClose} className="flex-1 border border-gray-200 py-1.5 rounded-lg text-gray-500">Cancel</button>
                        <button 
                            type="submit" 
                            disabled={isSaving}
                            className={cn(
                                "flex-1 py-1.5 rounded-lg font-bold text-white transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                                isSaving ? "bg-indigo-400 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700"
                            )}
                        >
                            {isSaving ? (
                                <>
                                    <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                    Saving...
                                </>
                            ) : (
                                transaction ? "Save Changes" : "Save Entry"
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};