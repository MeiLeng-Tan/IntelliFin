import os
from dotenv import load_dotenv
from flask import Flask, jsonify
from flask_cors import CORS
from mongoengine import connect
from routes import auth_bp, transactions_bp, subscription_bp, investment_bp, documents_bp, agent_bp, chat_bp

# Load environment variables
load_dotenv()

def create_app():
    app = Flask(__name__)

    CORS(app)

    # Establish Mongo connection
    mongo_uri = os.getenv("MONGO_URI")
    db_name = os.getenv("DB_NAME", "intellifin_db")
    connect(host=mongo_uri, db=db_name)

    # Register blueprints
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(transactions_bp, url_prefix="/api/transactions")
    app.register_blueprint(subscription_bp, url_prefix="/api/subscriptions")
    app.register_blueprint(investment_bp, url_prefix="/api/portfolio")
    app.register_blueprint(documents_bp, url_prefix="/api/documents")
    app.register_blueprint(agent_bp, url_prefix="/api/agent")
    app.register_blueprint(chat_bp, url_prefix="/api/chat")

    @app.route("/", methods=["GET"])
    def index():
        return jsonify({
            "message": "IntelliFin backend API is live."
        }), 200
    
    return app

if __name__ == "__main__":
    app = create_app()
    port = int(os.getenv("PORT", 5000))
    app.run(host='0.0.0.0', port=port) #, debug=False)
