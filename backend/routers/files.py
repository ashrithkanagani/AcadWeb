import os
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from database import files_collection
from bson import ObjectId
import cloudinary
import cloudinary.uploader
from dotenv import load_dotenv

# 1. Load Keys and Connect to Cloudinary
load_dotenv()
cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET")
)

router = APIRouter(prefix="/files", tags=["Files"])

# 2. Pydantic Model strictly for Folder Creation
class FolderItem(BaseModel):
    username: str
    type: str = "folder"
    name: str
    parentId: str = "root"

# 3. Helper to translate MongoDB data into React-friendly JSON
def file_helper(file) -> dict:
    return {
        "id": str(file["_id"]),
        "username": file["username"],
        "type": file.get("type", "file"),
        "name": file.get("name") or file.get("filename"),
        "filename": file.get("filename"),
        "file_type": file.get("file_type"),
        "file_size": file.get("file_size"),
        "url": file.get("url"),
        "parentId": file.get("parentId", "root")
    }

# 4. GET ROUTE: Send all files & folders to React
@router.get("/{username}")
async def get_user_files(username: str):
    files = []
    cursor = files_collection.find({"username": username})
    async for document in cursor:
        files.append(file_helper(document))
    return files

# 5. POST ROUTE (FILES): Catches FormData and sends to Cloudinary
@router.post("/")
async def add_file(
    username: str = Form(...),
    parentId: str = Form("root"),
    file: UploadFile = File(...)
):
    try:
        # Read the physical file
        file_bytes = await file.read()

        # Send it to Cloudinary
        upload_result = cloudinary.uploader.upload(
            file_bytes,
            resource_type="auto",
            folder=f"acadweb/{username}" 
        )

        # Save the lightweight URL to MongoDB
        file_doc = {
            "username": username,
            "type": "file",
            "name": file.filename,
            "filename": file.filename,
            "file_type": file.content_type,
            "file_size": f"{(len(file_bytes) / 1024):.2f} KB",
            "url": upload_result.get("secure_url"), # Cloudinary Link!
            "parentId": parentId
        }

        result = await files_collection.insert_one(file_doc)
        new_file = await files_collection.find_one({"_id": result.inserted_id})
        return file_helper(new_file)

    except Exception as e:
        print(f"Upload Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# 6. POST ROUTE (FOLDERS): Catches JSON specifically for making folders
@router.post("/folder")
async def add_folder(folder: FolderItem):
    payload = folder.dict()
    result = await files_collection.insert_one(payload)
    new_folder = await files_collection.find_one({"_id": result.inserted_id})
    return file_helper(new_folder)

# 7. DELETE ROUTE: Remove a file or folder
@router.delete("/{file_id}")
async def delete_file(file_id: str):
    result = await files_collection.delete_one({"_id": ObjectId(file_id)})
    if result.deleted_count == 1:
        return {"message": "Item deleted successfully"}
    
    raise HTTPException(status_code=404, detail="Item not found")