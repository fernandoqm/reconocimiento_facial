// Must import tfjs-node first so face-api picks up the Node backend
import '@tensorflow/tfjs-node';
import * as faceapi from '@vladmandic/face-api';
import * as canvas from 'canvas';
import path from 'path';

const { Canvas, Image, ImageData } = canvas;
faceapi.env.monkeyPatch({ Canvas, Image, ImageData } as unknown as faceapi.IFaceAPIEnvironment);

let modelsLoaded = false;
let loadingPromise: Promise<void> | null = null;

export async function loadModels(): Promise<void> {
  if (modelsLoaded) return;
  // Prevent concurrent loading — all callers await the same promise
  if (loadingPromise) return loadingPromise;

  loadingPromise = (async () => {
    const modelsPath = path.join(process.cwd(), 'public', 'models');
    await Promise.all([
      faceapi.nets.ssdMobilenetv1.loadFromDisk(modelsPath),
      faceapi.nets.faceLandmark68Net.loadFromDisk(modelsPath),
      faceapi.nets.faceRecognitionNet.loadFromDisk(modelsPath),
    ]);
    modelsLoaded = true;
    console.log('[models] Loaded from', modelsPath);
  })();

  return loadingPromise;
}

export { faceapi, canvas };
