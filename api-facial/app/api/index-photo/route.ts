import { NextRequest, NextResponse } from 'next/server';
import { extractVectorsFromUrl } from '@/lib/face-engine';
import { validateApiKey } from '@/lib/auth';
import type { IndexPhotoRequest, IndexPhotoResponse } from '@/types';

export const maxDuration = 30;

export async function POST(req: NextRequest): Promise<NextResponse> {
  const body: Partial<IndexPhotoRequest> = await req.json().catch(() => ({}));

  if (!validateApiKey(body.api_key)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!body.photo_url) {
    return NextResponse.json({ error: 'photo_url required' }, { status: 400 });
  }

  const vectors = await extractVectorsFromUrl(body.photo_url);

  const response: IndexPhotoResponse = {
    faces_found: vectors.length,
    vectors,
  };

  return NextResponse.json(response);
}
