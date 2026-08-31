from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from graph.conversation_manager import ConversationManager
from services.slot_generator import SlotGenerator

app = FastAPI(title="AeroHealth AI API")

# Setup CORS to allow the React frontend to communicate
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In a real app, we'd use a database. For this demo, we store sessions in memory.
sessions = {}

# Generate slots once on startup
slot_generator = SlotGenerator()
slot_generator.generate_today_slots()

class ChatRequest(BaseModel):
    session_id: str
    message: str

class ChatResponse(BaseModel):
    reply: str
    stage: str
    booking_complete: bool

@app.post("/chat", response_model=ChatResponse)
async def chat_endpoint(req: ChatRequest):
    if not req.session_id:
        raise HTTPException(status_code=400, detail="session_id is required")

    # Get or create the conversation manager for this session
    if req.session_id not in sessions:
        sessions[req.session_id] = ConversationManager()
        
    manager = sessions[req.session_id]
    
    # Process the user message
    try:
        reply = manager.process(req.message)
        
        return ChatResponse(
            reply=reply,
            stage=manager.state.get("stage", ""),
            booking_complete=manager.state.get("booking_complete", False)
        )
    except Exception as e:
        print(f"Error processing message: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/chat/{session_id}")
async def clear_session(session_id: str):
    if session_id in sessions:
        del sessions[session_id]
    return {"status": "cleared"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)
