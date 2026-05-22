import { NextResponse } from 'next/server';
import { loadModels } from '@/lib/models-loader';

export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse> {
  try {
    await loadModels();
    return NextResponse.json({ status: 'ok', models: 'loaded', ts: new Date().toISOString() });
  } catch (err) {
    return NextResponse.json({ status: 'error', message: String(err) }, { status: 500 });
  }
}
