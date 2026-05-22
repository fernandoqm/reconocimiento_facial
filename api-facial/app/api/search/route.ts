import { NextRequest, NextResponse } from 'next/server';
import { extractVectorFromBase64, findMatches } from '@/lib/face-engine';
import { validateApiKey } from '@/lib/auth';
import type { SearchRequest, SearchResponse } from '@/types';

export const maxDuration = 60; // Vercel Pro allows up to 300s, free tier 10s

export async function POST(req: NextRequest): Promise<NextResponse> {
  const body: Partial<SearchRequest> = await req.json().catch(() => ({}));

  if (!validateApiKey(body.api_key)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!body.event_photos?.length) {
    return NextResponse.json({ error: 'event_photos required' }, { status: 400 });
  }
  if (!body.selfie && !body.face_vector) {
    return NextResponse.json({ error: 'selfie or face_vector required' }, { status: 400 });
  }

  let queryVector: number[];
  let selfieVector: number[] | undefined;

  if (body.selfie) {
    const extracted = await extractVectorFromBase64(body.selfie);
    if (!extracted) {
      return NextResponse.json({ error: 'No face detected in selfie' }, { status: 422 });
    }
    queryVector = extracted;
    selfieVector = extracted;
  } else {
    queryVector = body.face_vector!;
  }

  const matches = await findMatches(queryVector, body.event_photos, body.threshold);

  const response: SearchResponse = {
    matches: matches.map(m => m.photoUrl),
    confidence_scores: matches.map(m => m.confidence),
    ...(selfieVector ? { selfie_vector: selfieVector } : {}),
  };

  return NextResponse.json(response);
}
