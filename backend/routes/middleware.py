import os
from dotenv import load_dotenv
from functools import wraps
from flask import request, jsonify
import jwt
from models import User

load_dotenv()
jwt_secret = os.getenv("JWT_SECRET_KEY")

def token_required(f):
    @wraps(f)
    def decorator(*args, **kwargs):
        token = None

        # Check the "Authorization" Bearer <token>" format"
        if "Authorization" in request.headers:
            auth_header = request.headers["Authorization"]
            if auth_header.startswith("Bearer"):
                token = auth_header.split(" ")[1]
        
        if not token:
            return jsonify({"error": "Authentication token missing"})
        
        try:
            # Decode payload
            payload = jwt.decode(token, jwt_secret, algorithms=["HS256"])
            # Check that user actually existed
            current_user = User.objects(id=payload["user_id"]).first()
            if not current_user:
                return jsonify({"error": "User session profile invalid"}), 401
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Authentication token has expired. Please log in again."}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Invalid security token."}), 401
        
        # Passing the authenticated user to next route
        return f(current_user, *args, **kwargs)

    return decorator