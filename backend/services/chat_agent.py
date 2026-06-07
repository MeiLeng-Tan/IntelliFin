import os
import json
from typing import Annotated, Sequence, TypedDict
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

from langchain_core.tools import tool
from langchain_core.messages import BaseMessage, SystemMessage, HumanMessage, AIMessage
from langchain_openai import ChatOpenAI
from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode, tools_condition
from langgraph.checkpoint.memory import MemorySaver

from qdrant_client import QdrantClient
from models import db, Subscription, InvestmentPortfolio

load_dotenv()

qdrant_url = os.getenv("QDRANT_URL")
qdrant_api_key = os.getenv("QDRANT_API_KEY")
qdrant_collection = os.getenv("QDRANT_COLLECTION")

if qdrant_url and qdrant_api_key:
    qdrant_client = QdrantClient(url=qdrant_url, api_key=qdrant_api_key)
else:
    qdrant_client = QdrantClient(":memory:")

class AgentState(TypedDict):
    """
    LangGraph shared session state
    """
    messages: Annotated[Sequence[BaseMessage], add_messages]
    user_id: str

# ===== AI Agent tools 
@tool
def search_semantic_history(query: str, tool_run_manager=None) -> str:
    """
    Queries vector database to find historical transction entries, notes or descriptions.
    """
    config = tool_run_manager.config if tool_run_manager else {}
    user_id = config.get("configurable", {}).get("user_id", "unknown")

    from langchain_openai import OpenAIEmbeddings
    embeddings = OpenAIEmbeddings(model="text-embedding-3-small")
    query_vector = embeddings.embed_query(query)

    from qdrant_client import models as qdrant_models
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
        limit=5
    )
    if not search_results.points:
        return "No relevant historical transaction narratives found in the vector index."
    
    return "\n".join([f"- Context: {p.payload.get("text")}" for p in search_results.points])
    
@tool
def query_live_portfolio_balances(tool_run_manager=None) -> str:
    """
    Queries current stock asset positions, quantities, and cost metrics directly from MongoDB.
    """
    config = tool_run_manager.config if tool_run_manager else {}
    user_id = config.get("configurable", {}).get("user_id", "unknown")

    portfolios = InvestmentPortfolio.objects(user_id=user_id)
    if not portfolios:
        return "You do not currently hold any active tracked market investment portfolio."
    
    holdings = []
    for p in portfolios:
        holdings.append({
            "ticker": p.ticker, 
            "type": p.asset_type, 
            "qty": float(p.total_quantity), 
            "avg_price": float(p.average_buy_price)
        })

    return json.dumps({"active_holdings": holdings}, indent=2)

tools_list = [search_semantic_history, query_live_portfolio_balances]
tool_node = ToolNode(tools_list)

model = ChatOpenAI(model="gpt-5.4-mini", temeprature=0).bind_tools(tools_list)

def brain_node(state: AgentState, config: dict):
    sys_prompt = SystemMessage(
        content=(
            "You are IntelliFin AI, a proactive, elite financial advisor. "
            "When a user asks about their financial health, portfolio status, or perfromance, "
            "you MUST call the 'query_live_portfolio_balances' tool first to examine their holdings. "
            "Do not apologize or claim you lack information until you have checked your tools. "
            "Analyze what you find in their portfolio and give a constructive breakdown of their financial health."
        )        
    )
    return {"messages": [model.invoke([sys_prompt] + list(state["messages"]), config=config)]}

workflow = StateGraph(AgentState)
workflow.add_node("financial_brain", brain_node)
workflow.add_node("action_tools", tool_node)

workflow.add_edge(START, "financial_brain")
workflow.add_conditional_edges("financial_brain", tools_condition, {True: "action_tools", False: END})
workflow.add_edge("action_tools", "financial_brain")

memory = MemorySaver()
compiled_graph = workflow.compile(checkpointer=memory)

def run_financial_agent(user_id, user_query):
    """
    Initializes and run LangGraph workflow.
    """
    config = {"configurable": {"thread_id": user_id, "user_id": user_id}}

    input_state = {
        "messages": [HumanMessage(content=user_query)],
        "user_id": user_id
    }

    final_state = compiled_graph.invoke(input_state, config=config)

    return final_state["messages"][-1].content

    