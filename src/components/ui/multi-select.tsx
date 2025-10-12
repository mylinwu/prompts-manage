'use client';

import * as React from 'react';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';

interface MultiSelectProps {
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  allowCustom?: boolean;
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = '选择...',
  allowCustom = false,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState('');

  const filteredOptions = React.useMemo(() => {
    if (!searchValue) return options;
    return options.filter((option) =>
      option.toLowerCase().includes(searchValue.toLowerCase())
    );
  }, [options, searchValue]);

  const handleSelect = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((item) => item !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const handleRemove = (value: string) => {
    onChange(selected.filter((item) => item !== value));
  };

  const handleAddCustom = () => {
    const trimmed = searchValue.trim();
    if (trimmed && !selected.includes(trimmed) && !options.includes(trimmed)) {
      onChange([...selected, trimmed]);
      setSearchValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && allowCustom && searchValue.trim()) {
      e.preventDefault();
      handleAddCustom();
    }
  };

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            <span className="truncate">
              {selected.length > 0
                ? `已选择 ${selected.length} 项`
                : placeholder}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <div className="p-2">
            <Input
              placeholder={allowCustom ? '搜索或输入新分组...' : '搜索...'}
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>
          <div className="max-h-60 pb-2 overflow-y-auto">
            {allowCustom && searchValue.trim() && !options.includes(searchValue.trim()) && (
              <div
                className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-slate-100 mx-2"
                onClick={handleAddCustom}
              >
                <span className="flex-1">创建 &quot;{searchValue.trim()}&quot;</span>
              </div>
            )}
            {filteredOptions.length === 0 && !allowCustom && (
              <div className="py-6 text-center text-sm text-slate-500">
                没有找到选项
              </div>
            )}
            {filteredOptions.map((option) => (
              <div
                key={option}
                className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-slate-100 mx-2"
                onClick={() => handleSelect(option)}
              >
                <Check
                  className={cn(
                    'mr-2 h-4 w-4',
                    selected.includes(option) ? 'opacity-100' : 'opacity-0'
                  )}
                />
                <span className="flex-1">{option}</span>
              </div>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      {/* 已选择的标签 */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selected.map((item) => (
            <Badge
              key={item}
              variant="secondary"
              className="flex items-center gap-1"
            >
              {item}
              <button
                type="button"
                onClick={() => handleRemove(item)}
                className="hover:text-red-500"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
