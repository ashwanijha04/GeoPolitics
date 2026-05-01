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
    <div className="fixed inset-0 z-[180] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className={`max-w-2xl w-full bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl ${style.glow} overflow-hidden relative`}
      >
        {/* Urgency bar */}
        <div className={`h-1 w-full ${style.bar}`} />

        <div className="p-6 md:p-8 border-b border-slate-800">
          <div className="flex items-center gap-3 mb-4">
            <div className={`p-2 rounded-xl border ${style.badge}`}>
              {crisis.urgency === 'critical' ? <Zap size={18} /> : <AlertTriangle size={18} />}
            </div>
            <div>
              <div className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500 mb-0.5">
                CRISIS — Turn {crisis.turn} · Decision Required
              </div>
              <h2 className={`text-xl md:text-2xl font-black ${style.title}`}>{crisis.title}</h2>
            </div>
          </div>
          <p className="text-slate-300 leading-relaxed text-sm md:text-base">{crisis.description}</p>
        </div>

        <AnimatePresence mode="wait">
          {!confirmed ? (
            <motion.div key="options" initial={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="p-6 md:p-8 space-y-3">
                <div className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-4">Choose your response:</div>
                {crisis.options.map(option => (
                  <motion.button
                    key={option.id}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => setSelected(option.id)}
                    className={`w-full text-left p-4 rounded-2xl border transition-all ${
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
                        <div className="font-black text-white mb-1">{option.label}</div>
                        <div className="text-xs text-slate-400 leading-relaxed">{option.description}</div>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>

              <div className="px-6 md:px-8 pb-6 md:pb-8">
                <button
                  onClick={handleConfirm}
                  disabled={!selected}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black uppercase tracking-widest rounded-xl transition-all shadow-lg"
                >
                  Execute Decision
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-6 md:p-8 text-center space-y-4"
            >
              <div className="text-4xl">⚡</div>
              <div className="text-lg font-black text-white">{chosenOption?.label}</div>
              <p className="text-slate-300 text-sm leading-relaxed">{chosenOption?.consequence || 'Decision executed. Consequences will follow.'}</p>
              <div className="text-xs text-slate-500 italic animate-pulse">Processing consequences…</div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
