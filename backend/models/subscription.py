"""
Subscription model schema for 'subscription' collection.
"""

from datetime import datetime, timezone
from mongoengine import Document, StringField, FloatField, BooleanField, DateTimeField, ReferenceField, CASCADE, NULLIFY

class Subscription(Document):
    """
    Define subscription collection schema
    """
    meta = {'collection': 'subscriptions'}
    
    # Pass reference class name as string
    user_id = ReferenceField('User', reverse_delete_rule=CASCADE, required=True)

    name = StringField(required=True, max_length=100)
    fee = FloatField(required=True)
    currency = StringField(required=True, default='SGD', max_length=3)
    billing_cycle = StringField(required=True, choices=['monthly', 'annual'])
    next_billing_date = DateTimeField()
    is_active = BooleanField(required=True, default=True)
    created_at = DateTimeField(default=lambda: datetime.now(timezone.utc))
    updated_at = DateTimeField(default=lambda: datetime.now(timezone.utc))

    def save(self, *args, **kwargs):
        self.updated_at = datetime.now(timezone.utc)
        return super(Subscription, self).save(*args, **kwargs)
    