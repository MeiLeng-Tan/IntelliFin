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

    plain_password = "password123"
    hashed_password = bcrypt.hashpw(plain_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    # Instantiate and save a user
    print("Creating users...")
    user = User(
        first_name="Mei Leng",
        last_name="Tan",
        username="meileng_dev",
        password=hashed_password
    )
    user.save()

    # Instantiate and save subscriptions
    print("Creating subscription tracking records...")
    sub_netflix = Subscription(
        user_id=user, 
        name="Netflix Premium",
        fee=22.98,
        currency="SGD",
        billing_cycle="monthly",
        next_billing_date = datetime.now(timezone.utc) + timedelta(days=30),
        is_active=True,
        created_at=datetime.now(timezone.utc) - timedelta(days=60)
    )
    sub_netflix.save()

    sub_spotify = Subscription(
        user_id=user,
        name="Spotify Family",
        fee=17.98,
        currency="SGD",
        billing_cycle="monthly",
        next_billing_date = datetime.now(timezone.utc) + timedelta(days=30),
        is_active=True,
        created_at=datetime.now(timezone.utc) - timedelta(days=90)
    )
    sub_spotify.save()

    # Generate random transaction history
    print("Creating transactions...")
    categories = ["food", "transport", "utilities", "others"]
    methods = ["cash", "credit_card", "bank_transfer"]
    descriptions = {
        "food": ["Hawker Centre", "FairPrice Supermarket", "Cafe Coffee", "Food Delivery"],
        "transport": ["Grab Ride", "EZ-Link Top-up", "Taxi"],
        "utilities": ["SP Group Utilities", "Mobile Bill"],
        "others": ["Gadget Shop", "Movie Tickets", "Bookstore"]
    }

    # Add transactions linked to the subscription model
    for i in range(2):
        past_date = datetime.now(timezone.utc) - timedelta(days=30 * i + 2)
        Transaction(
            user_id=user,
            date=past_date,
            type="expense",
            description="Netflix Premium Subscription",
            amount=22.98,
            method="credit_card",
            currency="SGD",
            category="utilities",
            subscription_id=sub_netflix,
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
            user_id=user,
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
