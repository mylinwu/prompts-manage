import { getAuthSession } from '@/lib/auth';
import { getCollection } from '@/lib/db';
import { Prompt, PromptVersion } from '@/types/prompt';
import { ObjectId } from 'mongodb';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string }> }
) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const { id, versionId } = await params;
    // 验证提示词所有权
    const promptsCollection = await getCollection<Prompt>('prompts');
    const prompt = await promptsCollection.findOne({
      _id: new ObjectId(id),
      userId: session.user.id,
    });

    if (!prompt) {
      return NextResponse.json({ error: '提示词不存在' }, { status: 404 });
    }

    // 获取版本数据
    const versionsCollection = await getCollection<PromptVersion>('prompt_versions');
    const version = await versionsCollection.findOne({
      _id: new ObjectId(versionId),
      promptId: id,
    });

    if (!version) {
      return NextResponse.json({ error: '版本不存在' }, { status: 404 });
    }

    // 恢复提示词内容
    await promptsCollection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          name: version.name,
          prompt: version.prompt,
          updatedAt: new Date(),
        },
      }
    );

    const updated = await promptsCollection.findOne({ _id: new ObjectId(id) });

    return NextResponse.json({
      id: updated!._id.toString(),
      userId: updated!.userId,
      name: updated!.name,
      prompt: updated!.prompt,
      emoji: updated!.emoji,
      description: updated!.description,
      groups: updated!.groups,
      isPublished: updated!.isPublished,
      createdAt: updated!.createdAt.toISOString(),
      updatedAt: updated!.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error('恢复版本失败:', error);
    return NextResponse.json({ error: '恢复版本失败' }, { status: 500 });
  }
}

