'use client';

import { PromptData } from '@/types/prompt';
import { Edit, MoreVertical, Trash2, FileText, Upload } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Badge } from '@/components/ui/badge';

interface PromptCardProps {
  prompt: PromptData;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onVersion?: () => void;
  onPublish?: () => void;
  isMyPrompts?: boolean;
}

export function PromptCard({
  prompt,
  onClick,
  onEdit,
  onDelete,
  onVersion,
  onPublish,
  isMyPrompts = true,
}: PromptCardProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const displayText = (prompt.description || prompt.prompt).substring(0, 200);

  return (
    <div
      ref={cardRef}
      className="relative h-full rounded-lg border border-slate-200 bg-white p-4 cursor-pointer transition-all hover:shadow-lg hover:-translate-y-0.5 overflow-hidden"
      onClick={onClick}
    >
      {isVisible && (
        <div className="h-full flex flex-col animate-fade-in">
          {/* 背景 emoji */}
          {prompt.emoji && (
            <div className="absolute -right-12 top-0 h-full flex items-center justify-center opacity-10 blur-xl pointer-events-none text-[200px]">
              {prompt.emoji}
            </div>
          )}

          {/* 头部 */}
          <div className="flex items-start justify-between gap-2 relative z-10">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-base leading-tight line-clamp-1 mb-2">
                {prompt.name}
              </h3>
              <div className="flex flex-wrap gap-1">
                {prompt.groups.map((group) => (
                  <Badge key={group} variant="secondary" className="text-xs">
                    {group}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex items-start gap-2 flex-shrink-0">
              {prompt.emoji && (
                <div className="w-11 h-11 rounded-lg bg-slate-100 flex items-center justify-center text-2xl">
                  {prompt.emoji}
                </div>
              )}
              {isMyPrompts && (
                <div className="relative">
                  <button
                    className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMenu(!showMenu);
                    }}
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                  {showMenu && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowMenu(false);
                        }}
                      />
                      <div className="absolute right-0 mt-1 w-40 rounded-md bg-white shadow-lg border border-slate-200 py-1 z-20">
                        <button
                          className="w-full px-4 py-2 text-sm text-left hover:bg-slate-100 flex items-center gap-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowMenu(false);
                            onEdit?.();
                          }}
                        >
                          <Edit className="w-4 h-4" />
                          编辑
                        </button>
                        <button
                          className="w-full px-4 py-2 text-sm text-left hover:bg-slate-100 flex items-center gap-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowMenu(false);
                            onVersion?.();
                          }}
                        >
                          <FileText className="w-4 h-4" />
                          版本历史
                        </button>
                        <button
                          className="w-full px-4 py-2 text-sm text-left hover:bg-slate-100 flex items-center gap-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowMenu(false);
                            onPublish?.();
                          }}
                        >
                          <Upload className="w-4 h-4" />
                          {prompt.isPublished ? '更新到市场' : '发布到市场'}
                        </button>
                        <button
                          className="w-full px-4 py-2 text-sm text-left hover:bg-slate-100 flex items-center gap-2 text-red-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowMenu(false);
                            onDelete?.();
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                          删除
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 内容 */}
          <div className="flex-1 mt-4 relative z-10">
            <div className="bg-slate-50 rounded-lg p-2 h-full">
              <p className="text-sm text-slate-600 line-clamp-3 leading-relaxed">
                {displayText}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

