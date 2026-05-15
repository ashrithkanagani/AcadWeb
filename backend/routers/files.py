from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from database import files_collection
from bson import ObjectId

router = APIRouter(prefix="/files", tags=["Files"])

# 1. Define what data React will send us when a file is uploaded
class FileItem(BaseModel):
    username: str
    filename: str
    file_type: str
    file_size: str

# 2. Helper to translate MongoDB data into React-friendly JSON
def file_helper(file) -> dict:
    return {
        "id": str(file["_id"]), # Converts MongoDB's weird ObjectId into a normal string
        "username": file["username"],
        "filename": file["filename"],
        "file_type": file.get("file_type", "unknown"),
        "file_size": file.get("file_size", "0 KB")
    }

# 3. GET ROUTE: Send all files to React when the page loads
@router.get("/{username}")
async def get_user_files(username: str):
    files = []
    # Search the database for any files belonging to this specific user
    cursor = files_collection.find({"username": username})
    async for document in cursor:
        files.append(file_helper(document))
    return files

# 4. POST ROUTE: Save a new file record to the database
@router.post("/")
async def add_file(file: FileItem):
    # Insert the data into MongoDB
    file_dict = file.dict()
    result = await files_collection.insert_one(file_dict)
    
    # Grab the newly saved file (with its new ID) and send it back to React
    new_file = await files_collection.find_one({"_id": result.inserted_id})
    return file_helper(new_file)

# 5. DELETE ROUTE: Remove a file when the user clicks the trash can
@router.delete("/{file_id}")
async def delete_file(file_id: str):
    # MongoDB requires the ID to be wrapped in ObjectId() to delete it
    result = await files_collection.delete_one({"_id": ObjectId(file_id)})
    if result.deleted_count == 1:
        return {"message": "File deleted successfully"}
    
    raise HTTPException(status_code=404, detail="File not found")