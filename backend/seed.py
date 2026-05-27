import os
import random
from datetime import datetime, timedelta, timezone
from flask import Flask
from dotenv import load_dotenv
from models import db, User, Subscription, Transaction, UserDocument
import bcrypt

# Load environment variables
load_dotenv()
mongo_uri = os.getenv("MONGO_URI")
db_name = os.getenv("DB_NAME", "intellifin_db")

def seed_database():
    # Clear existing data 
    print("Clearing existing collections")
    User.objects.delete()
    Transaction.objects.delete()
    Subscription.objects.delete()
    #UserDocument.objects.delete()

    plain_password = "123456"
    hashed_password = bcrypt.hashpw(plain_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    # Instantiate and save a user
    users = [
        {"first_name": "Mei Leng", "last_name": "Tan", "username": "tml", "password": hashed_password},
        {"first_name": "Marcus", "last_name": "Lim", "username": "marcus", "password": hashed_password},
        {"first_name": "Sarah", "last_name": "Tan", "username": "sarah", "password": hashed_password},
        {"first_name": "Florian", "last_name": "Beeres", "username": "florian", "password": hashed_password},
        {"first_name": "Kavitha", "last_name": "Almeida", "username": "kavitha", "password": hashed_password},
    ]

    subscriptions = [
        {"name": "Netflix Premium", "fee": 22.98, "currency": "SGD", "billing_cycle": "monthly"},
        {"name": "Spotify Family", "fee": 17.98, "currency": "SGD", "billing_cycle": "monthly"},
        {"name": "YouTube Premium", "fee": 13.98, "currency": "SGD", "billing_cycle": "monthly"},
        {"name": "Gym Membership", "fee": 95.00, "currency": "SGD", "billing_cycle": "monthly"},
        {"name": "iCloud+ 2TB", "fee": 14.98, "currency": "USD", "billing_cycle": "monthly"}
    ]

    categories = ["food", "transport", "utilities", "others"]
    methods = ["cash", "credit_card", "bank_transfer"]
    descriptions = {
        "food": ["Hawker Centre", "FairPrice Supermarket", "Cafe Coffee", "Food Delivery"],
        "transport": ["Grab Ride", "EZ-Link Top-up", "Taxi"],
        "utilities": ["SP Group Utilities", "Mobile Bill"],
        "others": ["Gadget Shop", "Movie Tickets", "Bookstore"]
    }

    print("Creating mock user data with random subscriptions and transactions...")

    for user in users:
        new_user = User(
            first_name=user["first_name"],
            last_name=user["last_name"],
            username=user["username"],
            password=hashed_password
        )
        new_user.save()

        num_subs = random.randint(0, 4)
        chosen_subscription = random.sample(subscriptions, num_subs)

        for sub in chosen_subscription:
            sub_record = Subscription(
                user_id=new_user, 
                name=sub["name"],
                fee=sub["fee"],
                currency=sub["currency"],
                billing_cycle=sub["billing_cycle"],
                next_billing_date = datetime.now(timezone.utc) + timedelta(days=30),
                is_active=True,
                created_at=datetime.now(timezone.utc) - timedelta(days=60)
            )
            sub_record.save()
            
            # Add transactions linked to the subscription model
            for i in range(2):
                past_date = datetime.now(timezone.utc) - timedelta(days=30 * i + 2)
                Transaction(
                    user_id=new_user,
                    date=past_date,
                    type="expense",
                    description=f"{sub["name"]} Subscription",
                    amount=sub["fee"],
                    method="credit_card",
                    currency=sub["currency"],
                    category="subscription",
                    subscription_id=sub_record,
                    created_at=past_date,
                    updated_at=past_date
                ).save()

        # Generate 15 randomized transaction
        for _ in range(15):
            category = random.choice(categories)
            t_type = "expense" if random.random() > 0.15 else "income"
            
            if t_type == "income":
                description = "Salary Paycheck" if random.random() > 0.5 else "Freelance Payout"
                amount = round(random.uniform(500, 4000), 2)
                category = "others"
                method = "bank_transfer"
            else:
                description = random.choice(descriptions[category])
                amount = round(random.uniform(5, 120), 2)
                method = random.choice(methods)

            random_days_ago = random.randint(0, 30)
            t_date = datetime.now(timezone.utc) - timedelta(days=random_days_ago)

            Transaction(
                user_id=new_user,
                date=t_date,
                type=t_type,
                description=description,
                amount=amount,
                method=method,
                currency="SGD",
                category=category,
                subscription_id=None,
                created_at=t_date,
                updated_at=t_date
            ).save()

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
