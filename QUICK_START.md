# 快速开始指南

## 环境准备

确保已安装：
- Node.js 20+
- pnpm
- MongoDB 6.0+

## 安装步骤

### 1. 安装依赖

```bash
pnpm install
```

### 2. 配置环境变量

创建 `.env.local` 文件（参考以下配置）：

```env
# MongoDB 连接
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB=prompts_manage

# NextAuth 配置
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-random-secret-key-here

# OAuth 提供商（可选）
AUTH_GOOGLE_ENABLED=false
AUTH_GITHUB_ENABLED=false
```

**生成 NEXTAUTH_SECRET**:
```bash
openssl rand -base64 32
```

### 3. 初始化市场数据

```bash
pnpm init-market
```

这将从 `src/data/agents.json` 导入约 9000+ 个提示词到市场。

### 4. 启动开发服务器

```bash
pnpm dev
```

访问 [http://localhost:3000](http://localhost:3000)

## 使用流程

### 1. 注册账号

访问 http://localhost:3000/register 注册新账号

### 2. 创建提示词

1. 登录后进入"我的提示词"页面
2. 点击"创建"按钮
3. 填写提示词信息：
   - 选择 Emoji 图标
   - 输入名称和描述
   - 编写提示词内容（支持 Markdown）
   - 添加分组标签

### 3. 管理提示词

- **编辑**: 点击卡片菜单 → 编辑
- **删除**: 点击卡片菜单 → 删除
- **版本控制**: 点击卡片菜单 → 版本历史 → 创建版本快照
- **发布到市场**: 点击卡片菜单 → 发布到市场

### 4. 导入导出

**导出**：
1. 点击"导出"按钮
2. 选择导出所有或选中的提示词
3. 下载 JSON 文件

**导入**：
1. 点击"导入"按钮
2. 选择符合格式的 JSON 文件
3. 确认导入

**JSON 格式示例**：
```json
[
  {
    "id": "1",
    "name": "提示词名称",
    "prompt": "提示词内容",
    "emoji": "🎯",
    "description": "提示词描述",
    "group": ["分类1", "分类2"]
  }
]
```

### 5. 浏览市场

1. 进入"提示词市场"页面
2. 按分组浏览或搜索
3. 点击卡片查看详情
4. 点击"添加到我的"克隆到个人库
5. 点击收藏图标收藏喜欢的提示词

## 常见问题

### Q: 如何连接到远程 MongoDB？

修改 `.env.local` 中的 `MONGODB_URI`：
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net
```

### Q: 如何启用 OAuth 登录？

1. 获取 Google/GitHub OAuth 凭证
2. 在 `.env.local` 中配置：
```env
AUTH_GOOGLE_ENABLED=true
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
```

### Q: 市场数据可以更新吗？

可以，修改 `src/data/agents.json` 后重新运行：
```bash
pnpm init-market
```

### Q: 如何部署到生产环境？

1. 构建项目：
```bash
pnpm build
```

2. 启动生产服务器：
```bash
pnpm start
```

3. 或部署到 Vercel：
```bash
vercel deploy
```

## 功能特性

✅ 用户认证（邮箱/密码、OAuth）
✅ 提示词 CRUD 操作
✅ Markdown 编辑器
✅ Emoji 选择器
✅ 分组管理
✅ 版本控制（手动快照）
✅ 导入/导出（Cherry Studio 格式）
✅ 提示词市场
✅ 收藏功能
✅ 搜索和过滤

## 技术支持

如遇问题，请检查：
1. MongoDB 是否正常运行
2. 环境变量是否正确配置
3. 依赖是否完整安装
4. 端口 3000 是否被占用

## 开发说明

### 项目结构
```
src/
├── app/                # Next.js App Router
│   ├── api/           # API 路由
│   ├── prompts/       # 提示词页面
│   └── ...
├── components/        # UI 组件
├── lib/              # 工具库
└── types/            # 类型定义
```

### API 文档

详见 [README.md](./README.md) 中的 API 路由章节。

### 数据库集合

- `users` - 用户账号
- `prompts` - 用户提示词
- `prompt_versions` - 版本历史
- `market_prompts` - 市场提示词
- `favorites` - 收藏记录

