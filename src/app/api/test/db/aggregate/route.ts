import { NextRequest } from 'next/server';
import { getCollection, ensureAuth, getDefaultCollectionName } from '@/lib/db';

export async function POST(req: NextRequest) {
  const unauthorized = ensureAuth(req.headers);
  if (unauthorized) return unauthorized;

  try {
    const body = await req.json();
    const collection = (body?.collection as string) || getDefaultCollectionName();
    const pipeline = Array.isArray(body?.pipeline) ? body.pipeline : [];
    const col = await getCollection(collection);
    const result = await col.aggregate(pipeline).toArray();
    return Response.json({ result, collection });
  } catch (err) {
    return new Response((err as Error).message, { status: 500 });
  }
}

