import { getAuthSession } from '@/lib/auth';
import { getCollection } from '@/lib/db';
import { Favorite, MarketPrompt } from '@/types/prompt';
import { NextRequest, NextResponse } from 'next/server';

// 启用 Next.js 缓存，60秒后重新验证
export const revalidate = 60;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const group = searchParams.get('group');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const session = await getAuthSession();
    const userId = session?.user?.id;

    const collection = await getCollection<MarketPrompt>('market_prompts');
    const query: Record<string, unknown> = {};

    if (group && group !== '全部') {
      query.groups = group;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await collection.countDocuments(query);
    const prompts = await collection
      .find(query)
      .sort({ favoriteCount: -1, publishedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();

    // 如果用户已登录，检查收藏状态
    let favoriteIds: Set<string> = new Set();
    if (userId) {
      const favoritesCollection = await getCollection<Favorite>('favorites');
      const favorites = await favoritesCollection
        .find({ userId })
        .toArray();
      favoriteIds = new Set(favorites.map((f) => f.marketPromptId));
    }

    const data = prompts.map((p) => ({
      id: p._id.toString(),
      originalPromptId: p.originalPromptId,
      userId: p.userId,
      name: p.name,
      prompt: p.prompt,
      emoji: p.emoji,
      description: p.description,
      groups: p.groups,
      publishedAt: p.publishedAt.toISOString(),
      favoriteCount: p.favoriteCount,
      isFavorited: userId ? favoriteIds.has(p._id.toString()) : false,
    }));

    return NextResponse.json({
      prompts: data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('获取市场提示词失败:', error);
    return NextResponse.json({ error: '获取市场提示词失败' }, { status: 500 });
  }
}

