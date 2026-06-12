from flask import Blueprint, request, jsonify
from functools import wraps
from .middleware import token_required
from services.chat_agent import compiled_graph

chat_bp = Blueprint("chat", __name__)

@chat_bp.route("/message", methods=["POST", "OPTIONS"])
@token_required
def handle_agent_message(current_user):
    if request.method == "OPTIONS":
        return "", 200
    
    body = request.get_json()
    user_message = body.get("message", "")

    session_id = body.get("session_id", str(current_user.id))

    try:
        initial_state = {
            "messages": [("user", user_message)],
            "user_id": str(current_user.id)
        }

        config = {
            "configurable": {
                "thread_id": str(session_id),
                "user_id": str(current_user.id)
            }
        }

        actions = []
        final_text = ""
        # Streaming graph to extract immediate structural action 
        for event in compiled_graph.stream(initial_state, config):
            for node, output in event.items():
                # Check for action_tool node
                if node == "tools" and "messages" in output:
                    last_msg = output["messages"][-1]
                    actions.append(f"Executed: {last_msg.name}")
                elif node == "financial_brain" and "messages" in output:
                    last_msg = output["messages"][-1]
                    if hasattr(last_msg, "tool_calls") and last_msg.tool_calls:
                        for tool in last_msg.tool_calls:
                            if tool["name"] == "query_live_portfolio_balances":
                                actions.append("Checking MongoDB invesment logs...")
                            elif tool["name"] == "search_semantic_history":
                                actions.append("Scanning Qdrant vector index partitions...")
                    else:
                        final_text = last_msg.content
                    
        return jsonify({
            "status": "success",
            "actions": actions,
            "response": final_text if final_text else "Analysis complete."
        }), 200
    
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
    
    
                

