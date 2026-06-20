# Dentify — Dental Disease Detection
Dentify is a web-based application that uses Artificial Intelligence to detect dental diseases from photos. Built with a YOLO object detection model, it analyzes teeth images and identifies conditions in seconds — helping users get an early reference before visiting a dentist.

## Features
- **Image Upload Detection** — Upload a photo of your teeth and get instant AI-powered analysis
- **Live Camera Detection** — Use your device camera for real-time scanning, with automatic detection every few seconds
- **Bounding Box Visualization** — Detected conditions are highlighted directly on the image with confidence scores
- **Multiple Condition Detection** — Identifies Caries, Plaque, Calculus, Gingivitis, and Healthy teeth
- **Responsive UI** — Works smoothly on both desktop and mobile

## Detectable Conditions
**Gingivitis** = Inflammation of the gums characterized by redness, swelling, and easy bleeding
**Plaque** = A sticky bacterial layer on the tooth surface that can lead to decay
**Calculus** = Hardened dental plaque caused by long-term mineral buildup
**Caries** = Damage to tooth tissue caused by enamel demineralization from bacterial acid
**Healthy** = Teeth and gums in a clean condition with no signs of disease

## Tech Stack
- **Backend:** Flask (Python)
- **AI Model:** YOLO26 (Ultralytics) — object detection
- **Image Processing:** OpenCV, Pillow
- **Frontend:** HTML, CSS, JavaScript

## How It Works
1. Upload a photo (or use the live camera) of your teeth
2. The YOLO model analyzes the image and detects dental conditions
3. Results are displayed with bounding boxes and confidence percentages
4. Use the results as an initial screening — always confirm with a dentist


##  Installation & Setup
```bash
# Clone the repository
git clone https://github.com/Meyrica/dental-disease-detection.git
cd dental-disease-detection
 
# Install dependencies
pip install -r requirements.txt
 
# Run the app
python app.py
```
## Disclaimer
This application provides an **initial screening only** and is not a substitute for professional dental diagnosis. Always consult a licensed dentist for accurate diagnosis and treatment.