import { useState, useEffect } from "react";
import { cn } from "../../utils/cn";
import { AnalyticsView } from "./AnalyticsView";
import { TransactionModal } from "./components/TransactionModal";
import { transactionService } from "../../services/financeService";
import type { Transaction, Subscription, TransactionSummary } from "../../types/financeTypes";
import { SubscriptionModal } from "./components/SubscriptionModal";

export const AnalyticsLayout: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [summary, setSummary] = useState<TransactionSummary | null>(null)
  const [parsingFile, setParsingFile] = useState(false);

  // Transaction modal management state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  // Subscription modal management state
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [selectedSub, setSelectedSub] = useState<Subscription | null>(null);

  // Pagination tracking states
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [loadingOlder, setLoadingOlder] = useState<boolean>(false);
  const LIMIT = 10;

  const loadInitialData = async () => {
    try {
      setCurrentPage(1);
      const [initialPaginated, subList, summaryData] = await Promise.all([
        transactionService.getPaginatedTransactions(1, LIMIT),
        transactionService.getUserSubscriptions(),
        transactionService.getTransactionSummary()
      ]);
      setTransactions(initialPaginated.transactions);
      setHasMore(initialPaginated.has_more);
      setSubscriptions(subList);
      setSummary(summaryData);
    } catch (err) {
      console.error("Data initialization pipeline failure:", err);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // Incremental page loader
  const handleLoadOlder = async () => {
    if (loadingOlder | !hasMore) return;

    setLoadingOlder(true);
    const nextPage = currentPage + 1;

    try {
      const data = await transactionService.getPaginatedTransactions(nextPage, LIMIT);
      setTransactions((prev) => [...prev, ...data.transactions]);
      setHasMore(data.has_more);
      setCurrentPage(nextPage);
    } catch (err) {
      console.error("Pagination load pipeline broke down: ", err);
    } finally {
      setLoadingOlder(false);
    }
  };

  // Handles File Drag/Drop Upload Parsing
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setParsingFile(true);
    try {
      await transactionService.uploadStatement(e.target.files[0]);
      await loadInitialData(); 
    } catch (err) {
      console.error("AI statement parser failed:", err);
    } finally {
      setParsingFile(false);
    }
  };

  // Handle delete transactions
  const handleDeleteTransaction = async (id: string) => {
    try {
      await transactionService.deleteTransaction(id);
      // Drop transaction from ledger
      setTransactions((prev) => prev.filter((t) => t.transaction_id !== id));
      // Update transaction summary
      const updatedSummary = await transactionService.getTransactionSummary();
      setSummary(updatedSummary);
    } catch (err) {
      console.error("Failed to discard runtime collection segment:", err);
    }
  };

  // Handle save transaction
  const handleSaveTransaction = async (payload: any) => {
    try {
      const targetId = selectedTransaction?.transaction_id;
      if (targetId) {
        await transactionService.updateTransaction(targetId, payload);
      } else {
        await transactionService.createTransaction(payload);
      }
      // Trigger fetch to sync the newlt created/ modified trasactions
      await loadInitialData();
      setIsModalOpen(false);
      setSelectedTransaction(null);
    } catch (err) {
      console.error("Failed to create/ update the transaction: ", err);
    }
  };

  // Save subscription handler
  const handleSaveSubscription = async (payload: any) => {
    try {
        const targetId = selectedSub?.subscription_id || selectedSub?.id;
        if (targetId) {
            await transactionService.updateSubscription(targetId, payload);
        } else {
            await transactionService.createSubscription(payload);
        }
        await loadInitialData(); // Refresh list & summary
        setIsSubModalOpen(false);
        setSelectedSub(null);
    } catch (err) {
        console.error("Failed to commit subscription mutation:", err);
    }
};
  
  return (
    <>
            <AnalyticsView 
                transactions={transactions}
                summary={summary}
                subscriptions={subscriptions}
                hasMore={hasMore}
                loadingOlder={loadingOlder}
                parsingFile={parsingFile}
                onLoadOlder={handleLoadOlder}
                onFileUpload={handleFileUpload}
                onAddTransaction={() => { setSelectedTransaction(null); setIsModalOpen(true); }}
                onEditTransaction={(tx) => { setSelectedTransaction(tx); setIsModalOpen(true); }}
                onDeleteTransaction={handleDeleteTransaction}
                onAddSubscription={() => { setSelectedSub(null); setIsSubModalOpen(true); }}
                onEditSubscription={(sub) => { setSelectedSub(sub); setIsSubModalOpen(true); }}
            />

            {/** Transaction Modal */}
            {isModalOpen && (
                <TransactionModal 
                    transaction={selectedTransaction}
                    onClose={() => { setIsModalOpen(false); setSelectedTransaction(null); }}
                    onSave={handleSaveTransaction}
                />
            )}

            {/* New Subscription Modal */}
            {isSubModalOpen && (
              <SubscriptionModal
                subscription={selectedSub}
                onClose={() => { setIsSubModalOpen(false); setSelectedSub(null); }}
                onSave={handleSaveSubscription}
            />
        )}
        </>

    // <div className="space-y-6">
    //   <div className="flex flex-wrap justify-between items-center bg-white border border-gray-200 p-4 rounded-xl gap-4 shadow-xs">
    //     <div>
    //       <h2 className="text-base font-bold text-gray-900">Financial Ledger Engine</h2>
    //       <p className="text-xs text-gray-400">Manage manual entries, evaluate subscriptions, or parse files dynamically.</p>
    //     </div>
    //     <div className="flex items-center gap-3">
    //       {/* 📄 PDF Extraction Input trigger */}
    //       <label className={cn("px-4 py-2 border border-gray-200 text-xs font-semibold rounded-xl cursor-pointer hover:bg-gray-50 flex items-center gap-1.5 transition-all", parsingFile ? "opacity-50 pointer-events-none" : "")}>
    //         {parsingFile ? "Parsing PDF File..." : "📁 Upload Statement"}
    //         <input type="file" accept=".pdf" onChange={handleFileUpload} className="hidden" disabled={parsingFile} />
    //       </label>
    //       <button onClick={() => setIsModalOpen(true)} className="bg-indigo-600 text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-indigo-700 cursor-pointer shadow-xs">
    //         ➕ Add Entry
    //       </button>
    //     </div>
    //   </div>

    //   {/* Presentation Workspace Container mapping subscriptions array and callback hooks */}
    //   <AnalyticsView 
    //     transactions={transactions} 
    //     summary={summary}
    //     subscriptions={subscriptions}
    //     onAddTransaction={handleAddTransaction}
    //     onEditTransaction={handleStartEdit} 
    //     onDeleteTransaction={handleDelete} 
    //     onAddSubscription={handleAddSubscription}
    //     onEditSubscription={handleEditSubscription}
    //     hasMore={hasMore}
    //     loadingOlder={loadingOlder}
    //     onLoadOlder={fetchNextDataChunk}
    //   />

      

    //   {/* Creation / Mutation Overlay Dialog */}
    //   {isModalOpen && (
    //     <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/30 backdrop-blur-xs p-4">
    //       <div className="bg-white rounded-xl w-full max-w-sm p-5 border shadow-xl space-y-4">
    //         <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">{editingId ? "Modify Record Node" : "New Entry Node"}</h3>
    //         <form onSubmit={handleFormSubmit} className="space-y-3 text-xs">
    //           <div className="flex bg-gray-100 p-0.5 rounded-lg">
    //             <button type="button" onClick={() => setType("expense")} className={cn("flex-1 py-1 font-semibold rounded-md", type === "expense" ? "bg-white text-rose-600" : "text-gray-500")}>Expense</button>
    //             <button type="button" onClick={() => setType("income")} className={cn("flex-1 py-1 font-semibold rounded-md", type === "income" ? "bg-white text-emerald-600" : "text-gray-500")}>Income</button>
    //           </div>
    //           <div>
    //             <label className="block font-bold text-gray-400 uppercase tracking-wider mb-0.5">Amount ($)</label>
    //             <input type="number" step="0.01" required value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 text-xs" />
    //           </div>
    //           <div>
    //             <label className="block font-bold text-gray-400 uppercase tracking-wider mb-0.5">Description</label>
    //             <input type="text" required value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. AWS Cloud Cluster" className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 text-xs" />
    //           </div>
    //           <div>
    //             <label className="block font-bold text-gray-400 uppercase tracking-wider mb-0.5">Category</label>
    //             <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-2.5 py-1.5 border border-gray-200 bg-white rounded-lg focus:outline-none focus:border-indigo-500 text-xs">
    //               <option value="development">Development</option>
    //               <option value="rent">Rent</option>
    //               <option value="utilities">Utilities</option>
    //               <option value="food">Food</option>
    //               <option value="transport">Transport</option>
    //               <option value="shopping">Shopping</option>
    //               <option value="others">Others</option>
    //             </select>
    //           </div>
    //           <div>
    //             <label className="block font-bold text-gray-400 uppercase tracking-wider mb-0.5">Date Signature</label>
    //             <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs" />
    //           </div>
    //           <div className="pt-2 flex gap-2">
    //             <button type="button" onClick={closeModal} className="flex-1 border border-gray-200 py-1.5 rounded-lg text-gray-500">Cancel</button>
    //             <button type="submit" className="flex-1 bg-indigo-600 text-white py-1.5 rounded-lg font-bold">{editingId ? "Save Changes" : "Commit"}</button>
    //           </div>
    //         </form>
    //       </div>
    //     </div>
    //   )}
    // </div>
  );
};