'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useRequest } from 'ahooks';
import { Download } from 'lucide-react';
import { useAlert } from '@/components/AlertProvider';

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedIds?: string[];
}

export function ExportDialog({ open, onOpenChange, selectedIds }: ExportDialogProps) {
  const { showAlert } = useAlert();
  const { loading, run: exportPrompts } = useRequest(
    async () => {
      const url = selectedIds && selectedIds.length > 0
        ? `/api/prompts/export?ids=${selectedIds.join(',')}`
        : '/api/prompts/export';

      const response = await fetch(url);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '导出失败');
      }

      return response.json();
    },
    {
      manual: true,
      onSuccess: (data) => {
        // 下载 JSON 文件
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `prompts-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        onOpenChange(false);
      },
      onError: (error) => {
        showAlert({ description: error.message });
      },
    }
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogClose onClick={() => onOpenChange(false)} />
        <DialogHeader>
          <DialogTitle>导出提示词</DialogTitle>
        </DialogHeader>

        <div className="mt-4 text-center py-8">
          <Download className="w-12 h-12 mx-auto mb-4 text-slate-400" />
          <p className="text-sm text-slate-600 mb-2">
            {selectedIds && selectedIds.length > 0
              ? `将导出 ${selectedIds.length} 个选中的提示词`
              : '将导出所有提示词'}
          </p>
          <p className="text-xs text-slate-500">
            导出格式符合 Cherry Studio 标准
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            取消
          </Button>
          <Button onClick={() => exportPrompts()} disabled={loading}>
            {loading ? '导出中...' : '确认导出'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

