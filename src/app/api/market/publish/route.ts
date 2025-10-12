import { getAuthSession } from '@/lib/auth';
import { getCollection } from '@/lib/db';
import { MarketPrompt, Prompt } from '@/types/prompt';
import { ObjectId } from 'mongodb';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const body = await request.json();
    const { promptId } = body;

    if (!promptId) {
      return NextResponse.json({ error: '提示词ID不能为空' }, { status: 400 });
    }

    // 验证提示词所有权
    const promptsCollection = await getCollection<Prompt>('prompts');
    const prompt = await promptsCollection.findOne({
      _id: new ObjectId(promptId),
      userId: session.user.id,
    });

    if (!prompt) {
      return NextResponse.json({ error: '提示词不存在' }, { status: 404 });
    }

    const marketCollection = await getCollection<MarketPrompt>('market_prompts');

    // 检查是否已发布
    const existing = await marketCollection.findOne({
      originalPromptId: promptId,
      userId: session.user.id,
    });

    if (existing) {
      // 更新已发布的提示词
      await marketCollection.updateOne(
        { _id: existing._id },
        {
          $set: {
            name: prompt.name,
            prompt: prompt.prompt,
            emoji: prompt.emoji,
            description: prompt.description,
            groups: prompt.groups,
            publishedAt: new Date(),
          },
        }
      );

      return NextResponse.json({
        id: existing._id.toString(),
        message: '提示词已更新到市场',
      });
    } else {
      // 新发布
      const newMarketPrompt: Omit<MarketPrompt, '_id'> = {
        originalPromptId: promptId,
        userId: session.user.id,
        name: prompt.name,
        prompt: prompt.prompt,
        emoji: prompt.emoji || '',
        description: prompt.description || '',
        groups: prompt.groups || [],
        publishedAt: new Date(),
        favoriteCount: 0,
      };

      const result = await marketCollection.insertOne(newMarketPrompt as MarketPrompt);

      // 更新原提示词的发布状态
      await promptsCollection.updateOne(
        { _id: new ObjectId(promptId) },
        { $set: { isPublished: true } }
      );

      return NextResponse.json({
        id: result.insertedId.toString(),
        message: '提示词已发布到市场',
      });
    }
  } catch (error) {
    console.error('发布提示词失败:', error);
    return NextResponse.json({ error: '发布提示词失败' }, { status: 500 });
  }
}

