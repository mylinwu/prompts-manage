import { NextRequest } from 'next/server';
import { getCollection } from '@/lib/db';
import { compare, hash } from 'bcryptjs';
import { withAuth, validateBody, validateObjectId, ApiError, withRateLimit } from '@/lib/api-utils';
import { z } from 'zod';

const changePasswordSchema = z.object({
  oldPassword: z.string().min(8, '密码至少 8 个字符'),
  newPassword: z.string().min(8, '密码至少 8 个字符'),
});

// 限流：每个用户每小时最多 10 次修改密码请求
export const POST = withAuth(withRateLimit(async (request: NextRequest, { userId }) => {
  // 验证请求体
  const { oldPassword, newPassword } = await validateBody(request, changePasswordSchema);

  // 查询用户
  const users = await getCollection<any>('users');
  const user = await users.findOne({ _id: validateObjectId(userId) });

  if (!user || !user.password) {
    throw new ApiError(404, '用户不存在', 'USER_NOT_FOUND');
  }

  // 验证旧密码
  const isPasswordValid = await compare(oldPassword, user.password);
  if (!isPasswordValid) {
    throw new ApiError(400, '旧密码不正确', 'INVALID_OLD_PASSWORD');
  }

  // 更新密码
  const newHash = await hash(newPassword, 10);
  await users.updateOne({ _id: user._id }, { $set: { password: newHash } });

  return { success: true, message: '密码修改成功' };
}, {
  windowMs: 60 * 60 * 1000, // 1 小时
  max: 10,                   // 最多 10 次
  keyType: 'user',           // 按用户限流
  identifier: 'change-password',
  message: '修改密码请求过于频繁，请稍后再试'
}));
