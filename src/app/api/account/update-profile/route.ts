import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCollection } from '@/lib/db';
import { ObjectId } from 'mongodb';
import { getAuthSession } from '@/lib/auth';

const schema = z.object({
	name: z.string().min(1, '请输入姓名').max(64, '姓名过长'),
});

export async function POST(req: Request) {
	const session = await getAuthSession();
	if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

	const body = await req.json().catch(() => null);
	const parse = schema.safeParse(body);
	if (!parse.success) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
	const { name } = parse.data;

	const users = await getCollection<any>('users');
	const user = await users.findOne({ _id: new ObjectId(session.user.id) });
	if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });

	await users.updateOne({ _id: user._id }, { $set: { name } });
	return NextResponse.json({ ok: true, name });
}
