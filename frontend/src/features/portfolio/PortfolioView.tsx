import type { PortfolioSummary } from "../../types/portfolioTypes";

interface PortfolioViewProps {
    portfolio: PortfolioSummary;
}

export const PortfolioView: React.FC<PortfolioViewProps> = ({ portfolio }) => {
    return (
        <div className="space-y-6">
            {/** Metric cards row (3 columns) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/** Total stacked balance */}
                <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm flex flex-col justify-between">
                    <div>
                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                            Total Portfolio Value
                        </span>
                        <h3 className="text-3xl font-bold text-indigo-600 mt-2">
                            S$ {portfolio.totalValueSGD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </h3>
                    </div>
                </div>

                {/** Equities breakdown */}
                <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Equities Allocation
                    </span>
                    <h3 className="text-2xl font-bold text-blue-600 mt-2">
                        S$ {portfolio.assetDistribution.equity.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </h3>
                    <div className="w-full bg-gray-100 h-2 rounded-full mt-3 overflow-hidden">
                        <div
                            className="bg-blue-500 h-2 rounded-full transition-all duration-500" 
                            style={{ width: `${portfolio.totalValueSGD > 0 ? (portfolio.assetDistribution.equity / portfolio.totalValueSGD) * 100 : 0}%` }}
                        />
                    </div>
                </div>

                {/** Crypto breakdown */}
                <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Cryptocurrency Assets
                    </span>
                    <h3 className="text-2xl font-bold text-amber-600 mt-2">
                        S$ {portfolio.assetDistribution.crypto.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </h3>
                    <div className="w-full bg-gray-100 h-2 rounded-full mt-3 overflow-hidden">
                        <div
                            className="bg-amber-500 h-2 rounded-full transition-all duration-500" 
                            style={{ width: `${portfolio.totalValueSGD > 0 ? (portfolio.assetDistribution.crypto / portfolio.totalValueSGD) * 100 : 0}%` }}
                        />
                    </div>
                </div>
            </div> 

            {/** Main Asset Ledger Table (spans full width underneath the cards) */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                    <h2 className="text-sm font-semibold text-gray-800">
                        Active Holdings Ledger
                    </h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-gray-200 bg-gray-50 text-gray-400 text-xs uppercase font-medium tracking-wider">
                                <th className="py-3 px-6">Asset Symbol</th>
                                <th className="py-3 px-6">Classification</th>
                                <th className="py-3 px-6 text-right">Volume Held</th>
                                <th className="py-3 px-6 text-right">Avg Cost Basis</th>
                                <th className="py-3 px-6 text-right">Total Net Exposure</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-sm text-gray-600">
                            {portfolio.portfolios.map((item, idx) => {
                                const cost = item.total_quantity * item.average_buy_price;
                                return (
                                    <tr key={idx} className="hover:bg-gray-50/70 transition-colors">
                                        <td className="py-4 px-6 font-semibold text-gray-900 tracking-wide">
                                            {item.ticker}
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider ${
                                                item.asset_type === 'crypto' 
                                                    ? 'bg-amber-50 text-amber-700 border border-amber-200' 
                                                    : 'bg-blue-50 text-blue-700 border border-blue-200'
                                            }`}>
                                                {item.asset_type}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-right font-mono text-gray-900">
                                            {item.total_quantity.toLocaleString(undefined, { maximumFractionDigits: 8 })}
                                        </td>
                                        <td className="py-4 px-6 text-right font-mono">
                                            S$ {item.average_buy_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </td>
                                        <td className="py-4 px-6 text-right font-mono font-semibold text-gray-900">
                                            S$ {cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};