import os
from dotenv import load_dotenv
from googleapiclient.discovery import build
from firebase_setup import db
from datetime import datetime  

load_dotenv()
YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY")

youtube = build("youtube", "v3", developerKey=YOUTUBE_API_KEY)

TOP_N = 500  # Total videos per category


def fetch_top_by_category(category_id, region="IN"):
    print(f"Fetching top {TOP_N} videos for category {category_id}...")

    collected = 0
    next_page_token = None
    seen_ids = set()

    while collected < TOP_N:
        response = youtube.videos().list(
            part="snippet,statistics,status,contentDetails",  # 🔥 added contentDetails
            chart="mostPopular",
            videoCategoryId=category_id,
            regionCode=region,
            maxResults=50,
            pageToken=next_page_token
        ).execute()

        items = response.get("items", [])
        if not items:
            break

        for item in items:
            if collected >= TOP_N:
                break

            vid = item["id"]

            if vid in seen_ids:
                continue
            seen_ids.add(vid)

            # ✅ embeddable check
            status = item.get("status", {})
            if not status.get("embeddable", False):
                print("Skipping non-embeddable:", vid)
                continue

            # ❌ skip live streams (important for kids)
            if item["snippet"].get("liveBroadcastContent") != "none":
                print("Skipping live:", vid)
                continue

            doc_ref = db.collection("videos").document(vid)

            if doc_ref.get().exists:
                print("Skipping existing:", vid)
                continue

            snippet = item["snippet"]
            statistics = item.get("statistics", {})
            content = item.get("contentDetails", {})

            data = {
    # 🔹 Core
    "videoId": vid,
    "title": snippet.get("title", ""),
    "description": snippet.get("description", ""),
    "channel": snippet.get("channelTitle", ""),

    # 🔹 Metadata
    "category_id": category_id,
    "tags": snippet.get("tags", []),
    "published_at": snippet.get("publishedAt"),
    "language": snippet.get("defaultAudioLanguage") or snippet.get("defaultLanguage"),

    # 🔹 Stats
    "views": int(statistics.get("viewCount", 0)),
    "likes": int(statistics.get("likeCount", 0)) if "likeCount" in statistics else None,
    "comment_count": int(statistics.get("commentCount", 0)) if "commentCount" in statistics else None,

    # 🔹 Content
    "duration": content.get("duration"),
    "definition": content.get("definition"),
    "caption": content.get("caption"),

    # 🔹 UI
    "thumbnail": snippet.get("thumbnails", {}).get("high", {}).get("url"),

    # 🔹 Flags
    "embeddable": True,

    # 🔥 NEW TRACKING FIELDS
    "data_version": 1,
    "fetched_at": datetime.utcnow(),

    # 🔹 Placeholders
    "age_group": None,
    "age": None,
    "topic": None,
    "risk_score": None,
    "transcript": None,

    # 🔹 Future ML
    "vector": None,
    "nsfw_ratio": None,
    "violence_ratio": None,
    "safety_flag": None
}

            doc_ref.set(data)

            print("Inserted:", vid)
            collected += 1

        next_page_token = response.get("nextPageToken")
        if not next_page_token:
            break

    print(f"Done. Total inserted: {collected}")


if __name__ == "__main__":
    # 10 = Music
    # 20 = Gaming
    # 22 = People & Blogs
    # 24 = Entertainment
    # 27 = Education

    fetch_top_by_category("10")
    fetch_top_by_category("20")
    fetch_top_by_category("27")
    fetch_top_by_category("22")
    fetch_top_by_category("24")