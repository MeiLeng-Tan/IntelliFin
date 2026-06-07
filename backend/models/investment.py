"""
Investment portfolio model schema for "investment_portfolio" collection
"""

from datetime import datetime, timezone
from mongoengine import Document, ReferenceField, StringField, CASCADE, FloatField, DecimalField, DateTimeField

class InvestmentPortfolio(Document):
    meta = {
        "collection": "investment_portfolio",
        "indexes": [
            {"fields": ["user_id", "ticker"], "unique": True}
        ]    
    }

    user_id = ReferenceField("User", reverse_delete_rule=CASCADE, required=True)
    ticker = StringField(required=True, max_length=10, uppercase=True, trim=True, default=None)
    asset_type = StringField(required=True, choices=["equity", "crypto", "commodity", "cash"])
    total_quantity = DecimalField(required=True, precision=18, scale=8, default=0.0)
    average_buy_price = DecimalField(required=True, precision=18, scale=4, default=0.0)
    created_at = DateTimeField(default=lambda: datetime.now(timezone.utc))
    updated_at = DateTimeField(default=lambda: datetime.now(timezone.utc))

    def save(self, *args, **kwargs):
        self.updated_at = datetime.now(timezone.utc)
        return super(InvestmentPortfolio, self).save(*args, **kwargs)
    
    def __repr__(self):
        return f"<InvestmentPortfolio {self.asset_type.upper()} - {self.ticker} - {self.total_quantity} {self.average_buy_price}>"
