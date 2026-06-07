import os
from dotenv import load_dotenv 
from openai import OpenAI
from qdrant_client import QdrantClient
from models import Transaction, Subscription
import json

load_dotenv()
qdrant_url = os.getenv("QDRANT_URL")
qdrant_api_key = os.getenv("QDRANT_API_KEY")
qdrant_collection = os.getenv("QDRANT_COLLECTION")
openai_api_key = os.getenv("OPENAI_API_KEY")
openai_client = OpenAI(api_key=openai_api_key)

if qdrant_url and qdrant_api_key:
    qdrant_client = QdrantClient(url=qdrant_url, api_key=qdrant_api_key)
else:
    qdrant_client = QdrantClient(":memory:")

def search_semantic_history(user_id: str, query: str, limit: int = 5) -> str:
    """
    Search Qdrant vector store for matching contexts
    """
    from services.rag_service import embeddings
    from qdrant_client import models as qdrant_models

    # Generate query embedding vector
    query_vector = embeddings.embed_query(query)

    # Query Qdrant with a trict user metadata security filter
    search_results = qdrant_client.query_points(
        collection_name=qdrant_collection,
        query=query_vector,
        query_filter=qdrant_models.Filter(
            must=[
                qdrant_models.FieldCondition(
                    key="metadata.user_id",
                    match=qdrant_models.MatchValue(value=str(user_id))
                )
            ]
        ),
        limit=limit
    )

    if not search_results.points:
        return "No relevant historical transaction narratives found in the vector index."
    
    contexts = []
    for point in search_results.points:
        payload = point.payload
        contexts.append(f"- Context: {payload.get("text", point.payload)} (Doc Type: {payload.get('doc_type', 'unknown')})")
    
    return "\n".join(contexts)

def query_active_subscriptions(user_id: str) -> str:
    """
    Query MongoDB directly for user's active recurring subscriptions.
    """
    subs = Subscription.objects(user_id=user_id, is_active=True)
    
    if not subs:
        return "The user has no active recurring subscription."
    
    sub_details = []
    for s in subs:
        sub_details.append(f"- {s.name}: {s.currency} {float(s.fee):,.2f} ({s.billing_cycle})")

    return "\n".join(sub_details)

def run_financial_agent(user_id: str, user_message: str) -> str:
    # Define tool schema for OpenAI
    tools = [
        {
            "type": "function",
            "function": {
                "name": "search_semantic_history",
                "description": "Use this tool to find deep semantic contexts, notes, PDF document chunks, receipts, or specific transaction descriptions from vector memory.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "query": {"type": "string", "description": "The natural language search term or topic to query."}
                    },
                    "required": ["query"]
                }
            }
        },
        {
            "type": "function",
            "function": {
                "name": "query_active_subscriptions",
                "description": "Use this tool strictly when the user asks what active subscriptions they are currently paying for.",
                "parameters": {
                    "type": "object",
                    "properties": {}
                }
            }
        }
    ]

    system_instruction = (
        "You are IntelliFin AI, an expert agentic financial advisor. You have real-time access to the user's "
        "financial database through tools. Always maintain financial precision. If tool inputs return data, "
        "synthesize it clearly. Never make up transanctional metrics."
    )

    # First LLM call
    messages = [
        {"role": "system", "content": system_instruction},
        {"role": "user", "content": user_message}
    ]

    response = openai_client.chat.completions.create(
        model="gpt-5.4-mini",
        messages=messages,
        tools=tools,
        tool_choice="auto"
    )

    response_message = response.choices[0].message
    tool_calls = response_message.tool_calls

    # Handle tool execution if LLM calls it
    if tool_calls:
        # Append LLM's initial thoguht containign tool requirements to conversation history
        messages.append(response_message)

        for tool_call in tool_calls:
            function_name = tool_call.function.name
            function_args = json.loads(tool_call.function.arguments)

            print(f"Agent executing tool: {function_name} with arguments {function_args}")

            # Execute the matching Python tool function
            if function_name == "search_semantic_history":
                tool_output = search_semantic_history(user_id=user_id, query=function_args.get("query"))
            elif function_name == "query_active_subscriptions":
                tool_output = query_active_subscriptions(user_id=user_id)
            else:
                tool_output = "Error: Tool execution target mismatch."

            messages.append({
                "role": "tool",
                "tool_call_id": tool_call.id,
                "name": function_name,
                "content": tool_output
            })

        # Second LLM call, generate synthesized natural answer with tool data
        final_response = openai_client.chat.completions.create(
            model="gpt-5.4-mini",
            messages=messages
        )
        return final_response.choices[0].message.content
    
    # Return direct text message if no tools are required to generate the answer.
    return response_message.content



