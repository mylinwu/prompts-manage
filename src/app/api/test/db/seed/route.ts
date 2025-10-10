import { NextRequest } from 'next/server';
import { getCollection, ensureAuth, getDefaultCollectionName } from '@/lib/db';

export async function POST(req: NextRequest) {
  const unauthorized = ensureAuth(req.headers);
  if (unauthorized) return unauthorized;

  try {
    const collectionName = getDefaultCollectionName();
    const col = await getCollection(collectionName);
    const now = new Date();
    const docs = [
      { name: 'Hello', text: 'Hello, world', tags: ['demo'], createdAt: now, updatedAt: now },
      { name: 'Prompt A', text: 'You are a helpful assistant', tags: ['llm','prompt'], createdAt: now, updatedAt: now },
      { name: 'Prompt B', text: 'Summarize the following', tags: ['summary'], createdAt: now, updatedAt: now },
    ];
    await col.insertMany(docs, { ordered: false });
    return Response.json({ inserted: docs.length, collection: collectionName });
  } catch (err) {
    return new Response((err as Error).message, { status: 500 });
  }
}

