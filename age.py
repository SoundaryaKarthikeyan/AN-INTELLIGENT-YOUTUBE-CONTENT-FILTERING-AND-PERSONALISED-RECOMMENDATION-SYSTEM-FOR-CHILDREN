import os
import joblib
import numpy as np
import pandas as pd
from firebase_setup import db

from sklearn.pipeline import Pipeline
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.ensemble import RandomForestClassifier

# ============================
# CONFIG
# ============================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PIPELINE_PATH = os.path.join(BASE_DIR, "age_rf_pipeline.joblib")
DATASET_PATH = os.path.join(BASE_DIR, "age.csv")

# ============================
# TRAIN MODEL
# ============================

def train():
    if not os.path.exists(DATASET_PATH):
        print("❌ Dataset missing: age_dataset.csv")
        exit()

    print("🚀 Training Random Forest model...")

    df = pd.read_csv(DATASET_PATH)

    df = df.dropna()

    texts = df["Sentence"].astype(str)
    ages = df["Age"].astype(int)

    pipeline = Pipeline([
        ("tfidf", TfidfVectorizer(
            max_features=10000,
            ngram_range=(1,2),
            stop_words="english"
        )),
        ("rf", RandomForestClassifier(
            n_estimators=150,
            max_depth=25,
            random_state=42,
            n_jobs=-1
        ))
    ])

    pipeline.fit(texts, ages)

    joblib.dump(pipeline, PIPELINE_PATH)

    print("✅ Model trained and saved")

    return pipeline

# ============================
# LOAD / TRAIN
# ============================

print("Current directory:", BASE_DIR)
print("Pipeline exists:", os.path.exists(PIPELINE_PATH))

if os.path.exists(PIPELINE_PATH):
    print("\n✅ Loading existing model...")
    pipeline = joblib.load(PIPELINE_PATH)
else:
    pipeline = train()

# ============================
# AGE GROUP LOGIC
# ============================

def get_age_group(age):
    if age <= 5:
        return "4-5"
    elif age <= 12:
        return "6-12"
    else:
        return "13+"

# ============================
# CLASSIFY
# ============================

def classify(text):
    if not text or len(text.split()) < 5:
        return None, None, 0.0

    try:
        probs = pipeline.predict_proba([text])[0]
        idx = np.argmax(probs)

        age = int(pipeline.classes_[idx])
        confidence = float(probs[idx])

    except Exception:
        age = int(pipeline.predict([text])[0])
        confidence = 0.7

    group = get_age_group(age)

    return age, group, confidence

# ============================
# QUICK TEST
# ============================

print("\n🧪 Testing model...")

test_texts = [
    "kids learning colors and shapes",
    "math tricks for school students",
    "deep learning neural network lecture"
]

for t in test_texts:
    print(t, "→", classify(t))

# ============================
# FIRESTORE PROCESSING
# ============================

print("\n📡 Fetching videos without age...")

docs = db.collection("videos") \
         .where("age", "==", None) \
         .stream()

processed = 0
skipped = 0

for doc in docs:
    video_id = doc.id
    data = doc.to_dict()

    transcript = data.get("transcript")

    if not transcript:
        skipped += 1
        continue

    age, group, conf = classify(transcript)

    if age is None:
        skipped += 1
        continue

    try:
        db.collection("videos").document(video_id).update({
            "age": age,
            "age_group": group
        })

        print(f"✅ {video_id} → age {age} | group {group} (conf={conf:.2f})")
        processed += 1

    except Exception as e:
        print(f"❌ Failed {video_id}: {e}")

print("\n========================")
print(f"✔ Processed: {processed}")
print(f"⚠ Skipped: {skipped}")
print("========================")