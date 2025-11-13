import Link from 'next/link';
import { getAuthSession } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { FileText, Store, Upload, Download, Share2 } from 'lucide-react';

export default async function Home() {
  const session = await getAuthSession();

  return (
    <div className="container mx-auto px-4 md:px-6 py-8 md:py-16">
      <div className="max-w-4xl mx-auto">
        {/* 标题区域 */}
        <div className="text-center mb-10 md:mb-16">
          <h1 className="text-3xl md:text-5xl font-bold mb-3 md:mb-4">提示词管理工具</h1>
          <p className="text-base md:text-xl text-slate-600 mb-6 md:mb-8 px-2">
            轻松管理、分享和发现优质的 AI 提示词
          </p>
          {session?.user ? (
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center px-4">
              <Link href="/prompts" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto">
                  <FileText className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                  我的提示词
                </Button>
              </Link>
              <Link href="/prompts/market" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  <Store className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                  浏览市场
                </Button>
              </Link>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center px-4">
              <Link href="/register" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto">立即开始</Button>
              </Link>
              <Link href="/login" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  登录
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* 功能特性 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 mb-10 md:mb-16">
          <div className="border border-slate-200 rounded-lg p-4 md:p-6 hover:shadow-lg transition-shadow">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-slate-900 text-white flex items-center justify-center mb-3 md:mb-4">
              <FileText className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <h3 className="text-lg md:text-xl font-semibold mb-2">提示词管理</h3>
            <p className="text-sm md:text-base text-slate-600">
              创建、编辑和组织你的提示词。支持 Markdown 语法，按分组管理，轻松查找。
            </p>
          </div>

          <div className="border border-slate-200 rounded-lg p-4 md:p-6 hover:shadow-lg transition-shadow">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-slate-900 text-white flex items-center justify-center mb-3 md:mb-4">
              <Store className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <h3 className="text-lg md:text-xl font-semibold mb-2">提示词市场</h3>
            <p className="text-sm md:text-base text-slate-600">
              浏览数千个优质提示词，收藏喜欢的内容，将优秀提示词添加到自己的收藏。
            </p>
          </div>

          <div className="border border-slate-200 rounded-lg p-4 md:p-6 hover:shadow-lg transition-shadow">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-slate-900 text-white flex items-center justify-center mb-3 md:mb-4">
              <Upload className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <h3 className="text-lg md:text-xl font-semibold mb-2">版本控制</h3>
            <p className="text-sm md:text-base text-slate-600">
              为提示词创建版本快照，随时恢复到历史版本，不用担心误操作丢失内容。
            </p>
          </div>

          <div className="border border-slate-200 rounded-lg p-4 md:p-6 hover:shadow-lg transition-shadow">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-slate-900 text-white flex items-center justify-center mb-3 md:mb-4">
              <Share2 className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <h3 className="text-lg md:text-xl font-semibold mb-2">RSS 订阅分享</h3>
            <p className="text-sm md:text-base text-slate-600">
              生成专属 RSS 订阅链接，一键分享你的提示词库。完美兼容 Cherry Studio 订阅功能，实时同步更新。
            </p>
          </div>

          <div className="border border-slate-200 rounded-lg p-4 md:p-6 hover:shadow-lg transition-shadow">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-slate-900 text-white flex items-center justify-center mb-3 md:mb-4">
              <Download className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <h3 className="text-lg md:text-xl font-semibold mb-2">导入导出</h3>
            <p className="text-sm md:text-base text-slate-600">
              支持 Cherry Studio 格式的导入导出，轻松迁移和备份你的提示词库。
            </p>
          </div>
        </div>

        {/* 快速开始 */}
        <div className="bg-slate-50 rounded-lg p-6 md:p-8 text-center">
          <h2 className="text-xl md:text-2xl font-semibold mb-3 md:mb-4">准备好开始了吗？</h2>
          <p className="text-sm md:text-base text-slate-600 mb-4 md:mb-6 px-2">
            {session?.user
              ? '前往我的提示词开始管理你的 AI 提示词库'
              : '注册账号，开始管理你的 AI 提示词库'}
          </p>
          {session?.user ? (
            <Link href="/prompts" className="inline-block w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto">前往我的提示词</Button>
            </Link>
          ) : (
            <Link href="/register" className="inline-block w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto">免费注册</Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
