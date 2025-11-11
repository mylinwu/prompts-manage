import { getAuthSession } from '@/lib/auth';
import { getCollection } from '@/lib/db';
import { Prompt, PromptVersion } from '@/types/prompt';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const group = searchParams.get('group');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const pageSize = Math.min(30, Math.max(20, parseInt(searchParams.get('pageSize') || '30', 10)));

    const collection = await getCollection<Prompt>('prompts');
    const query: Record<string, unknown> = { userId: session.user.id };

    if (group && group !== '全部') {
      query.groups = group;
    }

    const total = await collection.countDocuments(query);
    const prompts = await collection
      .find(query)
      .sort({ updatedAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .toArray();

    const data = prompts.map((p) => ({
      id: p._id.toString(),
      userId: p.userId,
      name: p.name,
      prompt: p.prompt,
      emoji: p.emoji,
      description: p.description,
      groups: p.groups,
      isPublished: p.isPublished,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    }));

    return NextResponse.json({ 
      prompts: data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    });
  } catch (error) {
    console.error('获取提示词失败:', error);
    return NextResponse.json({ error: '获取提示词失败' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const body = await request.json();
    const { name, prompt, emoji, description, groups } = body;

    if (!name || !prompt) {
      return NextResponse.json({ error: '名称和提示词内容不能为空' }, { status: 400 });
    }

    const collection = await getCollection<Prompt>('prompts');
    const now = new Date();

    const newPrompt: Omit<Prompt, '_id'> = {
      userId: session.user.id,
      name,
      prompt,
      emoji: emoji || '',
      description: description || '',
      groups: groups || [],
      isPublished: false,
      createdAt: now,
      updatedAt: now,
    };

    const result = await collection.insertOne(newPrompt as Prompt);
    const promptId = result.insertedId.toString();

    // 自动创建初始版本
    const versionsCollection = await getCollection<PromptVersion>('prompt_versions');
    const initialVersion: Omit<PromptVersion, '_id'> = {
      promptId,
      version: 1,
      name,
      prompt,
      description: '初始版本',
      createdAt: now,
      createdBy: session.user.id,
    };
    await versionsCollection.insertOne(initialVersion as PromptVersion);

    return NextResponse.json({
      id: promptId,
      ...newPrompt,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    });
  } catch (error) {
    console.error('创建提示词失败:', error);
    return NextResponse.json({ error: '创建提示词失败' }, { status: 500 });
  }
}

