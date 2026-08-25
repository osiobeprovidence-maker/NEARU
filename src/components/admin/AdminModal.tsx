import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, AlertTriangle, AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { cn } from '../../lib/utils';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
  variant?: 'default' | 'danger' | 'warning' | 'success';
}

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'lg',
  variant = 'default',
}) => {
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-zinc-950/60 backdrop-blur-xs"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className={cn(
              "relative w-full bg-white rounded-[2.5rem] border border-zinc-200 shadow-2xl shadow-zinc-950/20 overflow-hidden z-10 my-8 flex flex-col max-h-[90vh]",
              maxWidthClasses[maxWidth]
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between p-6 sm:p-8 border-b border-zinc-100 bg-zinc-50/50">
              <div className="flex items-center gap-3.5">
                {variant === 'danger' && (
                  <div className="w-10 h-10 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                )}
                {variant === 'warning' && (
                  <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                )}
                {variant === 'success' && (
                  <div className="w-10 h-10 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                )}
                <div>
                  <h3 className="text-xl font-black text-zinc-900 tracking-tight">{title}</h3>
                  {subtitle && (
                    <p className="text-xs text-zinc-500 font-medium mt-0.5">{subtitle}</p>
                  )}
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-2 -mr-2 -mt-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 sm:p-8 overflow-y-auto flex-1 custom-scrollbar">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
