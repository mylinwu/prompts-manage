import client from '@/lib/mongodb';
import type { Document } from 'mongodb';

export async function getDb(dbName?: string) {
  await client.connect();
  const name = dbName || process.env.MONGODB_DB;
  return name ? client.db(name) : client.db();
}

export async function getCollection<T extends Document = Document>(name: string, dbName?: string) {
  const db = await getDb(dbName);
  return db.collection<T>(name);
}

export function ensureAuth(headers: Headers) {
  if (process.env.NODE_ENV !== 'production') return;
  const token = headers.get('x-test-db-token');
  if (!token || token !== process.env.TEST_DB_TOKEN) {
    return new Response('Unauthorized', { status: 401 });
  }
}

export function getDefaultCollectionName() {
  return process.env.TEST_DB_COLLECTION || 'prompts';
}

