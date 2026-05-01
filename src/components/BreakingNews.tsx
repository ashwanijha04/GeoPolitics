/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Radio } from 'lucide-react';

export interface BreakingNewsItem {
  id: string;
  headline: string;
  subline: string;
  severity: 'war' | 'nuclear' | 'critical' | 'major';
}

interface Props {
  item: BreakingNewsItem | null;
  onDismiss: () => void;
}

const SEVERITY = {
  war:      { bg: 'bg-red-700',    label: 'WAR DECLARED',    text: 'text-white'  },
  nuclear:  { bg: 'bg-amber-600',  label: '☢ NUCLEAR ALERT', text: 'text-white'  },
  critical: { bg: 'bg-red-600',    label: 'BREAKING',        text: 'text-white'  },
  major:    { bg: 'bg-slate-700',  label: 'MAJOR EVENT',     text: 'text-white'  },
};

export function BreakingNews({ item, onDismiss }: Props) {
  useEffect(() => {
    if (!item) return;
    const t = setTimeout(onDismiss, 5000);
    return () => clearTimeout(t);
  }, [item, onDismiss]);

  return (
    <AnimatePresence>
      {item && (
        <motion.div
          key={item.id}
          initial={{ y: -80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -80, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          onClick={onDismiss}
          className="fixed top-0 left-0 right-0 z-[300] cursor-pointer"
        >
          <div className={`${SEVERITY[item.severity].bg} px-4 py-3 flex items-center gap-4 shadow-2xl`}>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Radio size={14} className="animate-pulse" />
              <span className="text-[11px] font-black uppercase tracking-widest">
                {SEVERITY[item.severity].label}
              </span>
            </div>
            <div className="w-px h-6 bg-white/30" />
            <div className="flex-1 min-w-0">
              <div className="font-black text-sm truncate">{item.headline}</div>
              <div className="text-xs opacity-80 truncate">{item.subline}</div>
            </div>
            <span className="text-xs opacity-60 flex-shrink-0">click to dismiss</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
