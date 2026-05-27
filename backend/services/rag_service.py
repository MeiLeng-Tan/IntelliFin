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
        collection_name="financial_knowledge_base",
        url=qdrant_url,
        api_key=qdrant_api_key
    )

    return len(chunks)
