"""
Models package. Exposes the db insatnce and all collection schemas.
"""

from flask_mongoengine import MongoEngine

# Initializes MongoEngine instance
db = MongoEngine()

# Import all models 
from .user import User
from .subscription import Subscription
from .transaction import Transaction
from .user_document import UserDocument
