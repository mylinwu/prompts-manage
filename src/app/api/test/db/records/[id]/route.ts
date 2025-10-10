import { NextRequest } from 'next/server';
import { ObjectId } from 'mongodb';
import { getCollection, ensureAuth, getDefaultCollectionName } from '@/lib/db';

function getParams(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const collection = searchParams.get('collection') || getDefaultCollectionName();
  return { collection };
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const unauthorized = ensureAuth(_req.headers);
  if (unauthorized) return unauthorized;
  try {
    const { collection } = getParams(_req);
    const col = await getCollection(collection);
    const doc = await col.findOne({ _id: new ObjectId(params.id) });
    if (!doc) return new Response('Not Found', { status: 404 });
    return Response.json(doc);
  } catch (err) {
    return new Response((err as Error).message, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const unauthorized = ensureAuth(req.headers);
  if (unauthorized) return unauthorized;
  try {
    const body = await req.json();
    const { collection } = getParams(req);
    const col = await getCollection(collection);
    const update = { $set: { name: body.name, text: body.text, tags: body.tags ?? [], updatedAt: new Date() } };
    const result = await col.updateOne({ _id: new ObjectId(params.id) }, update);
    return Response.json({ matchedCount: result.matchedCount, modifiedCount: result.modifiedCount, collection });
  } catch (err) {
    return new Response((err as Error).message, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const unauthorized = ensureAuth(req.headers);
  if (unauthorized) return unauthorized;
  try {
    const { collection } = getParams(req);
    const col = await getCollection(collection);
    const result = await col.deleteOne({ _id: new ObjectId(params.id) });
    return Response.json({ deletedCount: result.deletedCount, collection });
  } catch (err) {
    return new Response((err as Error).message, { status: 500 });
  }
}

