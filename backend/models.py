from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class User(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    email: str
    name: Optional[str] = None
    createdAt: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda dt: dt.isoformat()
        }

class Section(BaseModel):
    id: str
    heading: str
    content: str
    order: int

class Article(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    userId: Optional[str] = None
    title: str
    tone: Optional[str] = None
    audience: Optional[str] = None
    topics: Optional[List[str]] = None
    tags: List[str] = []
    sections: List[Section] = []
    status: str = "draft"
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda dt: dt.isoformat()
        }
