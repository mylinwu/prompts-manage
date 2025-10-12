import { getCollection } from '@/lib/db';
import { MarketPrompt } from '@/types/prompt';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const collection = await getCollection<MarketPrompt>('market_prompts');
    const prompts = await collection.find({}).toArray();

    // 提取所有唯一的分组
    const groupsSet = new Set<string>();
    prompts.forEach((prompt) => {
      prompt.groups.forEach((group) => {
        if (group) groupsSet.add(group);
      });
    });

    const groups = Array.from(groupsSet).sort();

    return NextResponse.json({ groups });
  } catch (error) {
    console.error('获取市场分组失败:', error);
    return NextResponse.json({ error: '获取市场分组失败' }, { status: 500 });
  }
}

