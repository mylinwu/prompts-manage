# API 开发指南

这是一份完整的 API 开发指南，适合 AI 阅读和使用。包含了所有开发规范、工具使用、示例代码和最佳实践。

## 目录

- [概述](#概述)
- [后端开发](#后端开发)
  - [核心工具](#核心工具)
  - [开发流程](#开发流程)
  - [完整示例](#完整示例)
  - [限流功能](#限流功能)
  - [常见模式](#常见模式)
  - [最佳实践](#最佳实践)
- [前端开发](#前端开发)
  - [API 客户端](#api-客户端)
  - [使用示例](#使用示例)
- [响应格式](#响应格式)
- [错误码](#错误码)

## 概述

项目提供了一套标准化的 API 开发工具库，包括：

- **认证中间件**：自动处理用户认证和权限验证
- **数据验证**：基于 Zod 的类型安全验证（就近原则）
- **错误处理**：统一的错误响应格式
- **数据序列化**：自动转换 MongoDB 文档为 JSON
- **分页工具**：标准化的分页参数处理
- **限流功能**：防止 API 滥用的限流中间件

## 核心工具

### 导入

```typescript
// 核心工具
import {
  withAuth,
  withOptionalAuth,
  ApiError,
  validateBody,
  validateObjectId,
  ensureOwnership,
  getPaginationParams,
  getRouteParams,
  serializeDocument,
  serializeDocuments,
  withRateLimit,
} from '@/lib/api-utils';

// 数据库
import { getCollection } from '@/lib/db';

// Zod
import { z } from 'zod';
```

### 认证中间件

#### `withAuth` - 必须登录

```typescript
export const GET = withAuth(async (request, { userId, user }) => {
  // userId: string - 用户 ID
  // user: { id, email, name, image } - 用户信息
  return { data: 'Protected data' };
});
```

#### `withOptionalAuth` - 可选登录

```typescript
export const GET = withOptionalAuth(async (request, { userId }) => {
  // userId: string | undefined - 可能为 undefined
  if (userId) {
    // 已登录用户的逻辑
  } else {
    // 未登录用户的逻辑
  }
  return { data: 'Public data' };
});
```

### 数据验证

#### 定义验证 Schema（就近原则）

在每个 route 文件顶部定义自己的验证规则：

```typescript
import { z } from 'zod';

// 在 route 文件顶部定义 schema
const createSchema = z.object({
  name: z.string().min(1, '名称不能为空'),
  email: z.string().email('无效的邮箱格式'),
  password: z.string().min(8, '密码至少 8 个字符'),
  description: z.string().default(''),
  groups: z.array(z.string()).default([]),
});

// 常用验证规则
z.string().min(1) // 非空字符串
z.string().email() // 邮箱验证
z.string().url() // URL 验证
z.number().int().positive() // 正整数
z.array(z.string()) // 字符串数组
z.boolean() // 布尔值
z.string().optional() // 可选字符串
z.string().default('') // 带默认值
```

#### `validateBody`

```typescript
export const POST = withAuth(async (request, { userId }) => {
  // 自动验证请求体，如果验证失败会抛出 400 错误
  const data = await validateBody(request, createSchema);
  
  // data 的类型是自动推导的
  console.log(data.name); // string
  console.log(data.emoji); // string (有默认值)
  
  return { success: true, data };
});
```

### 错误处理

#### `ApiError`

```typescript
// 抛出标准错误
throw new ApiError(404, '资源不存在', 'RESOURCE_NOT_FOUND');
throw new ApiError(400, '参数错误', 'INVALID_PARAMS');
throw new ApiError(403, '无权访问', 'FORBIDDEN');
throw new ApiError(500, '服务器错误', 'INTERNAL_ERROR');
```

### 数据序列化

#### `serializeDocument` / `serializeDocuments`

```typescript
// 单个文档
const prompt = await collection.findOne({ _id: objectId });
return serializeDocument(prompt);
// { id: "...", createdAt: "2024-01-01T00:00:00.000Z", ... }

// 多个文档
const prompts = await collection.find().toArray();
return serializeDocuments(prompts);
```

### 分页工具

#### `getPaginationParams`

```typescript
const { page, pageSize, skip, limit } = getPaginationParams(request, 20, 100);
// page: 当前页码
// pageSize: 每页大小
// skip: 跳过的数量
// limit: 限制的数量
```

### 其他工具函数

#### `validateObjectId`

```typescript
const objectId = validateObjectId(id, '提示词ID');
// 如果无效，自动抛出 400 错误
```

#### `ensureOwnership`

```typescript
const prompt = await collection.findOne({ _id: objectId });
ensureOwnership(prompt.userId, userId, '提示词');
// 如果不匹配，自动抛出 403 错误
```

#### `getRouteParams`

```typescript
export const GET = withAuth(async (request, context) => {
  const { id } = await getRouteParams(context);
  // 使用 id
});
```

## 限流功能

### `withRateLimit` - 限流中间件

防止 API 滥用，支持按用户或 IP 限流。

#### 基础用法

```typescript
// 按用户限流（需要配合 withAuth）
export const POST = withAuth(withRateLimit(
  async (request, { userId }) => {
    // 业务逻辑
  },
  {
    windowMs: 60 * 60 * 1000, // 1 小时
    max: 10,                   // 最多 10 次
    keyType: 'user',           // 按用户限流
    identifier: 'my-api',      // API 标识
    message: '请求过于频繁'     // 自定义错误消息
  }
));

// 按 IP 限流（公开接口）
export const POST = withRateLimit(
  async (request) => {
    // 业务逻辑
  },
  {
    windowMs: 10 * 60 * 1000, // 10 分钟
    max: 5,                    // 最多 5 次
    keyType: 'ip',             // 按 IP 限流
    identifier: 'register',
    message: '注册请求过于频繁，请稍后再试'
  }
);
```

#### 限流配置

```typescript
interface RateLimitConfig {
  windowMs: number;      // 时间窗口（毫秒）
  max: number;           // 窗口内最大请求数
  keyType?: 'user' | 'ip'; // 限流维度：用户或 IP
  identifier?: string;   // 可选标识符，用于区分不同的 API
  message?: string;      // 自定义错误消息
}
```

#### 常用限流策略

```typescript
// 注册接口 - 防止批量注册
{
  windowMs: 10 * 60 * 1000, // 10 分钟
  max: 5,                    // 最多 5 次
  keyType: 'ip',
  identifier: 'register'
}

// 修改密码 - 防止暴力破解
{
  windowMs: 60 * 60 * 1000, // 1 小时
  max: 10,                   // 最多 10 次
  keyType: 'user',
  identifier: 'change-password'
}

// 发布到市场 - 防止滥发
{
  windowMs: 24 * 60 * 60 * 1000, // 24 小时
  max: 30,                        // 最多 30 次
  keyType: 'user',
  identifier: 'market-publish'
}

// 收藏操作 - 防止刷数据
{
  windowMs: 60 * 60 * 1000, // 1 小时
  max: 60,                   // 最多 60 次
  keyType: 'user',
  identifier: 'favorite'
}
```

#### 响应头

限流中间件会自动添加响应头：

- `X-RateLimit-Limit` - 时间窗口内的最大请求数
- `X-RateLimit-Remaining` - 剩余可用请求数
- `X-RateLimit-Reset` - 重置时间（Unix 时间戳，秒）

## 开发流程

### 1. 创建新的 API 路由

```typescript
// src/app/api/your-endpoint/route.ts
import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/api-utils';
import { z } from 'zod';

const createSchema = z.object({
  name: z.string().min(1, '名称不能为空'),
  description: z.string().default(''),
});

export const GET = withAuth(async (request: NextRequest, { userId }) => {
  // 实现你的逻辑
  return { message: 'Success' };
});

export const POST = withAuth(async (request: NextRequest, { userId }) => {
  const data = await validateBody(request, createSchema);
  // 数据已验证
  return data;
});
```

### 2. 实现数据库操作

```typescript
import { getCollection } from '@/lib/db';
import { validateObjectId, serializeDocument } from '@/lib/api-utils';

export const GET = withAuth(async (request, context) => {
  const { id } = await getRouteParams(context);
  const objectId = validateObjectId(id);
  
  const collection = await getCollection('your_collection');
  const doc = await collection.findOne({ _id: objectId });
  
  if (!doc) {
    throw new ApiError(404, '资源不存在');
  }
  
  return serializeDocument(doc);
});
```

### 3. 添加分页支持

```typescript
import { getPaginationParams, serializeDocuments } from '@/lib/api-utils';

export const GET = withAuth(async (request, { userId }) => {
  const { page, pageSize, skip, limit } = getPaginationParams(request);
  
  const collection = await getCollection('your_collection');
  const query = { userId };
  
  const [items, total] = await Promise.all([
    collection.find(query).skip(skip).limit(limit).toArray(),
    collection.countDocuments(query),
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

## 完整示例

### CRUD 完整示例

```typescript
// src/app/api/items/route.ts
import { NextRequest } from 'next/server';
import { 
  withAuth, 
  validateBody, 
  getPaginationParams, 
  serializeDocuments,
  withRateLimit 
} from '@/lib/api-utils';
import { getCollection } from '@/lib/db';
import { z } from 'zod';

const createSchema = z.object({
  name: z.string().min(1),
  description: z.string().default(''),
});

// 列表查询（带限流）
export const GET = withAuth(withRateLimit(
  async (request: NextRequest, { userId }) => {
    const { page, pageSize, skip, limit } = getPaginationParams(request);
    
    const collection = await getCollection('items');
    const query = { userId };
    
    const [items, total] = await Promise.all([
      collection.find(query).skip(skip).limit(limit).toArray(),
      collection.countDocuments(query),
    ]);
    
    return {
      items: serializeDocuments(items),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  },
  {
    windowMs: 60 * 1000, // 1 分钟
    max: 100,             // 最多 100 次
    keyType: 'user',
    identifier: 'items-list'
  }
));

// 创建（带限流）
export const POST = withAuth(withRateLimit(
  async (request: NextRequest, { userId }) => {
    const data = await validateBody(request, createSchema);
    
    const collection = await getCollection('items');
    const now = new Date();
    
    const newItem = {
      ...data,
      userId,
      createdAt: now,
      updatedAt: now,
    };
    
    const result = await collection.insertOne(newItem);
    
    return {
      id: result.insertedId.toString(),
      ...newItem,
    };
  },
  {
    windowMs: 60 * 1000, // 1 分钟
    max: 20,              // 最多 20 次
    keyType: 'user',
    identifier: 'items-create'
  }
));
```

```typescript
// src/app/api/items/[id]/route.ts
import { NextRequest } from 'next/server';
import {
  withAuth,
  validateObjectId,
  ensureOwnership,
  getRouteParams,
  serializeDocument,
  validateBody,
  ApiError,
  withRateLimit,
} from '@/lib/api-utils';
import { getCollection } from '@/lib/db';
import { z } from 'zod';

const updateSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
});

// 获取单个
export const GET = withAuth(async (
  request: NextRequest, 
  context: { userId: string; params: Promise<{ id: string }> }
) => {
  const { id } = await getRouteParams(context);
  const objectId = validateObjectId(id);
  
  const collection = await getCollection('items');
  const item = await collection.findOne({ _id: objectId });
  
  if (!item) {
    throw new ApiError(404, '资源不存在');
  }
  
  ensureOwnership(item.userId, context.userId);
  
  return serializeDocument(item);
});

// 更新（带限流）
export const PATCH = withAuth(withRateLimit(
  async (request: NextRequest, context: { userId: string; params: Promise<{ id: string }> }) => {
    const { id } = await getRouteParams(context);
    const objectId = validateObjectId(id);
    const updateData = await validateBody(request, updateSchema);
    
    const collection = await getCollection('items');
    const existing = await collection.findOne({ _id: objectId });
    
    if (!existing) {
      throw new ApiError(404, '资源不存在');
    }
    
    ensureOwnership(existing.userId, context.userId);
    
    await collection.updateOne(
      { _id: objectId },
      { $set: { ...updateData, updatedAt: new Date() } }
    );
    
    const updated = await collection.findOne({ _id: objectId });
    return serializeDocument(updated!);
  },
  {
    windowMs: 60 * 1000, // 1 分钟
    max: 30,              // 最多 30 次
    keyType: 'user',
    identifier: 'items-update'
  }
));

// 删除（带限流）
export const DELETE = withAuth(withRateLimit(
  async (request: NextRequest, context: { userId: string; params: Promise<{ id: string }> }) => {
    const { id } = await getRouteParams(context);
    const objectId = validateObjectId(id);
    
    const collection = await getCollection('items');
    const existing = await collection.findOne({ _id: objectId });
    
    if (!existing) {
      throw new ApiError(404, '资源不存在');
    }
    
    ensureOwnership(existing.userId, context.userId);
    
    await collection.deleteOne({ _id: objectId });
    
    return { success: true };
  },
  {
    windowMs: 60 * 1000, // 1 分钟
    max: 20,              // 最多 20 次
    keyType: 'user',
    identifier: 'items-delete'
  }
));
```

## 最佳实践

### 1. 错误处理最佳实践

- ✅ 使用 `ApiError` 抛出错误
- ✅ 提供清晰的错误消息和错误码
- ❌ 不要直接返回 `NextResponse.json({ error: ... })`

```typescript
// ✅ 推荐
throw new ApiError(404, '提示词不存在', 'PROMPT_NOT_FOUND');

// ❌ 不推荐
return NextResponse.json({ error: '提示词不存在' }, { status: 404 });
```

### 2. 数据验证最佳实践

- ✅ 使用 `validateBody` 验证所有输入
- ✅ 在 route 文件顶部定义验证 schema（就近原则）
- ✅ 使用清晰的错误消息
- ❌ 不要手动解析和验证 JSON

```typescript
// ✅ 推荐
const createSchema = z.object({
  name: z.string().min(1, '名称不能为空'),
});
const data = await validateBody(request, createSchema);

// ❌ 不推荐
const body = await request.json();
if (!body.name) {
  return NextResponse.json({ error: '名称不能为空' }, { status: 400 });
}
```

### 3. 认证和权限最佳实践

- ✅ 使用 `withAuth` 或 `withOptionalAuth`
- ✅ 使用 `ensureOwnership` 验证资源所有权
- ❌ 不要手动调用 `getAuthSession`

```typescript
// ✅ 推荐
export const GET = withAuth(async (request, { userId }) => {
  // userId 自动可用
});

// ❌ 不推荐
export async function GET(request) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
```

### 4. 限流最佳实践

- ✅ 对敏感操作（注册、修改密码等）添加限流
- ✅ 对写操作（创建、更新、删除）添加限流
- ✅ 对可能的刷数据操作（收藏、点赞等）添加限流
- ✅ 使用合理的限流参数，避免影响正常用户

```typescript
// ✅ 推荐 - 敏感操作限流
export const POST = withAuth(withRateLimit(
  async (request, { userId }) => {
    // 业务逻辑
  },
  {
    windowMs: 60 * 60 * 1000, // 1 小时
    max: 10,                   // 最多 10 次
    keyType: 'user',
    identifier: 'sensitive-operation'
  }
));

// ✅ 推荐 - 公开接口按 IP 限流
export const POST = withRateLimit(
  async (request) => {
    // 业务逻辑
  },
  {
    windowMs: 10 * 60 * 1000, // 10 分钟
    max: 5,                    // 最多 5 次
    keyType: 'ip'
  }
);
```

### 5. 数据序列化最佳实践

- ✅ 使用 `serializeDocument` 或 `serializeDocuments`
- ✅ 让工具自动处理日期和 ObjectId 转换
- ❌ 不要手动转换 `_id` 和日期

```typescript
// ✅ 推荐
return serializeDocument(prompt);

// ❌ 不推荐
return {
  id: prompt._id.toString(),
  createdAt: prompt.createdAt.toISOString(),
  // ...
};
```

### 6. 分页最佳实践

- ✅ 使用 `getPaginationParams` 获取分页参数
- ✅ 返回标准的分页响应格式
- ❌ 不要手动解析分页参数

```typescript
// ✅ 推荐
const { page, pageSize, skip, limit } = getPaginationParams(request, 20, 100);

// ❌ 不推荐
const page = parseInt(request.nextUrl.searchParams.get('page') || '1');
```

### 7. 代码组织最佳实践

- ✅ 保持 API 处理器简洁，专注于业务逻辑
- ✅ 将复杂逻辑提取到独立的服务函数
- ✅ 使用 TypeScript 类型确保类型安全
- ✅ 验证规则定义在 route 文件顶部（就近原则）

```typescript
// ✅ 推荐
const createSchema = z.object({
  name: z.string().min(1),
  description: z.string().default(''),
});

export const POST = withAuth(withRateLimit(
  async (request, { userId }) => {
    const data = await validateBody(request, createSchema);
    const result = await createItem(userId, data);
    return result;
  },
  rateLimitConfig
));

// 复杂逻辑在独立函数中
async function createItem(userId: string, data: CreateItemData) {
  // 实现细节
}
```

## 常见模式

### GET 列表（带分页和搜索）

```typescript
export const GET = withAuth(async (request, { userId }) => {
  const { page, pageSize, skip, limit } = getPaginationParams(request);
  
  const searchParams = request.nextUrl.searchParams;
  const search = searchParams.get('search');
  const status = searchParams.get('status');
  
  const collection = await getCollection('items');
  const query: Record<string, unknown> = { userId };
  
  // 搜索条件
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }
  
  // 过滤条件
  if (status && status !== 'all') {
    query.status = status;
  }
  
  const [items, total] = await Promise.all([
    collection
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray(),
    collection.countDocuments(query),
  ]);
  
  return {
    items: serializeDocuments(items),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
    search: search || null,
  };
});
```

### POST 创建（带验证和限流）

```typescript
const createSchema = z.object({
  name: z.string().min(1, '名称不能为空'),
  description: z.string().default(''),
  category: z.string().optional(),
});

export const POST = withAuth(withRateLimit(
  async (request, { userId }) => {
    const data = await validateBody(request, createSchema);
    
    const collection = await getCollection('items');
    const now = new Date();
    
    const newItem = {
      ...data,
      userId,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    };
    
    const result = await collection.insertOne(newItem);
    
    return {
      id: result.insertedId.toString(),
      ...newItem,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };
  },
  {
    windowMs: 60 * 1000, // 1 分钟
    max: 20,              // 最多 20 次
    keyType: 'user',
    identifier: 'items-create'
  }
));
```

### PATCH 更新（带权限验证）

```typescript
const updateSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(['active', 'inactive']).optional(),
});

export const PATCH = withAuth(
  async (request, context: { userId: string; params: Promise<{ id: string }> }) => {
    const { id } = await getRouteParams(context);
    const objectId = validateObjectId(id);
    const updateData = await validateBody(request, updateSchema);
    
    const collection = await getCollection('items');
    const existing = await collection.findOne({ _id: objectId });
    
    if (!existing) {
      throw new ApiError(404, '资源不存在', 'ITEM_NOT_FOUND');
    }
    
    ensureOwnership(existing.userId, context.userId, '项目');
    
    await collection.updateOne(
      { _id: objectId },
      { $set: { ...updateData, updatedAt: new Date() } }
    );
    
    const updated = await collection.findOne({ _id: objectId });
    return serializeDocument(updated!);
  }
);
```

### 批量操作

```typescript
const batchDeleteSchema = z.object({
  ids: z.array(z.string()).min(1, '至少选择一个项目'),
});

export const POST = withAuth(withRateLimit(
  async (request, { userId }) => {
    const { ids } = await validateBody(request, batchDeleteSchema);
    
    const collection = await getCollection('items');
    
    // 验证所有 ID 并确保所有权
    const objectIds = ids.map(id => validateObjectId(id));
    
    const items = await collection
      .find({ _id: { $in: objectIds } })
      .toArray();
    
    if (items.length !== objectIds.length) {
      throw new ApiError(404, '部分项目不存在', 'ITEMS_NOT_FOUND');
    }
    
    const notOwned = items.filter(item => item.userId !== userId);
    if (notOwned.length > 0) {
      throw new ApiError(403, '无权删除部分项目', 'FORBIDDEN');
    }
    
    const result = await collection.deleteMany({
      _id: { $in: objectIds },
    });
    
    return {
      success: true,
      deletedCount: result.deletedCount,
    };
  },
  {
    windowMs: 60 * 1000, // 1 分钟
    max: 5,               // 最多 5 次
    keyType: 'user',
    identifier: 'batch-delete'
  }
));
```

## 响应格式

所有 API 响应都会自动包装为标准格式：

### 成功响应

```json
{
  "data": {
    // 你返回的数据
  }
}
```

### 错误响应

```json
{
  "error": "错误消息",
  "code": "ERROR_CODE"
}
```

### 分页响应

```json
{
  "data": {
    "items": [...],
    "total": 100,
    "page": 1,
    "pageSize": 20,
    "totalPages": 5
  }
}
```

### 限流响应

当触发限流时：

```json
{
  "error": "请求过于频繁，请在 14:30:00 后重试",
  "code": "RATE_LIMIT_EXCEEDED"
}
```

响应头会包含：

```http
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1694724600
```

## 错误码

### 标准错误码

- `UNAUTHORIZED` - 401 未授权
- `FORBIDDEN` - 403 无权访问
- `NOT_FOUND` - 404 资源不存在
- `VALIDATION_ERROR` - 400 验证失败
- `INVALID_ID` - 400 无效的 ID
- `INVALID_JSON` - 400 JSON 格式错误
- `INTERNAL_ERROR` - 500 服务器错误

### 业务错误码

- `USER_NOT_FOUND` - 用户不存在
- `EMAIL_ALREADY_EXISTS` - 邮箱已被注册
- `INVALID_OLD_PASSWORD` - 旧密码不正确
- `PROMPT_NOT_FOUND` - 提示词不存在
- `RATE_LIMIT_EXCEEDED` - 请求频率超限

### 自定义错误码

```typescript
// 推荐使用大写字母和下划线的格式
throw new ApiError(400, '余额不足', 'INSUFFICIENT_BALANCE');
throw new ApiError(409, '名称冲突', 'NAME_CONFLICT');
```

## 数据库操作

### 查询操作

```typescript
// 查询单个
const collection = await getCollection('items');
const item = await collection.findOne({ _id: objectId });

if (!item) {
  throw new ApiError(404, '资源不存在');
}

return serializeDocument(item);

// 查询列表
const items = await collection.find({ userId }).toArray();
return serializeDocuments(items);

// 带条件的查询
const query: Record<string, unknown> = { userId };
if (status) query.status = status;
if (search) {
  query.$or = [
    { name: { $regex: search, $options: 'i' } },
    { description: { $regex: search, $options: 'i' } }
  ];
}
```

### 创建操作

```typescript
const result = await collection.insertOne(newItem);
return {
  id: result.insertedId.toString(),
  ...newItem,
};
```

### 更新操作

```typescript
await collection.updateOne(
  { _id: objectId },
  { $set: { ...updateData, updatedAt: new Date() } }
);
```

### 删除操作

```typescript
await collection.deleteOne({ _id: objectId });
return { success: true };
```

## 前端开发

### API 客户端

前端使用基于 axios 封装的 API 客户端，自动处理响应格式、错误提示和认证跳转。

#### 导入

```typescript
import api from '@/lib/api-client';
```

#### 特性

1. **自动解包响应** - 直接返回 `data` 字段内容
2. **全局错误处理** - 自动显示 toast 提示
3. **401 自动跳转** - 未登录自动重定向到登录页
4. **统一错误格式** - 所有错误统一处理

#### 可用方法

```typescript
// GET 请求
const data = await api.get<ResponseType>('/prompts');
const data = await api.get('/prompts?page=1&pageSize=20');

// POST 请求
const result = await api.post('/prompts', { name, prompt, emoji });

// PATCH 请求
const updated = await api.patch(`/prompts/${id}`, { name });

// DELETE 请求
await api.delete(`/prompts/${id}`);

// PUT 请求
await api.put(`/prompts/${id}`, data);
```

### 使用示例

#### 基础 GET 请求

```typescript
import { useRequest } from 'ahooks';
import api from '@/lib/api-client';

const { data, loading } = useRequest(async () => {
  return await api.get('/prompts');
});
```

#### 带参数的 GET 请求

```typescript
const { data, loading, run } = useRequest(
  async (page: number) => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('pageSize', '20');
    
    return await api.get(`/prompts?${params.toString()}`);
  },
  { manual: true }
);

// 调用
run(1);
```

#### POST 请求创建资源

```typescript
const { loading, run: createPrompt } = useRequest(
  async (data: CreateData) => {
    return await api.post('/prompts', data);
  },
  {
    manual: true,
    onSuccess: (result) => {
      toast.success('创建成功');
      // 刷新列表等操作
    },
  }
);

// 调用
createPrompt({ name: '测试', prompt: '内容' });
```

#### PATCH 请求更新资源

```typescript
const { loading, run: updatePrompt } = useRequest(
  async (id: string, data: UpdateData) => {
    return await api.patch(`/prompts/${id}`, data);
  },
  {
    manual: true,
    onSuccess: () => {
      toast.success('更新成功');
    },
  }
);
```

#### DELETE 请求删除资源

```typescript
const { run: deletePrompt } = useRequest(
  async (id: string) => {
    await api.delete(`/prompts/${id}`);
  },
  {
    manual: true,
    onSuccess: () => {
      toast.success('删除成功');
      // 刷新列表
    },
  }
);
```

#### 表单提交示例

```typescript
const onSubmit = async (values: FormValues) => {
  setSubmitting(true);
  try {
    await api.post('/account/update-profile', values);
    toast.success('资料已更新');
    router.refresh();
  } catch (error) {
    // 错误已由 api-client 自动处理（显示 toast）
  } finally {
    setSubmitting(false);
  }
};
```

#### 错误处理

API 客户端会自动处理以下错误：

```typescript
// 401 - 自动跳转登录页
// 403 - 显示无权访问提示
// 404 - 显示资源不存在提示
// 429 - 显示限流提示
// 其他 - 显示通用错误提示
```

如需自定义错误处理：

```typescript
try {
  await api.post('/some-api', data);
} catch (error) {
  // 错误已经被 toast 提示过了
  // 这里可以做额外的处理，比如重置表单
  resetForm();
}
```

#### 类型安全

```typescript
interface PromptData {
  id: string;
  name: string;
  prompt: string;
}

interface PromptsResponse {
  prompts: PromptData[];
  total: number;
  page: number;
}

// 使用泛型指定返回类型
const data = await api.get<PromptsResponse>('/prompts');
// data 的类型是 PromptsResponse
```

### 前端最佳实践

1. **使用 useRequest** - 配合 ahooks 的 useRequest 管理请求状态
2. **类型定义** - 为 API 响应定义 TypeScript 类型
3. **错误处理** - 依赖 api-client 的自动错误处理，减少重复代码
4. **加载状态** - 使用 loading 状态禁用按钮，防止重复提交
5. **成功反馈** - 在 onSuccess 中处理成功后的逻辑（刷新、跳转等）

## 总结

使用这套工具库，你可以：

- ✅ 减少 50%+ 的样板代码
- ✅ 统一错误处理和响应格式
- ✅ 自动处理认证和权限验证
- ✅ 类型安全的数据验证
- ✅ 内置限流保护，防止 API 滥用
- ✅ 前后端统一的 API 调用方式
- ✅ 更专注于业务逻辑
- ✅ 遵循就近原则，代码更易维护

### 核心原则

1. **就近原则**：验证规则定义在使用的 route 文件中
2. **统一性**：所有 API 使用相同的错误处理和响应格式
3. **安全性**：自动处理认证、权限验证和限流
4. **类型安全**：充分利用 TypeScript 和 Zod 的类型系统
5. **可维护性**：减少样板代码，提高代码可读性
6. **用户体验**：自动错误提示和认证跳转

### 注意事项

1. **限流存储**：当前使用内存存储，适合单实例部署
2. **多实例部署**：需要改用 Redis 或其他分布式存储
3. **响应头**：限流信息会自动添加到响应头中
4. **后端错误处理**：不要使用 try-catch，中间件会自动处理
5. **前端错误处理**：api-client 已自动处理错误提示，无需手动 toast

如有问题或建议，请联系团队。
