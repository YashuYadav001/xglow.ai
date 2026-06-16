import * as faceapi from "face-api.js";

let modelsLoaded = false;

export async function loadModels() {
  if (modelsLoaded) return;

  await Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
    faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
  ]);

  modelsLoaded = true;
}

export async function analyzeFace(imageElement) {
  await loadModels();

  const detection = await faceapi
    .detectSingleFace(
      imageElement,
      new faceapi.TinyFaceDetectorOptions()
    )
    .withFaceLandmarks();

  if (!detection) {
    throw new Error("No face detected");
  }

  return detection;
}