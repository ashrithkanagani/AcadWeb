from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from database import users_collection

router = APIRouter(prefix="/auth", tags=["Auth"])

# 1. Define what data React will send us
class UserAuth(BaseModel):
    username: str
    password: str

# 2. Define what data we will send back to React
class UserResponse(BaseModel):
    id: str
    username: str

@router.post("/signup", response_model=UserResponse)
async def signup(user: UserAuth):
    # Check if user exists
    existing = await users_collection.find_one({"username": user.username})
    if existing:
        raise HTTPException(status_code=400, detail="Username already registered. Try another one.")

    # Insert into MongoDB
    new_user = {"username": user.username, "password": user.password}
    result = await users_collection.insert_one(new_user)
    
    # Return the new user with the generated MongoDB ID
    return {"id": str(result.inserted_id), "username": user.username}

@router.post("/login", response_model=UserResponse)
async def login(user: UserAuth):
    # Find the user in the database
    db_user = await users_collection.find_one({
        "username": user.username,
        "password": user.password
    })
    
    if not db_user:
        raise HTTPException(status_code=400, detail="Invalid username or password")
        
    # Success! Return the user
    return {"id": str(db_user["_id"]), "username": db_user["username"]}