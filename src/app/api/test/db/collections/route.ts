import { NextRequest } from 'next/server';
import { getDb, ensureAuth } from '@/lib/db';

export async function GET(req: NextRequest) {
  const unauthorized = ensureAuth(req.headers);
  if (unauthorized) return unauthorized;

  try {
    const db = await getDb();
    const cursor = db.listCollections({}, { nameOnly: true });
    const names: string[] = [];
    for await (const info of cursor) names.push(info.name);
    return Response.json({ collections: names });
  } catch (err) {
    return new Response((err as Error).message, { status: 500 });
  }
}

