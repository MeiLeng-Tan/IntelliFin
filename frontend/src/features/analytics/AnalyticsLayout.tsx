import { useState, useEffect } from "react";
import { cn } from "../../utils/cn";
import { AnalyticsView } from "./AnalyticsView";
import { transactionService } from "../../services/financeService";
import type { Transaction, Subscription, TransactionSummary } from "../../types/financeTypes";

export const AnalyticsLayout: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [summary, setSummary] = useState<TransactionSummary | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [parsingFile, setParsingFile] = useState(false);

  // Unified Creation & Edit Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [type, setType] = useState<"income" | "expense">("expense");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("development");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  

  const loadFeatureData = async () => {
    try {
      const [txList, subList, summaryData] = await Promise.all([
        transactionService.getUserTransactions(),
        transactionService.getUserSubscriptions(),
        transactionService.getTransactionSummary()
      ]);
      setTransactions(txList);
      setSubscriptions(subList);
      setSummary(summaryData);
    } catch (err) {
      console.error("Data ecosystem initialization pipeline failure:", err);
    }
  };
  useEffect(() => {
    loadFeatureData();
  }, []);

  // 📂 Handles File Drag/Drop Upload Parsing
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setParsingFile(true);
    try {
      const newExtractedNodes = await transactionService.uploadStatement(e.target.files[0]);
      setTransactions((prev) => [...newExtractedNodes, ...prev]);
      await loadFeatureData(); // Re-sync subscription states if new ones match
    } catch (err) {
      console.error("AI statement parser failed:", err);
    } finally {
      setParsingFile(false);
    }
  };

  // Open Form Modal in Update Mode
  const handleStartEdit = (tx: Transaction) => {
    setEditingId(tx.transaction_id);
    setType(tx.type);
    setAmount(tx.amount.toString());
    setDescription(tx.description);
    setCategory(tx.category);
    setDate(tx.date.split("T")[0]);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = parseFloat(amount);
    
    const basePayload = {
      date: new Date(date).toISOString(),
      type,
      description: description.trim(),
      amount: numericAmount,
      category: category.trim().toLowerCase(),
      method: "cash",
      currency: "SGD"
    };
    

    try {
      if (editingId) {
        // Run PUT Route update pipeline
        // await transactionService.updateTransaction(editingId, basePayload);
        // setTransactions((prev) => prev.map((t) => t.transaction_id === editingId ? { ...t, ...basePayload } : t));
      } else {
        // Run POST Manual pipeline
        // const result = await transactionService.createTransaction(basePayload);
        // const newTx: Transaction = { transaction_id: result.id, ...basePayload, source: "manual" };
        // setTransactions((prev) => [newTx, ...prev]);
      }
      closeModal();
    } catch (err) {
      console.error("Failed to persist transaction context:", err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await transactionService.delete(id);
      setTransactions((prev) => prev.filter((t) => t.transaction_id !== id));
      setSubscriptions((prev) => prev.filter((s) => s.subscription_id !== id)); // Clean local references if needed
    } catch (err) {
      console.error("Failed to delete record identifier node:", err);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setAmount("");
    setDescription("");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center bg-white border border-gray-200 p-4 rounded-xl gap-4 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-gray-900">Financial Ledger Engine</h2>
          <p className="text-xs text-gray-400">Manage manual entries, evaluate subscriptions, or parse files dynamically.</p>
        </div>
        <div className="flex items-center gap-3">
          {/* 📄 PDF Extraction Input trigger */}
          <label className={cn("px-4 py-2 border border-gray-200 text-xs font-semibold rounded-xl cursor-pointer hover:bg-gray-50 flex items-center gap-1.5 transition-all", parsingFile ? "opacity-50 pointer-events-none" : "")}>
            {parsingFile ? "Parsing PDF File..." : "📁 Upload Statement"}
            <input type="file" accept=".pdf" onChange={handleFileUpload} className="hidden" disabled={parsingFile} />
          </label>
          <button onClick={() => setIsModalOpen(true)} className="bg-indigo-600 text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-indigo-700 cursor-pointer shadow-xs">
            ➕ Add Entry
          </button>
        </div>
      </div>

      {/* Presentation Workspace Container mapping subscriptions array and callback hooks */}
      <AnalyticsView 
        transactions={transactions} 
        summary={summary}
        subscriptions={subscriptions}
        onDeleteTransaction={handleDelete} 
        onEditTransaction={handleStartEdit} 
        // onEditSubscription={handleDelete}
      />

      {/* Creation / Mutation Overlay Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/30 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl w-full max-w-sm p-5 border shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">{editingId ? "Modify Record Node" : "New Entry Node"}</h3>
            <form onSubmit={handleFormSubmit} className="space-y-3 text-xs">
              <div className="flex bg-gray-100 p-0.5 rounded-lg">
                <button type="button" onClick={() => setType("expense")} className={cn("flex-1 py-1 font-semibold rounded-md", type === "expense" ? "bg-white text-rose-600" : "text-gray-500")}>Expense</button>
                <button type="button" onClick={() => setType("income")} className={cn("flex-1 py-1 font-semibold rounded-md", type === "income" ? "bg-white text-emerald-600" : "text-gray-500")}>Income</button>
              </div>
              <div>
                <label className="block font-bold text-gray-400 uppercase tracking-wider mb-0.5">Amount ($)</label>
                <input type="number" step="0.01" required value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 text-xs" />
              </div>
              <div>
                <label className="block font-bold text-gray-400 uppercase tracking-wider mb-0.5">Description</label>
                <input type="text" required value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. AWS Cloud Cluster" className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 text-xs" />
              </div>
              <div>
                <label className="block font-bold text-gray-400 uppercase tracking-wider mb-0.5">Category</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-2.5 py-1.5 border border-gray-200 bg-white rounded-lg focus:outline-none focus:border-indigo-500 text-xs">
                  <option value="development">Development</option>
                  <option value="rent">Rent</option>
                  <option value="utilities">Utilities</option>
                  <option value="food">Food</option>
                  <option value="transport">Transport</option>
                  <option value="shopping">Shopping</option>
                  <option value="others">Others</option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-gray-400 uppercase tracking-wider mb-0.5">Date Signature</label>
                <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs" />
              </div>
              <div className="pt-2 flex gap-2">
                <button type="button" onClick={closeModal} className="flex-1 border border-gray-200 py-1.5 rounded-lg text-gray-500">Cancel</button>
                <button type="submit" className="flex-1 bg-indigo-600 text-white py-1.5 rounded-lg font-bold">{editingId ? "Save Changes" : "Commit"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};