const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

async function createAIClient() {
  if (!API_KEY) {
    throw new Error('Gemini API key is not configured. Set VITE_GEMINI_API_KEY in your environment.');
  }

  const { GoogleGenAI } = await import('@google/genai');
  return new GoogleGenAI({ apiKey: API_KEY });
}

const TIMETABLE_PROMPT = `
You are an expert timetable parser. Analyze this student timetable image carefully and extract ALL visible data.

The timetable may be:
- A college, school, exam, or coaching timetable
- A screenshot, photo, or scanned image
- Portrait or landscape orientation
- Slightly tilted or skewed
- Colored or patterned background
- Have merged cells spanning multiple days/times
- Have irregular or missing time slots
- Have abbreviated or full subject names

EXTRACTION RULES:
1. For merged cells (one subject spanning multiple time slots or days), create a SEPARATE entry for EACH slot it covers.
2. If time slots are missing, label them sequentially: "Slot 1", "Slot 2", "Slot 3", etc.
3. If a day is missing or unclear, use the column/row position: "Day 1", "Day 2", etc.
4. If a cell is empty, free period, or lunch/break — set subject to "Free" or the actual label (e.g., "Lunch", "Break").
5. Extract room/venue if visible, otherwise use null.
6. Extract teacher/faculty name if visible, otherwise use null.
7. Normalize day names to full names: "Mon" → "Monday", "Tue" → "Tuesday", etc.

OUTPUT FORMAT:
Return ONLY a valid JSON array. No explanations, no markdown, no code blocks.
Each object MUST have these exact keys:
{
  "day": "Monday",
  "time": "9:00 AM - 10:00 AM",
  "subject": "Mathematics",
  "room": "Room 101",
  "teacher": "Dr. Smith"
}
  if any of the parameters are not given, leave them empty 
`;

export async function extractTimetableFromImage(base64Data, mimeType) {
  try {
    const ai = await createAIClient();
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [
        TIMETABLE_PROMPT,
        {
          inlineData: {
            data: base64Data,
            mimeType: mimeType
          }
        }
      ],
      config: {
        responseMimeType: "application/json",
        temperature: 0.1, // Keep it low for consistent JSON output
      }
    });

    // Parse the returned JSON string into a JavaScript array
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Gemini Extraction Error:", error);
    throw new Error("Failed to extract timetable. Please try a clearer image.", { cause: error });
  }
}