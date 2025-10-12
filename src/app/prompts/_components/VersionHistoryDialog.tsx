'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PromptVersionData } from '@/types/prompt';
import { useRequest } from 'ahooks';
import { RotateCcw, Plus, Copy, ChevronDown, ChevronUp } from 'lucide-react';
import { useAlert } from '@/components/AlertProvider';

interface VersionHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  promptId: string | null;
  onRestore?: () => void;
}

export function VersionHistoryDialog({ open, onOpenChange, promptId, onRestore }: VersionHistoryDialogProps) {
  const { showAlert, showConfirm } = useAlert();
  const [versions, setVersions] = useState<PromptVersionData[]>([]);
  const [showCreateVersion, setShowCreateVersion] = useState(false);
  const [versionDescription, setVersionDescription] = useState('');
  const [expandedVersions, setExpandedVersions] = useState<Set<string>>(new Set());

  const { loading: loadingVersions, run: fetchVersions } = useRequest(
    async () => {
      if (!promptId) return [];

      const response = await fetch(`/api/prompts/${promptId}/versions`);
      if (!response.ok) throw new Error('获取版本历史失败');

      const data = await response.json();
      return data.versions;
    },
    {
      manual: true,
      onSuccess: (data) => {
        setVersions(data);
      },
    }
  );

  const { loading: creatingVersion, run: createVersion } = useRequest(
    async () => {
      if (!promptId) return;

      const response = await fetch(`/api/prompts/${promptId}/versions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: versionDescription }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '创建版本失败');
      }

      return response.json();
    },
    {
      manual: true,
      onSuccess: () => {
        setVersionDescription('');
        setShowCreateVersion(false);
        fetchVersions();
      },
      onError: (error) => {
        showAlert({ description: error.message });
      },
    }
  );

  const { loading: restoring, run: restoreVersion } = useRequest(
    async (versionId: string) => {
      if (!promptId) return;

      const response = await fetch(`/api/prompts/${promptId}/restore/${versionId}`, {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '恢复版本失败');
      }

      return response.json();
    },
    {
      manual: true,
      onSuccess: () => {
        showAlert({ description: '版本恢复成功' });
        onRestore?.();
        onOpenChange(false);
      },
      onError: (error) => {
        showAlert({ description: error.message });
      },
    }
  );

  useEffect(() => {
    if (open && promptId) {
      fetchVersions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, promptId]);

  const handleRestore = async (versionId: string, versionNumber: number) => {
    const confirmed = await showConfirm({ 
      title: '确认恢复',
      description: `确定要恢复到版本 ${versionNumber} 吗？` 
    });
    if (confirmed) {
      restoreVersion(versionId);
    }
  };

  const handleCopy = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      showAlert({ description: '已复制到剪贴板' });
    } catch (error) {
      showAlert({ description: '复制失败' });
    }
  };

  const toggleExpand = (versionId: string) => {
    setExpandedVersions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(versionId)) {
        newSet.delete(versionId);
      } else {
        newSet.add(versionId);
      }
      return newSet;
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogClose onClick={() => onOpenChange(false)} />
        <DialogHeader>
          <DialogTitle>版本历史</DialogTitle>
        </DialogHeader>

        <div className="mt-4">
          {!showCreateVersion ? (
            <Button onClick={() => setShowCreateVersion(true)} className="w-full mb-4">
              <Plus className="w-4 h-4 mr-2" />
              创建版本快照
            </Button>
          ) : (
            <div className="mb-4 p-4 border border-slate-200 rounded-lg">
              <Input
                value={versionDescription}
                onChange={(e) => setVersionDescription(e.target.value)}
                placeholder="版本说明（可选）"
                className="mb-2"
              />
              <div className="flex gap-2">
                <Button onClick={() => createVersion()} disabled={creatingVersion} size="sm">
                  {creatingVersion ? '创建中...' : '确认创建'}
                </Button>
                <Button
                  onClick={() => {
                    setShowCreateVersion(false);
                    setVersionDescription('');
                  }}
                  variant="outline"
                  size="sm"
                >
                  取消
                </Button>
              </div>
            </div>
          )}

          {loadingVersions ? (
            <div className="text-center py-8 text-slate-500">加载中...</div>
          ) : versions.length === 0 ? (
            <div className="text-center py-8 text-slate-500">暂无版本历史</div>
          ) : (
            <div className="space-y-2">
              {versions.map((version) => {
                const isExpanded = expandedVersions.has(version.id);
                return (
                  <div key={version.id} className="p-4 border border-slate-200 rounded-lg hover:border-slate-300 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold">版本 {version.version}</span>
                          <span className="text-xs text-slate-500">
                            {new Date(version.createdAt).toLocaleString('zh-CN')}
                          </span>
                        </div>
                        {version.description && (
                          <p className="text-sm text-slate-600 mb-2">{version.description}</p>
                        )}
                        <p className="text-xs text-slate-500 mb-1">名称: {version.name}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCopy(version.prompt)}
                          title="复制内容"
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRestore(version.id, version.version)}
                          disabled={restoring}
                        >
                          <RotateCcw className="w-3 h-3 mr-1" />
                          恢复
                        </Button>
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 mb-1">
                        内容: 
                      </div>
                      <div className="relative">
                        <pre className={`text-xs bg-slate-50 p-2 rounded border border-slate-200 whitespace-pre-wrap break-words font-mono ${
                          isExpanded ? '' : 'line-clamp-3'
                        }`}>
                          {version.prompt}
                        </pre>
                        {version.prompt.length > 100 && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => toggleExpand(version.id)}
                            className="mt-1 h-6 text-xs"
                          >
                            {isExpanded ? (
                              <>
                                <ChevronUp className="w-3 h-3 mr-1" />
                                收起
                              </>
                            ) : (
                              <>
                                <ChevronDown className="w-3 h-3 mr-1" />
                                展开查看全部
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

