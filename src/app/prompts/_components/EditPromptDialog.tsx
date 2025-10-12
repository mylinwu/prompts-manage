'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { EmojiPicker } from '@/components/EmojiPicker';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { PromptData } from '@/types/prompt';
import { useRequest } from 'ahooks';

interface EditPromptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prompt: PromptData | null;
  onSuccess?: () => void;
  availableGroups: string[];
}

export function EditPromptDialog({ open, onOpenChange, prompt, onSuccess, availableGroups }: EditPromptDialogProps) {
  const [name, setName] = useState('');
  const [promptText, setPromptText] = useState('');
  const [emoji, setEmoji] = useState('');
  const [description, setDescription] = useState('');
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [newGroup, setNewGroup] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  useEffect(() => {
    if (prompt) {
      setName(prompt.name);
      setPromptText(prompt.prompt);
      setEmoji(prompt.emoji || '');
      setDescription(prompt.description || '');
      setSelectedGroups(prompt.groups || []);
    }
  }, [prompt]);

  const { loading, run: updatePrompt } = useRequest(
    async () => {
      if (!prompt) return;

      const response = await fetch(`/api/prompts/${prompt.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, prompt: promptText, emoji, description, groups: selectedGroups }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '更新失败');
      }

      return response.json();
    },
    {
      manual: true,
      onSuccess: () => {
        onSuccess?.();
        onOpenChange(false);
      },
      onError: (error) => {
        alert(error.message);
      },
    }
  );

  const handleSubmit = () => {
    if (!name.trim() || !promptText.trim()) {
      alert('名称和提示词内容不能为空');
      return;
    }
    updatePrompt();
  };

  const handleAddGroup = () => {
    if (newGroup.trim() && !selectedGroups.includes(newGroup.trim())) {
      setSelectedGroups([...selectedGroups, newGroup.trim()]);
      setNewGroup('');
    }
  };

  if (!prompt) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogClose onClick={() => onOpenChange(false)} />
        <DialogHeader>
          <DialogTitle>编辑提示词</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Emoji 选择器 */}
          <div>
            <label className="block text-sm font-medium mb-2">Emoji</label>
            <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
              <PopoverTrigger>
                <Button type="button" variant="outline" className="w-20 h-20 text-3xl">
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

          {/* 提示词内容 */}
          <div>
            <label className="block text-sm font-medium mb-2">
              提示词 <span className="text-red-500">*</span>
            </label>
            <Textarea
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              placeholder="输入提示词内容"
              rows={10}
              className="font-mono text-sm"
            />
            <div className="text-xs text-slate-500 mt-1">字符数: {promptText.length}</div>
          </div>

          {/* 分组 */}
          <div>
            <label className="block text-sm font-medium mb-2">分组</label>
            <div className="flex gap-2 mb-2">
              <Input
                value={newGroup}
                onChange={(e) => setNewGroup(e.target.value)}
                placeholder="输入新分组或从下方选择"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddGroup();
                  }
                }}
              />
              <Button type="button" onClick={handleAddGroup} variant="outline">
                添加
              </Button>
            </div>
            {availableGroups.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {availableGroups.map((group) => (
                  <button
                    key={group}
                    type="button"
                    onClick={() => {
                      if (!selectedGroups.includes(group)) {
                        setSelectedGroups([...selectedGroups, group]);
                      }
                    }}
                    className="px-2 py-1 text-xs rounded-md bg-slate-100 hover:bg-slate-200 transition-colors"
                  >
                    {group}
                  </button>
                ))}
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              {selectedGroups.map((group) => (
                <span
                  key={group}
                  className="px-2 py-1 text-xs rounded-md bg-slate-900 text-white flex items-center gap-1"
                >
                  {group}
                  <button
                    type="button"
                    onClick={() => setSelectedGroups(selectedGroups.filter((g) => g !== group))}
                    className="hover:text-red-300"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? '保存中...' : '保存'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

