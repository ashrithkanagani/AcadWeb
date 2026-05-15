from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from database import photos_collection
from bson import ObjectId
import base64

router = APIRouter(prefix="/photos", tags=["Photos"])

# Helper to format data for React
def photo_helper(photo) -> dict:
    return {
        "id": str(photo["_id"]),
        "username": photo["username"],
        "filename": photo["filename"],
        "content_type": photo.get("content_type", "image/png"),
        "photo_data": photo.get("photo_data", "") # The actual image bytes!
    }

# GET: Fetch all photos for the user
@router.get("/{username}")
async def get_photos(username: str):
    photos = []
    cursor = photos_collection.find({"username": username})
    async for document in cursor:
        photos.append(photo_helper(document))
    return photos

# POST: Upload a new photo
@router.post("/")
async def upload_photo(username: str = Form(...), file: UploadFile = File(...)):
    # Security check: Ensure it is actually an image!
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Uploaded file must be an image.")

    # Convert the physical image into a Base64 string for MongoDB
    file_bytes = await file.read()
    encoded_photo = base64.b64encode(file_bytes).decode('utf-8')
    
    photo_doc = {
        "username": username,
        "filename": file.filename,
        "content_type": file.content_type,
        "photo_data": encoded_photo
    }
    
    result = await photos_collection.insert_one(photo_doc)
    new_photo = await photos_collection.find_one({"_id": result.inserted_id})
    return photo_helper(new_photo)

# DELETE: Remove a photo
@router.delete("/{photo_id}")
async def delete_photo(photo_id: str):
    result = await photos_collection.delete_one({"_id": ObjectId(photo_id)})
    if result.deleted_count == 1:
        return {"message": "Photo deleted successfully"}
    raise HTTPException(status_code=404, detail="Photo not found")