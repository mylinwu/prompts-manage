import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCollection } from '@/lib/db';
import { compare, hash } from 'bcryptjs';
import { ObjectId } from 'mongodb';
import { getAuthSession } from '@/lib/auth';

const schema = z.object({
	oldPassword: z.string().min(8),
	newPassword: z.string().min(8),
});

export async function POST(req: Request) {
	const session = await getAuthSession();
	if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

	const body = await req.json().catch(() => null);
	const parse = schema.safeParse(body);
	if (!parse.success) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
	const { oldPassword, newPassword } = parse.data;

	const users = await getCollection<any>('users');
	const user = await users.findOne({ _id: new ObjectId(session.user.id) });
	if (!user || !user.password) return NextResponse.json({ error: 'Not found' }, { status: 404 });

	const ok = await compare(oldPassword, user.password);
	if (!ok) return NextResponse.json({ error: 'Old password incorrect' }, { status: 400 });

	const newHash = await hash(newPassword, 10);
	await users.updateOne({ _id: user._id }, { $set: { password: newHash } });
	return NextResponse.json({ ok: true });
}
