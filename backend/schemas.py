from pydantic import BaseModel

# --- User Auth ---
class UserAuth(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    id: str
    username: str
    class Config:
        from_attributes = True

# --- Notes ---
class NoteBase(BaseModel):
    title: str
    body: str
    tag: str
    date: str
    user_id: str # Now required

class NoteCreate(NoteBase):
    pass

class NoteResponse(NoteBase):
    id: str
    class Config:
        from_attributes = True

# --- Assignments ---
class AssignmentBase(BaseModel):
    title: str
    subject: str
    dueDate: str
    time: str
    completed: bool
    user_id: str

class AssignmentCreate(AssignmentBase):
    pass

class AssignmentResponse(AssignmentBase):
    id: str
    class Config:
        from_attributes = True