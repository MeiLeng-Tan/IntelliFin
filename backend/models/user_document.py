"""
Document model schema for 'documents' collection.
"""

from datetime import datetime, timezone
from mongoengine import Document, StringField, FloatField, BooleanField, DateTimeField, ReferenceField, CASCADE, NULLIFY

class UserDocument(Document):
    """
    Define subscription collection schema
    """
    meta = {"collection": "documents"}
    
    # Pass reference class name as string
    user_id = ReferenceField("User", reverse_delete_rule=CASCADE, required=True)
    
    filename = StringField(required=True, max_length=255)
    file_type = StringField(required=True, max_length=10)
    pinecone_namespace = StringField(required=True)
    created_at = DateTimeField(default=lambda: datetime.now(timezone.utc))
    updated_at = DateTimeField(default=lambda: datetime.now(timezone.utc))

    def save(self, *args, **kwargs):
        self.updated_at = datetime.now(timezone.utc)
        return super(UserDocument, self).save(*args, **kwargs)