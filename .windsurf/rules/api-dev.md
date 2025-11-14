---
trigger: model_decision
description: 开发 API 时候要优先阅读该规范
---

# API 开发指南

## 核心工具导入

```typescript
import {
  withAuth,           // 必须登录
  withOptionalAuth,   // 可选登录
  withRateLimit,      // 限流中间件
  ApiError,           // 错误处理
  validateBody,       // 请求体验证
  validateObjectId,   // ObjectId验证
  ensureOwnership,    // 所有权验证
  getPaginationParams,// 分页参数
  getRouteParams,     // 路由参数
  serializeDocument,  // 单个文档序列化
  serializeDocuments, // 多个文档序列化
} from '@/lib/api-utils';

import { getCollection } from '@/lib/db';
import { z } from 'zod';
```

## 认证中间件

```typescript
// 必须登录
export const GET = withAuth(async (request, { userId, user }) => {
  return { userId, email: user.email };
});

// 可选登录
export const GET = withOptionalAuth(async (request, { userId }) => {
  return { isLogin: !!userId };
});
```

## 数据验证（就近原则）

```typescript
// 在 route 文件顶部定义 schema
const createSchema = z.object({
  name: z.string().min(1, '名称不能为空'),
  email: z.string().email('邮箱格式错误'),
  description: z.string().default(''),
});

export const POST = withAuth(async (request, { userId }) => {
  const data = await validateBody(request, createSchema);
  return data;
});
```

## 限流功能

```typescript
// 按用户限流（需要配合 withAuth）
export const POST = withAuth(withRateLimit(
  async (request, { userId }) => {
    // 业务逻辑
  },
  {
    windowMs: 60 * 60 * 1000, // 1小时
    max: 10,                   // 最多10次
    keyType: 'user',           // 按用户
    identifier: 'api-name'     // API标识
  }
));

// 按IP限流（公开接口）
export const POST = withRateLimit(
  async (request) => {
    // 业务逻辑
  },
  {
    windowMs: 10 * 60 * 1000, // 10分钟
    max: 5,                    // 最多5次
    keyType: 'ip'              // 按IP
  }
);
```

## 常用限流策略

| 接口类型 | 时间窗口 | 最大次数 | 限流维度 |
|---------|---------|---------|---------|
| 注册 | 10分钟 | 5次 | IP |
| 修改密码 | 1小时 | 10次 | 用户 |
| 发布内容 | 24小时 | 30次 | 用户 |
| 收藏/点赞 | 1小时 | 60次 | 用户 |

## 错误处理

```typescript
// 抛出错误
throw new ApiError(404, '资源不存在', 'NOT_FOUND');
throw new ApiError(403, '无权访问', 'FORBIDDEN');
throw new ApiError(400, '参数错误', 'INVALID_PARAMS');
```

## 数据库操作

```typescript
// 查询单个
const collection = await getCollection('items');
const item = await collection.findOne({ _id: objectId });
if (!item) throw new ApiError(404, '资源不存在');
return serializeDocument(item);

// 查询列表
const items = await collection.find({ userId }).toArray();
return serializeDocuments(items);

// 创建
const result = await collection.insertOne(data);
return { id: result.insertedId.toString(), ...data };

// 更新
await collection.updateOne(
  { _id: objectId },
  { $set: { ...updateData, updatedAt: new Date() } }
);

// 删除
await collection.deleteOne({ _id: objectId });
```

## 分页

```typescript
export const GET = withAuth(async (request, { userId }) => {
  const { page, pageSize, skip, limit } = getPaginationParams(request, 20, 100);
  
  const [items, total] = await Promise.all([
    collection.find({ userId }).skip(skip).limit(limit).toArray(),
    collection.countDocuments({ userId }),
  ]);
  
  return {
    items: serializeDocuments(items),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
});
```

## 路由参数和权限

