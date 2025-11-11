import { getAuthSession } from '@/lib/auth';
import { getCollection } from '@/lib/db';
import { Prompt } from '@/types/prompt';
import { NextRequest, NextResponse } from 'next/server';

// RSS Feed 输出格式
interface RSSFeedItem {
  id: string;
  name: string;
  prompt: string;
  emoji?: string;
  description?: string;
  group: string[];
}

type RSSFeed = RSSFeedItem[];

// 缓存数据结构
interface CacheEntry {
  data: RSSFeed;
  timestamp: number;
  expiresAt: number;
}

// 全局缓存对象
const rssCache = new Map<string, CacheEntry>();

// 缓存配置：1小时
const CACHE_TTL = 60 * 60 * 1000;

// 获取缓存
function getCache(userId: string): RSSFeed | null {
  const key = `rss_feed_${userId}`;
  const entry = rssCache.get(key);

  if (!entry) return null;

  if (Date.now() > entry.expiresAt) {
    rssCache.delete(key);
    return null;
  }

  return entry.data;
}

// 设置缓存
function setCache(userId: string, data: RSSFeed): void {
  const key = `rss_feed_${userId}`;
  const now = Date.now();

  rssCache.set(key, {
    data,
    timestamp: now,
    expiresAt: now + CACHE_TTL,
  });
}

// 清除缓存
function invalidateCache(userId: string): void {
  const key = `rss_feed_${userId}`;
  rssCache.delete(key);
}

// GET 端点：返回 RSS Feed
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    // 验证 userId 参数
    if (!userId) {
      return NextResponse.json({ error: '缺少 userId 参数' }, { status: 400 });
    }

    // 检查缓存
    const cachedData = getCache(userId);
    if (cachedData) {
      return NextResponse.json(cachedData);
    }

    // 从数据库查询用户的提示词
    const collection = await getCollection<Prompt>('prompts');
    const prompts = await collection
      .find({ userId })
      .sort({ updatedAt: -1 })
      .toArray();

    // 如果没有找到数据
    if (!prompts || prompts.length === 0) {
      return NextResponse.json({ error: '未找到数据' }, { status: 404 });
    }

    // 生成 RSS feed 格式的数据
    const rssFeed: RSSFeed = prompts.map((p) => ({
      id: p._id.toString(),
      name: p.name,
      prompt: p.prompt,
      emoji: p.emoji,
      description: p.description,
      group: p.groups, // 将 groups 映射为 group
    }));

    // 存储到缓存
    setCache(userId, rssFeed);

    return NextResponse.json(rssFeed);
  } catch (error) {
    console.error('获取 RSS feed 失败:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

// POST 端点：清除缓存
export async function POST(request: NextRequest) {
  try {
    // 验证用户身份
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const invalidate = searchParams.get('invalidate');

    // 验证 invalidate 参数
    if (invalidate !== 'true') {
      return NextResponse.json({ error: '缺少 invalidate 参数' }, { status: 400 });
    }

    // 清除当前用户的缓存
    invalidateCache(session.user.id);

    return NextResponse.json({ success: true, message: '缓存已清除' });
  } catch (error) {
    console.error('清除缓存失败:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
