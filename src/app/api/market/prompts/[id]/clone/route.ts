import { getAuthSession } from '@/lib/auth';
import { getCollection } from '@/lib/db';
import { MarketPrompt, Prompt } from '@/types/prompt';
import { ObjectId } from 'mongodb';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const marketCollection = await getCollection<MarketPrompt>('market_prompts');
    const marketPrompt = await marketCollection.findOne({ _id: new ObjectId(params.id) });

    if (!marketPrompt) {
      return NextResponse.json({ error: '市场提示词不存在' }, { status: 404 });
    }

    const promptsCollection = await getCollection<Prompt>('prompts');
    const now = new Date();

    const newPrompt: Omit<Prompt, '_id'> = {
      userId: session.user.id,
      name: marketPrompt.name,
      prompt: marketPrompt.prompt,
      emoji: marketPrompt.emoji || '',
      description: marketPrompt.description || '',
      groups: marketPrompt.groups || [],
      isPublished: false,
      createdAt: now,
      updatedAt: now,
    };

    const result = await promptsCollection.insertOne(newPrompt as Prompt);

    return NextResponse.json({
      id: result.insertedId.toString(),
      ...newPrompt,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    });
  } catch (error) {
    console.error('克隆提示词失败:', error);
    return NextResponse.json({ error: '克隆提示词失败' }, { status: 500 });
  }
}

