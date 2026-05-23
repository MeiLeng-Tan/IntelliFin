import os
from dotenv import load_dotenv
import datetime
import jwt
from flask import Blueprint, request, jsonify
import bcrypt
from models import User

load_dotenv()
jwt_secret = os.getenv("JWT_SECRET_KEY")

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/signup', methods=['POST'])
def signup():
    data = request.get_json() or {}
    print("INCOMING BRUNO DATA:", data)
    # Validate all required data are filled
    if not all(k in data for k in ('first_name', 'last_name', 'username', 'password')):
        return jsonify({'error': 'Missing required fields'}), 400
    
    if User.objects(username=data['username']).first():
        return jsonify({"error": "Username already exists"}), 400
    
    try:
        # Hash password
        hashed_password = bcrypt.hashpw(data['password'].encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

        new_user = User(
            first_name=data['first_name'],
            last_name=data['last_name'],
            username=data['username'],
            password=hashed_password
        ).save()
        return jsonify({"message": "User registered successfully"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    username = data.get('username')
    password = data.get('password')
    
    if not username or not password:
        return jsonify({"error": "Username and password required."}), 400
    
    user = User.objects(username=username).first()

    if not user or not bcrypt.checkpw(password.encode('utf-8'), user.password.encode('utf-8')):
        return jsonify({"error": "Invalid username or password"}), 401
    
    jwt_payload = {
        "user_id": str(user.id),
        "exp": datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=24)
    }
    token = jwt.encode(jwt_payload, jwt_secret, algorithm="HS256")

    return jsonify({
        "token": token,
        "user": {
            "id": str(user.id),
            "username": user.username,
            "first_name": user.first_name,
            "last_name": user.last_name
        }
    }), 200
