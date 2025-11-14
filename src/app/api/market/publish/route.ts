import { getCollection } from '@/lib/db';
import { MarketPrompt, Prompt } from '@/types/prompt';
import { ObjectId } from 'mongodb';
import { NextRequest } from 'next/server';
import { revalidatePath } from 'next/cache';
import { withAuth, validateBody, validateObjectId, ApiError, withRateLimit, AuthContext } from '@/lib/api-utils';
import { z } from 'zod';

// 强制动态渲染，因为使用了认证相关的 headers
export const dynamic = 'force-dynamic';

const publishSchema = z.object({
  promptId: z.string().min(1, '提示词ID不能为空'),
});

// 限流：每个用户每天最多 30 次发布请求
export const POST = withAuth(withRateLimit(async (request: NextRequest, context: AuthContext) => {
  const { userId } = context;
  // 验证请求体
  const { promptId } = await validateBody(request, publishSchema);
  const objectId = validateObjectId(promptId, '提示词ID');

  // 验证提示词所有权
  const promptsCollection = await getCollection<Prompt>('prompts');
  const prompt = await promptsCollection.findOne({
    _id: objectId,
    userId,
  });

  if (!prompt) {
    throw new ApiError(404, '提示词不存在', 'PROMPT_NOT_FOUND');
  }

  const marketCollection = await getCollection<MarketPrompt>('market_prompts');

  // 检查是否已发布
  const existing = await marketCollection.findOne({
    originalPromptId: promptId,
    userId,
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

    // 使市场 API 缓存失效
    revalidatePath('/api/market/prompts');

    return {
      id: existing._id.toString(),
      message: '提示词已更新到市场',
    };
  } else {
    // 新发布
    const newMarketPrompt: Omit<MarketPrompt, '_id'> = {
      originalPromptId: promptId,
      userId,
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
      { _id: objectId },
      { $set: { isPublished: true } }
    );

    // 使市场 API 缓存失效
    revalidatePath('/api/market/prompts');
    revalidatePath('/api/market/prompts/groups');

    return {
      id: result.insertedId.toString(),
      message: '提示词已发布到市场',
    };
  }
}, {
  windowMs: 24 * 60 * 60 * 1000, // 24 小时
  max: 30,                        // 最多 30 次
  keyType: 'user',                // 按用户限流
  identifier: 'market-publish',
  message: '发布请求过于频繁，请明天再试'
}));

