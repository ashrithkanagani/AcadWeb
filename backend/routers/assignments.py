from fastapi import APIRouter, HTTPException, Query
from bson import ObjectId
from typing import List

import schemas
from database import assignments_collection

router = APIRouter(
    prefix="/assignments",
    tags=["Assignments"]
)

def serialize_doc(doc: dict) -> dict:
    if not doc:
        return {}
    return {"id": str(doc["_id"]), **{k: v for k, v in doc.items() if k != "_id"}}

@router.get("/", response_model=List[schemas.AssignmentResponse])
async def get_assignments(user_id: str = Query(...)):
    cursor = assignments_collection.find({"user_id": user_id}).sort("dueDate", 1)
    return [serialize_doc(doc) async for doc in cursor]

@router.post("/", response_model=schemas.AssignmentResponse)
async def create_assignment(assignment: schemas.AssignmentCreate):
    assignment_data = assignment.dict()
    result = await assignments_collection.insert_one(assignment_data)
    return {"id": str(result.inserted_id), **assignment_data}

@router.put("/{assignment_id}", response_model=schemas.AssignmentResponse)
async def update_assignment(assignment_id: str, assignment: schemas.AssignmentCreate):
    if not ObjectId.is_valid(assignment_id):
        raise HTTPException(status_code=400, detail="Invalid assignment ID")

    assignment_data = assignment.dict()
    result = await assignments_collection.update_one(
        {"_id": ObjectId(assignment_id)},
        {"$set": assignment_data}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Assignment not found")

    updated = await assignments_collection.find_one({"_id": ObjectId(assignment_id)})
    return serialize_doc(updated)

@router.delete("/{assignment_id}")
async def delete_assignment(assignment_id: str):
    if not ObjectId.is_valid(assignment_id):
        raise HTTPException(status_code=400, detail="Invalid assignment ID")

    result = await assignments_collection.delete_one({"_id": ObjectId(assignment_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Assignment not found")
    return {"message": "Assignment deleted successfully"}