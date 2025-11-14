import { getCollection } from '@/lib/db';
import { Favorite, MarketPrompt } from '@/types/prompt';
import { ObjectId } from 'mongodb';
import { NextRequest } from 'next/server';
import { withOptionalAuth, withAuth, getRouteParams, withRateLimit } from '@/lib/api-utils';

export const GET = withOptionalAuth(
  async (request: NextRequest, context: { userId?: string; params: Promise<{ id: string }> }) => {
    const { id } = await getRouteParams(context);

    // 未登录用户返回未收藏
    if (!context.userId) {
      return { isFavorited: false };
    }

    const collection = await getCollection<Favorite>('favorites');
    const favorite = await collection.findOne({
      userId: context.userId,
      marketPromptId: id,
    });

    return { isFavorited: !!favorite };
  }
);

// 限流：每个用户每小时最多 60 次收藏操作
export const POST = withAuth(withRateLimit(
  async (request: NextRequest, context: { userId: string; params: Promise<{ id: string }> }) => {
    const { id } = await getRouteParams(context);
    
    const favoritesCollection = await getCollection<Favorite>('favorites');
    const marketCollection = await getCollection<MarketPrompt>('market_prompts');

    // 检查是否已收藏
    const existing = await favoritesCollection.findOne({
      userId: context.userId,
      marketPromptId: id,
    });

    if (existing) {
      // 取消收藏
      await favoritesCollection.deleteOne({ _id: existing._id });
      await marketCollection.updateOne(
        { _id: new ObjectId(id) },
        { $inc: { favoriteCount: -1 } }
      );
      return { isFavorited: false, message: '已取消收藏' };
    } else {
      // 添加收藏
      await favoritesCollection.insertOne({
        userId: context.userId,
        marketPromptId: id,
        createdAt: new Date(),
      } as Favorite);
      await marketCollection.updateOne(
        { _id: new ObjectId(id) },
        { $inc: { favoriteCount: 1 } }
      );
      return { isFavorited: true, message: '收藏成功' };
    }
  }, {
    windowMs: 60 * 60 * 1000, // 1 小时
    max: 60,                   // 最多 60 次
    keyType: 'user',           // 按用户限流
    identifier: 'market-favorite',
    message: '收藏操作过于频繁，请稍后再试'
  }
));

