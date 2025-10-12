'use client';

import { useState, useMemo } from 'react';
import { useRequest } from 'ahooks';
import { useSession } from 'next-auth/react';
import { MarketPromptData } from '@/types/prompt';
import { MarketPromptCard } from '@/app/prompts/_components/MarketPromptCard';
import { PromptDetailDialog } from '@/app/prompts/_components/PromptDetailDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search } from 'lucide-react';

export function MarketPageClient() {
  const { data: session } = useSession();
  const [selectedGroup, setSelectedGroup] = useState('全部');
  const [searchText, setSearchText] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [prompts, setPrompts] = useState<MarketPromptData[]>([]);
  const [groups, setGroups] = useState<string[]>([]);
  const [selectedPrompt, setSelectedPrompt] = useState<MarketPromptData | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);

  // 获取市场提示词列表
  const { loading, run: fetchPrompts } = useRequest(
    async () => {
      const params = new URLSearchParams();
      if (selectedGroup && selectedGroup !== '全部') {
        params.append('group', selectedGroup);
      }
      if (searchText.trim()) {
        params.append('search', searchText);
      }

      const url = `/api/market/prompts${params.toString() ? '?' + params.toString() : ''}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('获取市场提示词失败');

      const data = await response.json();
      return data.prompts;
    },
    {
      onSuccess: (data) => {
        setPrompts(data);
      },
      refreshDeps: [selectedGroup, searchText],
    }
  );

  // 获取市场分组列表
  useRequest(
    async () => {
      const response = await fetch('/api/market/prompts/groups');
      if (!response.ok) throw new Error('获取分组失败');

      const data = await response.json();
      return data.groups;
    },
    {
      onSuccess: (data) => {
        setGroups(data);
      },
    }
  );

  // 收藏/取消收藏
  const { run: toggleFavorite } = useRequest(
    async (promptId: string) => {
      if (!session?.user) {
        alert('请先登录');
        return;
      }

      const response = await fetch(`/api/market/prompts/${promptId}/favorite`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('操作失败');

      return response.json();
    },
    {
      manual: true,
      onSuccess: (data, [promptId]) => {
        setPrompts((prev) =>
          prev.map((p) =>
            p.id === promptId
              ? {
                  ...p,
                  isFavorited: data.isFavorited,
                  favoriteCount: p.favoriteCount + (data.isFavorited ? 1 : -1),
                }
              : p
          )
        );
      },
      onError: (error) => {
        alert(error.message);
      },
    }
  );

  // 克隆到我的提示词
  const { run: clonePrompt } = useRequest(
    async (promptId: string) => {
      if (!session?.user) {
        alert('请先登录');
        window.location.href = '/login?callbackUrl=/prompts/market';
        return;
      }

      const response = await fetch(`/api/market/prompts/${promptId}/clone`, {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '克隆失败');
      }

      return response.json();
    },
    {
      manual: true,
      onSuccess: () => {
        alert('已添加到我的提示词');
      },
      onError: (error) => {
        alert(error.message);
      },
    }
  );

  const handleSearch = () => {
    setSearchText(searchInput);
  };

  const handleSearchClear = () => {
    setSearchInput('');
    setSearchText('');
  };

  const handleDetail = (prompt: MarketPromptData) => {
    setSelectedPrompt(prompt);
    setShowDetailDialog(true);
  };

  const groupCounts = useMemo(() => {
    const counts: Record<string, number> = { '全部': prompts.length };
    prompts.forEach((p) => {
      p.groups.forEach((g) => {
        counts[g] = (counts[g] || 0) + 1;
      });
    });
    return counts;
  }, [prompts]);

  return (
    <div className="flex h-[calc(100vh-3rem)]">
      {/* 左侧分组导航 */}
      <div className="w-48 border-r border-slate-200 overflow-y-auto">
        <div className="p-4 space-y-1">
          <button
            onClick={() => setSelectedGroup('全部')}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between ${
              selectedGroup === '全部' ? 'bg-slate-900 text-white' : 'hover:bg-slate-100'
            }`}
          >
            <span>全部</span>
            <Badge variant={selectedGroup === '全部' ? 'outline' : 'secondary'} className="text-xs">
              {groupCounts['全部'] || 0}
            </Badge>
          </button>
          {groups.map((group) => (
            <button
              key={group}
              onClick={() => setSelectedGroup(group)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between ${
                selectedGroup === group ? 'bg-slate-900 text-white' : 'hover:bg-slate-100'
              }`}
            >
              <span className="truncate">{group}</span>
              <Badge variant={selectedGroup === group ? 'outline' : 'secondary'} className="text-xs">
                {groupCounts[group] || 0}
              </Badge>
            </button>
          ))}
        </div>
      </div>

      {/* 右侧内容区域 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 头部 */}
        <div className="border-b border-slate-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold">{searchText ? '搜索结果' : selectedGroup}</h1>
              <Badge variant="secondary">{prompts.length}</Badge>
            </div>
          </div>

          {/* 搜索框 */}
          <div className="flex gap-2">
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="搜索市场提示词..."
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSearch();
              }}
              className="flex-1"
            />
            <Button variant="outline" onClick={handleSearch}>
              <Search className="w-4 h-4" />
            </Button>
            {searchText && (
              <Button variant="outline" onClick={handleSearchClear}>
                清除
              </Button>
            )}
          </div>
        </div>

        {/* 提示词列表 */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="text-center py-20 text-slate-500">加载中...</div>
          ) : prompts.length === 0 ? (
            <div className="text-center py-20 text-slate-500">
              {searchText ? '没有找到相关提示词' : '暂无提示词'}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {prompts.map((prompt) => (
                <MarketPromptCard
                  key={prompt.id}
                  prompt={prompt}
                  onClick={() => handleDetail(prompt)}
                  onFavorite={() => toggleFavorite(prompt.id)}
                  onClone={() => clonePrompt(prompt.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 详情对话框 */}
      <PromptDetailDialog
        open={showDetailDialog}
        onOpenChange={setShowDetailDialog}
        prompt={selectedPrompt}
      />
    </div>
  );
}

