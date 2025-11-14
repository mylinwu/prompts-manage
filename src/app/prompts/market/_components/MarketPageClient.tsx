'use client';

import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { useRequest } from 'ahooks';
import { useSession } from 'next-auth/react';
import { MarketPromptData } from '@/types/prompt';
import { MarketPromptCard } from '@/app/prompts/_components/MarketPromptCard';
import { PromptDetailDialog } from '@/app/prompts/_components/PromptDetailDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search } from 'lucide-react';
import { useAlert } from '@/components/AlertProvider';
import api from '@/lib/api-client';

export function MarketPageClient() {
  const { data: session } = useSession();
  const { showAlert } = useAlert();
  const [selectedGroup, setSelectedGroup] = useState('全部');
  const [searchText, setSearchText] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [prompts, setPrompts] = useState<MarketPromptData[]>([]);
  const [groups, setGroups] = useState<string[]>([]);
  const [groupCounts, setGroupCounts] = useState<Record<string, number>>({});
  const [selectedPrompt, setSelectedPrompt] = useState<MarketPromptData | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const observerTarget = useRef<HTMLDivElement>(null);

  // 获取市场提示词列表
  const { loading, run: fetchPrompts } = useRequest(
    async (pageNum: number, append: boolean = false) => {
      const params = new URLSearchParams();
      if (selectedGroup && selectedGroup !== '全部') {
        params.append('group', selectedGroup);
      }
      if (searchText.trim()) {
        params.append('search', searchText);
      }
      params.append('page', pageNum.toString());
      params.append('limit', '30');

      const url = `/market/prompts?${params.toString()}`;
      const data = await api.get(url);

      return { data, append };
    },
    {
      manual: true,
      cacheKey: `market-prompts-${selectedGroup || 'all'}-${searchText || ''}`,
      staleTime: 5 * 60 * 1000, // 5分钟缓存
      onSuccess: ({ data, append }) => {
        if (append) {
          setPrompts((prev) => {
            // 创建一个 Set 来存储已存在的 ID
            const existingIds = new Set(prev.map(p => p.id));
            // 只添加不重复的新数据
            const newPrompts = data.prompts.filter((p: MarketPromptData) => !existingIds.has(p.id));
            return [...prev, ...newPrompts];
          });
        } else {
          setPrompts(data.prompts);
        }
        setTotal(data.total);
        setHasMore(data.page < data.totalPages);
      },
    }
  );

  // 获取市场分组列表
  useRequest(
    async () => {
      const data = await api.get('/market/prompts/groups');
      return data;
    },
    {
      cacheKey: 'market-groups',
      staleTime: 10 * 60 * 1000, // 10分钟缓存
      onSuccess: (data) => {
        setGroups(data.groups);
        setGroupCounts({ '全部': data.total, ...data.groupCounts });
      },
    }
  );

  // 收藏/取消收藏
  const { run: toggleFavorite, loading: favoriteLoading } = useRequest(
    async (promptId: string) => {
      if (!session?.user) {
        showAlert({ description: '请先登录' });
        return;
      }

      return await api.post(`/market/prompts/${promptId}/favorite`);
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
        showAlert({ description: error.message });
      },
    }
  );

  // 克隆到我的提示词
  const { run: clonePrompt, loading: cloneLoading } = useRequest(
    async (promptId: string) => {
      if (!session?.user) {
        showAlert({ description: '请先登录' });
        window.location.href = '/login?callbackUrl=/prompts/market';
        return;
      }

      return await api.post(`/market/prompts/${promptId}/clone`);
    },
    {
      manual: true,
      onSuccess: () => {
        showAlert({ description: '已添加到我的提示词' });
      },
      onError: (error) => {
        showAlert({ description: error.message });
      },
    }
  );

  // 重置并加载第一页
  const resetAndFetch = useCallback(() => {
    setPage(1);
    setPrompts([]);
    setHasMore(true);
    // 清除相关缓存
    fetchPrompts(1, false);
  }, [fetchPrompts, selectedGroup, searchText]);

  // 加载更多
  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchPrompts(nextPage, true);
    }
  }, [loading, hasMore, page, fetchPrompts]);

  // 监听分组和搜索变化
  useEffect(() => {
    resetAndFetch();
  }, [selectedGroup, searchText, resetAndFetch]);

  // 触底加载
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, loading, loadMore]);

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


  return (
    <div className="flex h-[calc(100vh-3.5rem)] md:h-[calc(100vh-3rem)]">
      {/* 左侧分组导航 */}
      <div className="hidden md:block w-48 border-r border-slate-200 overflow-y-auto">
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
        <div className="border-b border-slate-200 p-3 md:p-4">
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <div className="flex items-center gap-2">
              <h1 className="text-lg md:text-xl font-semibold truncate">{searchText ? '搜索结果' : selectedGroup}</h1>
              <Badge variant="secondary" className="text-xs">{total}</Badge>
            </div>
          </div>

          {/* 搜索框 */}
          <div className="flex gap-1 md:gap-2">
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="搜索市场提示词..."
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSearch();
              }}
              className="flex-1 text-sm md:text-base"
            />
            <Button variant="outline" onClick={handleSearch} className="h-10">
              <Search className="w-4 h-4" />
            </Button>
            {searchText && (
              <Button variant="outline" onClick={handleSearchClear} className="hidden sm:flex h-10">
                清除
              </Button>
            )}
          </div>
        </div>

        {/* 提示词列表 */}
        <div className="flex-1 overflow-y-auto p-3 md:p-4">
          {prompts.length === 0 && !loading ? (
            <div className="text-center py-20 text-slate-500 text-sm md:text-base px-4">
              {searchText ? '没有找到相关提示词' : '暂无提示词'}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                {prompts.map((prompt) => (
                  <MarketPromptCard
                    key={prompt.id}
                    prompt={prompt}
                    onClick={() => handleDetail(prompt)}
                    onFavorite={() => toggleFavorite(prompt.id)}
                    onClone={() => clonePrompt(prompt.id)}
                    favoriteLoading={favoriteLoading}
                    cloneLoading={cloneLoading}
                  />
                ))}
              </div>
              {/* 触底加载触发器 */}
              <div ref={observerTarget} className="h-10 flex items-center justify-center mt-4">
                {loading && <div className="text-slate-500 text-sm">加载中...</div>}
                {!hasMore && prompts.length > 0 && (
                  <div className="text-slate-400 text-xs md:text-sm">已加载全部 {total} 条数据</div>
                )}
              </div>
            </>
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

