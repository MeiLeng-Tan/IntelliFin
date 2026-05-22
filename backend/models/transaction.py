"""
Transaction model schema for 'transaction' collection.
"""

from datetime import datetime, timezone
from mongoengine import Document, StringField, FloatField, DateTimeField, ReferenceField, CASCADE, NULLIFY

class Transaction(Document):
    """
    Define transaction collection schema
    """
    meta = {'collection': 'transactions'}

    # Pass reference class name as string
    user_id = ReferenceField('User', reverse_delete_rule=CASCADE, required=True)
    subscription_id = ReferenceField('Subscription', reverse_delete_rule=NULLIFY, default=None)
    
    date = DateTimeField(required=True, default=lambda: datetime.now(timezone.utc))
    type = StringField(required=True, choices=['income', 'expense'])
    description = StringField(required=True, max_length=255)
    amount = FloatField(required=True)
    method = StringField(required=True, choices=['cash', 'credit_card', 'bank_transfer'])
    currency = StringField(required=True, default='SGD', max_length=3)
    category = StringField(required=True, choices=['food', 'transaport', 'utilities', 'others'])
    created_at = DateTimeField(default=lambda: datetime.now(timezone.utc))
    updated_at = DateTimeField(default=lambda: datetime.now(timezone.utc))

    def save(self, *args, **kwargs):
        self.updated_at = datetime.now(timezone.utc)
        return super(Transaction, self).save(*args, **kwargs)
    