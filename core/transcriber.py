import whisper
import os
import requests
from pathlib import Path
from dotenv import load_dotenv
from pydub import AudioSegment

# --------------------------------------------------
# ENVIRONMENT CONFIGURATION
# --------------------------------------------------

# Load .env from the main project directory
PROJECT_ROOT = Path(__file__).resolve().parent.parent
load_dotenv(PROJECT_ROOT / ".env")

SARVAM_PIECE_SECONDS = 25

WHISPER_MODEL = os.getenv("WHISPER_MODEL", "small")

SARVAM_API_KEY = os.getenv("SARVAM_API_KEY")

SARVAM_STT_TRANSLATE_URL = "https://api.sarvam.ai/speech-to-text-translate"

SARVAM_MODEL = os.getenv("SARVAM_STT_MODEL", "saaras:v2.5")

_model = None


# --------------------------------------------------
# WHISPER MODEL
# --------------------------------------------------


def load_model():

    global _model

    if _model is None:
        print(f"Loading Whisper model: {WHISPER_MODEL} ...")
        _model = whisper.load_model(WHISPER_MODEL)
        print("Whisper model loaded.")

    return _model


# --------------------------------------------------
# WHISPER TRANSCRIPTION
# --------------------------------------------------


def transcribe_chunk_whisper(chunk_path: str) -> str:

    model = load_model()

    result = model.transcribe(chunk_path, task="transcribe")

    return result["text"]


# --------------------------------------------------
# SARVAM API REQUEST
# --------------------------------------------------


def _send_to_sarvam(piece_path: str) -> str:
    """
    Send one WAV audio piece to Sarvam AI and return
    the English transcript.
    """

    if not SARVAM_API_KEY:
        raise RuntimeError(
            "SARVAM_API_KEY is missing. Check your .env file in the project root."
        )

    headers = {"api-subscription-key": SARVAM_API_KEY}

    with open(piece_path, "rb") as f:
        files = {"file": (os.path.basename(piece_path), f, "audio/wav")}

        data = {"model": SARVAM_MODEL, "with_diarization": "false"}

        response = requests.post(
            SARVAM_STT_TRANSLATE_URL,
            headers=headers,
            files=files,
            data=data,
            timeout=120,
        )

    if not response.ok:
        print(f"\nSarvam returned HTTP {response.status_code}")
        print(f"Response body: {response.text}\n")
        response.raise_for_status()

    result = response.json()

    return result.get("transcript", "")


# --------------------------------------------------
# SARVAM TRANSCRIPTION
# --------------------------------------------------


def transcribe_chunk_sarvam(chunk_path: str) -> str:
    """
    Sarvam synchronous API accepts audio pieces of up to
    30 seconds. Split each chunk into 25-second pieces,
    transcribe each piece, and combine the results.
    """

    if not SARVAM_API_KEY:
        raise RuntimeError("SARVAM_API_KEY is not set in environment / .env")

    audio = AudioSegment.from_wav(chunk_path)

    piece_ms = SARVAM_PIECE_SECONDS * 1000

    full_text = ""

    total_pieces = (len(audio) + piece_ms - 1) // piece_ms

    for i, start in enumerate(range(0, len(audio), piece_ms)):
        piece = audio[start : start + piece_ms]

        piece_path = f"{chunk_path}_sv_{i}.wav"

        piece.export(piece_path, format="wav")

        try:
            print(f"  -> Sarvam piece {i + 1}/{total_pieces} ...")

            transcript = _send_to_sarvam(piece_path)

            full_text += transcript + " "

        finally:
            if os.path.exists(piece_path):
                os.remove(piece_path)

    return full_text.strip()


# --------------------------------------------------
# TRANSCRIPTION ROUTER
# --------------------------------------------------


def transcribe_chunk(chunk_path: str, language: str = "english") -> str:
    """
    Route audio to the appropriate transcription engine.

    english  -> Local Whisper model
    hinglish -> Sarvam AI speech-to-text translation
    """

    if language.lower() == "hinglish":
        return transcribe_chunk_sarvam(chunk_path)

    return transcribe_chunk_whisper(chunk_path)


# --------------------------------------------------
# TRANSCRIBE ALL AUDIO CHUNKS
# --------------------------------------------------


def transcribe_all(chunks: list, language: str = "english") -> str:

    full_transcript = ""

    engine = "Sarvam AI" if language.lower() == "hinglish" else "Whisper"

    print(f"Using {engine} for transcription.")

    for i, chunk in enumerate(chunks):
        print(f"Transcribing chunk {i + 1}/{len(chunks)}...")

        text = transcribe_chunk(chunk, language=language)

        full_transcript += text + " "

    print("Transcription complete.")

    return full_transcript.strip()
