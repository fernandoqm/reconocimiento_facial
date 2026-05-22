// tfjs-node DEBE importarse primero para activar el backend nativo
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
  if (loadingPromise) return loadingPromise;

  loadingPromise = (async () => {
    // Los modelos viven en <raíz-del-proyecto>/models/
    const modelsPath = path.join(process.cwd(), 'models');
    await Promise.all([
      faceapi.nets.ssdMobilenetv1.loadFromDisk(modelsPath),
      faceapi.nets.faceLandmark68Net.loadFromDisk(modelsPath),
      faceapi.nets.faceRecognitionNet.loadFromDisk(modelsPath),
    ]);
    modelsLoaded = true;
    console.log('[models] Cargados desde', modelsPath);
  })();

  return loadingPromise;
}

export { faceapi, canvas };
