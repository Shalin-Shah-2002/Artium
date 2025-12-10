from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status

from schemas import Token, UserCreate, UserLogin, UserResponse
from services.auth import (
    authenticate_user,
    create_access_token,
    get_current_user,
    get_password_hash,
    get_user_by_email,
    get_user_collection,
)

router = APIRouter()


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register_user(payload: UserCreate):
    users = get_user_collection()
    email = payload.email.lower().strip()

    if get_user_by_email(email):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    doc = {
        "email": email,
        "name": payload.name,
        "passwordHash": get_password_hash(payload.password),
        "createdAt": datetime.utcnow(),
    }

    result = users.insert_one(doc)
    doc["_id"] = str(result.inserted_id)
    doc.pop("passwordHash", None)
    return doc


@router.post("/login", response_model=Token)
def login(payload: UserLogin):
    user = authenticate_user(payload.email.lower().strip(), payload.password)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")

    access_token = create_access_token(str(user["_id"]))
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=UserResponse)
def read_current_user(current_user: dict = Depends(get_current_user)):
    return current_user
