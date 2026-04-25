import os
import subprocess
import time
import re
from firebase_setup import db
from detector import frame_risk

def extract_video_id(url):
    """Extracts the video ID from various YouTube URL formats."""
    regex = r"(?:v=|\/)([0-9A-Za-z_-]{11}).*"
    match = re.search(regex, url)
    return match.group(1) if match else None

def process_video_from_link(video_url):
    start_time = time.time() # Start Total Timer
    
    video_id = extract_video_id(video_url)
    if not video_id:
        print("❌ ERROR: Invalid YouTube URL.")
        return

    # 1. Ensure Folders Exist
    os.makedirs("videos", exist_ok=True)
    os.makedirs("frames", exist_ok=True)
    video_path = f"videos/{video_id}.mp4"

    # 2. Download Video
    print(f"\n--- 📥 Downloading Video: {video_id} ---")
    download_cmd = f'yt-dlp -f 18 -o "{video_path}" "https://www.youtube.com/watch?v={video_id}"'
    subprocess.run(download_cmd, shell=True)

    if not os.path.exists(video_path):
        print(f"❌ ERROR: Video {video_id} failed to download.")
        return

    # 3. Extract Frames (0.5 fps = 1 frame every 2 seconds)
    print(f"--- 🎞️ Extracting Frames ---")
    extract_cmd = f'ffmpeg -y -i "{video_path}" -vf fps=0.5 -q:v 2 "frames/{video_id}_%03d.jpg"'
    subprocess.run(extract_cmd, shell=True)
    
    # 4. Analyze Frames with Timing
    frame_files = sorted([f for f in os.listdir("frames") if f.startswith(video_id)])
    if not frame_files:
        print("❌ ERROR: No frames found.")
        return

    findings = []
    inference_times = []

    print(f"--- 🔍 Analyzing {len(frame_files)} Frames ---")
    
    for img_name in frame_files:
        if "_OUT.jpg" in img_name: continue
        path = os.path.join("frames", img_name)
        
        # Measure Inference time
        inf_start = time.time()
        is_bad, objects = frame_risk(path)
        inference_times.append(time.time() - inf_start)

        if is_bad:
            frame_num_match = re.search(r'_(\d+)\.jpg', img_name)
            frame_num = int(frame_num_match.group(1)) if frame_num_match else 0
            timestamp = (frame_num - 1) * 2
            print(f"🚨 VIOLENCE in {img_name} at {timestamp}s -> {objects}")
            findings.append({"frame": img_name, "objs": objects, "timestamp": timestamp})

    # --- METRICS CALCULATION ---
    total_latency = time.time() - start_time
    avg_inference = sum(inference_times) / len(inference_times) if inference_times else 0
    fps_processed = len(frame_files) / total_latency

    print("\n" + "═"*30)
    print("🚀 PERFORMANCE METRICS")
    print(f"Total Latency: {total_latency:.2f} seconds")
    print(f"Avg Inference/Frame: {avg_inference*1000:.2f} ms")
    print(f"System Throughput: {fps_processed:.2f} frames/sec")
    print(f"Risk Detection Rate: {(len(findings)/len(frame_files))*100:.2f}%")
    print("═"*30)

    # 5. Save to Firebase
    try:
        db.collection("videos").document(video_id).set({
            "risk_score": 1.0 if findings else 0.0,
            "flagged_frames": findings,
            "metrics": {
                "latency": total_latency,
                "avg_inf_ms": avg_inference * 1000,
                "total_frames": len(frame_files)
            },
            "processed_at": time.time(),
            "status": "completed"
        }, merge=True)
        print("✅ Results synced to Firebase.")
    except Exception as e:
        print(f"❌ Firebase Error: {e}")

# THIS PART IS CRITICAL TO START THE SCRIPT
if __name__ == "__main__":
    print("🎥 CogniMate: Video Safety Analyzer")
    user_link = input("Please enter the YouTube video link: ").strip()
    if user_link:
        process_video_from_link(user_link)
    else:
        print("No link provided. Exiting.")