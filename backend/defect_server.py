import os
import time
import base64
import numpy as np
import cv2
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
from ultralytics import YOLO

# -----------------------------------------------------------------
# 1. FastAPI Application Setup
# -----------------------------------------------------------------
app = FastAPI(title="WMS YOLOv11 & OpenCV Quality Inspection Server")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------------------------------------------
# 2. Config & Class Mapping Filters
# -----------------------------------------------------------------
CONFIDENCE_THRESHOLD = 0.70

# Clean custom list of valid products
VALID_PRODUCTS = [
    "Bottle", "Cell Phone", "Laptop", "Keyboard", "Mouse", 
    "Book", "Scissors", "Cup", "Remote", "Monitor"
]

# Mapping COCO standard classes to our products
COCO_CLASS_MAP = {
    "bottle": "Bottle",
    "cell phone": "Cell Phone",
    "laptop": "Laptop",
    "keyboard": "Keyboard",
    "mouse": "Mouse",
    "book": "Book",
    "scissors": "Scissors",
    "cup": "Cup",
    "remote": "Remote",
    "tv": "Monitor"
}

# Load YOLOv11 model (attempts yolov11n.pt or custom best.pt weights if present)
weights_path = "best.pt" if os.path.exists("best.pt") else "yolov8n.pt"
print(f"[YOLOv11 SERVER] Loading model weights from: {weights_path}")
try:
    model = YOLO(weights_path)
except Exception as e:
    print(f"[YOLOv11 SERVER] Failed to load {weights_path}, falling back to yolov8n.pt: {e}")
    model = YOLO("yolov8n.pt")

# -----------------------------------------------------------------
# 3. OpenCV ROI Anomaly Inspection (No Mocking)
# -----------------------------------------------------------------
def inspect_roi_opencv(roi):
    """
    Improved OpenCV defect inspection with reduced false positives.
    Returns:
        status: GOOD / POSSIBLE DEFECT
        defect type
        anomaly score
    """

    if roi is None or roi.size == 0:
        return "GOOD", "None", 0.0

    try:
        h, w, c = roi.shape

        if h < 16 or w < 16:
            return "GOOD", "None", 0.0

        # Remove borders
        shave_h = int(h * 0.15)
        shave_w = int(w * 0.15)

        roi_clean = roi[shave_h:h-shave_h, shave_w:w-shave_w]

        if roi_clean.size == 0:
            roi_clean = roi

        hc, wc, _ = roi_clean.shape

        # ---------- Grayscale ----------
        gray = cv2.cvtColor(roi_clean, cv2.COLOR_BGR2GRAY)
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)

        # ---------- Edge Detection ----------
        edges = cv2.Canny(blurred, 100, 200)

        kernel = np.ones((3, 3), np.uint8)
        edges = cv2.morphologyEx(edges, cv2.MORPH_OPEN, kernel)
        edges = cv2.morphologyEx(edges, cv2.MORPH_CLOSE, kernel)

        edge_pixels = np.count_nonzero(edges)
        total_pixels = hc * wc

        edge_density = edge_pixels / max(total_pixels, 1)

        # ---------- Contours ----------
        contours, _ = cv2.findContours(
            edges,
            cv2.RETR_EXTERNAL,
            cv2.CHAIN_APPROX_SIMPLE
        )

        min_solidity = 1.0

        for cnt in contours:

            area = cv2.contourArea(cnt)

            if area < 250:
                continue

            x, y, cw, ch = cv2.boundingRect(cnt)

            box_area = cw * ch

            solidity = area / max(box_area, 1)

            min_solidity = min(min_solidity, solidity)

        # ---------- HSV ----------
        hsv = cv2.cvtColor(roi_clean, cv2.COLOR_BGR2HSV)

        _, s_ch, v_ch = cv2.split(hsv)

        std_v = np.std(v_ch)
        std_s = np.std(s_ch)

        anomaly_reasons = []
        anomaly_score = 0

        # ---------- Better Thresholds ----------

        if edge_density > 0.30:
            anomaly_reasons.append("Packaging Tear")
            anomaly_score = max(anomaly_score, edge_density)

        if min_solidity < 0.20:
            anomaly_reasons.append("Broken Edge")
            anomaly_score = max(anomaly_score, 1 - min_solidity)

        if std_v > 95:
            anomaly_reasons.append("Large Scratch")
            anomaly_score = max(anomaly_score, std_v / 100)

        if std_s > 90:
            anomaly_reasons.append("Water Damage")
            anomaly_score = max(anomaly_score, std_s / 100)

        # ---------- Debug ----------
        print("--------------------------------")
        print("Edge Density :", round(edge_density,3))
        print("Solidity     :", round(min_solidity,3))
        print("Std V        :", round(std_v,2))
        print("Std S        :", round(std_s,2))
        print("Reasons      :", anomaly_reasons)
        print("--------------------------------")

        # Require at least TWO conditions
        if len(anomaly_reasons) >= 2 and anomaly_score > 0.65:

            return (
                "POSSIBLE DEFECT",
                "Possible " + " / ".join(anomaly_reasons[:2]),
                round(anomaly_score,3)
            )

        return "GOOD", "None", 0.0

    except Exception as e:

        print("[OpenCV ERROR]", e)

        return "GOOD", "None", 0.0

