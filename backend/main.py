import os
import json
from contextlib import asynccontextmanager
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from google import genai
from google.genai import types
from routers import files, photos, reminders, notes, auth, assignments
from database import users_collection, client as mongo_client

# 1. Load Environment Variables
load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=api_key) if api_key else genai.Client()

# 2. Dynamic Mock User Generation Core
async def create_mock_users():
    try:
        if not await users_collection.find_one({"username": "ash"}):
            await users_collection.insert_one({"username": "ash", "password": "123"})
            
        if not await users_collection.find_one({"username": "ash1"}):
            await users_collection.insert_one({"username": "ash1", "password": "234"})
    except Exception as exc:
        print("MongoDB startup error:", exc)
        print("Check your MONGO_URL value in .env and verify your connection details.")
        raise

# 3. MODERN LIFESPAN LIFECYCLE CONTROLLER (Replaces deprecated on_event)
@asynccontextmanager
async def lifespan(app: FastAPI):
    # RUN ON STARTUP
    try:
        await mongo_client.admin.command('ping')
        print("**Pinged your deployment. You successfully connected to MongoDB!")
    except Exception as e:
        print(f"MongoDB Connection Error: {e}")
    
    await create_mock_users()
    yield
    # RUN ON SHUTDOWN (Optional database cleanups can go here)

# 4. Initialize FastAPI App with Lifespan
app = FastAPI(title="AcadMind API", lifespan=lifespan)

# 5. Configure CORS (CRITICAL FOR REACT)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================
# TIMETABLE AI LOGIC
# ==========================================
TIMETABLE_PROMPT = """
You are a universal student timetable parser. 
Analyze the image and extract the schedule into a clean JSON array.

EXTRACTION LOGIC:
1. SMART FILTER: 
   - IF the timetable contains BRIGHT GREEN cells, only extract those (this indicates registered classes).
   - IF there are NO green cells, extract ALL subjects visible in the grid.
   
2. GRID HANDLING:
   - Identify the Day (usually the first column or top row).
   - Map subjects to their corresponding day and time.
   - If specific times (like 08:00) are missing from the headers, use "Slot 1", "Slot 2", etc.

3. CLEANING:
   - Subject: Extract the main name (e.g., "MATHS", "SCIENCE").
   - Room/Teacher: Extract if mentioned in parentheses or small text (e.g., "SAS", "TR").

OUTPUT FORMAT:
Return ONLY a valid JSON array of objects with keys: "day", "time", "subject", "room", "teacher".
"""

def normalize_entry(entry: dict) -> dict:
    """Ensure every entry has all required keys with safe defaults."""
    return {
        "day": str(entry.get("day") or entry.get("date") or "Unknown"),
        "time": str(entry.get("time") or entry.get("slot") or entry.get("session") or "Slot ?"),
        "subject": str(entry.get("subject") or entry.get("course") or entry.get("paper") or "Unknown"),
        "room": entry.get("room") or entry.get("venue") or entry.get("hall") or None,
        "teacher": entry.get("teacher") or entry.get("faculty") or entry.get("instructor") or None,
    }

def extract_list_from_response(data) -> list:
    """Robustly pull a list out of whatever Gemini returned."""
    if isinstance(data, list):
        return data
    if isinstance(data, dict):
        for key in ("timetable", "schedule", "data", "entries", "classes", "slots", "results"):
            if key in data and isinstance(data[key], list):
                return data[key]
        if "day" in data or "subject" in data:
            return [data]
    return []

@app.post("/process-timetable")
def process_timetable(file: UploadFile = File(...)):
    allowed_types = {"image/jpeg", "image/png", "image/webp", "image/gif", "image/bmp"}
    content_type = file.content_type or "image/jpeg"
    if content_type not in allowed_types:
        return {"error": f"Unsupported file type: {content_type}. Please upload a JPEG, PNG, or WebP image."}

    try:
        content = file.file.read()

        if len(content) == 0:
            return {"error": "Uploaded file is empty."}

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=[
                TIMETABLE_PROMPT,
                types.Part.from_bytes(data=content, mime_type=content_type)
            ],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.1,
            ),
        )

        raw_text = response.text.strip()

        if raw_text.startswith("```"):
            raw_text = raw_text.split("```")[1]
            if raw_text.startswith("json"):
                raw_text = raw_text[4:]
            raw_text = raw_text.strip()

        parsed = json.loads(raw_text)
        entries = extract_list_from_response(parsed)

        if not entries:
            return {"error": "Could not extract any timetable data. Please try a clearer image."}

        normalized = [normalize_entry(e) for e in entries]
        return normalized

    except json.JSONDecodeError as e:
        print(f"JSON Parse Error: {e}\nRaw response: {response.text[:500]}")
        return {"error": "AI returned malformed data. Try uploading a clearer image."}
    except Exception as e:
        print(f"ERROR: {type(e).__name__}: {e}")
        return {"error": f"Processing failed: {str(e)}"}

# ==========================================
# REGISTER ROUTERS
# ==========================================
app.include_router(auth.router)
app.include_router(notes.router)
app.include_router(assignments.router)
app.include_router(reminders.router)
app.include_router(files.router)
app.include_router(photos.router)

@app.get("/")
def root():
    return {"message": "AcadMind API running with Multi-User support."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)