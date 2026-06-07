export interface InvestmentPositions {
    asset_type: "equity" | "crypto" | "commodity" | "cash";
    ticker: string;
    total_quantity: number;
    average_buy_price: number;
}

export interface PortfolioSummary {
    portfolios: InvestmentPositions[];
    totalValueSGD: number;
    assetDistribution: {
        equity: number;
        crypto: number;
        commodity: number;
        cash: number;
    }
}