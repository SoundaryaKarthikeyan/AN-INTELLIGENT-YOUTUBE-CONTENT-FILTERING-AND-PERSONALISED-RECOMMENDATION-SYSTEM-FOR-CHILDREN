from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
from datetime import datetime
from firebase_setup import db
from age_model import predict_age_bucket

# ===============================
# 🚀 FASTAPI INIT
# ===============================
app = FastAPI(title="Child Safe Recommendation System")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ===============================
# 📦 REQUEST MODELS
# ===============================

class AgeRequest(BaseModel):
    image: str

class RecommendationRequest(BaseModel):
    child_id: str
    age: int
    topics: List[str]

class WatchEvent(BaseModel):
    child_id: str
    video_id: str


# ===============================
# 🔎 HELPER FUNCTIONS
# ===============================

def fetch_child(child_id: str):
    doc = db.collection("children").document(child_id).get()

    if not doc.exists:
        raise HTTPException(status_code=404, detail="Child not found")

    return doc.to_dict()


def fetch_watch_history(child_id: str):
    docs = db.collection("watch_history") \
        .where("child_id", "==", child_id) \
        .stream()

    return [doc.to_dict()["video_id"] for doc in docs]


def fetch_videos_by_age(age: int):
    docs = db.collection("videos").stream()

    videos = []
    for doc in docs:
        video = doc.to_dict()
        video["id"] = doc.id

        if video.get("age") == age:
            videos.append(video)

    return videos


# ===============================
# 🎯 RECOMMENDATION ENGINE
# ===============================

def compute_score(video, topics, watched_ids):
    topic_match = 1 if video.get("topic") in topics else 0
    watched_penalty = 1 if video["id"] in watched_ids else 0
    popularity = (video.get("views", 0) or 0) / 10000

    score = (
        0.5 * topic_match +
        0.3 * (1 - watched_penalty) +
        0.2 * popularity
    )

    return score


# ===============================
# 📌 ROUTES
# ===============================

@app.get("/")
def root():
    return {"status": "Backend running with Firebase + Age Model"}


# -------------------------------
# 👶 Get Children
# -------------------------------

@app.get("/children/{parent_id}")
def get_children(parent_id: str):

    docs = db.collection("children") \
        .where("parent_id", "==", parent_id) \
        .stream()

    return [
        {**doc.to_dict(), "id": doc.id}
        for doc in docs
    ]


# -------------------------------
# 🎥 AGE VERIFICATION (REAL)
# -------------------------------

@app.post("/verify-age")
def verify_age(req: AgeRequest):

    try:
        age_bucket = predict_age_bucket(req.image)

        print("✅ Age verification completed.")
        print("Returned to frontend:", age_bucket)

        return {"age": age_bucket}

    except Exception as e:
        print("❌ Age verification failed:", str(e))
        raise HTTPException(status_code=500, detail="Age prediction failed")


# -------------------------------
# 🧠 Recommend Videos
# -------------------------------

@app.post("/recommend")
def recommend_videos(req: RecommendationRequest):

    child = fetch_child(req.child_id)

    if abs(child.get("declared_age", req.age) - req.age) > 3:
        raise HTTPException(
            status_code=403,
            detail="Age verification mismatch"
        )

    videos = fetch_videos_by_age(req.age)
    watched_ids = fetch_watch_history(req.child_id)

    recommendations = []

    for video in videos:
        score = compute_score(video, req.topics, watched_ids)
        video["score"] = score
        recommendations.append(video)

    recommendations.sort(key=lambda x: x["score"], reverse=True)

    print(f"📺 Generated {len(recommendations[:20])} recommendations")

    return recommendations[:20]


# -------------------------------
# ▶ Record Watch Event
# -------------------------------

@app.post("/watch")
def record_watch(event: WatchEvent):

    db.collection("watch_history").add({
        "child_id": event.child_id,
        "video_id": event.video_id,
        "watched_at": datetime.utcnow()
    })

    print(f"▶ Watch recorded: {event.video_id} for child {event.child_id}")

    return {"status": "Watch recorded"}


# -------------------------------
# 📊 Child Analytics
# -------------------------------

@app.get("/child-analytics/{child_id}")
def child_analytics(child_id: str):

    watched_ids = fetch_watch_history(child_id)

    if not watched_ids:
        return {"message": "No watch history"}

    topic_count = {}

    for vid in watched_ids:
        doc = db.collection("videos").document(vid).get()
        if doc.exists:
            topic = doc.to_dict().get("topic")
            topic_count[topic] = topic_count.get(topic, 0) + 1

    print(f"📊 Analytics generated for {child_id}")

    return {
        "total_watched": len(watched_ids),
        "topic_distribution": topic_count
    }