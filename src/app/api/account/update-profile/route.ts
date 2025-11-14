import { NextRequest } from 'next/server';
import { getCollection } from '@/lib/db';
import { withAuth, validateBody, validateObjectId, ApiError } from '@/lib/api-utils';
import { z } from 'zod';

const updateProfileSchema = z.object({
  name: z.string().optional(),
  image: z.string().url().optional(),
});

export const POST = withAuth(async (request: NextRequest, { userId }) => {
  // 验证请求体
  const { name } = await validateBody(request, updateProfileSchema);

  // 查询用户
  const users = await getCollection<any>('users');
  const user = await users.findOne({ _id: validateObjectId(userId) });

  if (!user) {
    throw new ApiError(404, '用户不存在', 'USER_NOT_FOUND');
  }

  // 更新用户信息
  await users.updateOne({ _id: user._id }, { $set: { name } });

  return { success: true, name, message: '个人信息更新成功' };
});
