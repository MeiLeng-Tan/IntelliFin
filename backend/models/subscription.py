"""
Subscription model schema for 'subscription' collection.
"""

from datetime import datetime, timezone
from mongoengine import Document, StringField, DecimalField, BooleanField, DateTimeField, ReferenceField, CASCADE, NULLIFY

class Subscription(Document):
    """
    Define subscription collection schema
    """
    meta = {
        "collection": "subscriptions",
        "indexes": [
            {"fields": ["user_id", "description"], "unique": True}
        ]
    }
    
    # Pass reference class name as string
    user_id = ReferenceField("User", reverse_delete_rule=CASCADE, required=True)

    description = StringField(required=True, max_length=100)
    fee = DecimalField(required=True, precision=18, scale=2)
    currency = StringField(required=True, default="SGD", max_length=3)
    billing_cycle = StringField(required=True, choices=["weekly", "monthly", "quarterly", "annual"])
    next_billing_date = DateTimeField()
    is_active = BooleanField(required=True, default=True)
    payment_method = StringField(choices=["cash", "credit_card", "bank_transfer"], default="credit_card")
    category = StringField(default="others", max_length=50)
    created_at = DateTimeField(default=lambda: datetime.now(timezone.utc))
    updated_at = DateTimeField(default=lambda: datetime.now(timezone.utc))

    def save(self, *args, **kwargs):
        self.updated_at = datetime.now(timezone.utc)
        return super(Subscription, self).save(*args, **kwargs)
    
    def __repr__(self):
        # repr string for quick subscription debugging
        return f"<Subscription {self.description} - {self.currency} {self.fee}/{self.billing_cycle}>"
    