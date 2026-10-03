import os
import shutil

from fastapi import (
    FastAPI,
    HTTPException,
    UploadFile,
    File
)

from fastapi.middleware.cors import CORSMiddleware

from pydantic import BaseModel

from faster_whisper import WhisperModel

from graph.conversation_manager import ConversationManager

from services.slot_generator import SlotGenerator


app = FastAPI(
    title="AeroHealth AI API"
)


# =========================================================
# CORS
# =========================================================

app.add_middleware(

    CORSMiddleware,

    allow_origins=["*"],

    allow_credentials=True,

    allow_methods=["*"],

    allow_headers=["*"],

)


# =========================================================
# CONVERSATION SESSIONS
# =========================================================

sessions = {}


# =========================================================
# GENERATE TODAY'S SLOTS
# =========================================================

slot_generator = SlotGenerator()

slot_generator.generate_today_slots()


# =========================================================
# WHISPER
# =========================================================

_whisper_model = None


def get_whisper_model():

    global _whisper_model


    if _whisper_model is None:

        print(
            "\nLoading multilingual Whisper model..."
        )

        print(
            "Model: base"
        )

        print(
            "Device: CPU"
        )

        print(
            "Compute type: int8"
        )


        _whisper_model = WhisperModel(

            "small",

            device="cpu",

            compute_type="int8"

        )


        print(
            "Whisper multilingual model loaded!"
        )


    return _whisper_model


# =========================================================
# REQUEST / RESPONSE MODELS
# =========================================================

class ChatRequest(BaseModel):

    session_id: str

    message: str

    user_id: str


class ChatResponse(BaseModel):

    reply: str

    stage: str

    booking_complete: bool


# =========================================================
# CHAT
# =========================================================

@app.post(
    "/chat",
    response_model=ChatResponse
)

async def chat_endpoint(
    req: ChatRequest
):

    # -----------------------------
    # Validate request
    # -----------------------------

    if not req.session_id:

        raise HTTPException(

            status_code=400,

            detail="session_id is required"

        )


    if not req.user_id:

        raise HTTPException(

            status_code=400,

            detail="user_id is required"

        )


    # -----------------------------
    # Create conversation manager
    # -----------------------------

    if req.session_id not in sessions:

        print(
            "\nCreating new conversation..."
        )

        print(
            "User ID:",
            req.user_id
        )


        sessions[
            req.session_id
        ] = ConversationManager(

            user_id=req.user_id

        )


    manager = sessions[
        req.session_id
    ]


    # -----------------------------
    # Process message
    # -----------------------------

    try:

        reply = manager.process(
            req.message
        )


        return ChatResponse(

            reply=reply,

            stage=manager.state.get(
                "stage",
                ""
            ),

            booking_complete=
                manager.state.get(
                    "booking_complete",
                    False
                )

        )


    except Exception as e:

        print(
            f"Error processing message: {e}"
        )


        raise HTTPException(

            status_code=500,

            detail=str(e)

        )


# =========================================================
# CLEAR CHAT SESSION
# =========================================================

@app.delete(
    "/chat/{session_id}"
)

async def clear_session(
    session_id: str
):

    if session_id in sessions:

        del sessions[
            session_id
        ]


    return {
        "status": "cleared"
    }


# =========================================================
# TRANSCRIBE AUDIO
# =========================================================

@app.post(
    "/transcribe"
)

async def transcribe_audio(
    audio: UploadFile = File(...)
):

    # -----------------------------
    # Save temporary audio file
    # -----------------------------

    temp_file_path = (
        f"temp_{audio.filename}"
    )


    with open(
        temp_file_path,
        "wb"
    ) as buffer:

        shutil.copyfileobj(
            audio.file,
            buffer
        )


    try:

        # -----------------------------
        # Load multilingual Whisper
        # -----------------------------

        model = get_whisper_model()


        # -----------------------------
        # Transcribe
        # -----------------------------
        #
        # language=None
        # means Whisper automatically
        # detects the spoken language.
        #
        # This allows:
        #
        # English
        # Kannada
        # and other supported languages.
        #
        # -----------------------------

        segments, info = model.transcribe(

            temp_file_path,

            beam_size=5,

            language="kn",

            task="transcribe",

            vad_filter=True,

            condition_on_previous_text=False

        )


        # -----------------------------
        # Combine segments
        # -----------------------------

        text = " ".join(

            [
                segment.text
                for segment in segments
            ]

        ).strip()


        # -----------------------------
        # Detected language
        # -----------------------------

        detected_language = (
            info.language
            if info
            else None
        )


        language_probability = (

            info.language_probability
            if info
            else None

        )


        print(
            "\n========== SPEECH RECOGNITION =========="
        )

        print(
            "Detected language:",
            detected_language
        )

        print(
            "Language probability:",
            language_probability
        )

        print(
            "Transcribed text:",
            text
        )

        print(
            "=========================================\n"
        )


        return {

            "text": text,

            "language": detected_language,

            "language_probability":
                language_probability

        }


    except Exception as e:

        print(
            f"Transcription error: {e}"
        )


        raise HTTPException(

            status_code=500,

            detail=str(e)

        )


    finally:

        # -----------------------------
        # Remove temporary file
        # -----------------------------

        if os.path.exists(
            temp_file_path
        ):

            os.remove(
                temp_file_path
            )


# =========================================================
# RUN SERVER
# =========================================================

if __name__ == "__main__":

    import uvicorn


    uvicorn.run(

        "server:app",

        host="0.0.0.0",

        port=8000,

        reload=True

    )