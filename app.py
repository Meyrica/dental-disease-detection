import os
import io
import base64
import uuid
from flask import Flask, request, jsonify, render_template
from ultralytics import YOLO
from PIL import Image
import cv2
import numpy as np

# ─── CONFIG ───────────────────────────────────────────────────────────────────
MODEL_PATH     = "model/best.pt"
UPLOAD_FOLDER  = "static/uploads"
CONF_THRESHOLD = 0.2
# ──────────────────────────────────────────────────────────────────────────────

app = Flask(__name__, 
            template_folder='templates/html',
            static_folder='templates/static',
            static_url_path='/static')

app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

print(f"[INFO] Loading model dari: {MODEL_PATH}")
model = YOLO(MODEL_PATH)
print(f"[INFO] Model dimuat! Classes: {model.names}")


def make_square_640(img_bgr):
    h, w    = img_bgr.shape[:2]
    scale   = 640 / max(h, w)
    new_w   = int(w * scale)
    new_h   = int(h * scale)
    resized = cv2.resize(img_bgr, (new_w, new_h), interpolation=cv2.INTER_LINEAR)
    canvas  = np.zeros((640, 640, 3), dtype=np.uint8)
    pad_top  = (640 - new_h) // 2
    pad_left = (640 - new_w) // 2
    canvas[pad_top:pad_top + new_h, pad_left:pad_left + new_w] = resized
    return canvas


@app.route('/')
def home():
    return render_template('landing_page.html')


@app.route('/model')
def model_page():
    return render_template('model_page.html')


@app.route("/predict", methods=["POST"])
def predict():
    if "image" not in request.files:
        return jsonify({"error": "No image files."}), 400

    file = request.files["image"]
    if file.filename == "":
        return jsonify({"error": "File name is empty."}), 400

    try:
        img_bytes = file.read()
        np_arr  = np.frombuffer(img_bytes, np.uint8)
        img_bgr = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

        if img_bgr is None:
            return jsonify({"error": "Failed to read image."}), 400

        img_square = make_square_640(img_bgr)

        results = model.predict(
            source=img_square,
            conf=CONF_THRESHOLD,
            imgsz=640,
            verbose=True
        )
        result = results[0]

        annotated_bgr  = result.plot()
        ext            = os.path.splitext(file.filename)[-1].lower() or ".jpg"
        unique_name    = f"{uuid.uuid4().hex}{ext}"
        annotated_path = os.path.join(UPLOAD_FOLDER, unique_name)
        cv2.imwrite(annotated_path, annotated_bgr)

        annotated_rgb = cv2.cvtColor(annotated_bgr, cv2.COLOR_BGR2RGB)
        pil_img       = Image.fromarray(annotated_rgb)
        buffer        = io.BytesIO()
        pil_img.save(buffer, format="JPEG", quality=90)
        b64      = base64.b64encode(buffer.getvalue()).decode("utf-8")
        data_url = f"data:image/jpeg;base64,{b64}"

        detections = []
        if result.boxes is not None:
            for box in result.boxes:
                cls_id     = int(box.cls[0].item())
                conf       = round(float(box.conf[0].item()) * 100, 1)
                class_name = model.names[cls_id]
                xyxy       = box.xyxy[0].tolist()
                detections.append({
                    "class":      class_name,
                    "confidence": conf,
                    "bbox": {
                        "x1": round(xyxy[0], 1),
                        "y1": round(xyxy[1], 1),
                        "x2": round(xyxy[2], 1),
                        "y2": round(xyxy[3], 1),
                    }
                })

        return jsonify({
            "annotated_image":  data_url,
            "detections":       detections,
            "total_detections": len(detections),
            "saved_as":         unique_name
        })

    except Exception as e:
        import traceback
        print(f"[ERROR] {traceback.format_exc()}")
        return jsonify({"error": f"Error: {str(e)}"}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)