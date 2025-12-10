from typing import List, Optional
from pydantic import BaseModel, Field


class UserBase(BaseModel):
    email: str
    name: Optional[str] = None


class UserCreate(UserBase):
    password: str = Field(..., min_length=8, max_length=72)


class UserLogin(BaseModel):
    email: str
    password: str = Field(..., min_length=8, max_length=72)


class UserResponse(UserBase):
    id: str = Field(alias="_id")

    class Config:
        populate_by_name = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    sub: Optional[str] = None

class GenerateRequest(BaseModel):
    title: str
    tone: Optional[str] = None
    audience: Optional[str] = None
    topics: Optional[List[str]] = None
    additionalPrompt: Optional[str] = None
    apiKey: str = Field(..., min_length=1)

class SectionRegenerateRequest(BaseModel):
    article: dict
    sectionId: str
    promptOverrides: Optional[dict] = None
    apiKey: str

class ArticleCreateRequest(BaseModel):
    title: str
    tone: Optional[str] = None
    audience: Optional[str] = None
    topics: Optional[List[str]] = None
    additionalPrompt: Optional[str] = None
    tags: Optional[List[str]] = []
    sections: List[dict] = []
    status: Optional[str] = "draft"

class ArticleUpdateRequest(BaseModel):
    title: Optional[str] = None
    tone: Optional[str] = None
    audience: Optional[str] = None
    topics: Optional[List[str]] = None
    additionalPrompt: Optional[str] = None
    tags: Optional[List[str]] = None
    sections: Optional[List[dict]] = None
    status: Optional[str] = None
