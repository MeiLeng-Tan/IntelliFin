from datetime import datetime, timezone
from io import BytesIO
from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
from langchain_openai import ChatOpenAI
from pypdf import PdfReader

from models import Transaction
from .middleware import token_required
from services import sync_transaction_to_qdrant, handle_subscription_linking

# Define the blueprint
transactions_bp = Blueprint("transaction", __name__)

llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)

@transactions_bp.route("/", methods=["GET"])
@token_required
def get_transactions(current_user):
    try:
        # Retrieve transactions belonging to the user
        transactions = Transaction.objects(user_id=current_user.id).order_by("-date")

        transaction_list = []
        for t in transactions:
            transaction_list.append({
                "transaction_id": str(t.id),
                "date": t.date.isoformat(),
                "type": t.type,
                "description": t.description,
                "amount": float(t.amount),
                "method": t.method,
                "currency": t.currency,
                "category": t.category,
                "source": t.source,
                "doc_name": t.doc_name if t.doc_name else None,
                "subscription_id": str(t.subscription_id.id) if t.subscription_id else None
            })

        return jsonify(transaction_list), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@transactions_bp.route("/manual", methods=["POST"])
@token_required
def create_manual_entry(current_user):
    data = request.get_json()
    
    if not all(k in data for k in ("date", "type", "description", "amount", "method", "currency", "category")):
        return jsonify({"error": "Missing required fields"}), 400
    
    try:
        category = data.get("category", "others")

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
                            "date": {"type": "string"},
                            "description": {"type": "string"},
                            "amount": {"type": "number", "description": "The absolute positive numberic value of the transaction"},
                            "type": {"type": "string", "enum": ["income", "expense"], "description": "Identify if this transaction is an income/deposit or an expense/withdrawal"},
                            "category": {"type": "string"},
                            "inferred_billing_cycle": {"type": "string", "enum": ["weekly", "monthly", "quarterly", "annual"]}
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

            sub_record = handle_subscription_linking(
                current_user_id=current_user.id,
                description=item["description"],
                amount=item["amount"],
                currency=detected_currency,
                tx_date=parsed_date,
                category=item["category"],
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
    