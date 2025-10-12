import { getCollection } from '@/lib/db';
import { MarketPrompt } from '@/types/prompt';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const collection = await getCollection<MarketPrompt>('market_prompts');
    const prompts = await collection.find({}).toArray();

    // 提取所有唯一的分组并统计数量
    const groupCounts: Record<string, number> = {};
    prompts.forEach((prompt) => {
      prompt.groups.forEach((group) => {
        if (group) {
          groupCounts[group] = (groupCounts[group] || 0) + 1;
        }
      });
    });

    const groups = Object.keys(groupCounts).sort();
    const total = prompts.length;

    return NextResponse.json({ groups, groupCounts, total });
  } catch (error) {
    console.error('获取市场分组失败:', error);
    return NextResponse.json({ error: '获取市场分组失败' }, { status: 500 });
  }
}

