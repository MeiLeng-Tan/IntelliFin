"""
Transaction model schema for 'transaction' collection.
"""

from datetime import datetime, timezone
from mongoengine import Document, StringField, DecimalField, DateTimeField, ReferenceField, CASCADE, NULLIFY

class Transaction(Document):
    """
    Define transaction collection schema
    """
    meta = {
        "collection": "transactions",
        "indexes": [
            {"fields": ["user_id", "-date"]}
        ]
    }

    # Pass reference class name as string
    user_id = ReferenceField("User", reverse_delete_rule=CASCADE, required=True)
    subscription_id = ReferenceField("Subscription", reverse_delete_rule=NULLIFY, default=None)
    
    date = DateTimeField(required=True, default=lambda: datetime.now(timezone.utc))
    type = StringField(required=True, choices=['income', 'expense'])
    description = StringField(required=True, max_length=255)
    amount = DecimalField(required=True, force_string=False, precision=2)
    currency = StringField(required=True, default="SGD", max_length=3)
    method = StringField(required=True, choices=["cash", "credit_card", "bank_transfer"])
    category = StringField(required=True, default="others")
    source = StringField(choices=["manual", "statement_upload"], default="manual")
    doc_name = StringField()
    created_at = DateTimeField(default=lambda: datetime.now(timezone.utc))
    updated_at = DateTimeField(default=lambda: datetime.now(timezone.utc))

    def save(self, *args, **kwargs):
        self.updated_at = datetime.now(timezone.utc)
        return super(Transaction, self).save(*args, **kwargs)
    
    def __repr__(self):
        return f"<Transaction {self.type.upper()} - {self.description[:20]}:{self.currency} {self.amount}>"
