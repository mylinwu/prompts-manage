'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

const EmojiPickerReact = dynamic(() => import('emoji-picker-react'), {
  ssr: false,
  loading: () => <div className="w-[350px] h-[450px] flex items-center justify-center">加载中...</div>,
});

interface EmojiPickerProps {
  onEmojiClick: (emoji: string) => void;
}

export function EmojiPicker({ onEmojiClick }: EmojiPickerProps) {
  return (
    <Suspense fallback={<div className="w-[350px] h-[450px] flex items-center justify-center">加载中...</div>}>
      <EmojiPickerReact
        onEmojiClick={(emojiData) => onEmojiClick(emojiData.emoji)}
        width={350}
        height={450}
        searchPlaceHolder="搜索表情..."
        previewConfig={{ showPreview: false }}
      />
    </Suspense>
  );
}

