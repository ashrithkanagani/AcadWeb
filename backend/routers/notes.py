from fastapi import APIRouter, HTTPException
from bson import ObjectId
from typing import List

import schemas
from database import notes_collection

router = APIRouter(prefix="/notes", tags=["Notes"])

def serialize_doc(doc: dict) -> dict:
    if not doc:
        return {}
    return {"id": str(doc["_id"]), **{k: v for k, v in doc.items() if k != "_id"}}

@router.get("/{user_id}", response_model=List[schemas.NoteResponse])
async def get_notes(user_id: str):
    cursor = notes_collection.find({"user_id": user_id}).sort("date", -1)
    return [serialize_doc(doc) async for doc in cursor]

@router.post("/", response_model=schemas.NoteResponse)
async def create_note(note: schemas.NoteCreate):
    note_data = note.dict()
    result = await notes_collection.insert_one(note_data)
    return {"id": str(result.inserted_id), **note_data}

@router.delete("/{note_id}")
async def delete_note(note_id: str):
    if not ObjectId.is_valid(note_id):
        raise HTTPException(status_code=400, detail="Invalid note ID")

    result = await notes_collection.delete_one({"_id": ObjectId(note_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Note not found")
    return {"message": "Note deleted successfully"}

@router.put("/{note_id}", response_model=schemas.NoteResponse)
async def update_note(note_id: str, note: schemas.NoteCreate):
    if not ObjectId.is_valid(note_id):
        raise HTTPException(status_code=400, detail="Invalid note ID")

    note_data = note.dict()
    result = await notes_collection.update_one(
        {"_id": ObjectId(note_id)},
        {"$set": note_data}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Note not found")

    updated = await notes_collection.find_one({"_id": ObjectId(note_id)})
    return serialize_doc(updated)
