import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useAdmin } from '../../contexts/AdminContext';
import { cn } from '../../lib/utils';

export const AdminToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useAdmin();

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2.5 max-w-md w-full pointer-events-none px-4 sm:px-0">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
            className={cn(
              "pointer-events-auto bg-white rounded-2xl p-4 border shadow-xl flex items-start gap-3.5",
              toast.type === 'success' && "border-emerald-200 text-zinc-900 shadow-emerald-950/5",
              toast.type === 'danger' && "border-rose-200 text-zinc-900 shadow-rose-950/5",
              toast.type === 'warning' && "border-amber-200 text-zinc-900 shadow-amber-950/5",
              toast.type === 'info' && "border-indigo-200 text-zinc-900 shadow-indigo-950/5"
            )}
          >
            <div className="mt-0.5 shrink-0">
              {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
              {toast.type === 'danger' && <AlertCircle className="w-5 h-5 text-rose-600" />}
              {toast.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-600" />}
              {toast.type === 'info' && <Info className="w-5 h-5 text-indigo-600" />}
            </div>

            <div className="flex-1 min-w-0 pr-2">
              <h4 className="text-sm font-bold text-zinc-900 leading-tight">{toast.title}</h4>
              {toast.message && (
                <p className="text-xs text-zinc-600 font-medium mt-1 leading-relaxed">{toast.message}</p>
              )}
            </div>

            <button
              onClick={() => dismissToast(toast.id)}
              className="text-zinc-400 hover:text-zinc-700 p-1 -mr-1 rounded-lg hover:bg-zinc-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
