'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface AlertOptions {
  title?: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  showCancel?: boolean;
}

interface AlertContextType {
  showAlert: (options: AlertOptions) => void;
  showConfirm: (options: AlertOptions) => Promise<boolean>;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export function AlertProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<AlertOptions>({
    title: '提示',
    description: '',
    confirmText: '确定',
    cancelText: '取消',
    showCancel: false,
  });
  const [resolvePromise, setResolvePromise] = useState<((value: boolean) => void) | null>(null);

  const showAlert = useCallback((opts: AlertOptions) => {
    setOptions({
      title: opts.title || '提示',
      description: opts.description,
      confirmText: opts.confirmText || '确定',
      cancelText: opts.cancelText || '取消',
      onConfirm: opts.onConfirm,
      onCancel: opts.onCancel,
      showCancel: opts.showCancel || false,
    });
    setOpen(true);
  }, []);

  const showConfirm = useCallback((opts: AlertOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setOptions({
        title: opts.title || '确认',
        description: opts.description,
        confirmText: opts.confirmText || '确定',
        cancelText: opts.cancelText || '取消',
        showCancel: true,
      });
      setResolvePromise(() => resolve);
      setOpen(true);
    });
  }, []);

  const handleConfirm = () => {
    options.onConfirm?.();
    if (resolvePromise) {
      resolvePromise(true);
      setResolvePromise(null);
    }
    setOpen(false);
  };

  const handleCancel = () => {
    options.onCancel?.();
    if (resolvePromise) {
      resolvePromise(false);
      setResolvePromise(null);
    }
    setOpen(false);
  };

  return (
    <AlertContext.Provider value={{ showAlert, showConfirm }}>
      {children}
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{options.title}</AlertDialogTitle>
            <AlertDialogDescription>{options.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            {options.showCancel && (
              <AlertDialogCancel onClick={handleCancel}>{options.cancelText}</AlertDialogCancel>
            )}
            <AlertDialogAction onClick={handleConfirm}>{options.confirmText}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AlertContext.Provider>
  );
}

export function useAlert() {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within AlertProvider');
  }
  return context;
}
