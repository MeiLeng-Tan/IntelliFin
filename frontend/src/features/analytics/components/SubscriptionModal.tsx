import { useState, useEffect } from "react";
import { cn } from "../../../utils/cn";
import type { Subscription } from "../../../types/financeTypes";

interface SubscriptionModalProps {
    subscription: Subscription | null;
    onClose: () => void;
    onSave: (payload: any) => void;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({ subscription, onClose, onSave }) => {
    const [name, setName] = useState("");
    const [fee, setFee] = useState("");
    const [currency, setCurrency] = useState<string>("SGD");
    const [cycle, setCycle] = useState("monthly");
    const [billingDate, setBillingDate] = useState("")
    const [category, setCategory] = useState("other");
    const [paymentMethod, setPaymentMethod] = useState<string>("credit_card");
    const [isActive, setIsActive] = useState<boolean>(true);
    const [isSaving, setIsSaving] = useState<boolean>(false);
    
    useEffect(() => {
        if (subscription) {
            setName(subscription.description || "");
            setFee((subscription.fee).toString());
            setCurrency(subscription.currency || "SGD");
            setCycle(subscription.billing_cycle || "monthly");
            setCategory(subscription.category || "others");
            setPaymentMethod(subscription.payment_method || "credit_card");
            setIsActive(subscription.is_active || true);
        }
    }, [subscription]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSaving) return;

        setIsSaving(true);
        try {
            await onSave({
                description: name.trim(),
                fee: parseFloat(fee),
                currency: currency,
                billing_cycle: cycle,
                next_billing_date: billingDate,
                is_active: isActive,
                payment_method: paymentMethod,
                category: category
            });
        } catch (err) {
            console.error("Unable to save: ", err);
            setIsSaving(false);
        }
        
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/30 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl w-full max-w-sm p-5 border shadow-xl space-y-4">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                    {subscription ? "Modify Subscription" : "Add Subscription"}
                </h3>
                <form onSubmit={handleSubmit} className="space-y-3 text-xs">
                    <div>
                        <label className="block font-bold text-gray-400 uppercase mb-0.5">Subscription Name</label>
                        <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Netflix, Adobe, etc." className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500" />
                    </div>
                    <div>
                        <label className="block font-bold text-gray-400 uppercase mb-0.5">Fee ($)</label>
                        <input type="number" step="0.01" required value={fee} onChange={(e) => setFee(e.target.value)} placeholder="0.00" className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500" />
                    </div>
                    <div>
                        <label className="block font-bold text-gray-400 uppercase mb-0.5">Currency</label>
                        <input type="text" required value={currency} onChange={(e) => setCurrency(e.target.value)} placeholder="SGD" className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500" />
                    </div>
                    <div>
                        <label className="block font-bold text-gray-400 uppercase mb-0.5">Payment Method</label>
                        <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="w-full px-2.5 py-1.5 border border-gray-200 bg-white rounded-lg focus:outline-none">
                            <option value="cash">Cash</option>
                            <option value="credit_card">Credit Card</option>
                            <option value="bank_transfer">Bank Transfer</option>
                        </select>
                    </div>
                    <div>
                        <label className="block font-bold text-gray-400 uppercase mb-0.5">Billing Cycle</label>
                        <select value={cycle} onChange={(e) => setCycle(e.target.value)} className="w-full px-2.5 py-1.5 border border-gray-200 bg-white rounded-lg focus:outline-none">
                            <option value="weekly">Weekly</option>
                            <option value="monthly">Monthly</option>
                            <option value="quarterly">Quarterly</option>
                            <option value="yearly">Yearly</option>
                        </select>
                    </div>
                    <div>
                        <label className="block font-bold text-gray-400 uppercase tracking-wider mb-0.5">Next Billing Date</label>
                        <input type="date" required value={billingDate} onChange={(e) => setBillingDate(e.target.value)} className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg" />
                    </div>
                    <div className="pt-1">
                        <label className="flex items-center gap-2.5 cursor-pointer p-2 rounded-lg bg-gray-50 border border-gray-100 hover:bg-gray-100/70 transition-all">
                            <input 
                                type="checkbox" 
                                checked={isActive} 
                                onChange={(e) => setIsActive(e.target.checked)} 
                                className="w-4 h-4 rounded text-indigo-600 border-gray-300 focus:ring-indigo-500 cursor-pointer" 
                            />
                            <div>
                                <span className="block font-bold text-gray-700">Active Subscription</span>
                                <span className="block text-[10px] text-gray-400 font-normal">Toggle off to stop subscription tracking</span>
                            </div>
                        </label>
                    </div>
                    <div className="pt-2 flex gap-2">
                        <button type="button" onClick={onClose} className="flex-1 border border-gray-200 py-1.5 rounded-lg text-gray-500">Cancel</button>
                        <button 
                            type="submit" 
                            disabled={isSaving} 
                            className={cn("flex-1 text-white py-1.5 rounded-lg font-bold flex items-center justify-center gap-1.5", isSaving ? "bg-indigo-400 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700")}
                        >
                            {isSaving ? (
                                <>
                                    <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                    Saving...
                                </>
                            ) : (
                                "Save"
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};