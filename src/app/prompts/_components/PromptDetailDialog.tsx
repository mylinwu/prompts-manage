'use client';

import { Dialog, DialogContent, DialogClose } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { PromptData, MarketPromptData } from '@/types/prompt';
import ReactMarkdown from 'react-markdown';
import { Copy } from 'lucide-react';
import { useAlert } from '@/components/AlertProvider';

interface PromptDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prompt: PromptData | MarketPromptData | null;
}

export function PromptDetailDialog({ open, onOpenChange, prompt }: PromptDetailDialogProps) {
  const { showAlert } = useAlert();
  
  if (!prompt) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(prompt.prompt);
    showAlert({ description: '已复制到剪贴板' });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogClose onClick={() => onOpenChange(false)} />

        <div className="space-y-4">
          {/* 头部 */}
          <div className="flex items-start gap-4">
            {prompt.emoji && (
              <div className="w-16 h-16 rounded-lg bg-slate-100 flex items-center justify-center text-4xl flex-shrink-0">
                {prompt.emoji}
              </div>
            )}
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2">{prompt.name}</h2>
              {prompt.description && (
                <p className="text-slate-600 mb-3">{prompt.description}</p>
              )}
              <div className="flex flex-wrap gap-2">
                {prompt.groups.map((group) => (
                  <Badge key={group} variant="secondary">
                    {group}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* 提示词内容 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">提示词内容</h3>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 px-3 py-1 text-sm rounded-md bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                <Copy className="w-4 h-4" />
                复制
              </button>
            </div>
            <div className="bg-slate-50 rounded-lg p-4 max-h-96 overflow-y-auto">
              <div className="markdown-content text-sm">
                <ReactMarkdown>{prompt.prompt}</ReactMarkdown>
              </div>
            </div>
          </div>

          {/* 元信息 */}
          {'createdAt' in prompt && (
            <div className="text-xs text-slate-500 border-t pt-3">
              <p>创建时间: {new Date(prompt.createdAt).toLocaleString('zh-CN')}</p>
              {'updatedAt' in prompt && (
                <p>更新时间: {new Date(prompt.updatedAt).toLocaleString('zh-CN')}</p>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

