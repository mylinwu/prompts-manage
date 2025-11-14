import { getCollection } from '@/lib/db';
import { Prompt } from '@/types/prompt';
import { NextRequest } from 'next/server';
import {
  withAuth,
  validateObjectId,
  ensureOwnership,
  getRouteParams,
  serializeDocument,
  validateBody,
  ApiError,
  AuthContext,
} from '@/lib/api-utils';
import { z } from 'zod';

// 强制动态渲染，因为使用了认证相关的 headers
export const dynamic = 'force-dynamic';

const updatePromptSchema = z.object({
  name: z.string().optional(),
  prompt: z.string().optional(),
  emoji: z.string().optional(),
  description: z.string().optional(),
  groups: z.array(z.string()).optional(),
});

export const GET = withAuth(
  async (request: NextRequest, context: AuthContext & { params?: Promise<{ id: string }> }) => {
    const { id } = await getRouteParams(context);
    const objectId = validateObjectId(id, '提示词ID');

    const collection = await getCollection<Prompt>('prompts');
    const prompt = await collection.findOne({ _id: objectId });

    if (!prompt) {
      throw new ApiError(404, '提示词不存在', 'PROMPT_NOT_FOUND');
    }

    // 验证权限
    ensureOwnership(prompt.userId, context.userId, '提示词');

    return serializeDocument(prompt);
  }
);

export const PATCH = withAuth(
  async (request: NextRequest, context: AuthContext & { params?: Promise<{ id: string }> }) => {
    const { id } = await getRouteParams(context);
    const objectId = validateObjectId(id, '提示词ID');

    // 验证请求体
    const updateData = await validateBody(request, updatePromptSchema);

    const collection = await getCollection<Prompt>('prompts');
    const existing = await collection.findOne({ _id: objectId });

    if (!existing) {
      throw new ApiError(404, '提示词不存在', 'PROMPT_NOT_FOUND');
    }

    // 验证权限
    ensureOwnership(existing.userId, context.userId, '提示词');

    // 更新数据
    await collection.updateOne(
      { _id: objectId },
      { $set: { ...updateData, updatedAt: new Date() } }
    );

    const updated = await collection.findOne({ _id: objectId });
    if (!updated) {
      throw new ApiError(500, '更新失败', 'UPDATE_FAILED');
    }

    return serializeDocument(updated);
  }
);

export const DELETE = withAuth(
  async (request: NextRequest, context: AuthContext & { params?: Promise<{ id: string }> }) => {
    const { id } = await getRouteParams(context);
    const objectId = validateObjectId(id, '提示词ID');

    const collection = await getCollection<Prompt>('prompts');
    const existing = await collection.findOne({ _id: objectId });

    if (!existing) {
      throw new ApiError(404, '提示词不存在', 'PROMPT_NOT_FOUND');
    }

    // 验证权限
    ensureOwnership(existing.userId, context.userId, '提示词');

    const result = await collection.deleteOne({ _id: objectId });

    if (result.deletedCount === 0) {
      throw new ApiError(500, '删除失败', 'DELETE_FAILED');
    }

    return { success: true, message: '删除成功' };
  }
);

