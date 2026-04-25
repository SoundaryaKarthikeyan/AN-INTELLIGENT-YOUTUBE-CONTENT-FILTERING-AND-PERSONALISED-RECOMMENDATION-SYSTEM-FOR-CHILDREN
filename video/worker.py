import os
import subprocess
import json
from firebase_setup import db
from detector import frame_risk

# Ensure folders exist
os.makedirs("videos", exist_ok=True)
os.makedirs("frames", exist_ok=True)
os.makedirs("labels", exist_ok=True)

# ----------------------------

def get_videos():
    docs = db.collection("videos") \
        .where("risk_score", "==", None) \
        .limit(10) \
        .stream()

    return list(docs)

# ---------------------------------------------

def download_video(video_id):
    print(f"Downloading video: {video_id}")

    cmd = (
        f'yt-dlp '
        f'-f "18" '
        f'--no-playlist '
        f'--no-check-certificates '
        f'-o videos/{video_id}.mp4 '
        f'https://www.youtube.com/watch?v={video_id}'
    )

    os.system(cmd)

    exists = os.path.exists(f"videos/{video_id}.mp4")

    if exists:
        print("Download successful.")
    else:
        print("Download failed.")

    return exists

# -------------------------------

def extract_frames(video_id):
    print("Extracting frames...")

    cmd = (
        f'ffmpeg -y -i videos/{video_id}.mp4 '
        f'-vf fps=1 frames/{video_id}_%03d.jpg'
    )

    os.system(cmd)

    print("Frame extraction complete.")

# ----------------------------------
def compute_iou(box1, box2):
    """
    box format: [x1, y1, x2, y2]
    """

    xA = max(box1[0], box2[0])
    yA = max(box1[1], box2[1])
    xB = min(box1[2], box2[2])
    yB = min(box1[3], box2[3])

    inter_w = max(0, xB - xA)
    inter_h = max(0, yB - yA)
    inter_area = inter_w * inter_h

    box1_area = (box1[2] - box1[0]) * (box1[3] - box1[1])
    box2_area = (box2[2] - box2[0]) * (box2[3] - box2[1])

    union_area = box1_area + box2_area - inter_area

    if union_area == 0:
        return 0

    return inter_area / union_area

# ---------------------------
def compute_video_risk(video_id):
    risks = []
    detection_log = []

    print("\n==============================")
    print(" FRAME ANALYSIS STARTED ")
    print("==============================")

    frame_files = sorted(os.listdir("frames"))

    for img in frame_files:
        if img.startswith(video_id) and img.endswith(".jpg"):

            path = os.path.join("frames", img)

            risk, detections = frame_risk(path)
            risks.append(risk)

            print(f"\nFrame: {img}")
            print(f"Risk Score: {risk:.3f}")

            if detections:
                print("Detections:")
                for det in detections:
                    print(f"  - {det}")

                detection_log.append({
                    "frame": img,
                    "detections": detections
                })
            else:
                print("Detections: None")

    if len(risks) == 0:
        print("\n⚠ No frames processed.")
        return 0.0, []

    final_risk = max(risks)

    print("\n==============================")
    print(" VIDEO SUMMARY ")
    print("==============================")
    print(f"Total Frames Processed: {len(risks)}")
    print(f"Final Risk Score (MAX frame risk): {final_risk:.3f}")
    print("==============================\n")

    return final_risk, detection_log

# --------------------------------------------------

def evaluate_detections(video_id, iou_threshold=0.5):

    TP = 0
    FP = 0
    FN = 0

    frame_files = sorted(os.listdir("frames"))

    for img in frame_files:
        if img.startswith(video_id) and img.endswith(".jpg"):

            frame_path = os.path.join("frames", img)
            label_path = os.path.join("labels", img.replace(".jpg", ".json"))

            if not os.path.exists(label_path):
                continue

            with open(label_path, "r") as f:
                ground_truth = json.load(f)

            _, predictions = frame_risk(frame_path)

            matched_gt = set()

            for pred in predictions:

                pred_class = pred["class"]
                pred_box = pred["bbox"]

                match_found = False

                for i, gt in enumerate(ground_truth):

                    if i in matched_gt:
                        continue

                    if pred_class != gt["class"]:
                        continue

                    iou = compute_iou(pred_box, gt["bbox"])

                    if iou >= iou_threshold:
                        TP += 1
                        matched_gt.add(i)
                        match_found = True
                        break

                if not match_found:
                    FP += 1

            FN += (len(ground_truth) - len(matched_gt))

    precision = TP / (TP + FP) if (TP + FP) > 0 else 0
    recall = TP / (TP + FN) if (TP + FN) > 0 else 0
    f1 = (2 * precision * recall) / (precision + recall) if (precision + recall) > 0 else 0

    print("\n==============================")
    print(" DETECTION EVALUATION ")
    print("==============================")
    print(f"TP: {TP}")
    print(f"FP: {FP}")
    print(f"FN: {FN}")
    print(f"Precision: {precision:.4f}")
    print(f"Recall: {recall:.4f}")
    print(f"F1 Score: {f1:.4f}")
    print("==============================\n")

    return precision, recall, f1

# ----------------------------------------------
def cleanup(video_id):
    print("Cleaning up temporary files...")

    for f in os.listdir("frames"):
        if f.startswith(video_id):
            os.remove(os.path.join("frames", f))

    vid = f"videos/{video_id}.mp4"
    if os.path.exists(vid):
        os.remove(vid)

    print("Cleanup complete.")

# ----------------------------------------
def save(video_id, risk, detection_log, precision, recall, f1):

    db.collection("videos").document(video_id).update({
        "risk_score": risk,
        "yolo_detections": detection_log,
        "precision": precision,
        "recall": recall,
        "f1_score": f1
    })

    print("Results saved to Firebase.")

# -----------------------------------------------
def main():
    videos = get_videos()

    if not videos:
        print("No videos to process.")
        return

    for doc in videos:
        vid = doc.id

        print("\n====================================")
        print(f"Processing Video ID: {vid}")
        print("====================================")

        ok = download_video(vid)
        if not ok:
            continue

        extract_frames(vid)

        risk, detection_log = compute_video_risk(vid)

        precision, recall, f1 = evaluate_detections(vid)

        save(vid, risk, detection_log, precision, recall, f1)

        cleanup(vid)

        print(f"Completed: {vid} → Final Risk: {risk:.3f}")

# ---------------------------------------------------

if __name__ == "__main__":
    main()