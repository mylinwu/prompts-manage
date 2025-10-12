import { getAuthSession } from '@/lib/auth';
import { getCollection } from '@/lib/db';
import { Prompt, PromptVersion } from '@/types/prompt';
import { ObjectId } from 'mongodb';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    // 验证提示词所有权
    const promptsCollection = await getCollection<Prompt>('prompts');
    const prompt = await promptsCollection.findOne({
      _id: new ObjectId(params.id),
      userId: session.user.id,
    });

    if (!prompt) {
      return NextResponse.json({ error: '提示词不存在' }, { status: 404 });
    }

    const versionsCollection = await getCollection<PromptVersion>('prompt_versions');
    const versions = await versionsCollection
      .find({ promptId: params.id })
      .sort({ version: -1 })
      .toArray();

    const data = versions.map((v) => ({
      id: v._id.toString(),
      promptId: v.promptId,
      version: v.version,
      name: v.name,
      prompt: v.prompt,
      description: v.description,
      createdAt: v.createdAt.toISOString(),
      createdBy: v.createdBy,
    }));

    return NextResponse.json({ versions: data });
  } catch (error) {
    console.error('获取版本历史失败:', error);
    return NextResponse.json({ error: '获取版本历史失败' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const body = await request.json();
    const { description } = body;

    // 验证提示词所有权
    const promptsCollection = await getCollection<Prompt>('prompts');
    const prompt = await promptsCollection.findOne({
      _id: new ObjectId(params.id),
      userId: session.user.id,
    });

    if (!prompt) {
      return NextResponse.json({ error: '提示词不存在' }, { status: 404 });
    }

    // 获取当前最大版本号
    const versionsCollection = await getCollection<PromptVersion>('prompt_versions');
    const lastVersion = await versionsCollection
      .find({ promptId: params.id })
      .sort({ version: -1 })
      .limit(1)
      .toArray();

    const newVersion = lastVersion.length > 0 ? lastVersion[0].version + 1 : 1;

    const versionData: Omit<PromptVersion, '_id'> = {
      promptId: params.id,
      version: newVersion,
      name: prompt.name,
      prompt: prompt.prompt,
      description: description || `版本 ${newVersion}`,
      createdAt: new Date(),
      createdBy: session.user.id,
    };

    const result = await versionsCollection.insertOne(versionData as PromptVersion);

    return NextResponse.json({
      id: result.insertedId.toString(),
      ...versionData,
      createdAt: versionData.createdAt.toISOString(),
    });
  } catch (error) {
    console.error('创建版本快照失败:', error);
    return NextResponse.json({ error: '创建版本快照失败' }, { status: 500 });
  }
}

