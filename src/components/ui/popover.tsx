'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface PopoverProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

interface PopoverTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
}

interface PopoverContentProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: 'start' | 'center' | 'end';
  sideOffset?: number;
}

const PopoverContext = React.createContext<{
  open: boolean;
  setOpen: (open: boolean) => void;
}>({
  open: false,
  setOpen: () => {},
});

const Popover = ({ open: controlledOpen, onOpenChange, children }: PopoverProps) => {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  return (
    <PopoverContext.Provider value={{ open, setOpen }}>
      <div className="relative block">{children}</div>
    </PopoverContext.Provider>
  );
};

const PopoverTrigger = ({ children, asChild }: PopoverTriggerProps) => {
  const { open, setOpen } = React.useContext(PopoverContext);

  const handleClick = () => setOpen(!open);

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      onClick: handleClick,
    } as React.Attributes);
  }

  return <div onClick={handleClick}>{children}</div>;
};

const PopoverContent = React.forwardRef<HTMLDivElement, PopoverContentProps>(
  ({ className, align = 'center', children, ...props }, ref) => {
    const { open, setOpen } = React.useContext(PopoverContext);
    const contentRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (contentRef.current && !contentRef.current.contains(event.target as Node)) {
          setOpen(false);
        }
      };

      if (open) {
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
      }
    }, [open, setOpen]);

    if (!open) return null;

    return (
      <div
        ref={contentRef}
        className={cn(
          'absolute z-50 mt-2 w-72 rounded-md border border-slate-200 bg-white p-4 shadow-lg',
          {
            'left-0': align === 'start',
            'left-1/2 -translate-x-1/2': align === 'center',
            'right-0': align === 'end',
          },
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
PopoverContent.displayName = 'PopoverContent';

export { Popover, PopoverTrigger, PopoverContent };

