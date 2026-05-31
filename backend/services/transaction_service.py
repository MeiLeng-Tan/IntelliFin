from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta
from decimal import Decimal
from models import Subscription

def handle_subscription_linking(current_user_id, description, amount, currency, tx_date, category, inferred_cycle):
    """
    Check for subscription categories, find or create the subscription database and return its ID
    """
    if "subscription" not in category.lower():
        return None
    
    # Check if the subscription already exists for the user
    existing_sub = Subscription.objects(
        user_id=current_user_id,
        name__icontains=description.strip()
    ).first()

    if existing_sub:
        existing_sub.fee = Decimal(str(amount))
        existing_sub.currency = currency.upper()
        existing_sub.save()
        return existing_sub
    
    # Determine billing_cycle with fallbacks defaults
    billing_cycle = inferred_cycle.lower() if inferred_cycle in ["weekly", "monthly", "quarterly", "annual"] else "monthly"

    # If transaction date is missing, use current server time 
    base_date = tx_date if isinstance(tx_date, datetime) else datetime.now()

    if billing_cycle == "weekly":
        next_billing_date = base_date + relativedelta(days=7)
    elif billing_cycle == "monthly":
        next_billing_date = base_date + relativedelta(months=1)
    elif billing_cycle == "quarterly":
        next_billing_date = base_date + relativedelta(months=3)
    elif billing_cycle == "annual":
        next_billing_date = base_date + relativedelta(years=1)

    # Create a new subscription if none exists
    new_sub = Subscription(
        user_id=current_user_id,
        name=description.strip(),
        fee=Decimal(str(amount)),
        currency=currency.upper(), 
        billing_cycle=billing_cycle,
        next_billing_date=next_billing_date,
        is_active=True
    )
    new_sub.save()
    return new_sub

