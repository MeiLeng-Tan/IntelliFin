from datetime import datetime, timezone
from io import BytesIO
from decimal import Decimal
from collections import defaultdict
from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
from langchain_openai import ChatOpenAI
from pypdf import PdfReader
from models import Transaction
from .middleware import token_required
from services import sync_transaction_to_qdrant, handle_subscription_linking, delete_transaction_from_qdrant


# Define the blueprint
transactions_bp = Blueprint("transaction", __name__)

llm = ChatOpenAI(model="gpt-5.4-mini", temperature=0)

@transactions_bp.route("/", methods=["GET"])
@token_required
def get_user_transactions(current_user):
    try:
        # Retrieve transactions belonging to the user
        transactions = Transaction.objects(user_id=current_user.id).only("id", "date", "type", "description", "amount","currency", "category").order_by("-date")

        if not transactions:
            return jsonify([]), 200
        
        transaction_list = []
        for t in transactions:
            transaction_list.append({
                "transaction_id": str(t.id),
                "date": t.date.isoformat(),
                "type": t.type,
                "description": t.description,
                "amount": float(t.amount),
                "currency": t.currency,
                "category": t.category,
            })

        return jsonify(transaction_list), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@transactions_bp.route("/<string:tx_id>", methods=["GET"])
@token_required
def get_transaction_detail(current_user, tx_id):
    try:
        tx = Transaction.objects(id=tx_id, user_id=current_user.id).first()
        if not tx:
            return jsonify({"error": "Transaction not found or unauthorized."}), 404
        
        transaction_detail = {
            "transaction_id": str(tx.id),
            "date": tx.date.isoformat(),
            "type": tx.type,
            "description": tx.description,
            "amount": float(tx.amount),
            "method": tx.method,
            "currency": tx.currency,
            "category": tx.category,
            "source": tx.source,
            "doc_name": tx.doc_name if tx.doc_name else None,
            "subscription_id": str(tx.subscription_id.id) if tx.subscription_id else None
        }
        return jsonify(transaction_detail), 200

    except Exception as e:
        return jsonify({"error": f"failed to retrieve transaction: {str(e)}"})

