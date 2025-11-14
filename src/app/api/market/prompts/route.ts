import { getCollection } from '@/lib/db';
import { Favorite, MarketPrompt } from '@/types/prompt';
import { NextRequest } from 'next/server';
import { withOptionalAuth, getPaginationParams, serializeDocuments } from '@/lib/api-utils';

// 启用 Next.js 缓存，60秒后重新验证
export const revalidate = 600;

export const GET = withOptionalAuth(async (request: NextRequest, { userId }) => {
  const searchParams = request.nextUrl.searchParams;
  const group = searchParams.get('group');
  const search = searchParams.get('search');
  const { page, pageSize: limit, skip } = getPaginationParams(request, 50, 100);

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
    .skip(skip)
    .limit(limit)
    .toArray();

  // 如果用户已登录，检查收藏状态
  let favoriteIds: Set<string> = new Set();
  if (userId) {
    const favoritesCollection = await getCollection<Favorite>('favorites');
    const favorites = await favoritesCollection.find({ userId }).toArray();
    favoriteIds = new Set(favorites.map((f) => f.marketPromptId));
  }

  const data = prompts.map((p) => ({
    ...serializeDocuments([p])[0],
    publishedAt: p.publishedAt.toISOString(),
    favoriteCount: p.favoriteCount,
    isFavorited: userId ? favoriteIds.has(p._id.toString()) : false,
  }));

  return {
    prompts: data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
});

