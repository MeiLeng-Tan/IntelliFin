"""
Transaction model schema for 'transaction' collection.
"""

from datetime import datetime, timezone
from mongoengine import Document, StringField, DecimalField, DateTimeField, ReferenceField, CASCADE, NULLIFY
from bson import ObjectId

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
    type = StringField(required=True, choices=["income", "expense", "investment"])
    description = StringField(required=True, max_length=255)
    amount = DecimalField(required=True, precision=18, scale=2)
    currency = StringField(required=True, default="SGD", max_length=3)
    method = StringField(required=True, choices=["cash", "credit_card", "bank_transfer"])
    category = StringField(required=True, default="others")
    # Investment specific fiels 
    trade_action = StringField(choices=["buy", "sell"], default=None)
    ticker = StringField(max_length=10, uppercase=True, trim=True, default=None)
    quantity = DecimalField(precision=18, scale=8, default=0.0)
    price_per_unit = DecimalField(precision=18, scale=4, default=0.0)
    
    source = StringField(choices=["manual", "statement_upload"], default="manual")
    doc_name = StringField()
    created_at = DateTimeField(default=lambda: datetime.now(timezone.utc))
    updated_at = DateTimeField(default=lambda: datetime.now(timezone.utc))

    def save(self, *args, **kwargs):
        self.updated_at = datetime.now(timezone.utc)
        return super(Transaction, self).save(*args, **kwargs)
    
    def __repr__(self):
        return f"<Transaction {self.type.upper()} - {self.description[:20]}:{self.currency} {self.amount}>"

    def to_json_dict(self):
        """Converts the MongoEngine document into a clean Python dictionary"""
        data = {}
        for key in self._data:
            value = self._data[key]
            
            if key in ['amount', 'quantity', 'price_per_unit']:
                data[key] = float(value) if value is not None else 0.0
            elif isinstance(value, ObjectId):
                data[key] = str(value)
            elif hasattr(value, 'id'):
                data[key] = str(value.id)
            elif hasattr(value, 'isoformat'): 
                data[key] = value.isoformat()
            else:
                data[key] = value
                
        if 'id' in data:
            data['transaction_id'] = data["id"]
            
        return data