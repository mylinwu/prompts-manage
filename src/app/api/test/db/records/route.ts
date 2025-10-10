import { NextRequest } from 'next/server';
import { ObjectId } from 'mongodb';
import { getCollection, ensureAuth, getDefaultCollectionName } from '@/lib/db';

function parseQuery(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const collection = searchParams.get('collection') || getDefaultCollectionName();
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '20', 10)));
  const search = searchParams.get('search')?.trim();
  return { collection, page, pageSize, search };
}

export async function GET(req: NextRequest) {
  const unauthorized = ensureAuth(req.headers);
  if (unauthorized) return unauthorized;

  try {
    const { collection, page, pageSize, search } = parseQuery(req);
    const col = await getCollection(collection);
    const query: any = search
      ? { $or: [
          { name: { $regex: search, $options: 'i' } },
          { text: { $regex: search, $options: 'i' } },
        ] }
      : {};

    const total = await col.countDocuments(query);
    const docs = await col
      .find(query)
      .sort({ updatedAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .toArray();
    return Response.json({ items: docs, total, page, pageSize, collection });
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
    const col = await getCollection(collection);
    const now = new Date();
    const doc = { name: body.name, text: body.text, tags: body.tags ?? [], createdAt: now, updatedAt: now };
    const result = await col.insertOne(doc);
    return Response.json({ insertedId: result.insertedId, collection });
  } catch (err) {
    return new Response((err as Error).message, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const unauthorized = ensureAuth(req.headers);
  if (unauthorized) return unauthorized;

  try {
    const { searchParams } = new URL(req.url);
    const collection = searchParams.get('collection') || getDefaultCollectionName();
    const idsParam = searchParams.get('ids');
    const col = await getCollection(collection);

    if (idsParam) {
      const ids = idsParam.split(',').map((s) => s.trim()).filter(Boolean);
      const objectIds = ids.map((id) => new ObjectId(id));
      const result = await col.deleteMany({ _id: { $in: objectIds } });
      return Response.json({ deletedCount: result.deletedCount, collection });
    }

    const result = await col.deleteMany({});
    return Response.json({ deletedCount: result.deletedCount, collection });
  } catch (err) {
    return new Response((err as Error).message, { status: 500 });
  }
}

