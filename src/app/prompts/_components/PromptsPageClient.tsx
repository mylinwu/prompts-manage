'use client';

import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { useRequest } from 'ahooks';
import { useSession } from 'next-auth/react';
import { PromptData } from '@/types/prompt';
import { PromptCard } from './PromptCard';
import { CreatePromptDialog } from './CreatePromptDialog';
import { EditPromptDialog } from './EditPromptDialog';
import { VersionHistoryDialog } from './VersionHistoryDialog';
import { ImportDialog } from './ImportDialog';
import { ExportDialog } from './ExportDialog';
import { PromptDetailDialog } from './PromptDetailDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Upload, Download, Search, Share2 } from 'lucide-react';
import { useAlert } from '@/components/AlertProvider';
import api from '@/lib/api-client';

const promptsCache: Record<string, { data: any; expiry: number }> = {};

const invalidatePromptsCache = () => {
  Object.keys(promptsCache).forEach((key) => {
    delete promptsCache[key];
  });
};

export function PromptsPageClient() {
  const { showAlert, showConfirm } = useAlert();
  const { data: session } = useSession();
  const [selectedGroup, setSelectedGroup] = useState('全部');
  const [searchText, setSearchText] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [prompts, setPrompts] = useState<PromptData[]>([]);
  const [groups, setGroups] = useState<string[]>([]);
  const [groupCounts, setGroupCounts] = useState<Record<string, number>>({});
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const observerTarget = useRef<HTMLDivElement>(null);
  const [isSharing, setIsSharing] = useState(false);

  // 对话框状态
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showVersionDialog, setShowVersionDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState<PromptData | null>(null);

  // 获取提示词列表（分页 + 缓存）
  const { loading, run: fetchPrompts } = useRequest(
    async (pageNum: number, append: boolean = false) => {
      const params = new URLSearchParams();
      if (selectedGroup && selectedGroup !== '全部') {
        params.append('group', selectedGroup);
      }
      params.append('page', pageNum.toString());
      params.append('pageSize', '30');

      const cacheKey = `prompts:${selectedGroup || '全部'}:${pageNum}`;
      const now = Date.now();
      const cached = promptsCache[cacheKey];
      if (cached && cached.expiry > now) {
        return { data: cached.data, append };
      }

      const url = `/prompts?${params.toString()}`;
      const data = await api.get(url);
      promptsCache[cacheKey] = {
        data,
        expiry: now + 5 * 60 * 1000,
      };

      return { data, append };
    },
    {
      manual: true,
      onSuccess: ({ data, append }) => {
        if (append) {
          setPrompts((prev) => {
            const existingIds = new Set(prev.map((p) => p.id));
            const newPrompts = data.prompts.filter((p: PromptData) => !existingIds.has(p.id));
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

  // 获取分组列表（基于所有数据的统计）
  useRequest(
    async () => {
      const data = await api.get('/prompts/groups');
      return data;
    },
    {
      onSuccess: (data) => {
        setGroups(data.groups);
        setGroupCounts({ '全部': data.total, ...data.groupCounts });
        setTotal(data.total);
      },
    }
  );

  // 重置并加载第一页
  const resetAndFetch = useCallback(() => {
    setPage(1);
    setPrompts([]);
    setHasMore(true);
    const cacheKeyPrefix = `prompts:${selectedGroup || '全部'}:`;
    Object.keys(promptsCache).forEach((key) => {
      if (key.startsWith(cacheKeyPrefix)) {
        delete promptsCache[key];
      }
    });
    fetchPrompts(1, false);
  }, [fetchPrompts, selectedGroup]);

  // 分组变化时重新加载
  useEffect(() => {
    resetAndFetch();
  }, [selectedGroup, resetAndFetch]);

  // 加载更多
  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchPrompts(nextPage, true);
    }
  }, [loading, hasMore, page, fetchPrompts]);

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

  // 删除提示词
  const { run: deletePrompt } = useRequest(
    async (id: string) => {
      await api.delete(`/prompts/${id}`);
    },
    {
      manual: true,
      onSuccess: () => {
        invalidatePromptsCache();
        resetAndFetch();
      },
      onError: (error) => {
        showAlert({ description: error.message });
      },
    }
  );

  // 发布到市场
  const { run: publishToMarket } = useRequest(
    async (promptId: string) => {
      return await api.post('/market/publish', { promptId });
    },
    {
      manual: true,
      onSuccess: (data) => {
        showAlert({ description: data.message });
        invalidatePromptsCache();
        resetAndFetch();
      },
      onError: (error) => {
        showAlert({ description: error.message });
      },
    }
  );

  // 过滤提示词
  const filteredPrompts = useMemo(() => {
    if (!searchText.trim()) return prompts;

    return prompts.filter(
      (p) =>
        p.name.toLowerCase().includes(searchText.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchText.toLowerCase()) ||
        p.prompt.toLowerCase().includes(searchText.toLowerCase())
    );
  }, [prompts, searchText]);

  const handleSearch = () => {
    setSearchText(searchInput);
  };

  const handleSearchClear = () => {
    setSearchInput('');
    setSearchText('');
  };

  const handleEdit = (prompt: PromptData) => {
    setSelectedPrompt(prompt);
    setShowEditDialog(true);
  };

  const handleDelete = async (prompt: PromptData) => {
    const confirmed = await showConfirm({ 
      title: '确认删除',
      description: `确定要删除「${prompt.name}」吗？` 
    });
    if (confirmed) {
      deletePrompt(prompt.id);
    }
  };

  const handleVersion = (prompt: PromptData) => {
    setSelectedPrompt(prompt);
    setShowVersionDialog(true);
  };

  const handlePublish = async (prompt: PromptData) => {
    const confirmed = await showConfirm({ 
      title: '确认发布',
      description: `确定要${prompt.isPublished ? '更新' : '发布'}「${prompt.name}」到市场吗？` 
    });
    if (confirmed) {
      publishToMarket(prompt.id);
    }
  };

  const handleShare = async () => {
    if (!session?.user?.id) {
      showAlert({ description: '请先登录' });
      return;
    }

    setIsSharing(true);
    try {
      // 1. 刷新缓存
      await api.post('/prompts/rss?invalidate=true');

      // 2. 在新窗口打开 RSS feed
      const userId = session.user.id;
      window.open(`/api/prompts/rss?userId=${userId}`, '_blank');
    } catch (error) {
      showAlert({ 
        description: error instanceof Error ? error.message : '操作失败，请稍后重试' 
      });
    } finally {
      setIsSharing(false);
    }
  };

  const handleDetail = (prompt: PromptData) => {
    setSelectedPrompt(prompt);
    setShowDetailDialog(true);
  };

  const currentTotal = useMemo(() => {
    if (selectedGroup === '全部') {
      return groupCounts['全部'] || 0;
    }
    return groupCounts[selectedGroup] || 0;
  }, [groupCounts, selectedGroup]);

  return (
    <div className="flex h-[calc(100vh-3.5rem)] md:h-[calc(100vh-3rem)]">
      {/* 左侧分组导航 */}
      <div className="hidden md:block w-48 border-r border-slate-200 overflow-y-auto">
        <div className="p-4 space-y-1">
          <button
            onClick={() => setSelectedGroup('全部')}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between ${
              selectedGroup === '全部'
                ? 'bg-slate-900 text-white'
                : 'hover:bg-slate-100'
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
                selectedGroup === group
                  ? 'bg-slate-900 text-white'
                  : 'hover:bg-slate-100'
              }`}
            >
              <span>{group}</span>
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
              <h1 className="text-lg md:text-xl font-semibold truncate">
                {searchText ? '搜索结果' : selectedGroup}
              </h1>
              <Badge variant="secondary" className="text-xs">{currentTotal}</Badge>
            </div>
            <div className="flex items-center gap-1 md:gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowImportDialog(true)} className="hidden sm:flex">
                <Upload className="w-4 h-4 md:mr-1" />
                <span className="hidden md:inline">导入</span>
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowExportDialog(true)} className="hidden sm:flex">
                <Download className="w-4 h-4 md:mr-1" />
                <span className="hidden md:inline">导出</span>
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleShare}
                disabled={isSharing || !session?.user?.id}
              >
                <Share2 className="w-4 h-4 md:mr-1" />
                <span className="hidden md:inline">
                  {isSharing ? '生成中...' : '分享'}
                </span>
              </Button>
              <Button size="sm" onClick={() => setShowCreateDialog(true)}>
                <Plus className="w-4 h-4 md:mr-1" />
                <span className="hidden sm:inline">创建</span>
              </Button>
            </div>
          </div>

          {/* 搜索框 */}
          <div className="flex gap-1 md:gap-2">
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="搜索提示词..."
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
        <div className="flex-1 overflow-y-auto p-3 md:p-4 relative">
          {filteredPrompts.length === 0 && !loading ? (
            <div className="text-center py-20 text-slate-500 text-sm md:text-base px-4">
              {searchText ? '没有找到相关提示词' : '暂无提示词，点击创建按钮开始'}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                {filteredPrompts.map((prompt) => (
                  <PromptCard
                    key={prompt.id}
                    prompt={prompt}
                    onClick={() => handleDetail(prompt)}
                    onEdit={() => handleEdit(prompt)}
                    onDelete={() => handleDelete(prompt)}
                    onVersion={() => handleVersion(prompt)}
                    onPublish={() => handlePublish(prompt)}
                  />
                ))}
              </div>
              <div ref={observerTarget} className="h-10 flex items-center justify-center mt-4">
                {loading && <div className="text-slate-500 text-sm">加载中...</div>}
                {!hasMore && prompts.length > 0 && (
                  <div className="text-slate-400 text-xs md:text-sm">已加载全部 {currentTotal} 条数据</div>
                )}
              </div>
              {loading && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
                  <div className="text-slate-600 text-sm md:text-base">加载中...</div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* 对话框 */}
      <CreatePromptDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={() => {
          invalidatePromptsCache();
          resetAndFetch();
        }}
        availableGroups={groups}
      />

      <EditPromptDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        prompt={selectedPrompt}
        onSuccess={() => {
          invalidatePromptsCache();
          resetAndFetch();
        }}
        availableGroups={groups}
        onVersionHistory={(promptId) => {
          setShowEditDialog(false);
          setShowVersionDialog(true);
        }}
      />

      <VersionHistoryDialog
        open={showVersionDialog}
        onOpenChange={setShowVersionDialog}
        promptId={selectedPrompt?.id || null}
        onRestore={() => {
          invalidatePromptsCache();
          resetAndFetch();
        }}
      />

      <ImportDialog
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
        onSuccess={() => {
          invalidatePromptsCache();
          resetAndFetch();
        }}
      />

      <ExportDialog open={showExportDialog} onOpenChange={setShowExportDialog} />

      <PromptDetailDialog
        open={showDetailDialog}
        onOpenChange={setShowDetailDialog}
        prompt={selectedPrompt}
      />
    </div>
  );
}

