# 提示词管理工具

一个功能完善的 AI 提示词管理系统，支持创建、编辑、分组、版本控制以及市场分享功能。

## 主要功能

- ✅ 提示词创建与编辑（支持 Markdown 语法高亮）
- ✅ 用户管理（注册、登录、修改密码、注销）
- ✅ 分组管理
- ✅ 导入/导出（支持 Cherry Studio 格式）
- ✅ 版本控制（手动创建版本快照）
- ✅ 提示词市场（浏览、收藏、克隆）
- ✅ 发布提示词到市场

## 技术栈

- **框架**: Next.js 15 (App Router)
- **语言**: TypeScript
- **数据库**: MongoDB
- **认证**: NextAuth.js
- **UI**: Tailwind CSS + 自定义组件
- **状态管理**: ahooks
- **表单**: React Hook Form + Zod
- **Markdown**: react-markdown

## 快速开始

### 1. 安装依赖

```bash
pnpm install
```

### 2. 配置环境变量

创建 `.env.local` 文件：

```env
# MongoDB
MONGODB_URI=your_mongodb_connection_string
MONGODB_DB=prompts_manage

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_secret_key_here

# OAuth (可选)
AUTH_GOOGLE_ENABLED=false
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

AUTH_GITHUB_ENABLED=false
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
```

### 3. 初始化市场数据

从 `src/data/agents.json` 导入市场提示词数据：

```bash
pnpm init-market
```

### 4. 启动开发服务器

```bash
pnpm dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

## 项目结构

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API 路由
│   │   ├── prompts/       # 提示词 CRUD
│   │   ├── market/        # 市场功能
│   │   └── auth/          # 用户认证
│   ├── prompts/           # 提示词页面
│   │   ├── _components/   # 提示词相关组件
│   │   └── market/        # 市场页面
│   └── ...
├── components/            # 通用组件
│   ├── ui/               # UI 基础组件
│   └── EmojiPicker.tsx   # Emoji 选择器
├── lib/                   # 工具库
│   ├── auth.ts           # 认证配置
│   ├── db.ts             # 数据库工具
│   └── utils.ts          # 工具函数
├── types/                 # TypeScript 类型定义
│   └── prompt.ts         # 提示词相关类型
├── data/                  # 数据文件
│   └── agents.json       # 市场初始数据
└── scripts/              # 脚本
    └── init-market.ts    # 市场数据初始化
```

## API 路由

### 提示词管理

- `GET /api/prompts` - 获取用户的提示词列表
- `POST /api/prompts` - 创建提示词
- `GET /api/prompts/[id]` - 获取单个提示词
- `PATCH /api/prompts/[id]` - 更新提示词
- `DELETE /api/prompts/[id]` - 删除提示词

### 版本管理

- `GET /api/prompts/[id]/versions` - 获取版本历史
- `POST /api/prompts/[id]/versions` - 创建版本快照
- `POST /api/prompts/[id]/restore/[versionId]` - 恢复到指定版本

### 市场功能

- `GET /api/market/prompts` - 获取市场提示词
- `POST /api/market/prompts/[id]/favorite` - 收藏/取消收藏
- `POST /api/market/prompts/[id]/clone` - 克隆到我的提示词
- `POST /api/market/publish` - 发布提示词到市场

### 导入导出

- `POST /api/prompts/import` - 导入提示词
- `GET /api/prompts/export` - 导出提示词

## 数据模型

### Prompt (提示词)

```typescript
interface Prompt {
  _id: ObjectId;
  userId: string;
  name: string;
  prompt: string;
  emoji?: string;
  description?: string;
  groups: string[];
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### PromptVersion (版本)

```typescript
interface PromptVersion {
  _id: ObjectId;
  promptId: string;
  version: number;
  name: string;
  prompt: string;
  description?: string;
  createdAt: Date;
  createdBy: string;
}
```

### MarketPrompt (市场提示词)

```typescript
interface MarketPrompt {
  _id: ObjectId;
  originalPromptId?: string;
  userId?: string;
  name: string;
  prompt: string;
  emoji?: string;
  description?: string;
  groups: string[];
  publishedAt: Date;
  favoriteCount: number;
}
```

## 特性说明

### 版本控制

用户可以为提示词创建版本快照：

1. 点击提示词卡片的菜单，选择"版本历史"
2. 点击"创建版本快照"按钮
3. 可选填写版本说明
4. 在版本列表中可以恢复到任意历史版本

### 导入导出

支持 Cherry Studio 格式的 JSON 文件：

```json
[
  {
    "id": "1",
    "name": "提示词名称",
    "prompt": "提示词内容",
    "emoji": "😀",
    "description": "描述",
    "group": ["分组1", "分组2"]
  }
]
```

### 市场功能

- 所有人可以浏览市场提示词（无需登录）
- 登录用户可以收藏和克隆提示词
- 用户可以将自己的提示词发布到市场
- 市场提示词按收藏数排序

## 开发说明

### 代码规范

- 使用 TypeScript 严格模式
- 组件使用函数式编程
- 优先使用 React Server Components
- 客户端组件使用 `'use client'` 标记
- 使用 ahooks 进行数据请求

### 样式规范

- 使用 Tailwind CSS
- 组件样式内联
- 响应式设计（移动优先）
- 不支持暗黑模式（固定亮色主题）

## License

MIT
