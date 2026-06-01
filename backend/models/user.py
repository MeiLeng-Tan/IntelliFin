"""
User model schema for 'users' collection.
"""

from datetime import datetime, timezone
from mongoengine import Document, StringField, EmailField, DateTimeField

class User(Document):
    """
    Define user collection schema
    """
    meta = {"collection": "users"}

    first_name = StringField(required=True, max_length=50)
    last_name = StringField(required=True, max_length=50)
    email = EmailField(required=True, unique=True)
    password = StringField(required=True)
    created_at = DateTimeField(default=lambda: datetime.now(timezone.utc))
    updated_at = DateTimeField(default=lambda: datetime.now(timezone.utc))

    def save(self, *args, **kwargs):
        self.updated_at = datetime.now(timezone.utc)
        return super(User, self).save(*args, **kwargs)

    def __repr__(self):
        return f'<User {self.email}>'
