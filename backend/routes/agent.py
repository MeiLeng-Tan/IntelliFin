from flask import Blueprint, request, jsonify
from .middleware import token_required
from services import run_financial_agent

agent_bp = Blueprint("agent_bp", __name__)

@agent_bp.route("/", methods=["POST"])
@token_required
def chat_with_agent(current_user):
    try:
        data = request.get_json() or {}
        user_message = data.get("message", "").strip()

        if not user_message:
            return jsonify({"error": "Message content string cannot be blank."}), 400
        
        # Run agent query routine
        agent_response = run_financial_agent(user_id=str(current_user.id), user_message=user_message)

        return jsonify({
            "sender": "ai agent",
            "message": agent_response
        }), 200
    
    except Exception as e:
        return jsonify({"error": f"Agent loop execution failed: {str(e)}"}), 500
    