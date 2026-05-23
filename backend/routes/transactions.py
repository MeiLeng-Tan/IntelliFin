from flask import Blueprint, jsonify
from models import Transaction
from .middleware import token_required

# Define the blueprint
transactions_bp = Blueprint('transaction', __name__)

@transactions_bp.route('/', methods=['GET'])
@token_required
def get_transactions(current_user):
    try:
        # Retrieve transactions belonging to the user
        transactions = Transaction.objects(user_id=current_user).order_by('-date')

        transaction_list = []
        for t in transactions:
            transaction_list.append({
                "id": str(t.id),
                "date": t.date.isoformat(),
                "type": t.type,
                "description": t.description,
                "amount": t.amount,
                "method": t.method,
                "currency": t.currency,
                "category": t.category,
                "subscription_id": str(t.subscription_id.id) if t.subscription_id else None
            })

        return jsonify(transaction_list), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500