'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { EmojiPicker } from '@/components/EmojiPicker';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { MultiSelect } from '@/components/ui/multi-select';
import { useRequest } from 'ahooks';
import { cn } from '@/lib/utils';

interface CreatePromptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  availableGroups: string[];
}

export function CreatePromptDialog({ open, onOpenChange, onSuccess, availableGroups }: CreatePromptDialogProps) {
  const [name, setName] = useState('');
  const [prompt, setPrompt] = useState('');
  const [emoji, setEmoji] = useState('');
  const [description, setDescription] = useState('');
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const { loading, run: createPrompt } = useRequest(
    async () => {
      const response = await fetch('/api/prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, prompt, emoji, description, groups: selectedGroups }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '创建失败');
      }

      return response.json();
    },
    {
      manual: true,
      onSuccess: () => {
        onSuccess?.();
        handleClose();
      },
      onError: (error) => {
        alert(error.message);
      },
    }
  );

  const handleClose = () => {
    setName('');
    setPrompt('');
    setEmoji('');
    setDescription('');
    setSelectedGroups([]);
    onOpenChange(false);
  };

  const handleSubmit = () => {
    if (!name.trim() || !prompt.trim()) {
      alert('名称和提示词内容不能为空');
      return;
    }
    createPrompt();
  };


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogClose onClick={handleClose} />
        <DialogHeader>
          <DialogTitle>创建提示词</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Emoji 选择器 */}
          <div>
            <label className="block text-sm font-medium mb-2">Emoji</label>
            <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
              <PopoverTrigger>
                <Button type="button" variant="outline" className={cn("w-12 h-12", emoji ? "text-2xl" : "text-sm")}>
                  {emoji || '选择'}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start">
                <EmojiPicker
                  onEmojiClick={(selectedEmoji) => {
                    setEmoji(selectedEmoji);
                    setShowEmojiPicker(false);
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* 名称 */}
          <div>
            <label className="block text-sm font-medium mb-2">
              名称 <span className="text-red-500">*</span>
            </label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="输入名称" />
          </div>

          {/* 描述 */}
          <div>
            <label className="block text-sm font-medium mb-2">描述</label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="输入描述" />
          </div>

          {/* 分组 */}
          <div>
            <label className="block text-sm font-medium mb-2">分组</label>
            <MultiSelect
              options={availableGroups}
              selected={selectedGroups}
              onChange={setSelectedGroups}
              placeholder="选择或创建分组"
              allowCustom={true}
            />
          </div>
          
          {/* 提示词内容 */}
          <div>
            <label className="block text-sm font-medium mb-2">
              提示词 <span className="text-red-500">*</span>
            </label>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="输入提示词内容"
              rows={10}
              className="font-mono text-sm"
            />
            <div className="text-xs text-slate-500 mt-1">字符数: {prompt.length}</div>
          </div>

        </div>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? '创建中...' : '创建'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

