import { NextRequest } from 'next/server';
import { getCollection } from '@/lib/db';
import { Prompt } from '@/types/prompt';
import { withAuth, AuthContext } from '@/lib/api-utils';

// 强制动态渲染，因为使用了认证相关的 headers
export const dynamic = 'force-dynamic';

export const GET = withAuth(async (request: NextRequest, context: AuthContext) => {
  const { userId } = context;
  const collection = await getCollection<Prompt>('prompts');
  const prompts = await collection.find({ userId }).toArray();

  // 统计分组数量
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

  return { groups, groupCounts, total };
});

