import { NextRequest } from 'next/server';
import { getCollection } from '@/lib/db';
import { hash } from 'bcryptjs';
import { validateBody, ApiError, createSuccessResponse, createErrorResponse, withRateLimit } from '@/lib/api-utils';
import { z } from 'zod';

const registerSchema = z.object({
  email: z.string().email('无效的邮箱格式'),
  password: z.string().min(8, '密码至少 8 个字符'),
  name: z.string().optional(),
});

// 限流：每个 IP 每 10 分钟最多 5 次注册请求
export const POST = withRateLimit(async (request: NextRequest) => {
  try {
    // 验证请求体
    const { email, password, name } = await validateBody(request, registerSchema);

    const users = await getCollection<any>('users');
    
    // 检查邮箱是否已注册
    const existing = await users.findOne({ email });
    if (existing) {
      throw new ApiError(409, '该邮箱已被注册', 'EMAIL_ALREADY_EXISTS');
    }

    // 加密密码
    const passwordHash = await hash(password, 10);
    
    // 创建用户
    await users.insertOne({ 
      email, 
      password: passwordHash, 
      name, 
      image: null, 
      emailVerified: null 
    });

    return createSuccessResponse({ 
      success: true, 
      message: '注册成功' 
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return createErrorResponse(error);
    }
    console.error('注册失败:', error);
    return createErrorResponse('注册失败', 500);
  }
}, {
  windowMs: 10 * 60 * 1000, // 10 分钟
  max: 5,                    // 最多 5 次
  keyType: 'ip',             // 按 IP 限流
  identifier: 'register',
  message: '注册请求过于频繁，请稍后再试'
});
