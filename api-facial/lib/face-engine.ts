import { faceapi, canvas, loadModels } from './models-loader';
import type { MatchResult } from '@/types';

const DEFAULT_THRESHOLD = parseFloat(process.env.FACE_MATCH_THRESHOLD ?? '0.6');

export async function extractVectorFromBase64(base64: string): Promise<number[] | null> {
  await loadModels();
  const buffer = Buffer.from(base64, 'base64');
  const img = await canvas.loadImage(buffer);

  const detection = await faceapi
    .detectSingleFace(img as unknown as HTMLImageElement)
    .withFaceLandmarks()
    .withFaceDescriptor();

  return detection ? Array.from(detection.descriptor) : null;
}

export async function extractVectorsFromUrl(url: string): Promise<number[][]> {
  await loadModels();
  const res = await fetch(url, { signal: AbortSignal.timeout(15_000) });
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);

  const buf = Buffer.from(await res.arrayBuffer());
  const img = await canvas.loadImage(buf);

  const detections = await faceapi
    .detectAllFaces(img as unknown as HTMLImageElement)
    .withFaceLandmarks()
    .withFaceDescriptors();

  return detections.map(d => Array.from(d.descriptor));
}

function euclidean(a: number[], b: number[]): number {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += (a[i] - b[i]) ** 2;
  return Math.sqrt(s);
}

export async function findMatches(
  queryVector: number[],
  photoUrls: string[],
  threshold = DEFAULT_THRESHOLD
): Promise<MatchResult[]> {
  const results: MatchResult[] = [];

  await Promise.allSettled(
    photoUrls.map(async (photoUrl) => {
      try {
        const vectors = await extractVectorsFromUrl(photoUrl);
        for (const vec of vectors) {
          const distance = euclidean(queryVector, vec);
          if (distance < threshold) {
            results.push({
              photoUrl,
              distance: +distance.toFixed(4),
              confidence: +(1 - distance / threshold).toFixed(4),
            });
            break; // count each photo at most once
          }
        }
      } catch (err) {
        console.error(`[face-engine] Skip ${photoUrl}:`, (err as Error).message);
      }
    })
  );

  return results.sort((a, b) => a.distance - b.distance);
}
