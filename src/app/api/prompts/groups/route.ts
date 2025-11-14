import { NextRequest } from 'next/server';
import { getCollection } from '@/lib/db';
import { Prompt } from '@/types/prompt';
import { withAuth } from '@/lib/api-utils';

export const GET = withAuth(async (request: NextRequest, { userId }) => {
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