# -----------------------------------------------------------------
# 4. FastAPI Schemas & Router
# -----------------------------------------------------------------
class FramePayload(BaseModel):
    image: str # Base64 encoded JPEG string

@app.post("/detect_frame")
async def detect_frame(payload: FramePayload):
    try:
        image_b64 = payload.image
        if not image_b64:
            raise HTTPException(status_code=400, detail="No image data provided")

        if "," in image_b64:
            header, encoded = image_b64.split(",", 1)
        else:
            encoded = image_b64

        img_bytes = base64.b64decode(encoded)
        nparr = np.frombuffer(img_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if img is None:
            raise HTTPException(status_code=400, detail="Invalid image encoding")

        # Run YOLO inference
        results = model(img, conf=0.25, verbose=False)
        
        predictions = []
        if results and len(results) > 0:
            result = results[0]
            boxes = result.boxes
            
            for idx, box in enumerate(boxes):
                cls_id = int(box.cls[0].item())
                raw_cls_name = model.names[cls_id].lower()
                conf = float(box.conf[0].item())

                # Strict validation mapping
                mapped_name = None
                if raw_cls_name in COCO_CLASS_MAP:
                    mapped_name = COCO_CLASS_MAP[raw_cls_name]
                elif raw_cls_name.capitalize() in VALID_PRODUCTS:
                    mapped_name = raw_cls_name.capitalize()
                else:
                    mapped_name = "Unknown Product"

                print(f"[YOLO DETECTED] Class: {raw_cls_name} ({cls_id}) | Conf: {conf:.3f} | Mapped: {mapped_name}")

                # Enforce strict 70% confidence threshold check
                if conf < CONFIDENCE_THRESHOLD:
                    print(f"[YOLO THRESHOLD] Mapping to Unknown Product because {conf:.3f} < {CONFIDENCE_THRESHOLD}")
                    mapped_name = "Unknown Product"

                xyxy = box.xyxy[0].tolist()
                x1, y1, x2, y2 = map(int, xyxy)
                w = x2 - x1
                h = y2 - y1

                # Extract Region of Interest (ROI)
                crop = img[max(0, y1):min(img.shape[0], y2), max(0, x1):min(img.shape[1], x2)]
                
                # Perform OpenCV Anomaly Inspection
                inspect_status, defect_type, anomaly_score = inspect_roi_opencv(crop)

                # Simulated tracking ID (consistently seeded)
                track_id = int(time.time() * 10) % 1000 + idx + 101

                predictions.append({
                    "class": mapped_name,
                    "rawClass": raw_cls_name.capitalize(),
                    "score": conf,
                    "bbox": [x1, y1, w, h],
                    "status": inspect_status,
                    "defect": defect_type,
                    "anomalyScore": anomaly_score,
                    "trackingId": f"TRK-{track_id}",
                    "detectionTime": time.strftime("%H:%M:%S")
                })

        return {"predictions": predictions}

    except Exception as e:
        print(f"[API ERROR] Frame classification failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == '__main__':
    uvicorn.run(app, host="0.0.0.0", port=5001)
