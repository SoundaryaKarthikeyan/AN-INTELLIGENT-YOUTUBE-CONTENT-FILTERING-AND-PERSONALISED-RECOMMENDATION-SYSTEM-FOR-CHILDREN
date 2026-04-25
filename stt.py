import os
import subprocess
import glob
from faster_whisper import WhisperModel
from firebase_setup import db
from youtube_transcript_api import YouTubeTranscriptApi

# ============================
# CONFIG
# ============================

AUDIO_DIR = "audio"
os.makedirs(AUDIO_DIR, exist_ok=True)

MAX_DURATION = 180  # 3 min (fast)

# ============================
# LOAD MODEL
# ============================

print("🚀 Loading Whisper model...")
model = WhisperModel(
    "tiny",
    device="cpu",
    compute_type="int8"
)
print("✅ Model loaded")

# ============================
# FAST METHOD (CAPTIONS)
# ============================

def get_caption_transcript(video_id):
    try:
        data = YouTubeTranscriptApi.get_transcript(video_id)

        text = []
        for t in data:
            if t["start"] > MAX_DURATION:
                break
            text.append(t["text"])

        final = " ".join(text).strip()

        if len(final) > 10:
            print("⚡ Captions used")
            return final

        return None

    except:
        return None


# ============================
# DOWNLOAD (fallback only)
# ============================

def download_audio(video_id):
    output_template = f"{AUDIO_DIR}/{video_id}.%(ext)s"

    result = subprocess.run(
        [
            "py", "-m", "yt_dlp",
            "-f", "bestaudio/best",
            "--no-playlist",
            "-o", output_template,
            f"https://www.youtube.com/watch?v={video_id}"
        ],
        capture_output=True,
        text=True
    )

    if result.returncode != 0:
        return None

    files = glob.glob(f"{AUDIO_DIR}/{video_id}.*")
    return files[0] if files else None


# ============================
# TRIM
# ============================

def trim_audio(input_path):
    out = input_path.replace(".", "_trim.")

    subprocess.run([
        "ffmpeg",
        "-y",
        "-i", input_path,
        "-t", str(MAX_DURATION),
        "-ac", "1",
        "-ar", "16000",
        out
    ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    return out if os.path.exists(out) else None


# ============================
# WHISPER
# ============================

def whisper_transcribe(audio_path):
    segments, _ = model.transcribe(
        audio_path,
        beam_size=1,
        vad_filter=False
    )

    return " ".join([s.text for s in segments]).strip()


# ============================
# FETCH
# ============================

docs = list(
    db.collection("videos")
      .where("data_version", "==", 1)
      .limit(20)
      .stream()
)

print("📊 Docs:", len(docs))

# ============================
# PROCESS
# ============================

processed = 0

for doc in docs:
    vid = doc.id
    data = doc.to_dict()

    if data.get("transcript"):
        continue

    print("\n🎯", vid)

    # -------------------------
    # STEP 1: CAPTIONS (FAST)
    # -------------------------
    transcript = get_caption_transcript(vid)

    # -------------------------
    # STEP 2: FALLBACK WHISPER
    # -------------------------
    if not transcript:
        print("⬇️ Falling back to Whisper")

        audio = download_audio(vid)
        if not audio:
            print("❌ Skip (download failed)")
            continue

        trimmed = trim_audio(audio)
        if not trimmed:
            continue

        transcript = whisper_transcribe(trimmed)

    # -------------------------
    # SAVE
    # -------------------------
    if transcript and len(transcript) > 10:
        db.collection("videos").document(vid).update({
            "transcript": transcript
        })
        print("✅ Saved")
        processed += 1

print("\n✔ Done:", processed)