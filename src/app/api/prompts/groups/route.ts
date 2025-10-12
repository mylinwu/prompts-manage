import { getAuthSession } from '@/lib/auth';
import { getCollection } from '@/lib/db';
import { Prompt } from '@/types/prompt';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const collection = await getCollection<Prompt>('prompts');
    const prompts = await collection.find({ userId: session.user.id }).toArray();

    // 提取所有唯一的分组
    const groupsSet = new Set<string>();
    prompts.forEach((prompt) => {
      prompt.groups.forEach((group) => {
        if (group) groupsSet.add(group);
      });
    });

    const groups = Array.from(groupsSet).sort();

    return NextResponse.json({ groups });
  } catch (error) {
    console.error('获取分组失败:', error);
    return NextResponse.json({ error: '获取分组失败' }, { status: 500 });
  }
}

