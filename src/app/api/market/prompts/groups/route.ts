import { getCollection } from '@/lib/db';
import { MarketPrompt } from '@/types/prompt';
import { NextRequest } from 'next/server';
import { createSuccessResponse, createErrorResponse } from '@/lib/api-utils';

export const revalidate = 600;

// 公开 API，不需要认证
export async function GET(request: NextRequest) {
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

    return createSuccessResponse({ groups, groupCounts, total });
  } catch (error) {
    console.error('获取市场分组失败:', error);
    return createErrorResponse('获取市场分组失败', 500);
  }
}

