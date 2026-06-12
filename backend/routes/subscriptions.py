from flask import Blueprint, request, jsonify
from datetime import datetime, timezone
from dateutil.relativedelta import relativedelta
from models import Subscription
from .middleware import token_required

subscription_bp = Blueprint("subscription", __name__)

@subscription_bp.route("/", methods=["GET"])
@token_required
def get_all_subscriptions(current_user):
    try:
        subscriptions = Subscription.objects(user_id=current_user.id).order_by("-next_billing_date")

        if not subscriptions:
            return jsonify({"error": "Subscriptions not found or unauthorized."}), 404
            
        subscription_list = []
        for sub in subscriptions:
            subscription_list.append({
                "subscription_id": str(sub.id),
                "description": sub.description,
                "fee": float(sub.fee),
                "currency": sub.currency,
                "billing_cycle": sub.billing_cycle,
                "next_billing_date": sub.next_billing_date.isoformat() if sub.next_billing_date else None,
                "is_active": bool(sub.is_active),
                "payment_method": sub.payment_method,
                "category": sub.category
            })

        return jsonify(subscription_list), 200
    
    except Exception as e:
        return jsonify({"error": f"Failed to fetch subscriptions: {str(e)}"}), 500

@subscription_bp.route("/<string:sub_id>", methods=["GET"])
@token_required
def get_subscription(current_user, sub_id):
    try:
        sub = Subscription.objects(id=sub_id, user_id=current_user.id).first()

        if not sub:
            return jsonify({"error": "Subscriptions not found or unauthorized."}), 404
            
        subscription = {
            "subscription": str(sub.id),
            "description": sub.description,
            "fee": float(sub.fee) if sub.fee else None,
            "currency": sub.currency,
            "billing_cycle": sub.billing_cycle,
            "next_billing_date": sub.next_billing_date.isoformat() if sub.next_billing_date else None,
            "is_active": bool(sub.is_active),
            "payment_method": sub.payment_method,
            "category": sub.category
        }

        return jsonify(subscription), 200
    
    except Exception as e:
        return jsonify({"error": f"Failed to fetch subscription: {str(e)}"}), 500

@subscription_bp.route("/new", methods=["POST"])
@token_required
def create_subscription(current_user):
    data = request.get_json()
    
    if not all(k in data for k in ("description", "fee", "currency", "billing_cycle", "is_active")):
        return jsonify({"error": "Missing required fields"}), 400
    
    try:
        category = data.get("category", "others").strip().lower()
        
        # Save subscription to database
        sub = Subscription(
            user_id=current_user.id,
            description=data["description"],
            fee=data["fee"],
            currency=data["currency"],
            billing_cycle=data["billing_cycle"],
            payment_method=data["payment_method"],
            category=category,
            is_active=data["is_active"]
        )
        sub.save()

        return jsonify({"message": "New subscription recorded.", "id":str(sub.id)}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    

@subscription_bp.route("/<string:sub_id>", methods=["PUT"])
@token_required
def update_subscription(current_user, sub_id):
    data = request.get_json()
    try:
        # Fetch the subcription
        sub = Subscription.objects(id=sub_id, user_id=current_user.id).first()
        if not sub:
            return jsonify({"error": "Subscription record not found"}), 404
        
        if "description" in data:
            sub.description = data["description"].strip()
        if "fee" in data:
            sub.fee = float(data["fee"])
        if "currency" in data:
            sub.currency = data["currency"].strip().upper()
        if "category" in data:
            sub.category = data["category"]
        if "is_active" in data:
            sub.is_active = bool(data["is_active"])
        if "billing_cycle" in data:
            new_cycle = data["billing_cycle"].strip().lower()
            if new_cycle in ["weekly", "monthly", "quarterly", "annual"]:
                sub.billing_cycle = new_cycle
                # Recalculate next billing date:
                base_date = datetime.now(timezone.utc)
                if new_cycle == "weekly":
                    sub.next_billing_date = base_date + relativedelta(days=7)
                elif new_cycle == "monthly":
                    sub.next_billing_date = base_date + relativedelta(months=1)
                elif new_cycle == "quarterly":
                    sub.next_billing_date = base_date + relativedelta(months=3)
                elif new_cycle == "annual":
                    sub.next_billing_date = base_date + relativedelta(years=1)
            else:
                return jsonify({"error": "Validation failed: 'billing_cycle' must be strictly 'weekly', 'monthly', 'quarterly' or 'annual'"}), 400
        
        sub.save()

        return jsonify({
            "message": "Subscription updated successfully.",
        }), 200
    
    except Exception as e:
        return jsonify({"error": f"Failed to update subscription: {str(e)}"}), 500
