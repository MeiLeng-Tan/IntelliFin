import os
from dotenv import load_dotenv
from io import BytesIO
from pypdf import PdfReader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings
from langchain_qdrant import QdrantVectorStore
from qdrant_client import QdrantClient

# Initialize the client
load_dotenv()
qdrant_url = os.getenv("QDRANT_URL")
qdrant_api_key = os.getenv("QDRANT_API_KEY")
qdrant_collection = os.getenv("QDRANT_COLLECTION")

if qdrant_url and qdrant_api_key:
    client = QdrantClient(url=qdrant_url, api_key=qdrant_api_key)
else:
    client = QdrantClient(":memory:")

embeddings = OpenAIEmbeddings(model="text-embedding-3-small")

def extract_text_from_pdf(file_bytes):
    """
    Extract raw string lines from the uploaded binary PDF streams. 
    """
    pdf_file = BytesIO(file_bytes)
    reader = PdfReader(pdf_file)
    extracted_text = ""
    for page in reader.pages:
        text = page.extract_text()
        if text:
            extracted_text += text + "\n"
    return extracted_text

def ingest_document(file_bytes, filename, user_id):
    """
    Parses text, chunks and geenrates embeddings, then save to Qdrant wiht metadata filters.
    """
    # Extract text from file bytes
    raw_text = extract_text_from_pdf(file_bytes)
    if not raw_text.strip():
        raise ValueError("Could not extract any readable text from this document.")
    
    # Split text into 1--- characters segments with a 200 characters overllapping windows
    text_splitters = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    chunks = text_splitters.split_text(raw_text)

    # Construct metadat blocks for security filtering, users only able to search their own uploaded document 
    metadatas = [
        {
            "user_id": str(user_id),
            "source_document": filename,
            "chunk_index": idx
        }
        for idx, _ in enumerate(chunks)
    ]

    # Transmit chunks and metadata to clous Qdrant collection
    QdrantVectorStore.from_texts(
        texts=chunks,
        embedding=embeddings,
        metadatas=metadatas,
        collection_name=qdrant_collection,
        url=qdrant_url,
        api_key=qdrant_api_key
    )

    return len(chunks)

def sync_transaction_to_qdrant(transaction):
    """
    Converts transaction into descriptive paragraph for RAG context.
    """
    tx_type = getattr(transaction, "type", "expense").lower()

    if tx_type == "income":
        action_phrase = f"received ${transaction.amount:,.2f} of income from"
    else:
        action_phrase = f"spent ${transaction.amount:,.2f} on item"

    narrative_text = (
        f"Transaction Record: User {action_phrase} '{transaction.description}'."
        f"This transaction categorized under '{transaction.category}' "
        f"and logged via {transaction.source}."
    )

    metadata = {
        "user_id": str(transaction.user_id),
        "doc_type": "transaction",
        "transaction_type": tx_type,
        "transaction_id": str(transaction.id),
        "source": transaction.source
    }

    # Append the transaction vector to collection
    QdrantVectorStore.from_texts(
        texts=[narrative_text],
        embedding=embeddings,
        metadatas=[metadata],
        collection_name="financial_knowledge_base",
        url=qdrant_url,
        api_key=qdrant_api_key
    )
