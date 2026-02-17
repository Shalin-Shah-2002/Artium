import os
from typing import Optional
from dotenv import load_dotenv
from pymongo import MongoClient
from pymongo.database import Database
import certifi





load_dotenv()

def get_db() -> Database:
    uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
    mongo_kwargs = {}

    if uri.startswith("mongodb+srv://") or os.getenv("MONGODB_FORCE_CERT", "true").lower() not in {"false", "0", "no"}:
        # Provide Atlas with a trusted CA bundle when using TLS.
        mongo_kwargs["tlsCAFile"] = certifi.where()

    client = MongoClient(uri, **mongo_kwargs)
    db_name = os.getenv("MONGODB_DB", "ai_article_creator")
    return client[db_name]
