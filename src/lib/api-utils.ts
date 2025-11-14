import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from './auth';
import { z, ZodSchema } from 'zod';
import { ObjectId } from 'mongodb';

/**
 * API 错误类型
 */
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * 标准化的 API 响应格式
 */
export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  code?: string;
  message?: string;
}

/**
 * 分页响应格式
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * 认证上下文
 */
export interface AuthContext {
  userId: string;
  user: {
    id: string;
    email?: string | null;
    name?: string | null;
    image?: string | null;
  };
}

/**
 * API 处理器类型
 */
export type ApiHandler<T = unknown, TContext = Record<string, unknown>> = (
  request: NextRequest,
  context: AuthContext & TContext
) => Promise<T>;

/**
 * 创建成功响应
 */
export function createSuccessResponse<T>(
  data: T,
  status = 200
): NextResponse<ApiResponse<T>> {
  return NextResponse.json({ data }, { status });
}

/**
 * 创建错误响应
 */
export function createErrorResponse(
  error: string | ApiError,
  status?: number
): NextResponse<ApiResponse> {
  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
      },
      { status: error.statusCode }
    );
  }

  return NextResponse.json(
    { error: typeof error === 'string' ? error : '服务器错误' },
    { status: status || 500 }
  );
}

/**
 * 创建分页响应
 */
export function createPaginatedResponse<T>(
  items: T[],
  total: number,
  page: number,
  pageSize: number
): NextResponse<ApiResponse<PaginatedResponse<T>>> {
  return createSuccessResponse({
    items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  });
}

/**
 * 认证中间件 - 要求用户必须登录
 */
export function withAuth<T = any>(
  handler: (
    request: NextRequest,
    context: AuthContext & { params?: Promise<any> }
  ) => Promise<T>
) {
  return async (
    request: NextRequest,
    context?: { params?: Promise<any> }
  ): Promise<NextResponse> => {
    try {
      const session = await getAuthSession();

      if (!session?.user?.id) {
        return createErrorResponse(
          new ApiError(401, '未授权，请先登录', 'UNAUTHORIZED')
        );
      }

      const authContext: AuthContext = {
        userId: session.user.id,
        user: session.user,
      };

      const result = await handler(request, {
        ...authContext,
        params: context?.params,
      });

      return createSuccessResponse(result);
    } catch (error) {
      console.error('API 错误:', error);

      if (error instanceof ApiError) {
        return createErrorResponse(error);
      }

      return createErrorResponse(
        error instanceof Error ? error.message : '服务器内部错误',
        500
      );
    }
  };
}

/**
 * 可选认证中间件 - 用户可以未登录访问
 */
export function withOptionalAuth<T = any>(
  handler: (
    request: NextRequest,
    context: Partial<AuthContext> & { params?: Promise<any> }
  ) => Promise<T>
) {
  return async (
    request: NextRequest,
    context?: { params?: Promise<any> }
  ): Promise<NextResponse> => {
    try {
      const session = await getAuthSession();

      const authContext: Partial<AuthContext> = session?.user?.id
        ? {
            userId: session.user.id,
            user: session.user,
          }
        : {};

      const result = await handler(request, {
        ...authContext,
        params: context?.params,
      });

      return createSuccessResponse(result);
    } catch (error) {
      console.error('API 错误:', error);

      if (error instanceof ApiError) {
        return createErrorResponse(error);
      }

      return createErrorResponse(
        error instanceof Error ? error.message : '服务器内部错误',
        500
      );
    }
  };
}

/**
 * 验证请求体
 */
export async function validateBody<T extends ZodSchema>(
  request: NextRequest,
  schema: T
): Promise<z.infer<T>> {
  try {
    const body = await request.json();
    const result = schema.safeParse(body);

    if (!result.success) {
      throw new ApiError(
        400,
        result.error.errors.map((e) => e.message).join(', '),
        'VALIDATION_ERROR'
      );
    }

    return result.data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(400, '请求体格式错误', 'INVALID_JSON');
  }
}

/**
 * 获取查询参数
 */
export function getQueryParams(request: NextRequest) {
  return request.nextUrl.searchParams;
}

/**
 * 获取分页参数
 */
export function getPaginationParams(
  request: NextRequest,
  defaultPageSize = 20,
  maxPageSize = 100
) {
  const searchParams = getQueryParams(request);
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const pageSize = Math.min(
    maxPageSize,
    Math.max(1, parseInt(searchParams.get('pageSize') || String(defaultPageSize), 10))
  );

  return {
    page,
    pageSize,
    skip: (page - 1) * pageSize,
    limit: pageSize,
  };
}

/**
 * 验证 ObjectId
 */
export function validateObjectId(id: string, fieldName = 'ID'): ObjectId {
  if (!ObjectId.isValid(id)) {
    throw new ApiError(400, `无效的 ${fieldName}`, 'INVALID_ID');
  }
  return new ObjectId(id);
}

/**
 * 确保资源属于当前用户
 */
export function ensureOwnership(
  resourceUserId: string,
  currentUserId: string,
  resourceName = '资源'
) {
  if (resourceUserId !== currentUserId) {
    throw new ApiError(403, `无权访问该${resourceName}`, 'FORBIDDEN');
  }
}

/**
 * 处理动态路由参数
 */
export async function getRouteParams<T extends Record<string, string>>(
  context: { params: Promise<T> }
): Promise<T>;
export async function getRouteParams<T extends Record<string, string>>(
  context: { params?: Promise<T> }
): Promise<T>;

