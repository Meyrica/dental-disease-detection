from ultralytics import YOLO
import cv2

model = YOLO("model/best.pt")

# Pakai gambar dari dataset yang ada di folder project VS Code kamu
img = cv2.imread(r"dental-disease---detection-2\test\images\-1002-_jpg.rf.77893ef7de96b79aec0f09936a3987da.jpg")

if img is None:
    print("ERROR: Gambar tidak ditemukan!")
    print("Coba cari nama file yang ada...")
    import os
    test_folder = r"dental-disease---detection-2\test\images"
    if os.path.exists(test_folder):
        files = os.listdir(test_folder)
        print(f"File di folder test/images ({len(files)} total):")
        for f in files[:5]:
            print(f"  {f}")
    else:
        print(f"Folder tidak ada: {test_folder}")
else:
    print(f"Gambar berhasil dibaca: {img.shape}")
    square = cv2.resize(img, (640, 640))
    results = model.predict(source=square, conf=0.1, imgsz=640, verbose=True)
    print(f"Total: {len(results[0].boxes)}")
    for box in results[0].boxes:
        print(f" -> {model.names[int(box.cls[0])]} {round(float(box.conf[0])*100,1)}%")