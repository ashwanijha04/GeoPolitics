/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { Zap } from 'lucide-react';
import { GameState, ActionType } from '../types.ts';
import { generateHotDecisions } from '../narrative.ts';

interface Props {
  gameState: GameState;
  onAction: (countryId: string, action: ActionType) => void;
}

const URGENCY = {
  critical:    { border: 'border-red-500/40',    bg: 'bg-red-950/20',    dot: 'bg-red-500 animate-pulse', label: 'CRITICAL' },
  warn:        { border: 'border-amber-500/30',  bg: 'bg-amber-950/15',  dot: 'bg-amber-400',             label: 'WATCH'    },
  opportunity: { border: 'border-emerald-500/30',bg: 'bg-emerald-950/15',dot: 'bg-emerald-500',           label: 'OPEN'     },
};

export function HotDecisions({ gameState, onAction }: Props) {
  const decisions = generateHotDecisions(gameState);
  if (decisions.length === 0) return null;

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Zap size={14} className="text-amber-400" />
        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-400">Hot Decisions</span>
        <span className="ml-auto text-[8px] text-slate-600 uppercase font-bold">{decisions.length} active</span>
      </div>
      <div className="space-y-2">
        {decisions.map(d => {
          const style = URGENCY[d.urgency];
          return (
            <motion.div
              key={d.id}
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              className={`p-3 rounded-xl border ${style.border} ${style.bg}`}
            >
              <div className="flex items-start gap-2">
                <span className="text-base flex-shrink-0 mt-0.5">{d.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">{style.label}</span>
                    <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${style.dot}`} />
                  </div>
                  <div className="text-xs font-black text-white mb-0.5 leading-snug">{d.title}</div>
                  <div className="text-[10px] text-slate-400 leading-snug">{d.detail}</div>
                </div>
              </div>
              {d.suggestedAction && d.countryId && (
                <button
                  onClick={() => onAction(d.countryId!, d.suggestedAction as ActionType)}
                  className={`mt-2 w-full py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all border ${
                    d.urgency === 'critical'
                      ? 'border-red-500/40 text-red-400 hover:bg-red-950/40'
                      : d.urgency === 'opportunity'
                      ? 'border-emerald-500/40 text-emerald-400 hover:bg-emerald-950/40'
                      : 'border-amber-500/40 text-amber-400 hover:bg-amber-950/40'
                  }`}
                >
                  → Execute {d.suggestedAction}
                </button>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
