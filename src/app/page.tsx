import Link from 'next/link';
import { getAuthSession } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { FileText, Store, Upload, Download } from 'lucide-react';

export default async function Home() {
  const session = await getAuthSession();

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-4xl mx-auto">
        {/* 标题区域 */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4">提示词管理工具</h1>
          <p className="text-xl text-slate-600 mb-8">
            轻松管理、分享和发现优质的 AI 提示词
          </p>
          {session?.user ? (
            <div className="flex gap-4 justify-center">
              <Link href="/prompts">
                <Button size="lg">
                  <FileText className="w-5 h-5 mr-2" />
                  我的提示词
                </Button>
              </Link>
              <Link href="/prompts/market">
                <Button size="lg" variant="outline">
                  <Store className="w-5 h-5 mr-2" />
                  浏览市场
                </Button>
              </Link>
            </div>
          ) : (
            <div className="flex gap-4 justify-center">
              <Link href="/register">
                <Button size="lg">立即开始</Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline">
                  登录
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* 功能特性 */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <div className="border border-slate-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 rounded-lg bg-slate-900 text-white flex items-center justify-center mb-4">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-semibold mb-2">提示词管理</h3>
            <p className="text-slate-600">
              创建、编辑和组织你的提示词。支持 Markdown 语法，按分组管理，轻松查找。
            </p>
          </div>

          <div className="border border-slate-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 rounded-lg bg-slate-900 text-white flex items-center justify-center mb-4">
              <Store className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-semibold mb-2">提示词市场</h3>
            <p className="text-slate-600">
              浏览数千个优质提示词，收藏喜欢的内容，将优秀提示词添加到自己的收藏。
            </p>
          </div>

          <div className="border border-slate-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 rounded-lg bg-slate-900 text-white flex items-center justify-center mb-4">
              <Upload className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-semibold mb-2">版本控制</h3>
            <p className="text-slate-600">
              为提示词创建版本快照，随时恢复到历史版本，不用担心误操作丢失内容。
            </p>
          </div>

          <div className="border border-slate-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 rounded-lg bg-slate-900 text-white flex items-center justify-center mb-4">
              <Download className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-semibold mb-2">导入导出</h3>
            <p className="text-slate-600">
              支持 Cherry Studio 格式的导入导出，轻松迁移和备份你的提示词库。
            </p>
          </div>
        </div>

        {/* 快速开始 */}
        <div className="bg-slate-50 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-semibold mb-4">准备好开始了吗？</h2>
          <p className="text-slate-600 mb-6">
            {session?.user
              ? '前往我的提示词开始管理你的 AI 提示词库'
              : '注册账号，开始管理你的 AI 提示词库'}
          </p>
          {session?.user ? (
            <Link href="/prompts">
              <Button size="lg">前往我的提示词</Button>
            </Link>
          ) : (
            <Link href="/register">
              <Button size="lg">免费注册</Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
