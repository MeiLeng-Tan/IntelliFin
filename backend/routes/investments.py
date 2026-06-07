from flask import Blueprint, request, jsonify
from decimal import Decimal
from datetime import datetime, timezone
from dateutil.relativedelta import relativedelta
from models import InvestmentPortfolio
from .middleware import token_required


investment_bp = Blueprint("investment", __name__)

@investment_bp.route("/", methods=["GET"])
@token_required
def get_investment_portfolio(current_user):
    try:
        investments = InvestmentPortfolio.objects(user_id=current_user.id)

        if not investments:
            return jsonify({"error": "Investment portfolio not found or unauthorized."}), 404
            
        investment_portfolio = []
        for inv in investments:
            investment_portfolio.append({
                "ticker": inv.ticker,
                "asset_type": inv.asset_type,
                "total_quantity": inv.total_quantity,
                "average_buy_price": float(inv.average_buy_price)
            })

        return jsonify(investment_portfolio), 200
    
    except Exception as e:
        return jsonify({"error": f"Failed to fetch investment portfolio: {str(e)}"}), 500
    
@investment_bp.route("/summary", methods=["GET"])
@token_required
def get_portfolio_summary(current_user):
    raw_positions = InvestmentPortfolio.objects(user_id=current_user.id)

    positions_list = []
    total_value_sgd = Decimal(0.0)
    distribution = {
        "equity": Decimal(0.0), 
        "crypto": Decimal(0.0), 
        "commodity": Decimal(0.0), 
        "cash": Decimal(0.0)
    }

    for pos in raw_positions:
        # Calculate individual position cost
        pos_cost = pos.total_quantity * pos.average_buy_price
        total_value_sgd += pos_cost

        # Accumulate asset-class specific totals
        if pos.asset_type in distribution:
            distribution[pos.asset_type] += pos_cost
        
        positions_list.append({
            "asset_type": pos.asset_type,
            "ticker": pos.ticker,
            "total_quantity": pos.total_quantity,
            "average_buy_price": pos.average_buy_price
        })
    
    return jsonify({
        "portfolios": positions_list,
        "totalValueSGD": float(total_value_sgd),
        "assetDistribution": {k: float(v) for k, v in distribution.items()}
    }), 200
