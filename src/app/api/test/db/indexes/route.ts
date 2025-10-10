import { NextRequest } from 'next/server';
import { getCollection, ensureAuth, getDefaultCollectionName } from '@/lib/db';

export async function GET(req: NextRequest) {
  const unauthorized = ensureAuth(req.headers);
  if (unauthorized) return unauthorized;
  try {
    const { searchParams } = new URL(req.url);
    const collection = searchParams.get('collection') || getDefaultCollectionName();
    const col = await getCollection(collection);
    const idx = await col.indexes();
    return Response.json({ indexes: idx, collection });
  } catch (err) {
    return new Response((err as Error).message, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const unauthorized = ensureAuth(req.headers);
  if (unauthorized) return unauthorized;
  try {
    const body = await req.json();
    const collection = (body?.collection as string) || getDefaultCollectionName();
    const keys = body?.keys as Record<string, 1 | -1 | 'text'>;
    const options = body?.options as Record<string, any> | undefined;
    const col = await getCollection(collection);
    const name = await col.createIndex(keys, options);
    return Response.json({ name, collection });
  } catch (err) {
    return new Response((err as Error).message, { status: 500 });
  }
}

