import os
from dotenv import load_dotenv
import datetime
import jwt
from flask import Blueprint, request, jsonify
import bcrypt
from models import User

load_dotenv()
jwt_secret = os.getenv("JWT_SECRET_KEY")

auth_bp = Blueprint("auth", __name__)

@auth_bp.route("/signup", methods=["POST"])
def signup():
    data = request.get_json() or {}
    # Validate all required data are filled
    if not all(k in data for k in ("first_name", "last_name", "email", "password")):
        return jsonify({"error": "Missing required fields"}), 400
    
    if User.objects(email=data["email"]).first():
        return jsonify({"error": "Email already exists"}), 400
    
    try:
        # Hash password
        hashed_password = bcrypt.hashpw(data["password"].encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

        new_user = User(
            first_name=data["first_name"],
            last_name=data["last_name"],
            email=data["email"],
            password=hashed_password
        ).save()

        # Generate JWT-token right away for auto-login
        jwt_payload = {
            "user_id": str(new_user.id),
            "exp": datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=24)
        }
        token = jwt.encode(jwt_payload, jwt_secret, algorithm="HS256")

        return jsonify({
            "message": "User registered successfully",
            "token": token,
            "user": {
                "id": str(new_user.id),
                "email": new_user.email,
                "first_name": new_user.first_name,
                "last_name": new_user.last_name
            }
        }), 201
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    email = data.get("email")
    password = data.get("password")
    
    if not email or not password:
        return jsonify({"error": "Email and password required."}), 400
    
    user = User.objects(email=email).first()

    if not user or not bcrypt.checkpw(password.encode("utf-8"), user.password.encode("utf-8")):
        return jsonify({"error": "Invalid email or password"}), 401
    
    jwt_payload = {
        "user_id": str(user.id),
        "exp": datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=24)
    }
    token = jwt.encode(jwt_payload, jwt_secret, algorithm="HS256")

    return jsonify({
        "token": token,
        "user": {
            "id": str(user.id),
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name
        }
    }), 200
