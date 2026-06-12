import { useState, useEffect } from "react";
import { AnalyticsView } from "./AnalyticsView";
import { TransactionModal } from "./components/TransactionModal";
import { transactionService } from "../../services/financeService";
import type { Transaction, Subscription, TransactionSummary } from "../../types/financeTypes";
import { SubscriptionModal } from "./components/SubscriptionModal";

export const AnalyticsLayout: React.FC = () => {
  const [monthFilter, setMonthFilter] = useState("all");
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
        transactionService.getPaginatedTransactions(1, LIMIT, monthFilter),
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
  }, [monthFilter]);

  // Incremental page loader
  const handleLoadOlder = async () => {
    if (loadingOlder || !hasMore) return;

    setLoadingOlder(true);
    const nextPage = currentPage + 1;

    try {
      const data = await transactionService.getPaginatedTransactions(nextPage, LIMIT, monthFilter);
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
        const targetId = selectedSub?.subscription_id;
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
                monthFilter={monthFilter} 
                onMonthFilterChange={setMonthFilter}
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
  );
};