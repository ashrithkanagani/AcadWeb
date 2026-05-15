import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")

# Connect to your MongoDB Atlas cluster or local MongoDB instance
client = AsyncIOMotorClient(
    MONGO_URL,
    serverSelectionTimeoutMS=5000,
    connectTimeoutMS=5000,
)

# Select your database (MongoDB creates it automatically if it doesn't exist!)
db = client.acadmind_db

# Define your "Collections" (MongoDB equivalent of SQL tables)
users_collection = db.get_collection("users")
notes_collection = db.get_collection("notes")
assignments_collection = db.get_collection("assignments")
files_collection = db.get_collection("files")
reminders_collection = db.get_collection("reminders")
timetable_collection = db.get_collection("timetable")
photos_collection = db.get_collection("photos")