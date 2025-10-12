'use client';

import { MarketPromptData } from '@/types/prompt';
import { Heart, Download } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Badge } from '@/components/ui/badge';

interface MarketPromptCardProps {
  prompt: MarketPromptData;
  onClick?: () => void;
  onFavorite?: () => void;
  onClone?: () => void;
}

export function MarketPromptCard({ prompt, onClick, onFavorite, onClone }: MarketPromptCardProps) {
  const [isVisible, setIsVisible] = useState(false);
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

            {prompt.emoji && (
              <div className="w-11 h-11 rounded-lg bg-slate-100 flex items-center justify-center text-2xl flex-shrink-0">
                {prompt.emoji}
              </div>
            )}
          </div>

          {/* 内容 */}
          <div className="flex-1 mt-4 relative z-10">
            <div className="bg-slate-50 rounded-lg p-2 h-full">
              <p className="text-sm text-slate-600 line-clamp-3 leading-relaxed">
                {displayText}
              </p>
            </div>
          </div>

          {/* 底部操作 */}
          <div className="flex items-center justify-between mt-3 relative z-10">
            <button
              className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm transition-colors ${
                prompt.isFavorited
                  ? 'bg-red-50 text-red-600 hover:bg-red-100'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
              onClick={(e) => {
                e.stopPropagation();
                onFavorite?.();
              }}
            >
              <Heart className={`w-4 h-4 ${prompt.isFavorited ? 'fill-current' : ''}`} />
              {prompt.favoriteCount}
            </button>
            <button
              className="flex items-center gap-1 px-3 py-1.5 rounded-md text-sm bg-slate-900 text-white hover:bg-slate-800 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                onClone?.();
              }}
            >
              <Download className="w-4 h-4" />
              添加到我的
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

