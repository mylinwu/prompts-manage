# 提示词管理工具开发计划

## 一、基础设施搭建 ✅

### 1.1 依赖安装 ✅

- [x] 安装 Shadcn UI 基础组件：`button`, `input`, `textarea`, `select`, `dialog`, `dropdown-menu`, `card`, `badge`, `popover`, `tabs`, `separator`
- [x] 安装 markdown 相关：`react-markdown`, `rehype-highlight`, `remark-gfm`
- [x] 安装 emoji 选择器：`emoji-picker-react`
- [x] 安装 icons：`lucide-react`

### 1.2 类型定义 ✅

- [x] 创建 `src/types/prompt.ts`，定义核心数据类型：

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

interface MarketPrompt {
  _id: ObjectId;
  originalPromptId: string;
  userId: string;
  name: string;
  prompt: string;
  emoji?: string;
  description?: string;
  groups: string[];
  publishedAt: Date;
  favoriteCount: number;
}

interface Favorite {
  _id: ObjectId;
  userId: string;
  marketPromptId: string;
  createdAt: Date;
}
```

### 1.3 数据库工具函数 ✅

- [x] 扩展 `src/lib/db.ts`，添加提示词相关的集合访问函数

## 二、核心功能开发 ✅

### 2.1 页面结构 ✅

- [x] 创建以下页面和路由：
  - [x] `/prompts` - 我的提示词（主页）
  - [x] `/prompts/market` - 提示词市场
  - [x] `/prompts/[id]` - 提示词详情（可选）

### 2.2 组件开发 ✅

#### 布局组件 ✅

- [x] `src/app/prompts/_components/PromptsLayout.tsx` - 左侧分组导航 + 右侧内容区域（集成在 PromptsPageClient.tsx 中）
- [x] `src/app/prompts/_components/GroupNav.tsx` - 左侧分组导航列表（集成在 PromptsPageClient.tsx 中）
- [x] `src/app/prompts/_components/PromptCard.tsx` - 提示词卡片（参考 AgentCard.tsx）

#### 表单组件 ✅

- [x] `src/components/EmojiPicker.tsx` - Emoji 选择器（使用 emoji-picker-react + Popover）
- [x] `src/app/prompts/_components/CreatePromptDialog.tsx` - 创建提示词弹窗
- [x] `src/app/prompts/_components/EditPromptDialog.tsx` - 编辑提示词弹窗
- [x] `src/app/prompts/_components/GroupSelect.tsx` - 分组下拉选择器（集成在弹窗中）

#### 功能组件 ✅

- [x] `src/app/prompts/_components/VersionHistoryDialog.tsx` - 版本历史对话框（已实现）
- [ ] `src/app/prompts/_components/CreateVersionDialog.tsx` - 创建版本快照弹窗（功能已集成到详情对话框中）
- [x] `src/app/prompts/_components/ImportDialog.tsx` - 导入提示词弹窗
- [x] `src/app/prompts/_components/ExportDialog.tsx` - 导出提示词弹窗
- [ ] `src/app/prompts/_components/MarkdownEditor.tsx` - Markdown 编辑器（带预览）（未实现独立组件，功能已集成）

### 2.3 API 路由 ✅

#### 提示词 CRUD ✅

- [x] `POST /api/prompts` - 创建提示词
- [x] `GET /api/prompts` - 获取当前用户的提示词列表
- [x] `GET /api/prompts/[id]` - 获取单个提示词详情
- [x] `PATCH /api/prompts/[id]` - 更新提示词
- [x] `DELETE /api/prompts/[id]` - 删除提示词

#### 版本管理 ✅

- [x] `POST /api/prompts/[id]/versions` - 创建版本快照
- [x] `GET /api/prompts/[id]/versions` - 获取版本历史
- [x] `POST /api/prompts/[id]/restore/[versionId]` - 恢复到指定版本

#### 分组管理 ✅

- [x] `GET /api/prompts/groups` - 获取用户的所有分组
- [x] `POST /api/prompts/groups` - 创建分组（集成在创建提示词时自动创建）

#### 市场功能 ✅

- [x] `POST /api/market/publish` - 发布到市场
- [x] `GET /api/market/prompts` - 获取市场提示词列表
- [x] `POST /api/market/prompts/[id]/favorite` - 收藏/取消收藏
- [x] `GET /api/market/prompts/[id]/favorite` - 检查是否已收藏
- [x] `POST /api/market/prompts/[id]/clone` - 克隆市场提示词到我的

#### 导入导出 ✅

- [x] `POST /api/prompts/import` - 导入 JSON 格式提示词
- [x] `GET /api/prompts/export` - 导出提示词为 JSON

## 三、市场初始化 ✅

### 3.1 数据迁移脚本 ✅

- [x] 创建 `src/scripts/init-market.ts`，读取 `src/data/agents.json` 并导入到 `market_prompts` 集合

### 3.2 执行脚本 ✅

- [x] 添加 npm script: `"init-market": "tsx src/scripts/init-market.ts"`

## 四、UI 细节优化 ✅

### 4.1 样式调整 ✅

- [x] 参考 Cherry Studio 的卡片设计（阴影、hover 效果、背景模糊 emoji）
- [x] 使用 Tailwind CSS 实现响应式布局
- [x] 确保不支持暗黑模式（固定亮色主题）

### 4.2 交互优化 ✅

- [x] 搜索框实时过滤
- [x] 分组切换动画
- [x] 卡片懒加载（IntersectionObserver）
- [x] 表单验证提示

## 五、用户功能完善 ✅

### 5.1 用户注册增强 ✅

- [x] 添加用户名字段到注册表单
- [x] 完善用户资料页面
- [x] 创建更新用户资料的API (`/api/account/update-profile`)
- [x] 创建用户资料编辑表单组件 (`UpdateProfileForm.tsx`)
- [x] 优化账户设置页面布局和功能

### 5.2 导航更新 ✅

- [x] 更新 `src/app/layout.tsx` 和 `src/app/nav.tsx`，添加提示词管理相关导航链接

## 六、测试与优化 ⚠️

### 6.1 功能测试 ❌

- [ ] 创建、编辑、删除提示词
- [ ] 版本快照创建与恢复
- [ ] 导入导出功能
- [ ] 市场浏览与收藏
- [ ] 用户注册和登录
- [ ] 发布提示词到市场
- [ ] 搜索和分组过滤

### 6.2 性能优化 ⚠️

- [x] 使用 React Server Components
- [ ] 分页加载（市场提示词）- 后端支持，前端未实现滚动加载
- [x] 图片懒加载

## 七、部署准备 ❌

### 7.1 数据库准备

- [ ] 创建 MongoDB 生产数据库
- [ ] 配置生产环境数据库连接
- [ ] 运行初始化脚本 `pnpm init-market`

### 7.2 构建和部署

- [ ] 执行 `pnpm build` 检查构建错误
- [ ] 测试生产构建 `pnpm start`
- [ ] 部署到服务器/平台（Vercel/其他）

### 7.3 环境变量

- [x] MONGODB_URI - 已配置
- [x] MONGODB_DB - 已配置
- [x] NEXTAUTH_URL - 已配置
- [x] NEXTAUTH_SECRET - 已配置