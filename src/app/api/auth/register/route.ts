import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCollection } from '@/lib/db';
import { hash } from 'bcryptjs';

const schema = z.object({
	email: z.string().email(),
	password: z.string().min(8),
	name: z.string().min(1).max(64),
});

export async function POST(req: Request) {
	const body = await req.json().catch(() => null);
	const parse = schema.safeParse(body);
	if (!parse.success) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
	const { email, password, name } = parse.data;

	const users = await getCollection<any>('users');
	const existing = await users.findOne({ email });
	if (existing) return NextResponse.json({ error: 'Email already registered' }, { status: 409 });

	const passwordHash = await hash(password, 10);
	await users.insertOne({ email, password: passwordHash, name, image: null, emailVerified: null });
	return NextResponse.json({ ok: true });
}
