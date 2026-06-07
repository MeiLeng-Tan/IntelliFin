import { useEffect, useState } from "react";
import { PortfolioView  } from "./PortfolioView";
import { investmentService } from "../../services/portfolioService";
import type { PortfolioSummary } from "../../types/portfolioTypes";

export const PortfolioLayout: React.FC = () => {
    const [portfolioData, setPortfolioData] = useState<PortfolioSummary | null>(null)
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchPortfolio = async () => {
            try {
                setIsLoading(true);
                const data = await investmentService.getUserPortfolioSummary();
                setPortfolioData(data);
                setError(null);
            } catch (err) {
                console.error("Failed to fetch user portfolio:", err);
                setError("Could not load your portfolio. Please try again.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchPortfolio();
    }, []);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-red-700">
                {error}
            </div>
        );
    }

    if (!portfolioData || portfolioData.portfolios.length === 0) {
        return (
            <div className="text-center p-12 bg-white border border-dashed border-gray-300 rounded-2xl">
                <h3 className="text-lg font-medium text-gray-900">No positions found</h3>
                <p className="text-gray-500 mt-2">Start by adding your first investment to see your summary.</p>
                <button className="mt-6 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                    + Add Investment
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-6">
            <header className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Investment Portfolio</h1>
                <p className="text-gray-500">Real-time overview of your net exposure and allocations.</p>
            </header>

            <PortfolioView portfolio={portfolioData} />
        </div>
    );  
};