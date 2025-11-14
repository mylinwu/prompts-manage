import { getCollection } from '@/lib/db';
import { AgentFormat, Prompt } from '@/types/prompt';
import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/api-utils';
import { ObjectId } from 'mongodb';

export const GET = withAuth(async (request: NextRequest, { userId }) => {
  const searchParams = request.nextUrl.searchParams;
  const ids = searchParams.get('ids')?.split(',').filter(Boolean);

  const collection = await getCollection<Prompt>('prompts');
  const query: Record<string, unknown> = { userId };

  // 如果指定了 ID 列表，只导出这些 ID
  if (ids && ids.length > 0) {
    query._id = { $in: ids.map((id) => new ObjectId(id)) };
  }

  const prompts = await collection.find(query).toArray();

  // 转换为 Agent 格式
  const agents: AgentFormat[] = prompts.map((p) => ({
    id: p._id.toString(),
    name: p.name,
    prompt: p.prompt,
    emoji: p.emoji,
    description: p.description,
    group: p.groups,
  }));

  return agents;
});