export async function getRouteParams<T extends Record<string, string>>(
  context: { params?: Promise<T> }
): Promise<T> {
  if (!context.params) {
    throw new Error('路由参数缺失');
  }
  return await context.params;
}

/**
 * 序列化 MongoDB 文档为 JSON
 */
export function serializeDocument<T extends { _id: ObjectId; createdAt?: Date; updatedAt?: Date }>(
  doc: T
): Omit<T, '_id' | 'createdAt' | 'updatedAt'> & {
  id: string;
  createdAt?: string;
  updatedAt?: string;
} {
  const { _id, createdAt, updatedAt, ...rest } = doc;
  return {
    ...rest,
    id: _id.toString(),
    ...(createdAt && { createdAt: createdAt.toISOString() }),
    ...(updatedAt && { updatedAt: updatedAt.toISOString() }),
  };
}

/**
 * 批量序列化文档
 */
export function serializeDocuments<T extends { _id: ObjectId; createdAt?: Date; updatedAt?: Date }>(
  docs: T[]
): Array<
  Omit<T, '_id' | 'createdAt' | 'updatedAt'> & {
    id: string;
    createdAt?: string;
    updatedAt?: string;
  }
> {
  return docs.map(serializeDocument);
}

/**
 * 限流配置
 */
export interface RateLimitConfig {
  windowMs: number;      // 时间窗口（毫秒）
  max: number;           // 窗口内最大请求数
  keyType?: 'user' | 'ip'; // 限流维度：用户或 IP
  identifier?: string;   // 可选标识符，用于区分不同的 API
  message?: string;      // 自定义错误消息
}

/**
 * 限流记录
 */
interface RateLimitEntry {
  count: number;
  resetAt: number;
}

/**
 * 内存存储的限流数据
 * 注意：这是单实例实现，多实例部署需要使用 Redis 等分布式存储
 */
const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * 定期清理过期的限流记录（每 5 分钟）
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetAt) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * 获取限流键
 */
function getRateLimitKey(
  request: NextRequest,
  userId: string | undefined,
  config: RateLimitConfig
): string {
  const keyType = config.keyType || 'user';
  
  let baseKey: string;
  if (keyType === 'user' && userId) {
    baseKey = `user:${userId}`;
  } else {
    // 获取 IP 地址
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : 
               request.headers.get('x-real-ip') || 
               'unknown';
    baseKey = `ip:${ip}`;
  }

  const identifier = config.identifier || request.nextUrl.pathname;
  return `rate:${identifier}:${baseKey}`;
}

/**
 * 检查限流
 */
function checkRateLimit(
  key: string,
  windowMs: number,
  max: number
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  // 如果没有记录或已过期，创建新记录
  if (!entry || now > entry.resetAt) {
    const resetAt = now + windowMs;
    rateLimitStore.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: max - 1, resetAt };
  }

  // 检查是否超限
  if (entry.count >= max) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  // 增加计数
  entry.count += 1;
  return { allowed: true, remaining: max - entry.count, resetAt: entry.resetAt };
}

/**
 * 限流中间件
 * 
 * @example
 * // 按用户限流
 * export const POST = withAuth(
 *   withRateLimit(
 *     async (request, { userId }) => { ... },
 *     { windowMs: 60000, max: 10, keyType: 'user' }
 *   )
 * );
 * 
 * // 按 IP 限流（公开接口）
 * export const GET = withRateLimit(
 *   async (request) => { ... },
 *   { windowMs: 60000, max: 60, keyType: 'ip' }
 * );
 */
export function withRateLimit<T = any>(
  handler: (request: NextRequest, context: T) => Promise<unknown>,
  config: RateLimitConfig
) {
  return async (request: NextRequest, context: T) => {
    try {
      // 获取 userId（如果有）
      const userId = context && typeof context === 'object' && 'userId' in context 
        ? (context as { userId?: string }).userId 
        : undefined;

      // 生成限流键
      const key = getRateLimitKey(request, userId, config);

      // 检查限流
      const { allowed, remaining, resetAt } = checkRateLimit(
        key,
        config.windowMs,
        config.max
      );

      // 如果超限，抛出错误
      if (!allowed) {
        const resetDate = new Date(resetAt);
        const message = config.message || 
          `请求过于频繁，请在 ${resetDate.toLocaleTimeString('zh-CN')} 后重试`;
        
        throw new ApiError(429, message, 'RATE_LIMIT_EXCEEDED');
      }

      // 执行原处理函数
      const result = await handler(request, context);

      // 如果返回的是 NextResponse，添加限流响应头
      if (result instanceof NextResponse) {
        result.headers.set('X-RateLimit-Limit', config.max.toString());
        result.headers.set('X-RateLimit-Remaining', remaining.toString());
        result.headers.set('X-RateLimit-Reset', Math.floor(resetAt / 1000).toString());
        return result;
      }

      // 如果是普通对象，包装成响应并添加响应头
      const response = createSuccessResponse(result);
      response.headers.set('X-RateLimit-Limit', config.max.toString());
      response.headers.set('X-RateLimit-Remaining', remaining.toString());
      response.headers.set('X-RateLimit-Reset', Math.floor(resetAt / 1000).toString());
      
      return response;
    } catch (error) {
      if (error instanceof ApiError) {
        return createErrorResponse(error);
      }
      console.error('Rate limit error:', error);
      return createErrorResponse('服务器错误', 500);
    }
  };
}
