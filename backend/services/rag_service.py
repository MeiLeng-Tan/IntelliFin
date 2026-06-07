import os
from dotenv import load_dotenv
from io import BytesIO
from pypdf import PdfReader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings
from langchain_qdrant import QdrantVectorStore
from qdrant_client import QdrantClient
from qdrant_client.http import models as qdrant_models
import uuid

# Initialize the client
load_dotenv()
qdrant_url = os.getenv("QDRANT_URL")
qdrant_api_key = os.getenv("QDRANT_API_KEY")
qdrant_collection = os.getenv("QDRANT_COLLECTION", "financial_knowledge_base")

if qdrant_url and qdrant_api_key:
    client = QdrantClient(url=qdrant_url, api_key=qdrant_api_key)
else:
    client = QdrantClient(":memory:")

try:
    if not client.collection_exists(collection_name=qdrant_collection):
        print(f"Creating collection '{qdrant_collection}' in Qdrant cluster...")
        client.create_collection(
            collection_name=qdrant_collection,
            vectors_config=qdrant_models.VectorParams(
                size=1536, 
                distance=qdrant_models.Distance.COSINE
            )
        )
        print(f"Collection '{qdrant_collection}' created successfully.")
        # Create payload index 
        client.create_payload_index(
            collection_name=qdrant_collection,
            field_name="metadata.user_id",
            field_schema=qdrant_models.PayloadSchemaType.KEYWORD
        )
except Exception as init_err:
    print(f"Warning during Qdrant collection initialization check: {str(init_err)}")

embeddings = OpenAIEmbeddings(model="text-embedding-3-small")

# Instantiate a Vecotr Store instance
vector_store = QdrantVectorStore(
    client=client,
    collection_name=qdrant_collection,
    embedding=embeddings
)

def convert_mongo_id_to_uuid(mongo_id: str) -> str:
    """
    Convert MongoDB ObjectId string into a 36-characters Qdrant UUID string.
    """
    padded_hex = str(mongo_id).zfill(32)
    return str(uuid.UUID(hex=padded_hex))

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

    # Construct metadata blocks for security filtering, users only able to search their own uploaded document 
    metadatas = [
        {
            "user_id": str(user_id),
            "source_document": filename,
            "chunk_index": idx
        }
        for idx, _ in enumerate(chunks)
    ]

    # Transmit chunks and metadata to clous Qdrant collection
    vector_store.add_texts(
        texts=chunks,
        metadatas=metadatas,
    )

    return len(chunks)

def sync_transaction_to_qdrant(transaction):
    """
    Converts transaction into descriptive paragraph for RAG context.
    """

    if hasattr(transaction.user_id, "id"):
        raw_user_id = str(transaction.user_id.id)
    else:
        raw_user_id = str(transaction.user_id)

    tx_type = getattr(transaction, "type", "expense").lower()

    if tx_type == "investment":
        text_payload = (
            f"Investment activity log: On {transaction.date.strftime("%B %d, %Y")}, "
            f"the user executed a {transaction.trade_action.upper()} order for {transaction.quantity} units "
            f"of {transaction.ticker} ({transaction.category.upper()}) at a price of {transaction.price_per_unit} {transaction.currency} per unit. "
            f"The total transaction allocation volume amounted to {transaction.amount} {transaction.currency} via {transaction.method}."
        )
    else:
        if tx_type == "income":
            action_phrase = f"received ${transaction.amount} ${transaction.currency} from"
        else:
            action_phrase = f"spent ${transaction.amount} ${transaction.currency} on"

        text_payload = (
            f"Transaction activity log: On {transaction.date.strftime("%B %d, %Y")}, "
            f"the User {action_phrase} '{transaction.description}'. "
            f"This transaction categorized under '{transaction.category}' category, "
            f"paid via {transaction.method}."
            # f"and logged via {transaction.source}."
        )

    metadata = {
        "user_id": str(raw_user_id),
        "doc_type": "transaction",
        "date": transaction.date.isoformat(),
        "transaction_type": tx_type,
        "transaction_category": str(transaction.category),
        "ticker": getattr(transaction, "ticker", None),
        "transaction_id": str(transaction.id),
        "source": transaction.source
    }

    qdrant_uuid = convert_mongo_id_to_uuid(str(transaction.id))

    # Append the transaction vector to collection
    vector_store.add_texts(
        texts=[text_payload],
        metadatas=[metadata],
        ids=[qdrant_uuid]
    )

def delete_transaction_from_qdrant(tx_id: str) -> bool:
    """
    Remove a transaction vector point from Qdant cluster by its UUID string. 
    Return true if successul, raises exception otherwise.
    """
    try: 

        qdrant_uuid = convert_mongo_id_to_uuid(str(tx_id))

        client.delete(
            collection_name=qdrant_collection,
            points_selector=[qdrant_uuid]
        )
        return True
    except Exception as e:
        print(f"Qdrant Vector deletion failed for ID {tx_id}: {str(e)}")
        raise e