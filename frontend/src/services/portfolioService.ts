import api from "./api";
import type { InvestmentPositions, PortfolioSummary } from "../types/portfolioTypes";

export const investmentService = {
     /**
     * Get /api/portfolio
     * Get user's investment portfolio
     */
    getUserInvestments: async (): Promise<InvestmentPositions[]> => {
        const response = await api.get<InvestmentPositions[]>("/portfolio/");
        return response.data;
    },

    getUserPortfolioSummary: async (): Promise<PortfolioSummary> => {
        const response = await api.get<PortfolioSummary>("/portfolio/summary");
        return response.data
    }
}
