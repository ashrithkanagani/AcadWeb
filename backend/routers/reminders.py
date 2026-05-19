from fastapi import APIRouter, HTTPException
from bson import ObjectId
from pydantic import BaseModel
from typing import List

from database import reminders_collection

router = APIRouter(prefix="/reminders", tags=["Reminders"])

class ReminderItem(BaseModel):
    username: str
    name: str
    date: str
    time: str
    desc: str | None = None
    color: str | None = None


def serialize(doc: dict) -> dict:
    if not doc:
        return {}
    return {"id": str(doc["_id"]), **{k: v for k, v in doc.items() if k != "_id"}}


@router.get("/{username}")
async def get_reminders(username: str):
    cursor = reminders_collection.find({"username": username}).sort("date", -1)
    return [serialize(doc) async for doc in cursor]


@router.post("/")
async def create_reminder(reminder: ReminderItem):
    reminder_data = reminder.dict()
    result = await reminders_collection.insert_one(reminder_data)
    created = await reminders_collection.find_one({"_id": result.inserted_id})
    return serialize(created)


@router.delete("/{reminder_id}")
async def delete_reminder(reminder_id: str):
    if not ObjectId.is_valid(reminder_id):
        raise HTTPException(status_code=400, detail="Invalid reminder ID")
    result = await reminders_collection.delete_one({"_id": ObjectId(reminder_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Reminder not found")
    return {"message": "Reminder deleted"}


# ADDED: Fully configured PUT route to handle database updates for edits
@router.put("/{reminder_id}")
async def update_reminder(reminder_id: str, reminder_data_raw: dict):
    if not ObjectId.is_valid(reminder_id):
        raise HTTPException(status_code=400, detail="Invalid reminder ID")

    # Clean out any incoming string ID keys so MongoDB doesn't try to alter the main entity index
    reminder_data = {k: v for k, v in reminder_data_raw.items() if k != "id" and k != "_id"}

    result = await reminders_collection.update_one(
        {"_id": ObjectId(reminder_id)},
        {"$set": reminder_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Reminder not found")

    # Retrieve and serialize the freshly updated document to send back to React
    updated = await reminders_collection.find_one({"_id": ObjectId(reminder_id)})
    return serialize(updated)