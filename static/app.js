const steps = [
  {
    key: "object",
    label: "Take a photo of the object",
  },
  {
    key: "scale",
    label: "Take a photo of the object on the scale",
  },
  {
    key: "scale_reading",
    label: "Take a photo of the scale reading",
  },
];

const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const preview = document.getElementById("preview");
const captureBtn = document.getElementById("capture");
const saveBtn = document.getElementById("save");
const retakeBtn = document.getElementById("retake");
const cancelBtn = document.getElementById("cancel");
const newBtn = document.getElementById("new");
const stepLabel = document.getElementById("step-label");
const instructions = document.getElementById("step-instructions");
const observationLabel = document.getElementById("observation-id");
const progressBar = document.getElementById("progress-bar");
const message = document.getElementById("message");

let stream = null;
let observationId = null;
let stepIndex = 0;
let capturedBlob = null;

function setMessage(text, tone = "") {
  message.textContent = text;
  message.style.color = tone === "success" ? "#2f8f5b" : "";
}

function updateProgress() {
  const percent = (stepIndex / steps.length) * 100;
  progressBar.style.width = `${percent}%`;
}

function updateStepUI() {
  const step = steps[stepIndex];
  stepLabel.textContent = step ? `Step ${stepIndex + 1} of ${steps.length}` : "Complete";
  instructions.textContent = step ? step.label : "All photos captured. Start a new observation.";
  captureBtn.disabled = !step;
  cancelBtn.disabled = !observationId;
  if (step) {
    newBtn.classList.add("hidden");
  }
  updateProgress();
}

function generateObservationId() {
  const now = new Date();
  const stamp = now.toISOString().replace(/[-:.TZ]/g, "");
  const rand = Math.random().toString(36).slice(2, 6);
  return `${stamp}_${rand}`;
}

async function startCamera() {
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" },
      audio: false,
    });
    video.srcObject = stream;
    captureBtn.disabled = false;
    updateStepUI();
  } catch (error) {
    setMessage("Camera access denied. Please allow camera permissions.");
  }
}

function showPreview(dataUrl) {
  preview.src = dataUrl;
  preview.classList.remove("hidden");
  video.classList.add("hidden");
  saveBtn.classList.remove("hidden");
  retakeBtn.classList.remove("hidden");
  captureBtn.classList.add("hidden");
}

function resetPreview() {
  preview.classList.add("hidden");
  video.classList.remove("hidden");
  saveBtn.classList.add("hidden");
  retakeBtn.classList.add("hidden");
  captureBtn.classList.remove("hidden");
  capturedBlob = null;
}

function captureFrame() {
  if (!stream) {
    return;
  }
  const width = video.videoWidth;
  const height = video.videoHeight;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(video, 0, 0, width, height);
  canvas.toBlob(
    (blob) => {
      if (!blob) {
        setMessage("Unable to capture image.");
        return;
      }
      capturedBlob = blob;
      const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
      showPreview(dataUrl);
      setMessage("Captured. Review and save.");
    },
    "image/jpeg",
    0.92
  );
}

async function saveCapture() {
  const step = steps[stepIndex];
  if (!step || !capturedBlob) {
    return;
  }

  if (!observationId) {
    observationId = generateObservationId();
    observationLabel.textContent = observationId;
  }

  const formData = new FormData();
  formData.append("observation_id", observationId);
  formData.append("step", step.key);
  formData.append("image", capturedBlob, `${observationId}_${step.key}.jpg`);

  try {
    const response = await fetch("/save", {
      method: "POST",
      body: formData,
    });
    if (!response.ok) {
      throw new Error("Save failed");
    }
    const result = await response.json();
    if (!result.ok) {
      throw new Error(result.error || "Save failed");
    }
    stepIndex += 1;
    resetPreview();
    updateStepUI();

    if (stepIndex >= steps.length) {
      setMessage("Observation saved! Ready for the next one.", "success");
      progressBar.style.width = "100%";
      newBtn.classList.remove("hidden");
    } else {
      setMessage("Saved. Continue to the next photo.");
    }
  } catch (error) {
    setMessage("Could not save. Please try again.");
  }
}

async function cancelObservation() {
  if (!observationId) {
    return;
  }
  const formData = new FormData();
  formData.append("observation_id", observationId);

  try {
    const response = await fetch("/cancel", {
      method: "POST",
      body: formData,
    });
    if (!response.ok) {
      throw new Error("Cancel failed");
    }
    observationId = null;
    observationLabel.textContent = "Canceled";
    stepIndex = 0;
    resetPreview();
    updateStepUI();
    setMessage("Observation canceled. Ready to start over.");
  } catch (error) {
    setMessage("Could not cancel. Please try again.");
  }
}

function startNewObservation() {
  observationId = null;
  observationLabel.textContent = "Not started";
  stepIndex = 0;
  resetPreview();
  updateStepUI();
  setMessage("Ready for a new observation.");
}

captureBtn.addEventListener("click", captureFrame);
retakeBtn.addEventListener("click", resetPreview);
saveBtn.addEventListener("click", saveCapture);
cancelBtn.addEventListener("click", cancelObservation);
newBtn.addEventListener("click", startNewObservation);

window.addEventListener("load", () => {
  startCamera();
  updateStepUI();
});

window.addEventListener("keydown", (event) => {
  if (event.key === "n" && stepIndex >= steps.length) {
    startNewObservation();
  }
});
