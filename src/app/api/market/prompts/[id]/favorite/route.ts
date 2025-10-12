import { getAuthSession } from '@/lib/auth';
import { getCollection } from '@/lib/db';
import { Favorite, MarketPrompt } from '@/types/prompt';
import { ObjectId } from 'mongodb';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ isFavorited: false });
    }

    const { id } = await params;
    const collection = await getCollection<Favorite>('favorites');
    const favorite = await collection.findOne({
      userId: session.user.id,
      marketPromptId: id,
    });

    return NextResponse.json({ isFavorited: !!favorite });
  } catch (error) {
    console.error('检查收藏状态失败:', error);
    return NextResponse.json({ error: '检查收藏状态失败' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const { id } = await params;
    const favoritesCollection = await getCollection<Favorite>('favorites');
    const marketCollection = await getCollection<MarketPrompt>('market_prompts');

    // 检查是否已收藏
    const existing = await favoritesCollection.findOne({
      userId: session.user.id,
      marketPromptId: id,
    });

    if (existing) {
      // 取消收藏
      await favoritesCollection.deleteOne({ _id: existing._id });
      await marketCollection.updateOne(
        { _id: new ObjectId(id) },
        { $inc: { favoriteCount: -1 } }
      );
      return NextResponse.json({ isFavorited: false });
    } else {
      // 添加收藏
      await favoritesCollection.insertOne({
        userId: session.user.id,
        marketPromptId: id,
        createdAt: new Date(),
      } as Favorite);
      await marketCollection.updateOne(
        { _id: new ObjectId(id) },
        { $inc: { favoriteCount: 1 } }
      );
      return NextResponse.json({ isFavorited: true });
    }
  } catch (error) {
    console.error('收藏操作失败:', error);
    return NextResponse.json({ error: '收藏操作失败' }, { status: 500 });
  }
}

