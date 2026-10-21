"""
Minimal FastAPI backend exposing the existing AI Video Assistant pipeline and RAG engine.
Preserves existing functions in main.py, utils/audio_processor.py, core/, etc.
"""

import os
import uuid
import shutil
import threading
from typing import Dict, Any, Optional
from pathlib import Path
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

# Ensure root .env is loaded
PROJECT_ROOT = Path(__file__).resolve().parent
load_dotenv(PROJECT_ROOT / ".env")

# Import existing application pipeline and functions
from main import run_pipeline
from core.rag_engine import ask_question

app = FastAPI(
    title="AI Video Assistant API",
    description="Backend API exposing transcription, AI summarization, extraction, and RAG chat.",
    version="1.0.0",
)

# Enable CORS for local dev and frontend deployment
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = PROJECT_ROOT / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# In-memory session store: analysis_id -> session data
# Format:
# {
#   "id": str,
#   "status": "pending" | "processing" | "completed" | "error",
#   "error": Optional[str],
#   "source_type": "youtube" | "file",
#   "source_name": str,
#   "language": str,
#   "title": Optional[str],
#   "summary": Optional[str],
#   "action_items": Optional[str],
#   "key_decisions": Optional[str],
#   "open_questions": Optional[str],
#   "transcript": Optional[str],
#   "rag_chain": Any, # Held server-side only
#   "created_at": str
# }
sessions: Dict[str, Dict[str, Any]] = {}
sessions_lock = threading.Lock()


class QuestionRequest(BaseModel):
    question: str


def _run_analysis_worker(analysis_id: str, source: str, language: str):
    with sessions_lock:
        if analysis_id in sessions:
            sessions[analysis_id]["status"] = "processing"

    try:
        # Call the existing run_pipeline function
        result = run_pipeline(source=source, language=language)

        with sessions_lock:
            if analysis_id in sessions:
                sessions[analysis_id].update({
                    "status": "completed",
                    "title": result.get("title", "Untitled Analysis"),
                    "transcript": result.get("transcript", ""),
                    "summary": result.get("summary", ""),
                    "action_items": result.get("action_items", ""),
                    "key_decisions": result.get("key_decisions", ""),
                    "open_questions": result.get("open_questions", ""),
                    "rag_chain": result.get("rag_chain"),
                })
    except Exception as e:
        with sessions_lock:
            if analysis_id in sessions:
                sessions[analysis_id].update({
                    "status": "error",
                    "error": str(e),
                })


def _format_session_response(sess: Dict[str, Any]) -> Dict[str, Any]:
    """Return session metadata and results, omitting Python-only objects like rag_chain."""
    return {
        "id": sess["id"],
        "status": sess["status"],
        "error": sess.get("error"),
        "source_type": sess.get("source_type"),
        "source_name": sess.get("source_name"),
        "language": sess.get("language"),
        "title": sess.get("title"),
        "summary": sess.get("summary"),
        "action_items": sess.get("action_items"),
        "key_decisions": sess.get("key_decisions"),
        "open_questions": sess.get("open_questions"),
        "transcript": sess.get("transcript"),
        "created_at": sess.get("created_at"),
    }


@app.get("/")
def health_check():
    return {"status": "ok", "service": "AI Video Assistant API"}


@app.get("/api/analyses")
def list_analyses():
    """Returns list of real stored analysis sessions in memory."""
    with sessions_lock:
        items = [_format_session_response(s) for s in sessions.values()]
        # Sort newest first
        items.reverse()
        return {"analyses": items}


@app.post("/api/analyses/youtube")
def analyze_youtube(
    url: str = Form(...),
    language: str = Form("english"),
    background_tasks: BackgroundTasks = BackgroundTasks(),
):
    clean_url = url.strip()
    if not clean_url:
        raise HTTPException(status_code=400, detail="YouTube URL cannot be empty")

    analysis_id = str(uuid.uuid4())
    import datetime
    session_data = {
        "id": analysis_id,
        "status": "pending",
        "error": None,
        "source_type": "youtube",
        "source_name": clean_url,
        "language": language.strip().lower() or "english",
        "title": None,
        "summary": None,
        "action_items": None,
        "key_decisions": None,
        "open_questions": None,
        "transcript": None,
        "rag_chain": None,
        "created_at": datetime.datetime.now().isoformat(),
    }

    with sessions_lock:
        sessions[analysis_id] = session_data

    # Execute in background thread to avoid blocking FastAPI
    background_tasks.add_task(_run_analysis_worker, analysis_id, clean_url, session_data["language"])

    return _format_session_response(session_data)


@app.post("/api/analyses/upload")
def analyze_upload(
    file: UploadFile = File(...),
    language: str = Form("english"),
    background_tasks: BackgroundTasks = BackgroundTasks(),
):
    if not file.filename:
        raise HTTPException(status_code=400, detail="Uploaded file has no filename")

    # Allowed audio / video formats supported by ffmpeg/pydub
    allowed_exts = {".mp3", ".wav", ".m4a", ".mp4", ".mov", ".mkv", ".webm", ".aac", ".flac"}
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in allowed_exts:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format '{file_ext}'. Supported: {', '.join(allowed_exts)}",
        )

    analysis_id = str(uuid.uuid4())
    safe_filename = f"{analysis_id}_{file.filename}"
    saved_path = UPLOAD_DIR / safe_filename

    with open(saved_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    import datetime
    session_data = {
        "id": analysis_id,
        "status": "pending",
        "error": None,
        "source_type": "file",
        "source_name": file.filename,
        "language": language.strip().lower() or "english",
        "title": None,
        "summary": None,
        "action_items": None,
        "key_decisions": None,
        "open_questions": None,
        "transcript": None,
        "rag_chain": None,
        "created_at": datetime.datetime.now().isoformat(),
    }

    with sessions_lock:
        sessions[analysis_id] = session_data

    background_tasks.add_task(
        _run_analysis_worker, analysis_id, str(saved_path), session_data["language"]
    )

    return _format_session_response(session_data)


@app.get("/api/analyses/{analysis_id}")
def get_analysis_status(analysis_id: str):
    with sessions_lock:
        sess = sessions.get(analysis_id)
        if not sess:
            raise HTTPException(status_code=404, detail=f"Analysis session '{analysis_id}' not found")
        return _format_session_response(sess)


@app.post("/api/analyses/{analysis_id}/chat")
def chat_with_analysis(analysis_id: str, req: QuestionRequest):
    with sessions_lock:
        sess = sessions.get(analysis_id)
        if not sess:
            raise HTTPException(status_code=404, detail=f"Analysis session '{analysis_id}' not found")

        if sess["status"] != "completed":
            raise HTTPException(
                status_code=400,
                detail=f"Analysis is currently '{sess['status']}'. Wait until it completes before asking questions.",
            )

        rag_chain = sess.get("rag_chain")
        if not rag_chain:
            raise HTTPException(
                status_code=500,
                detail="RAG chain is not initialized for this session.",
            )

    question = req.question.strip()
    if not question:
        raise HTTPException(status_code=400, detail="Question cannot be empty")

    try:
        # Ask question using the existing ask_question function and held chain
        answer = ask_question(rag_chain, question)
        return {
            "analysis_id": analysis_id,
            "question": question,
            "answer": answer,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating answer: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run("api:app", host="0.0.0.0", port=port, reload=True)
