import numpy as np
from collections import Counter

# =========================
# CONFIG
# =========================
WEIGHTS = {
    "topic": 0.4,
    "age": 0.2,
    "difficulty": 0.15,
    "safety": 0.15,
    "engagement": 0.1
}

SAFETY_THRESHOLD = 0.3
AGE_TOLERANCE = 1
DIVERSITY_THRESHOLD = 0.9
TOP_K = 10


# =========================
# SIMILARITY
# =========================
def cosine_similarity(a, b):
    a = np.array(a)
    b = np.array(b)
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b) + 1e-8)


# =========================
# SCORING HELPERS
# =========================
def age_score(user_age, video_age, max_diff=4):
    return 1 - abs(user_age - video_age) / max_diff


def difficulty_score(user_diff, video_diff):
    return 1 - abs(user_diff - video_diff)


# =========================
# MAIN SCORING
# =========================
def compute_score(user, video):
    topic_sim = cosine_similarity(user["topic_vec"], video["topic_vec"])
    age_sim = age_score(user["age_group"], video["age_group"])
    diff_sim = difficulty_score(user["preferred_difficulty"], video["difficulty"])
    safety = video["safety"]
    engagement = video["engagement"]

    score = (
        WEIGHTS["topic"] * topic_sim +
        WEIGHTS["age"] * age_sim +
        WEIGHTS["difficulty"] * diff_sim +
        WEIGHTS["safety"] * safety +
        WEIGHTS["engagement"] * engagement
    )

    # ---- Penalties / boosts ----

    # Low safety penalty
    if safety < 0.5:
        score *= 0.5

    # History adjustment
    if video["id"] in user["history"]:
        if user["history"][video["id"]] == "skipped":
            score *= 0.6
        elif user["history"][video["id"]] == "watched":
            score *= 1.2

    # Recent topic boost
    for recent_topic in user["recent_topics"]:
        if cosine_similarity(recent_topic, video["topic_vec"]) > 0.8:
            score += 0.05

    return score


# =========================
# FILTERING
# =========================
def filter_candidates(user, videos):
    filtered = []

    for v in videos:
        if abs(user["age_group"] - v["age_group"]) > AGE_TOLERANCE:
            continue

        if v["safety"] < SAFETY_THRESHOLD:
            continue

        filtered.append(v)

    return filtered


# =========================
# DIVERSITY
# =========================
def is_too_similar(video, selected):
    for s in selected:
        sim = cosine_similarity(video["topic_vec"], s["topic_vec"])
        if sim > DIVERSITY_THRESHOLD:
            return True
    return False


# =========================
# FINAL PIPELINE
# =========================
def rank_videos(user, videos, top_k=TOP_K):
    # 1. Filter
    candidates = filter_candidates(user, videos)

    # 2. Score
    scored = []
    for v in candidates:
        score = compute_score(user, v)
        scored.append((v, score))

    # 3. Sort
    scored.sort(key=lambda x: x[1], reverse=True)

    # 4. Diversity filter
    final = []
    for video, score in scored:
        if not is_too_similar(video, final):
            final.append(video)
        if len(final) >= top_k:
            break

    return final


# =========================
# TEST RUN
# =========================
if __name__ == "__main__":
    user = {
        "age_group": 2,
        "topic_vec": [0.1, 0.3, 0.5],
        "preferred_difficulty": 0.5,
        "recent_topics": [],
        "history": {}
    }

    videos = [
        {
            "id": "vid1",
            "topic_vec": [0.1, 0.3, 0.4],
            "age_group": 2,
            "difficulty": 0.6,
            "safety": 0.9,
            "engagement": 0.8
        },
        {
            "id": "vid2",
            "topic_vec": [0.9, 0.1, 0.2],
            "age_group": 1,
            "difficulty": 0.3,
            "safety": 0.95,
            "engagement": 0.7
        }
    ]

    recs = rank_videos(user, videos, top_k=5)

    print("Recommended:")
    for v in recs:
        print(v["id"])