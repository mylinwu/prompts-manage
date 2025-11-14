import { getCollection } from '@/lib/db';
import { Prompt, PromptVersion } from '@/types/prompt';
import { NextRequest } from 'next/server';
import { withAuth, validateObjectId, ensureOwnership, getRouteParams, serializeDocument, ApiError, AuthContext } from '@/lib/api-utils';

// 强制动态渲染，因为使用了认证相关的 headers
export const dynamic = 'force-dynamic';

export const POST = withAuth(
  async (
    request: NextRequest,
    context: AuthContext & { params?: Promise<{ id: string; versionId: string }> }
  ) => {
    const { id, versionId } = await getRouteParams(context);
    const promptId = validateObjectId(id, '提示词ID');
    const versionObjectId = validateObjectId(versionId, '版本ID');

    // 验证提示词所有权
    const promptsCollection = await getCollection<Prompt>('prompts');
    const prompt = await promptsCollection.findOne({ _id: promptId });

    if (!prompt) {
      throw new ApiError(404, '提示词不存在', 'PROMPT_NOT_FOUND');
    }

    ensureOwnership(prompt.userId, context.userId, '提示词');

    // 获取版本数据
    const versionsCollection = await getCollection<PromptVersion>('prompt_versions');
    const version = await versionsCollection.findOne({
      _id: versionObjectId,
      promptId: id,
    });

    if (!version) {
      throw new ApiError(404, '版本不存在', 'VERSION_NOT_FOUND');
    }

    // 恢复提示词内容
    await promptsCollection.updateOne(
      { _id: promptId },
      {
        $set: {
          name: version.name,
          prompt: version.prompt,
          updatedAt: new Date(),
        },
      }
    );

    const updated = await promptsCollection.findOne({ _id: promptId });
    if (!updated) {
      throw new ApiError(500, '恢复失败', 'RESTORE_FAILED');
    }

    return {
      ...serializeDocument(updated),
      message: `已恢复到版本 ${version.version}`,
    };
  }
);

