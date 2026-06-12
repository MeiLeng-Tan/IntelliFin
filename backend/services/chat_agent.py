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
from langchain_core.tools import InjectedToolArg
from langchain_core.runnables import RunnableConfig

from qdrant_client import QdrantClient
from models import db, Transaction, Subscription, InvestmentPortfolio

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
def search_semantic_history(query: str, config: Annotated[RunnableConfig, InjectedToolArg]) -> str:
    """
    Queries vector database to find historical transction entries, notes or descriptions.
    """
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
    
    return "\n".join([f"- Context: {p.payload.get("text", "")}" for p in search_results.points])
    
@tool
def query_live_portfolio_balances(config: Annotated[RunnableConfig, InjectedToolArg]) -> str:
    """
    Queries current stock asset positions, quantities, and cost metrics directly from MongoDB.
    """
    user_id = config.get("configurable", {}).get("user_id", "unknown")

    if not user_id or user_id == "unknown":
        return "ErrorL User cntext missing."

    portfolios = InvestmentPortfolio.objects(user_id=user_id)
    if not portfolios:
        return "You do not currently hold any active tracked market investment portfolio."
    
    holdings = []
    for p in portfolios:
        holdings.append({
            "ticker": str(p.ticker), 
            "type": str(p.asset_type), 
            "qty": float(p.total_quantity), 
            "avg_price": float(p.average_buy_price)
        })

    return json.dumps({"active_holdings": holdings}, indent=2)

@tool
def qeury_financial_cashflow(config: Annotated[RunnableConfig, InjectedToolArg]) -> str:
    """
    Summarize total income and spending from user's transaction history. 
    """
    user_id = config.get("configurable", {}).get("user_id", "unknown")
    if user_id == "unknown":
        return "Error: User context missing."
    
    from bson import ObjectId
    try:
        query_id = ObjectId(str(user_id)) if ObjectId.is_valid(str(user_id)) else str(user_id)
        transactions = Transaction.objects(user_id=query_id)

        if not transactions:
            return "No transaction history found for this user."
        
        total_income = 0
        total_spending = 0

        for t in transactions:
            if t.amount > 0:
                total_income += t.amount
            else:
                total_spending += abs(t.amount)

        net_cashflow = total_income - total_spending

        return json.dump({
            "total_income": float(total_income),
            "total_spending": float(total_spending),
            "net_cahsflow": float(net_cashflow),
            "suggested_investment_buffer": float(net_cashflow * 0.2)
        }, indent=2)
    
    except Exception as e:
        return f"Error accessing transactions: {str(e)}"

@tool
def get_transaction_history(days: int = 30, config: Annotated[RunnableConfig, InjectedToolArg] = None) -> str:
    """
    Retrieves the actual list of recent transactions (merchant, amount, date).
    Use this when the user asks about specific purchases or spending patterns.
    """
    user_id = config.get("configurable", {}).get("user_id")
    
    # Query MongoDB for the actual objects
    transactions = Transaction.objects(user_id=user_id).order_by('-date').limit(20)
    
    if not transactions:
        return "No recent transactions found."

    results = []
    for t in transactions:
        results.append(f"{t.date.strftime('%Y-%m-%d')}: {t.description} {t.category} - ${abs(t.amount)}")
    
    return "\n".join(results)

tools_list = [search_semantic_history, query_live_portfolio_balances, qeury_financial_cashflow, get_transaction_history]
tool_node = ToolNode(tools_list)

model = ChatOpenAI(model="gpt-5.4-mini", temperature=0).bind_tools(tools_list)

def brain_node(state: AgentState, config: RunnableConfig):
    sys_prompt = SystemMessage(
        content=(
            "You are IntelliFin AI, a proactive, elite financial advisor. "
            "When a user asks about their financial health, portfolio status, or perfromance, "
            "you MUST call the 'query_live_portfolio_balances' tool first to examine their holdings. "
            "When a user asks about their income, spending, or cashflow, you MUST call the 'query_financial_cashflow' tool first. "
            "Do not apologize or claim you lack information until you have checked your tools. "
            "Analyze what you find in their portfolio and give a constructive breakdown of their financial health."
        )        
    )
    history = state.get("messages", [])

    if not history or not isinstance(history[0], SystemMessage):
        payload = [sys_prompt] + list(history)
    else:
        payload = list(history)

    response = model.invoke(payload, config=config)

    return {"messages": [response]}

workflow = StateGraph(AgentState)
workflow.add_node("financial_brain", brain_node)
workflow.add_node("tools", tool_node)

workflow.add_edge(START, "financial_brain")
workflow.add_conditional_edges("financial_brain", tools_condition) #, {True: "action_tools", False: END})
workflow.add_edge("tools", "financial_brain")

memory = MemorySaver()
compiled_graph = workflow.compile(checkpointer=memory)

__all__ = ["compiled_graph"]

def run_financial_agent(user_id, user_query):
    """
    Initializes and run LangGraph workflow.
    """
    config = {"configurable": {"thread_id": user_id, "user_id": user_id}}

    input_state = {
        "messages": [HumanMessage(content=user_query)],
        "user_id": user_id
    }

    try:
        final_state = compiled_graph.invoke(input_state, config=config)
        return final_state["messages"][-1].content
    except Exception as e:
        print(f"Graph Error: {e}")
        raise e

    