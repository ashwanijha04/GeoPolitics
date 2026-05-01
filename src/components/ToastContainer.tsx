import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Toast } from '../types.ts';
import { CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react';

interface ToastContainerProps {
  toasts: Toast[];
}

export function ToastContainer({ toasts }: ToastContainerProps) {
  const getIcon = (type: Toast['type']) => {
    switch (type) {
      case 'success': return <CheckCircle2 size={18} />;
      case 'error': return <AlertCircle size={18} />;
      case 'warning': return <AlertTriangle size={18} />;
      default: return <Info size={18} />;
    }
  };

  const getColors = (type: Toast['type']) => {
    switch (type) {
      case 'success': return 'bg-emerald-600 border-emerald-400 text-white';
      case 'error': return 'bg-red-600 border-red-400 text-white';
      case 'warning': return 'bg-orange-600 border-orange-400 text-white';
      default: return 'bg-blue-600 border-blue-400 text-white';
    }
  };

  return (
    <div className="fixed bottom-32 left-1/2 -translate-x-1/2 md:bottom-auto md:top-20 md:right-4 md:translate-x-0 z-[200] flex flex-col gap-2 w-full max-w-xs md:max-w-md px-4 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            layout
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border ${getColors(toast.type)} pointer-events-auto backdrop-blur-md`}
          >
            <div className="flex-shrink-0">{getIcon(toast.type)}</div>
            <p className="text-sm font-bold tracking-tight text-center flex-1">{toast.message}</p>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
