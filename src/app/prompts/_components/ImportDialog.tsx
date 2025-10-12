'use client';

import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useRequest } from 'ahooks';
import { Upload } from 'lucide-react';

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function ImportDialog({ open, onOpenChange, onSuccess }: ImportDialogProps) {
  const [fileContent, setFileContent] = useState<unknown[] | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { loading, run: importPrompts } = useRequest(
    async () => {
      const response = await fetch('/api/prompts/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agents: fileContent }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '导入失败');
      }

      return response.json();
    },
    {
      manual: true,
      onSuccess: (data) => {
        alert(data.message || '导入成功');
        onSuccess?.();
        handleClose();
      },
      onError: (error) => {
        alert(error.message);
      },
    }
  );

  const handleClose = () => {
    setFileContent(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onOpenChange(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (!Array.isArray(json)) {
          alert('文件格式错误：必须是数组格式');
          return;
        }
        setFileContent(json);
      } catch {
        alert('文件解析失败：请确保是有效的 JSON 格式');
      }
    };
    reader.readAsText(file);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogClose onClick={handleClose} />
        <DialogHeader>
          <DialogTitle>导入提示词</DialogTitle>
        </DialogHeader>

        <div className="mt-4">
          <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center">
            <Upload className="w-12 h-12 mx-auto mb-4 text-slate-400" />
            <p className="text-sm text-slate-600 mb-4">
              选择符合 Cherry Studio 格式的 JSON 文件
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload">
              <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                选择文件
              </Button>
            </label>
          </div>

          {fileContent && (
            <div className="mt-4 p-4 bg-slate-50 rounded-lg">
              <p className="text-sm font-medium mb-2">文件信息</p>
              <p className="text-sm text-slate-600">
                将导入 <span className="font-semibold">{fileContent.length}</span> 个提示词
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            取消
          </Button>
          <Button onClick={() => importPrompts()} disabled={!fileContent || loading}>
            {loading ? '导入中...' : '确认导入'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

