import os
import random
import time
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from flask import Flask
from dotenv import load_dotenv
import bcrypt
from qdrant_client import QdrantClient

from models import db, User, Subscription, Transaction, InvestmentPortfolio
from services import sync_transaction_to_qdrant
from services.rag_service import client as qdrant_raw_client

# Load environment variables
load_dotenv()
mongo_uri = os.getenv("MONGO_URI")
db_name = os.getenv("DB_NAME", "intellifin_db")
qdrant_url = os.getenv("QDRANT_URL")
qdrant_api_key = os.getenv("QDRANT_API_KEY")
qdrant_collection = os.getenv("QDRANT_COLLECTION")

def seed_database():
    # Clear existing data 
    print("Clearing existing collections")
    User.objects.delete()
    Transaction.objects.delete()
    Subscription.objects.delete()
    #UserDocument.objects.delete()
    # Clear vector database
    client = QdrantClient(
        url=qdrant_url,
        api_key=qdrant_api_key
    )
    if qdrant_raw_client.collection_exists(qdrant_collection):
        print(f"Clearing existing Qdrant collection {qdrant_collection}")
        qdrant_raw_client.delete_collection(qdrant_collection)
        # Wait for the cloud node cluster to complete the wipe loop
        time.sleep(3)

    from qdrant_client.http import models as qdrant_models
    if not qdrant_raw_client.collection_exists(qdrant_collection):
        print(f"Creating a clean {qdrant_collection} collection")
        qdrant_raw_client.create_collection(
            collection_name=qdrant_collection,
            vectors_config=qdrant_models.VectorParams(
                size=1536,
                distance=qdrant_models.Distance.COSINE
            )
        )
        qdrant_raw_client.create_payload_index(
            collection_name=qdrant_collection,
            field_name="metadata.user_id",
            field_schema=qdrant_models.PayloadSchemaType.KEYWORD
        )
        time.sleep(1)
        
    plain_password = "123456"
    hashed_password = bcrypt.hashpw(plain_password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    # Instantiate and save a user
    users = [
        {"first_name": "demo", "last_name": "user", "email": "demo@email.com"},
        {"first_name": "Marcus", "last_name": "Lim", "email": "marcus@email.com"},
        {"first_name": "Sarah", "last_name": "Tan", "email": "sarah@email.com"},
        {"first_name": "Florian", "last_name": "Beeres", "email": "florian@email.com"},
        {"first_name": "Kavitha", "last_name": "Almeida", "email": "kavitha@email.com"},
    ]

    subscriptions = [
        {"description": "Netflix Premium", "fee": 22.98, "currency": "SGD", "billing_cycle": "monthly", "category": "entertainment"},
        {"description": "Spotify Family", "fee": 17.98, "currency": "SGD", "billing_cycle": "monthly", "category": "entertainment"},
        {"description": "YouTube Premium", "fee": 13.98, "currency": "SGD", "billing_cycle": "monthly", "category": "entertainment"},
        {"description": "Gym Membership", "fee": 95.00, "currency": "SGD", "billing_cycle": "monthly", "category": "fitness"},
        {"description": "iCloud+ 2TB", "fee": 14.98, "currency": "USD", "billing_cycle": "monthly", "category": "software"}
    ]

    categories = ["food", "transport", "utilities", "others"]
    methods = ["cash", "credit_card", "bank_transfer"]
    descriptions = {
        "food": ["Hawker Centre", "FairPrice Supermarket", "Cafe Coffee", "Food Delivery"],
        "transport": ["Grab Ride", "EZ-Link Top-up", "Taxi"],
        "utilities": ["SP Group Utilities", "Mobile Bill"],
        "others": ["Gadget Shop", "Movie Tickets", "Bookstore"]
    }

    assets = [
        {"ticker": "AAPL", "asset_type": "equity", "base_price": 180.0},
        {"ticker": "TSLA", "asset_type": "equity", "base_price": 175.0},
        {"ticker": "BTC", "asset_type": "crypto", "base_price": 63000.0},
        {"ticker": "ETH", "asset_type": "crypto", "base_price": 3400.0},
    ]

    print("Creating mock user data with portfolios and random transactions...")

    for user in users:
        new_user = User(
            first_name=user["first_name"],
            last_name=user["last_name"],
            email=user["email"],
            password=hashed_password
        )
        new_user.save()

        num_subs = random.randint(0, 4)
        chosen_subscription = random.sample(subscriptions, num_subs)

        for sub in chosen_subscription:
            sub_record = Subscription(
                user_id=new_user.id, 
                description=sub["description"],
                fee=Decimal(str(sub["fee"])),
                currency=sub["currency"],
                billing_cycle=sub["billing_cycle"],
                next_billing_date = datetime.now(timezone.utc) + timedelta(days=30),
                is_active=True,
                payment_method="credit_card",
                category=sub["category"],
                created_at=datetime.now(timezone.utc) - timedelta(days=60)
            )
            sub_record.save()
            
            # Add transactions linked to the subscription model
            for i in range(3):
                past_date = datetime.now(timezone.utc) - timedelta(days=30 * i + 2)
                tx_sub = Transaction(
                    user_id=new_user.id,
                    date=past_date,
                    type="expense",
                    description=f"{sub["description"]} Subscription",
                    amount=Decimal(str(sub["fee"])),
                    method="credit_card",
                    currency=sub["currency"],
                    category="subscription",
                    subscription_id=sub_record.id,
                    created_at=past_date,
                    updated_at=past_date
                )
                tx_sub.save()
                sync_transaction_to_qdrant(tx_sub)

        # Generate portfolio data
        if new_user.first_name == "demo":
            demo_trades = [
                {"ticker": "AAPL", "asset_type": "equity", "action": "buy", "quantity": 15.0, "price_per_unit": 190.00, "days_ago": 45},
                {"ticker": "AAPL", "asset_type": "equity", "action": "buy", "quantity": 10.0, "price_per_unit": 170.00, "days_ago": 20},
                {"ticker": "TSLA", "asset_type": "equity", "action": "buy", "quantity": 20.0, "price_per_unit": 180.00, "days_ago": 30},
                {"ticker": "TSLA", "asset_type": "equity", "action": "sell", "quantity": 5.0, "price_per_unit": 195.00, "days_ago": 5},
                {"ticker": "BTC", "asset_type": "crypto", "action": "buy", "quantity": 0.5, "price_per_unit": 62000.00, "days_ago": 15}
            ]
            for trade in demo_trades:
                trade_date = datetime.now(timezone.utc) - timedelta(days=trade["days_ago"])
                total_amount = Decimal(str(trade["quantity"] * trade["price_per_unit"]))

                tx_invest = Transaction(
                    user_id=new_user.id,
                    date=trade_date,
                    type="investment",
                    description=f"{trade["action"].upper()} {trade["quantity"]} {trade["ticker"]}",
                    amount=total_amount,
                    method="bank_transfer",
                    currency="SGD",
                    category="investment",
                    trade_action = trade["action"],
                    ticker = trade["ticker"],
                    quantity = trade["quantity"],
                    price_per_unit = trade["price_per_unit"],
                    created_at=trade_date,
                    updated_at=trade_date
                )
                tx_invest.save()
                sync_transaction_to_qdrant(tx_invest)

            # Save into investment_portfolio for UI and AI utility
            InvestmentPortfolio(user_id=new_user.id, ticker="AAPL", asset_type="equity", total_quantity=25.0, average_buy_price=182.0).save()
            InvestmentPortfolio(user_id=new_user.id, ticker="TSLA", asset_type="equity", total_quantity=15.0, average_buy_price=180.0).save()
            InvestmentPortfolio(user_id=new_user.id, ticker="BTC", asset_type="crypto", total_quantity=0.5, average_buy_price=62000.0).save()
            
        else:
            chosen_assets = random.sample(assets, random.randint(1,3))
            for asset in chosen_assets:
                qty = round(random.uniform(5,50), 2) if asset["asset_type"] == "equity" else round(random.uniform(0.1, 1.5), 4)
                buy_price = round(asset["base_price"] * random.uniform(0.9, 1.1), 2)
                total_amount = Decimal(str(qty * buy_price))
                trade_date = datetime.now(timezone.utc) - timedelta(days=random.randint(1,20))

                tx_invest = Transaction(
                    user_id=new_user.id,
                    date=trade_date,
                    type="investment",
                    description=f"BUY {qty} {asset["ticker"]}",
                    amount=total_amount,
                    method="bank_transfer",
                    currency="SGD",
                    category="investment",
                    trade_action = "buy",
                    ticker = asset["ticker"],
                    quantity = qty,
                    price_per_unit = buy_price,
                    source = "manual",
                    created_at=trade_date,
                    updated_at=trade_date
                )
                tx_invest.save()
                sync_transaction_to_qdrant(tx_invest)

                InvestmentPortfolio(
                    user_id=new_user.id,
                    ticker=asset["ticker"],
                    asset_type=asset["asset_type"],
                    total_quantity=qty,
                    average_buy_price=buy_price
                ).save()

        # Generate 50 randomized transaction
        for _ in range(50):
            category = random.choice(categories)
            t_type = "expense" if random.random() > 0.15 else "income"
            
            if t_type == "income":
                description = "Salary Paycheck" if random.random() > 0.5 else "Freelance Payout"
                amount = round(random.uniform(500, 4000), 2)
                category = "paycheck"
                method = "bank_transfer"
            else:
                description = random.choice(descriptions[category])
                amount = round(random.uniform(5, 120), 2)
                method = random.choice(methods)

            random_days_ago = random.randint(0, 90)
            t_date = datetime.now(timezone.utc) - timedelta(days=random_days_ago)

            tx = Transaction(
                user_id=new_user.id,
                date=t_date,
                type=t_type,
                description=description,
                amount=Decimal(str(amount)),
                method=method,
                currency="SGD",
                category=category,
                subscription_id=None,
                created_at=t_date,
                updated_at=t_date
            )
            tx.save()
            sync_transaction_to_qdrant(tx)

    print(f"\n[SUCCESS] Database seeding complete!")

if __name__ == "__main__":
    # Application instance for database connection initialization
    app = Flask(__name__)
    
    # Configure MongoDB connection
    app.config["MONGODB_SETTINGS"] = {
        "host": mongo_uri,
        "db": db_name,
    }
    
    db.init_app(app)
    
    with app.app_context():
        seed_database()
