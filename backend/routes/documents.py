from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
from .middleware import token_required
from services.rag_service import ingest_document

documents_bp = Blueprint("documents", __name__)

@documents_bp.route("/upload", methods=["POST"])
@token_required
def upload_documents(current_user):
    # Check if a file is appended to the incoming form-data network request
    if "file" not in request.files:
        return jsonify({"error": "No file found in request."}), 400
    
    uploaded_file = request.files["file"]

    if uploaded_file.filename == "":
        return jsonify({"error": "No file selected"}), 400
    
    # Sanitize filename to prevent directory traversal attacks
    filename = secure_filename(uploaded_file.filename)
    
    if not filename.lower().endswith(".pdf"):
        return jsonify({"error": "Only PDF documents are supported for RAG processing."}), 400
    
    try:
        # Read file as binary bytes
        file_bytes = uploaded_file.read()

        # Pass to service layer along with authenticated user ID
        total_chunks = ingest_document(
            file_bytes=file_bytes,
            filename=filename,
            user_id=str(current_user.id)
        )

        return jsonify({
            "message": f"Successfully processed '{filename}' into vector store.",
            "total_segments_indexed": total_chunks,
            "doc_type": "policy"
        }), 201
    
    except ValueError as ve:
        # Catch specific custom error string cleanly
        return jsonify({
            "error": "Unreadable document layer",
            "details": str(ve),
            "suggestion": "Please upload a digitally generated PDF where text can be highlighted and copied manually."
        }), 400
    
    except Exception as e:
        return jsonify({"error": f"Internal error occurred while processing document, '{str(e)}'"}), 500
    