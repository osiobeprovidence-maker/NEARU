import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, Camera, Mic, Bell, AlertCircle, Settings, X } from 'lucide-react';
import { AppPermissionType, PermissionDialogConfig } from '../services/permissionManager';

interface PermissionRationaleModalProps {
  isOpen: boolean;
  config: PermissionDialogConfig | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function PermissionRationaleModal({
  isOpen,
  config,
  onConfirm,
  onCancel,
}: PermissionRationaleModalProps) {
  if (!isOpen || !config) return null;

  const renderIcon = () => {
    if (config.isSettingsRecovery) {
      return (
        <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200/70 flex items-center justify-center shadow-xs">
          <Settings className="w-7 h-7" />
        </div>
      );
    }

    switch (config.type) {
      case 'location':
        return (
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200/70 flex items-center justify-center shadow-xs">
            <MapPin className="w-7 h-7" />
          </div>
        );
      case 'camera':
        return (
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-200/70 flex items-center justify-center shadow-xs">
            <Camera className="w-7 h-7" />
          </div>
        );
      case 'microphone':
        return (
          <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-600 border border-purple-200/70 flex items-center justify-center shadow-xs">
            <Mic className="w-7 h-7" />
          </div>
        );
      case 'notifications':
        return (
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200/70 flex items-center justify-center shadow-xs">
            <Bell className="w-7 h-7" />
          </div>
        );
      default:
        return (
          <div className="w-14 h-14 rounded-2xl bg-zinc-100 text-zinc-700 border border-zinc-200 flex items-center justify-center shadow-xs">
            <AlertCircle className="w-7 h-7" />
          </div>
        );
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-zinc-950/60 backdrop-blur-sm"
          onClick={onCancel}
        />

        {/* Modal Card / Bottom Sheet on Mobile */}
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.96 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full sm:max-w-md bg-white rounded-t-[2rem] sm:rounded-3xl shadow-2xl overflow-hidden z-10 pb-safe"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Mobile Drag Indicator */}
          <div className="flex justify-center pt-3 pb-1 sm:hidden">
            <div className="w-10 h-1 rounded-full bg-zinc-200" />
          </div>

          <div className="p-6 sm:p-7 text-center">
            {/* Close Button top-right */}
            <button
              onClick={onCancel}
              className="absolute top-4 right-4 p-2 rounded-full text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Icon */}
            <div className="flex justify-center mb-4 mt-1">{renderIcon()}</div>

            {/* Title */}
            <h3 className="text-xl font-black text-zinc-900 tracking-tight mb-2">
              {config.title}
            </h3>

            {/* Description */}
            <p className="text-sm text-zinc-500 font-medium leading-relaxed max-w-sm mx-auto mb-7">
              {config.description}
            </p>

            {/* Actions */}
            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={onConfirm}
                className="w-full py-3.5 px-6 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-sm shadow-md shadow-zinc-900/10 active:scale-[0.98] transition-all cursor-pointer"
              >
                {config.confirmLabel}
              </button>
              <button
                type="button"
                onClick={onCancel}
                className="w-full py-3 px-6 rounded-2xl bg-transparent hover:bg-zinc-100 text-zinc-600 font-bold text-sm active:scale-[0.98] transition-all cursor-pointer"
              >
                {config.cancelLabel}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
