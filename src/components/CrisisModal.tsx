/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, Zap } from 'lucide-react';
import { ActiveCrisis } from '../types.ts';

interface Props {
  crisis: ActiveCrisis;
  onChoose: (optionId: string) => void;
}

const URGENCY_STYLE = {
  critical: { bar: 'bg-red-500',    badge: 'bg-red-500/20 text-red-300 border-red-500/40',    glow: 'shadow-red-900/40',    title: 'text-red-400'    },
  high:     { bar: 'bg-amber-500',  badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40', glow: 'shadow-amber-900/30', title: 'text-amber-400' },
  medium:   { bar: 'bg-blue-500',   badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30',  glow: 'shadow-blue-900/30',  title: 'text-blue-400'  },
};

export function CrisisModal({ crisis, onChoose }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const style = URGENCY_STYLE[crisis.urgency];

  const handleConfirm = () => {
    if (!selected) return;
    setConfirmed(true);
    setTimeout(() => onChoose(selected), 1200);
  };

  const chosenOption = crisis.options.find(o => o.id === selected);

  return (
    /* Full-screen on mobile, centered card on desktop. The inner div scrolls. */
    <div className="fixed inset-0 z-[180] flex items-end sm:items-center justify-center bg-slate-950/90 backdrop-blur-md">
      <motion.div
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', stiffness: 350, damping: 32 }}
        className={`w-full sm:max-w-2xl bg-slate-900 border-t sm:border border-slate-700 sm:rounded-3xl shadow-2xl flex flex-col`}
        style={{ maxHeight: '92dvh' }}
      >
        {/* Urgency bar */}
        <div className={`h-1 w-full flex-shrink-0 ${style.bar} sm:rounded-t-3xl`} />

        {/* Scrollable body */}
        <div className="overflow-y-auto overscroll-contain flex-1">
          <div className="p-5 sm:p-8 border-b border-slate-800">
            <div className="flex items-center gap-3 mb-3">
              <div className={`p-2 rounded-xl border flex-shrink-0 ${style.badge}`}>
                {crisis.urgency === 'critical' ? <Zap size={16} /> : <AlertTriangle size={16} />}
              </div>
              <div>
                <div className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500 mb-0.5">
                  CRISIS · Turn {crisis.turn} · Decision Required
                </div>
                <h2 className={`text-lg sm:text-2xl font-black ${style.title} leading-tight`}>{crisis.title}</h2>
              </div>
            </div>
            <p className="text-slate-300 leading-relaxed text-sm">{crisis.description}</p>
          </div>

          <AnimatePresence mode="wait">
            {!confirmed ? (
              <motion.div key="options" initial={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="p-5 sm:p-8 space-y-2.5">
                  <div className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-3">Choose your response:</div>
                  {crisis.options.map(option => (
                    <button
                      key={option.id}
                      onClick={() => setSelected(option.id)}
                      className={`w-full text-left p-4 rounded-2xl border transition-all active:scale-[0.99] ${
                        selected === option.id
                          ? 'border-blue-500 bg-blue-950/30'
                          : 'border-slate-800 bg-slate-900/50 hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-4 h-4 rounded-full border-2 mt-0.5 flex-shrink-0 transition-all ${
                          selected === option.id ? 'border-blue-500 bg-blue-500' : 'border-slate-600'
                        }`} />
                        <div className="flex-1">
                          <div className="font-black text-white text-sm mb-1">{option.label}</div>
                          <div className="text-xs text-slate-400 leading-relaxed">{option.description}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="result"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-8 text-center space-y-4"
              >
                <div className="text-4xl">⚡</div>
                <div className="text-lg font-black text-white">{chosenOption?.label}</div>
                <p className="text-slate-300 text-sm leading-relaxed">{chosenOption?.consequence || 'Decision executed. Consequences will follow.'}</p>
                <div className="text-xs text-slate-500 italic animate-pulse">Processing consequences…</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sticky confirm button — always visible at bottom */}
        {!confirmed && (
          <div className="flex-shrink-0 p-4 sm:p-6 border-t border-slate-800 bg-slate-900">
            <button
              onClick={handleConfirm}
              disabled={!selected}
              className="w-full py-4 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black uppercase tracking-widest rounded-xl transition-all shadow-lg text-sm"
            >
              {selected ? 'Execute Decision' : 'Select a response above'}
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
