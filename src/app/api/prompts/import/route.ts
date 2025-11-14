import { getCollection } from '@/lib/db';
import { AgentFormat, Prompt } from '@/types/prompt';
import { NextRequest } from 'next/server';
import { withAuth, validateBody, withRateLimit } from '@/lib/api-utils';
import { z } from 'zod';

const importSchema = z.object({
  agents: z.array(
    z.object({
      id: z.string().optional(), // id 是可选的，导入时可能没有
      name: z.string(),
      prompt: z.string(),
      emoji: z.string().optional(),
      description: z.string().optional(),
      group: z.array(z.string()).optional(),
    })
  ).min(1, '导入数据不能为空'),
});

// 限流：每个用户每小时最多 10 次导入请求
export const POST = withAuth(withRateLimit(async (request: NextRequest, { userId }) => {
  // 验证请求体
  const { agents } = await validateBody(request, importSchema);

  const collection = await getCollection<Prompt>('prompts');
  const now = new Date();

  // 转换为 Prompt 格式
  const newPrompts: Omit<Prompt, '_id'>[] = agents.map((agent) => ({
    userId,
    name: agent.name,
    prompt: agent.prompt,
    emoji: agent.emoji || '',
    description: agent.description || '',
    groups: agent.group || [],
    isPublished: false,
    createdAt: now,
    updatedAt: now,
  }));

  // 批量插入
  const result = await collection.insertMany(newPrompts as Prompt[]);

  return {
    success: true,
    count: result.insertedCount,
    message: `成功导入 ${result.insertedCount} 个提示词`,
  };
}, {
  windowMs: 60 * 60 * 1000, // 1 小时
  max: 10,                   // 最多 10 次
  keyType: 'user',           // 按用户限流
  identifier: 'import-prompts',
  message: '导入请求过于频繁，请稍后再试'
}));

