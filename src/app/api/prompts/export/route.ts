import { getAuthSession } from '@/lib/auth';
import { getCollection } from '@/lib/db';
import { AgentFormat, Prompt } from '@/types/prompt';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const ids = searchParams.get('ids')?.split(',');

    const collection = await getCollection<Prompt>('prompts');
    const query: Record<string, unknown> = { userId: session.user.id };

    if (ids && ids.length > 0) {
      const { ObjectId } = await import('mongodb');
      query._id = { $in: ids.map((id) => new ObjectId(id)) };
    }

    const prompts = await collection.find(query).toArray();

    const agents: AgentFormat[] = prompts.map((p) => ({
      id: p._id.toString(),
      name: p.name,
      prompt: p.prompt,
      emoji: p.emoji,
      description: p.description,
      group: p.groups,
    }));

    return NextResponse.json(agents);
  } catch (error) {
    console.error('导出提示词失败:', error);
    return NextResponse.json({ error: '导出提示词失败' }, { status: 500 });
  }
}

