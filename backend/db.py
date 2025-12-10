import os
from typing import Optional
from dotenv import load_dotenv
from pymongo import MongoClient
from pymongo.database import Database

load_dotenv()

def get_db() -> Database:
    uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
    client = MongoClient(uri)
    db_name = os.getenv("MONGODB_DB", "ai_article_creator")
    return client[db_name]
