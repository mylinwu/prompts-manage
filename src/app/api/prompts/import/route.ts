import { getAuthSession } from '@/lib/auth';
import { getCollection } from '@/lib/db';
import { AgentFormat, Prompt } from '@/types/prompt';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const body = await request.json();
    const { agents } = body;

    if (!Array.isArray(agents) || agents.length === 0) {
      return NextResponse.json({ error: '导入数据格式错误' }, { status: 400 });
    }

    const collection = await getCollection<Prompt>('prompts');
    const now = new Date();

    const newPrompts: Omit<Prompt, '_id'>[] = agents.map((agent: AgentFormat) => ({
      userId: session.user.id,
      name: agent.name,
      prompt: agent.prompt,
      emoji: agent.emoji || '',
      description: agent.description || '',
      groups: agent.group || [],
      isPublished: false,
      createdAt: now,
      updatedAt: now,
    }));

    const result = await collection.insertMany(newPrompts as Prompt[]);

    return NextResponse.json({
      success: true,
      count: result.insertedCount,
      message: `成功导入 ${result.insertedCount} 个提示词`,
    });
  } catch (error) {
    console.error('导入提示词失败:', error);
    return NextResponse.json({ error: '导入提示词失败' }, { status: 500 });
  }
}

