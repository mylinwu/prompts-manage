import { getCollection } from '@/lib/db';
import { Prompt, PromptVersion } from '@/types/prompt';
import { NextRequest } from 'next/server';
import { withAuth, validateObjectId, ensureOwnership, getRouteParams, serializeDocuments, validateBody, ApiError, withRateLimit, AuthContext } from '@/lib/api-utils';
import { z } from 'zod';

// 强制动态渲染，因为使用了认证相关的 headers
export const dynamic = 'force-dynamic';

const createVersionSchema = z.object({
  description: z.string().default(''),
});

export const GET = withAuth(
  async (request: NextRequest, context: AuthContext & { params?: Promise<{ id: string }> }) => {
    const { id } = await getRouteParams(context);
    const objectId = validateObjectId(id, '提示词ID');

    // 验证提示词所有权
    const promptsCollection = await getCollection<Prompt>('prompts');
    const prompt = await promptsCollection.findOne({ _id: objectId });

    if (!prompt) {
      throw new ApiError(404, '提示词不存在', 'PROMPT_NOT_FOUND');
    }

    ensureOwnership(prompt.userId, context.userId, '提示词');

    // 获取版本列表
    const versionsCollection = await getCollection<PromptVersion>('prompt_versions');
    const versions = await versionsCollection
      .find({ promptId: id })
      .sort({ version: -1 })
      .toArray();

    return { versions: serializeDocuments(versions) };
  }
);

// 限流：每个用户每小时最多 60 次创建版本请求
export const POST = withAuth(withRateLimit(
  async (request: NextRequest, context: AuthContext & { params?: Promise<{ id: string }> }) => {
    const { id } = await getRouteParams(context);
    const objectId = validateObjectId(id, '提示词ID');
    const { description } = await validateBody(request, createVersionSchema);

    // 验证提示词所有权
    const promptsCollection = await getCollection<Prompt>('prompts');
    const prompt = await promptsCollection.findOne({ _id: objectId });

    if (!prompt) {
      throw new ApiError(404, '提示词不存在', 'PROMPT_NOT_FOUND');
    }

    ensureOwnership(prompt.userId, context.userId, '提示词');

    // 获取当前最大版本号
    const versionsCollection = await getCollection<PromptVersion>('prompt_versions');
    const lastVersion = await versionsCollection
      .find({ promptId: id })
      .sort({ version: -1 })
      .limit(1)
      .toArray();

    const newVersion = lastVersion.length > 0 ? lastVersion[0].version + 1 : 1;

    const versionData: Omit<PromptVersion, '_id'> = {
      promptId: id,
      version: newVersion,
      name: prompt.name,
      prompt: prompt.prompt,
      description: description || `版本 ${newVersion}`,
      createdAt: new Date(),
      createdBy: context.userId,
    };

    const result = await versionsCollection.insertOne(versionData as PromptVersion);

    return {
      id: result.insertedId.toString(),
      ...versionData,
      createdAt: versionData.createdAt.toISOString(),
      message: `版本 ${newVersion} 创建成功`,
    };
  }, {
    windowMs: 60 * 60 * 1000, // 1 小时
    max: 60,                   // 最多 60 次
    keyType: 'user',           // 按用户限流
    identifier: 'create-version',
    message: '创建版本请求过于频繁，请稍后再试'
  }
));

