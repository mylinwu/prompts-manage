import { getAuthSession } from '@/lib/auth';
import { getCollection } from '@/lib/db';
import { Prompt } from '@/types/prompt';
import { ObjectId } from 'mongodb';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const { id } = await params;
    const collection = await getCollection<Prompt>('prompts');
    const prompt = await collection.findOne({
      _id: new ObjectId(id),
      userId: session.user.id,
    });

    if (!prompt) {
      return NextResponse.json({ error: '提示词不存在' }, { status: 404 });
    }

    return NextResponse.json({
      id: prompt._id.toString(),
      userId: prompt.userId,
      name: prompt.name,
      prompt: prompt.prompt,
      emoji: prompt.emoji,
      description: prompt.description,
      groups: prompt.groups,
      isPublished: prompt.isPublished,
      createdAt: prompt.createdAt.toISOString(),
      updatedAt: prompt.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error('获取提示词失败:', error);
    return NextResponse.json({ error: '获取提示词失败' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, prompt, emoji, description, groups } = body;

    const collection = await getCollection<Prompt>('prompts');
    
    const existing = await collection.findOne({
      _id: new ObjectId(id),
      userId: session.user.id,
    });

    if (!existing) {
      return NextResponse.json({ error: '提示词不存在' }, { status: 404 });
    }

    const updateData: Partial<Prompt> & { updatedAt: Date } = {
      updatedAt: new Date(),
    };

    if (name !== undefined) updateData.name = name;
    if (prompt !== undefined) updateData.prompt = prompt;
    if (emoji !== undefined) updateData.emoji = emoji;
    if (description !== undefined) updateData.description = description;
    if (groups !== undefined) updateData.groups = groups;

    await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    const updated = await collection.findOne({ _id: new ObjectId(id) });

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
    console.error('更新提示词失败:', error);
    return NextResponse.json({ error: '更新提示词失败' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const { id } = await params;
    const collection = await getCollection<Prompt>('prompts');
    const result = await collection.deleteOne({
      _id: new ObjectId(id),
      userId: session.user.id,
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: '提示词不存在' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('删除提示词失败:', error);
    return NextResponse.json({ error: '删除提示词失败' }, { status: 500 });
  }
}

