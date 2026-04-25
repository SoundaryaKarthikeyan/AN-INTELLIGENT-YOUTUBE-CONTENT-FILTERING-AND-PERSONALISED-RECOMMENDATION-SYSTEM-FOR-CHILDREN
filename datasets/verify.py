import json
import requests
import time
from bs4 import BeautifulSoup

INPUT_JSON = "1-3.json"
OUTPUT_JSON = "whitelist_verified.json"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; ChannelVerifier/1.0)"
}

def verify_channel(channel):
    channel_id = channel["channel_id"]
    url = f"https://www.youtube.com/channel/{channel_id}"

    try:
        r = requests.get(url, headers=HEADERS, timeout=10)

        if r.status_code != 200:
            return False, None

        soup = BeautifulSoup(r.text, "html.parser")
        title = soup.title.text.strip() if soup.title else ""

        # YouTube error pages still return 200 sometimes
        if "404" in title.lower() or "not found" in title.lower():
            return False, None

        return True, title

    except Exception as e:
        return False, None

def main():
    with open(INPUT_JSON, "r", encoding="utf-8") as f:
        data = json.load(f)

    verified = []

    for ch in data["channels"]:
        ok, title = verify_channel(ch)

        ch["verified"] = ok
        ch["page_title"] = title

        print(f"{ch['official_name']} → {'OK' if ok else 'INVALID'}")

        if ok:
            verified.append(ch)

        time.sleep(1.5)  # be polite to YouTube

    with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
        json.dump(
            {"age_group": data["age_group"], "channels": verified},
            f,
            indent=2,
            ensure_ascii=False
        )

    print(f"\nVerified channels saved to {OUTPUT_JSON}")

if __name__ == "__main__":
    main()