@transactions_bp.route("/manual", methods=["POST"])
@token_required
def create_manual_entry(current_user):
    data = request.get_json()
    
    if not all(k in data for k in ("date", "type", "description", "amount", "method", "currency", "category")):
        return jsonify({"error": "Missing required fields"}), 400
    
    try:
        raw_category = data.get("category", "others").strip().lower()
        category = "subscription" if "subscription" in raw_category else raw_category
            

        # Call service layer to handle subscription linking 
        sub_record = handle_subscription_linking(
            current_user_id=current_user.id,
            description=data["description"],
            amount=data["amount"],
            currency=data["currency"],
            tx_date=datetime.now(timezone.utc),
            category=category,
            inferred_cycle=data.get("billing_cycle", "monthly")
        )
        # Save transaction to database
        tx = Transaction(
            user_id=current_user.id,
            type=data["type"],
            date=datetime.now(timezone.utc),
            description=data["description"],
            amount=data["amount"],
            currency=data["currency"],
            method=data["method"],
            category="subscription" if sub_record else category,
            source='manual',
            subscription_id=sub_record.id if sub_record else None
        )
        tx.save()
        sync_transaction_to_qdrant(tx)

        return jsonify({"message": "Manual ledger item recorded.", "id":str(tx.id)}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@transactions_bp.route('/parse', methods=["POST"])
@token_required
def parse_statement(current_user):
    if 'file' not in request.files:
        return jsonify({"error": "No statement file found"}), 400
    
    file = request.files['file']
    if file.filename == "":
        return jsonify({"error": "No file selected"}), 400
    
    filename = secure_filename(file.filename)
    if not filename.lower().endswith(".pdf"):
        return jsonify({"error": "Only PDF bank statements are supported"}), 400

    try:
        uploaded_file = BytesIO(file.read())
        reader = PdfReader(uploaded_file)
        raw_text = "".join([page.extract_text() for page in reader.pages if page.extract_text()])

        if not raw_text.strip():
            return jsonify({"error": "PDF statement text later is empty"}), 400
        
        # OpenAI structured output schema
        schema = {
            "title": "TransactionExtractor", 
            "description": "Extract financial items from a statement text layer",
            "type": "object",
            "properties": {
                "statement_currency": {
                    "type": "string",
                    "description": "The overall currency of the account statment (e.g. USD, SGD, MYR). Look at headers or summary blocks."
                },
                "transactions": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "date": {
                                "type": "string"
                            },
                            "description": {
                                "type": "string"
                            },
                            "amount": {
                                "type": "number", 
                                "description": "The absolute positive numberic value of the transaction"
                            },
                            "type": {
                                "type": "string", 
                                "enum": ["income", "expense"], 
                                "description": "Identify if this transaction is an income/deposit or an expense/withdrawal"
                            },
                            "category": {
                                "type": "string", 
                                "enum": ["subscription", "food", "transport", "utilities", "income", "shopping", "others"],
                                "description": "Standardized lowercase singular category bucket for the transaction item."
                            },
                            "inferred_billing_cycle": {
                                "type": "string", 
                                "enum": ["weekly", "monthly", "quarterly", "annual"]
                            }
                        },
                        "required": ["date", "description", "amount", "type", "category", "inferred_billing_cycle"]
                    }
                }
            },
            "required": ["statement_currency", "transactions"]
        }

        structured_llm = llm.with_structured_output(schema)
        extraction = structured_llm.invoke(f"Extract transactions:\n\n{raw_text}")

        detected_currency = extraction.get("statement_currency", "SGD").upper()

        saved_items = []
        for item in extraction.get("transactions", []):
            try:
                parsed_date = datetime.strptime(item["date"], "%Y-%m-%d")
            except:
                parsed_date = datetime.now(timezone.utc)

            raw_category = item.get("category", "others").strip().lower()
            category = "subscription" if "subscription" in raw_category else raw_category

            sub_record = handle_subscription_linking(
                current_user_id=current_user.id,
                description=item["description"],
                amount=item["amount"],
                currency=detected_currency,
                tx_date=parsed_date,
                category=category,
                inferred_cycle=item.get("inferred_billing_cycle", "monthly")
            )

            tx = Transaction(
                user_id=current_user.id,
                type=item["type"],
                date=parsed_date,
                description=item["description"],
                amount=item["amount"],
                currency=detected_currency,
                category="subscription" if sub_record else item["category"],
                method="credit_card",
                source='statement_upload',
                doc_name=filename,
                subscription_id=sub_record.id if sub_record else None
            )
            tx.save()
            sync_transaction_to_qdrant(tx)
            saved_items.append({
                "date": tx.date.isoformat() if tx.date else None,
                "type": tx.type,
                "description": tx.description, 
                "amount": float(tx.amount), 
                "currency": tx.currency,
                "category": tx.category})

        return jsonify({"message": f"Successfully parsed and synced {len(saved_items)} entries.", "data": saved_items}), 201
    
    except Exception as e:
        return jsonify({"error": f"Failed to parse statement: {str(e)}"}), 500

# Edit a transaction
@transactions_bp.route("/<string:tx_id>", methods=["PUT"])
@token_required
def update_transaction(current_user, tx_id):
    data = request.get_json()
    try:
        # Fetch transaction and ensuring that it belongs to the active user
        tx = Transaction.objects(id=tx_id, user_id=current_user.id).first()
        if not tx:
            return jsonify({"error": "Transaction not found or unauthorized."}), 404
        
        # Update database fields if present in payload
        if "description" in data:
            tx.description = data["description"].strip()
        if "amount" in data:
            tx.amount = data["amount"]
        if "category" in data:
            raw_category = data["category"].strip().lower()
            tx.category = "subscription" if "subscription" in raw_category else raw_category
        if "type" in data:
            new_type = data["type"].strip().lower()
            if new_type not in ["income", "expense"]:
                return jsonify({"error": "Validation failed: 'type' must be strictly 'income' or 'expense'"}), 400
            tx.type = new_type
        if "currency" in data:
            tx.currency = data["currency"].strip().lower()
        if "method" in data:
            tx.method = data["method"].strip().lower()

        tx.save()

        sync_transaction_to_qdrant(tx)

        return jsonify({
            "message": "Transaction updated and reindexed in vector space successfully.",
        }), 200
    
    except Exception as e:
        return jsonify({"error": f"Failed to update transaction: {str(e)}"}), 500

