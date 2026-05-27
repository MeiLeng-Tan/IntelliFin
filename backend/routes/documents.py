from flask import Blueprint, request, jsonify
from .middleware import token_required
from services.rag_service import ingest_document

documents_bp = Blueprint('documents', __name__)

@documents_bp.route('/upload', methods=['POST'])
@token_required
def upload_documents(current_user):
    # Check if a file is appended to the incomign from-data network request
    if 'file' not in request.files:
        return jsonify({"error": "No file found in request."}), 400
    
    uploaded_file = request.files['file']

    if uploaded_file.filename == '':
        return jsonify({"error": "No file selected"}), 400
    
    if not uploaded_file.filename.lower().endswith('pdf'):
        return jsonify({"error": "Only PDF documents are supported for RAG processing."}), 400
    
    try:
        # Read file as binary bytes
        file_bytes = uploaded_file.read()

        # Pass to service layer along with authenticated user ID
        total_chunks = ingest_document(
            file_bytes=file_bytes,
            filename=uploaded_file.filename,
            user_id=current_user.id
        )

        return jsonify({
            "message": f"Successfully processed '{uploaded_file.filename}' into vector store.",
            "total_segments_indexed": total_chunks,
            "status": "synchronized"
        }), 201
    except ValueError as ve:
        # Catch our specific custom error string cleanly
        return jsonify({
            "error": "Unreadable document layer",
            "details": str(ve),
            "suggestion": "Please upload a digitally generated PDF where text can be highlighted and copied manually."
        }), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    