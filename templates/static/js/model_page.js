// =========================
// TAB SWITCH
// =========================
function switchTab(tab) {
    const uploadMode = document.getElementById("uploadMode");
    const cameraMode = document.getElementById("cameraMode");
    const tabUpload  = document.getElementById("tabUpload");
    const tabCamera  = document.getElementById("tabCamera");

    if (tab === "upload") {
        uploadMode.style.display = "block";
        cameraMode.style.display = "none";
        tabUpload.classList.add("active");
        tabCamera.classList.remove("active");
        stopLiveDetection();
    } else {
        uploadMode.style.display = "none";
        cameraMode.style.display = "block";
        tabUpload.classList.remove("active");
        tabCamera.classList.add("active");
        startCamera();
    }
}

// =========================
// UPLOAD MODE
// =========================
function previewImage(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('previewImg').src = e.target.result;
            document.getElementById('preview').style.display = 'block';
            document.getElementById('uploadZone').style.display = 'none';
        };
        reader.readAsDataURL(input.files[0]);
    }
}

async function uploadImage() {
    const input = document.getElementById("imageInput");
    if (!input.files.length) {
        alert("Choose an image first!");
        return;
    }

    const formData = new FormData();
    formData.append("image", input.files[0]);

    document.getElementById("loading").style.display        = "flex";
    document.getElementById("result").style.display         = "none";
    document.getElementById("detections").style.display     = "none";
    document.getElementById("empty-state").style.display    = "none";

    try {
        const response = await fetch("/predict", { method: "POST", body: formData });
        const data     = await response.json();

        document.getElementById("loading").style.display = "none";

        if (data.error) { alert(data.error); return; }

        showResult(data);

        document.getElementById("detectBtn").style.display = "none";
        document.getElementById("resetBtn").style.display  = "block";

    } catch (err) {
        document.getElementById("loading").style.display = "none";
        alert("Error: " + err);
    }
}

function resetForm() {
    document.getElementById("imageInput").value              = "";
    document.getElementById("preview").style.display         = "none";
    document.getElementById("previewImg").src                = "";
    document.getElementById("uploadZone").style.display      = "block";
    document.getElementById("result").style.display          = "none";
    document.getElementById("resultImg").src                 = "";
    document.getElementById("detections").style.display      = "none";
    document.getElementById("detections-list").innerHTML     = "";
    document.getElementById("empty-state").style.display     = "block";
    document.getElementById("detectBtn").style.display       = "block";
    document.getElementById("resetBtn").style.display        = "none";
}

// =========================
// CAMERA MODE
// =========================
let cameraStream    = null;
let liveInterval    = null;
let isDetecting     = false;

async function startCamera() {
    const statusDot  = document.querySelector(".status-dot");
    const statusText = document.getElementById("cameraStatusText");

    try {
        cameraStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } }
        });

        const video        = document.getElementById("cameraFeed");
        video.srcObject    = cameraStream;
        statusDot.classList.add("live");
        statusText.textContent = "Camera ready — click Start to detect";

    } catch (err) {
        statusText.textContent = "Camera access denied";
        console.error("Camera error:", err);
    }
}

function startLiveDetection() {
    if (!cameraStream) return;

    isDetecting = true;
    document.getElementById("startCameraBtn").style.display = "none";
    document.getElementById("stopCameraBtn").style.display  = "block";
    document.querySelector(".scan-line").classList.add("active");
    document.getElementById("cameraStatusText").textContent = "Detecting live...";
    document.getElementById("empty-state").style.display    = "none";

    // Kirim frame tiap 1.5 detik
    liveInterval = setInterval(captureAndDetect, 1500);
    captureAndDetect(); // langsung detect sekali di awal
}

function stopLiveDetection() {
    isDetecting = false;
    clearInterval(liveInterval);
    liveInterval = null;

    document.getElementById("startCameraBtn").style.display = "block";
    document.getElementById("stopCameraBtn").style.display  = "none";
    document.querySelector(".scan-line")?.classList.remove("active");

    const statusText = document.getElementById("cameraStatusText");
    if (statusText) statusText.textContent = "Detection stopped";

    // Matiin kamera kalau pindah tab
    if (!document.getElementById("cameraMode") ||
        document.getElementById("cameraMode").style.display === "none") {
        if (cameraStream) {
            cameraStream.getTracks().forEach(t => t.stop());
            cameraStream = null;
        }
    }
}

async function captureAndDetect() {
    if (!isDetecting || !cameraStream) return;

    const video  = document.getElementById("cameraFeed");
    const canvas = document.getElementById("captureCanvas");

    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(async (blob) => {
        if (!blob) return;

        const formData = new FormData();
        formData.append("image", blob, "frame.jpg");

        try {
            const response = await fetch("/predict", { method: "POST", body: formData });
            const data     = await response.json();

            if (!isDetecting) return; // sudah di-stop saat request jalan
            if (data.error)   return;

            showResult(data);

        } catch (err) {
            console.error("Live detect error:", err);
        }
    }, "image/jpeg", 0.85);
}

// =========================
// SHARED: TAMPILKAN HASIL
// =========================
function showResult(data) {
    document.getElementById("resultImg").src             = data.annotated_image;
    document.getElementById("result").style.display      = "block";
    document.getElementById("empty-state").style.display = "none";

    let html = "";
    data.detections.forEach(d => {
        html += `<div class="detection-item">
            <span class="class-name">${d.class}</span>
            <span class="confidence-badge">${d.confidence}%</span>
        </div>`;
    });

    if (data.total_detections === 0) {
        html = `<div class="detection-item"><span class="class-name">No condition detected</span></div>`;
    }

    document.getElementById("detections-list").innerHTML = html;
    document.getElementById("detections").style.display  = "block";
}