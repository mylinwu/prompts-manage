import { getCollection } from '@/lib/db';
import { MarketPrompt, Prompt } from '@/types/prompt';
import { NextRequest } from 'next/server';
import { withAuth, validateObjectId, getRouteParams, ApiError } from '@/lib/api-utils';

export const POST = withAuth(
  async (request: NextRequest, context: { userId: string; params: Promise<{ id: string }> }) => {
    const { id } = await getRouteParams(context);
    const objectId = validateObjectId(id, '市场提示词ID');

    // 查询市场提示词
    const marketCollection = await getCollection<MarketPrompt>('market_prompts');
    const marketPrompt = await marketCollection.findOne({ _id: objectId });

    if (!marketPrompt) {
      throw new ApiError(404, '市场提示词不存在', 'MARKET_PROMPT_NOT_FOUND');
    }

    // 克隆到用户的提示词库
    const promptsCollection = await getCollection<Prompt>('prompts');
    const now = new Date();

    const newPrompt: Omit<Prompt, '_id'> = {
      userId: context.userId,
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

    return {
      id: result.insertedId.toString(),
      ...newPrompt,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      message: '克隆成功',
    };
  }
);

