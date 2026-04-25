from ultralytics import YOLO
import cv2
import os

# Load model once
model = YOLO("model/best.pt")

# Map your specific bad classes from best.pt
BAD_CLASSES = {0: "nsfw", 1: "violence"}
TARGET_IDS = list(BAD_CLASSES.keys())

def frame_risk(image_path, save_annotated=True):
    # 'classes' filter ensures YOLO doesn't even look for 'safe' objects
    results = model(image_path, conf=0.25, classes=TARGET_IDS, verbose=False)

    detections = []
    is_risky = False

    for r in results:
        if len(r.boxes) > 0:
            is_risky = True
            
            # Save the frame with ONLY the violent boxes drawn
            if save_annotated:
                annotated = r.plot(line_width=2)
                # Save as a specific 'detected' file for your UI/Report
                output_path = image_path.replace(".jpg", "_OUT.jpg")
                cv2.imwrite(output_path, annotated)

            for box in r.boxes:
                cls = int(box.cls[0])
                conf = float(box.conf[0])
                detections.append({
                    "label": BAD_CLASSES.get(cls, "unknown"),
                    "confidence": round(conf, 3)
                })

    return is_risky, detections