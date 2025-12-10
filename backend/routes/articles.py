from datetime import datetime

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException

from db import get_db
from schemas import ArticleCreateRequest, ArticleUpdateRequest
from services.auth import get_current_user

router = APIRouter()

@router.post("/articles")
def create_article(req: ArticleCreateRequest, current_user: dict = Depends(get_current_user)):
    """
    Save a new article draft to MongoDB.
    
    Body: Article data (title, tone, audience, topics, tags, sections, status)
    Returns: Article ID
    """
    db = get_db()

    try:
        owner_id = ObjectId(current_user["_id"])
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Invalid user identifier") from exc

    additional_prompt = (req.additionalPrompt.strip() if req.additionalPrompt else None)

    doc = {
        "title": req.title,
        "tone": req.tone,
        "audience": req.audience,
        "topics": req.topics,
        "additionalPrompt": additional_prompt,
        "tags": req.tags or [],
        "sections": req.sections or [],
        "status": req.status or "draft",
        "userId": owner_id,
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow(),
    }
    result = db.articles.insert_one(doc)
    return {"_id": str(result.inserted_id)}

@router.get("/articles/{id}")
def get_article(id: str, current_user: dict = Depends(get_current_user)):
    """
    Retrieve an article by ID.
    
    Returns: Full article document
    """
    db = get_db()
    try:
        owner_id = ObjectId(current_user["_id"])
        doc = db.articles.find_one({"_id": ObjectId(id), "userId": owner_id})
        if not doc:
            raise HTTPException(status_code=404, detail="Article not found")
        doc["_id"] = str(doc["_id"])
        if doc.get("userId"):
            doc["userId"] = str(doc["userId"])
        return doc
    except Exception as e:
        if "invalid" in str(e).lower():
            raise HTTPException(status_code=400, detail="Invalid article ID")
        raise HTTPException(status_code=500, detail="Failed to retrieve article")

@router.get("/articles")
def list_articles(limit: int = 20, skip: int = 0, current_user: dict = Depends(get_current_user)):
    """
    List all articles with pagination.
    
    Query params:
        - limit: Max number of articles to return (default 20)
        - skip: Number of articles to skip (default 0)
    
    Returns: List of articles
    """
    db = get_db()
    try:
        owner_id = ObjectId(current_user["_id"])
        cursor = (
            db.articles
            .find({"userId": owner_id})
            .sort("updatedAt", -1)
            .skip(skip)
            .limit(limit)
        )
        articles = []
        for doc in cursor:
            doc["_id"] = str(doc["_id"])
            if doc.get("userId"):
                doc["userId"] = str(doc["userId"])
            articles.append(doc)
        return {"articles": articles}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to list articles")

@router.put("/articles/{id}")
def update_article(id: str, req: ArticleUpdateRequest, current_user: dict = Depends(get_current_user)):
    """
    Update an existing article.
    
    Body: Partial article updates
    Returns: Updated article
    """
    db = get_db()
    update = {k: v for k, v in req.dict(exclude_none=True).items()}
    if "additionalPrompt" in update:
        update["additionalPrompt"] = update["additionalPrompt"].strip() if update["additionalPrompt"] else None
    update["updatedAt"] = datetime.utcnow()
    
    try:
        owner_id = ObjectId(current_user["_id"])
        result = db.articles.update_one({"_id": ObjectId(id), "userId": owner_id}, {"$set": update})
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Article not found")
        
        doc = db.articles.find_one({"_id": ObjectId(id)})
        doc["_id"] = str(doc["_id"])
        if doc.get("userId"):
            doc["userId"] = str(doc["userId"])
        return doc
    except HTTPException:
        raise
    except Exception as e:
        if "invalid" in str(e).lower():
            raise HTTPException(status_code=400, detail="Invalid article ID")
        raise HTTPException(status_code=500, detail="Failed to update article")

@router.delete("/articles/{id}")
def delete_article(id: str, current_user: dict = Depends(get_current_user)):
    """
    Delete an article by ID.
    
    Returns: Success message
    """
    db = get_db()
    try:
        owner_id = ObjectId(current_user["_id"])
        result = db.articles.delete_one({"_id": ObjectId(id), "userId": owner_id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Article not found")
        return {"message": "Article deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        if "invalid" in str(e).lower():
            raise HTTPException(status_code=400, detail="Invalid article ID")
        raise HTTPException(status_code=500, detail="Failed to delete article")