```typescript
export const GET = withAuth(
  async (request, context: { userId: string; params: Promise<{ id: string }> }) => {
    const { id } = await getRouteParams(context);
    const objectId = validateObjectId(id);
    
    const item = await collection.findOne({ _id: objectId });
    if (!item) throw new ApiError(404, '资源不存在');
    
    // 验证所有权
    ensureOwnership(item.userId, context.userId);
    
    return serializeDocument(item);
  }
);
```

## 完整 CRUD 示例

```typescript
// 列表 + 创建
export const GET = withAuth(withRateLimit(
  async (request, { userId }) => {
    const { page, pageSize, skip, limit } = getPaginationParams(request);
    const [items, total] = await Promise.all([
      collection.find({ userId }).skip(skip).limit(limit).toArray(),
      collection.countDocuments({ userId }),
    ]);
    return { items: serializeDocuments(items), total, page, pageSize };
  },
  { windowMs: 60000, max: 100, keyType: 'user' }
));

const createSchema = z.object({
  name: z.string().min(1),
  description: z.string().default(''),
});

export const POST = withAuth(withRateLimit(
  async (request, { userId }) => {
    const data = await validateBody(request, createSchema);
    const result = await collection.insertOne({ ...data, userId, createdAt: new Date() });
    return { id: result.insertedId.toString(), ...data };
  },
  { windowMs: 60000, max: 20, keyType: 'user' }
));

// 单个资源操作 [id]/route.ts
export const GET = withAuth(async (request, context) => {
  const { id } = await getRouteParams(context);
  const item = await collection.findOne({ _id: validateObjectId(id) });
  if (!item) throw new ApiError(404, '资源不存在');
  ensureOwnership(item.userId, context.userId);
  return serializeDocument(item);
});

export const PATCH = withAuth(async (request, context) => {
  const { id } = await getRouteParams(context);
  const updateData = await validateBody(request, updateSchema);
  const existing = await collection.findOne({ _id: validateObjectId(id) });
  if (!existing) throw new ApiError(404, '资源不存在');
  ensureOwnership(existing.userId, context.userId);
  await collection.updateOne({ _id: validateObjectId(id) }, { $set: updateData });
  return serializeDocument(await collection.findOne({ _id: validateObjectId(id) }));
});

export const DELETE = withAuth(async (request, context) => {
  const { id } = await getRouteParams(context);
  const existing = await collection.findOne({ _id: validateObjectId(id) });
  if (!existing) throw new ApiError(404, '资源不存在');
  ensureOwnership(existing.userId, context.userId);
  await collection.deleteOne({ _id: validateObjectId(id) });
  return { success: true };
});
```

## 响应格式

```json
// 成功
{ "data": { ... } }

// 错误
{ "error": "错误消息", "code": "ERROR_CODE" }

// 分页
{ "data": { "items": [...], "total": 100, "page": 1, "pageSize": 20 } }
```

## 核心原则

1. **就近原则**：验证规则定义在 route 文件顶部
2. **统一性**：使用统一的错误处理和响应格式
3. **安全性**：自动处理认证、权限验证和限流
4. **简洁性**：减少样板代码，专注业务逻辑

## 常见错误码

- `UNAUTHORIZED` - 401 未授权
- `FORBIDDEN` - 403 无权访问
- `NOT_FOUND` - 404 资源不存在
- `VALIDATION_ERROR` - 400 验证失败
- `RATE_LIMIT_EXCEEDED` - 429 限流

## 最佳实践速查

- ✅ 使用 `withAuth`/`withOptionalAuth`
- ✅ 使用 `validateBody` 验证输入
- ✅ 使用 `ApiError` 抛出错误
- ✅ 使用 `serializeDocument(s)` 序列化数据
- ✅ 对敏感操作添加 `withRateLimit`
- ✅ Schema 定义在 route 文件顶部
- ❌ 不要手动处理认证和响应
- ❌ 不要手动转换 ObjectId 和日期