@transactions_bp.route("/<string:tx_id>", methods=["DELETE"])
@token_required
def delete_transaction(current_user, tx_id):
    try:
        # Verify transaction exist and own by the user
        tx = Transaction.objects(id=tx_id, user_id=current_user.id).first()
        if not tx:
            return jsonify({"error": "Transaction not found or unauthorized"}), 404
        
        # Delete semantic vector point from Qdrant cluster
        try:
            delete_transaction_from_qdrant(tx_id)
        except Exception as q_err:
            print(f"Vector deletion error: {str(q_err)}")

        tx.delete()

        return jsonify({"message": "Transaction deleted from database"}), 200
    
    except Exception as e:
        return jsonify({"error": f"failed to delete the transaction: {str(e)}"}), 500

@transactions_bp.route("/paginated", methods=["GET"])
@token_required
def get_paginated_transactions(current_user):
    try:
        page = int(request.args.get("page", 1))
        limit = int(request.args.get("limit", 10))
        skip_amount = (page - 1) * limit

        # Fetch chronological descending records
        query = Transaction.objects(user_id=current_user.id).only("id", "date", "type", "description", "amount","currency", "category").order_by("-date")
        total_records = query.count()

        records = query.skip(skip_amount).limit(limit)
        serialized_txs = [tx.to_json_dict() for tx in records]

        return jsonify({
            "status": "success",
            "transactions": serialized_txs,
            "has_more": skip_amount + len(serialized_txs) < total_records
        }), 200
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)}), 500


@transactions_bp.route("/summary", methods=["GET"])
@token_required
def get_transaction_summary(current_user):
    try:
        # Pipeline to group transaction in the database by Month-Year
        pipeline = [
            {"$match": {"user_id": current_user.id}},
            {
                "$group": {
                    "_id": {
                        "year": {"$year": "$date"},
                        "month": {"$month": "$date"}
                    },
                    "total_income": {
                        "$sum": {"$cond": [{"$eq": ["$type", "income"]}, "$amount", 0]}
                    },
                    "total_expense": {
                        "$sum": {"$cond": [{"$eq": ["$type", "expense"]}, "$amount", 0]}
                    }
                }
            },
            {"$sort": {"_id.year": -1, "_id.month": -1}}
        ]

        aggregated_results = list(Transaction.objects.aggregate(*pipeline))

        chart_data = []
        global_income = 0
        global_expense = 0

        # Month mapping 
        months_map = {1: "January", 2: "February", 3: "March", 4: "April", 5: "May", 6: "June",
                      7: "July", 8: "August", 9: "September", 10: "October", 11: "November", 12: "December"}
        
        for res in aggregated_results:
            m_num = res["_id"]["month"]
            y_num = res["_id"]["year"]
            m_name = f"{months_map[m_num]} {y_num}"
            m_nameNum = f"{y_num}-{m_num:02d}"

            inc = float(res["total_income"])
            exp = float(res["total_expense"])

            global_income += inc
            global_expense += exp

            chart_data.append({
                "name": m_name,
                "year_month": m_nameNum,
                "Income": inc,
                "Expense": exp
            })
            
        return jsonify({
            "status": "success",
            "total_incomes": global_income,
            "total_expenses": global_expense,
            "chart_data": chart_data
        }), 200
    
    except Exception as e:
        return jsonify({"error": "Failed to comppile financial metrics."}), 500
