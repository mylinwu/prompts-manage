'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { EmojiPicker } from '@/components/EmojiPicker';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { MultiSelect } from '@/components/ui/multi-select';
import { PromptData } from '@/types/prompt';
import { useRequest } from 'ahooks';
import { History } from 'lucide-react';
import { useAlert } from '@/components/AlertProvider';
import { cn } from '@/lib/utils';
import api from '@/lib/api-client';

interface EditPromptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prompt: PromptData | null;
  onSuccess?: () => void;
  availableGroups: string[];
  onVersionHistory?: (promptId: string) => void;
}

export function EditPromptDialog({ open, onOpenChange, prompt, onSuccess, availableGroups, onVersionHistory }: EditPromptDialogProps) {
  const { showAlert } = useAlert();
  const [name, setName] = useState('');
  const [promptText, setPromptText] = useState('');
  const [emoji, setEmoji] = useState('');
  const [description, setDescription] = useState('');
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [versionDescription, setVersionDescription] = useState('');
  const [showCreateVersion, setShowCreateVersion] = useState(false);

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
      return await api.patch(`/prompts/${prompt.id}`, { name, prompt: promptText, emoji, description, groups: selectedGroups });
    },
    {
      manual: true,
      onSuccess: () => {
        onSuccess?.();
        onOpenChange(false);
      },
      onError: (error) => {
        showAlert({ description: error.message });
      },
    }
  );

  const { loading: creatingVersion, run: createVersion } = useRequest(
    async () => {
      if (!prompt) return;
      return await api.post(`/prompts/${prompt.id}/versions`, { description: versionDescription });
    },
    {
      manual: true,
      onSuccess: () => {
        setVersionDescription('');
        setShowCreateVersion(false);
        showAlert({ description: '保存并创建版本成功' });
        onSuccess?.();
        onOpenChange(false);
      },
      onError: (error) => {
        showAlert({ description: error.message });
      },
    }
  );

  const handleSubmit = async () => {
    if (!name.trim() || !promptText.trim()) {
      showAlert({ description: '名称和提示词内容不能为空' });
      return;
    }
    
    // 如果是创建版本模式，先保存再创建版本
    if (showCreateVersion) {
      try {
        await updatePrompt();
        await createVersion();
      } catch (error) {
        // 错误已在各自的 onError 中处理
      }
    } else {
      updatePrompt();
    }
  };


  if (!prompt) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-[95vw] md:w-full">
        <DialogClose onClick={() => onOpenChange(false)} />
        <DialogHeader>
          <DialogTitle>编辑提示词</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 md:space-y-4 mt-3 md:mt-4">
          {/* Emoji 选择器 */}
          <div>
            <label className="block text-xs md:text-sm font-medium mb-1 md:mb-2">Emoji</label>
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
            <label className="block text-xs md:text-sm font-medium mb-1 md:mb-2">
              名称 <span className="text-red-500">*</span>
            </label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="输入名称" className="text-sm md:text-base" />
          </div>

          {/* 描述 */}
          <div>
            <label className="block text-xs md:text-sm font-medium mb-1 md:mb-2">描述</label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="输入描述" className="text-sm md:text-base" />
          </div>

          {/* 分组 */}
          <div>
            <label className="block text-xs md:text-sm font-medium mb-1 md:mb-2">分组</label>
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
            <label className="block text-xs md:text-sm font-medium mb-1 md:mb-2">
              提示词 <span className="text-red-500">*</span>
            </label>
            <Textarea
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              placeholder="输入提示词内容"
              rows={8}
              className="font-mono text-xs md:text-sm"
            />
            <div className="text-xs text-slate-500 mt-1">字符数: {promptText.length}</div>
          </div>

        </div>

        <DialogFooter className="mt-4 md:mt-6 flex-col sm:flex-row gap-2">
          <div className="flex flex-col sm:flex-row gap-2 w-full">
            <div className="flex gap-2 flex-1">
              {!showCreateVersion && (
                <Button 
                  variant="outline" 
                  onClick={() => onVersionHistory?.(prompt?.id || '')} 
                  disabled={loading}
                  className="flex-1 sm:flex-initial"
                >
                  <History className="w-4 h-4 mr-2" />
                  版本历史
                </Button>
              )}
              {!showCreateVersion ? (
                <Button 
                  variant="outline" 
                  onClick={() => setShowCreateVersion(true)} 
                  disabled={loading}
                  className="flex-1 sm:flex-initial"
                >
                  创建版本
                </Button>
              ) : (
                <div className="flex gap-2 flex-1 mr-8">
                  <Input
                    value={versionDescription}
                    onChange={(e) => setVersionDescription(e.target.value)}
                    placeholder="版本说明（可选）"
                    className="flex-1"
                  />
                  <Button
                    onClick={() => {
                      setShowCreateVersion(false);
                      setVersionDescription('');
                    }}
                    variant="outline"
                  >
                    取消
                  </Button>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading} className="flex-1 sm:flex-initial">
                取消
              </Button>
              <Button onClick={handleSubmit} disabled={loading || creatingVersion} className="flex-1 sm:flex-initial">
                {loading || creatingVersion ? '保存中...' : (showCreateVersion ? '保存为新版本' : '保存')}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

