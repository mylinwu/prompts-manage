import { getCollection } from '@/lib/db';
import { Prompt, PromptVersion } from '@/types/prompt';
import { NextRequest } from 'next/server';
import { withAuth, getPaginationParams, serializeDocuments, validateBody, ApiError, AuthContext } from '@/lib/api-utils';
import { z } from 'zod';

// 强制动态渲染，因为使用了认证相关的 headers
export const dynamic = 'force-dynamic';

const createPromptSchema = z.object({
  name: z.string().min(1, '名称不能为空'),
  prompt: z.string().min(1, '提示词内容不能为空'),
  emoji: z.string().default(''),
  description: z.string().default(''),
  groups: z.array(z.string()).default([]),
});

export const GET = withAuth(async (request: NextRequest, context: AuthContext) => {
  const { userId } = context;
  const searchParams = request.nextUrl.searchParams;
  const group = searchParams.get('group');
  const { page, pageSize, skip, limit } = getPaginationParams(request, 30, 30);

  const collection = await getCollection<Prompt>('prompts');
  const query: Record<string, unknown> = { userId };

  if (group && group !== '全部') {
    query.groups = group;
  }

  const total = await collection.countDocuments(query);
  const prompts = await collection
    .find(query)
    .sort({ updatedAt: -1 })
    .skip(skip)
    .limit(limit)
    .toArray();

  return {
    prompts: serializeDocuments(prompts),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
});

export const POST = withAuth(async (request: NextRequest, context: AuthContext) => {
  const { userId } = context;
  // 验证请求体
  const { name, prompt, emoji, description, groups } = await validateBody(
    request,
    createPromptSchema
  );

  const collection = await getCollection<Prompt>('prompts');
  const now = new Date();

  const newPrompt: Omit<Prompt, '_id'> = {
    userId,
    name,
    prompt,
    emoji,
    description,
    groups,
    isPublished: false,
    createdAt: now,
    updatedAt: now,
  };

  const result = await collection.insertOne(newPrompt as Prompt);
  const promptId = result.insertedId.toString();

  // 自动创建初始版本
  const versionsCollection = await getCollection<PromptVersion>('prompt_versions');
  const initialVersion: Omit<PromptVersion, '_id'> = {
    promptId,
    version: 1,
    name,
    prompt,
    description: '初始版本',
    createdAt: now,
    createdBy: userId,
  };
  await versionsCollection.insertOne(initialVersion as PromptVersion);

  return {
    id: promptId,
    ...newPrompt,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
});

