/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { Shield, TrendingUp, Target, AlertTriangle, CheckCircle2, Info, Flame } from 'lucide-react';
import { GameState } from '../types.ts';
import { Alert, advisorAuto, buildForecast } from '../forecast.ts';

interface Props {
  gameState: GameState;
}

const ADVISORS = [
  { role: 'Military' as const, icon: Shield, accent: 'text-red-400', ring: 'border-red-500/30' },
  { role: 'Economic' as const, icon: TrendingUp, accent: 'text-yellow-400', ring: 'border-yellow-500/30' },
  { role: 'Intelligence' as const, icon: Target, accent: 'text-purple-400', ring: 'border-purple-500/30' },
];

export function SidePanel({ gameState }: Props) {
  const alerts = buildForecast(gameState);

  return (
    <div className="space-y-4">
      <ForecastCard alerts={alerts} />

      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400">Policy Council</span>
          <div className="h-px flex-1 bg-blue-900/30" />
        </div>
        <div className="space-y-3">
          {ADVISORS.map(a => {
            const Icon = a.icon;
            return (
              <div key={a.role} className={`p-3 bg-slate-950/50 border ${a.ring} rounded-xl`}>
                <div className="flex items-center gap-2 mb-1.5">
                  <div className={`w-7 h-7 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center ${a.accent}`}>
                    <Icon size={14} />
                  </div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-300">{a.role}</div>
                </div>
                <p className="text-xs text-slate-300 italic leading-snug">"{advisorAuto(gameState, a.role)}"</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ForecastCard({ alerts }: { alerts: Alert[] }) {
  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-400">Forecast</span>
        <div className="h-px flex-1 bg-amber-900/30" />
      </div>
      {alerts.length === 0 ? (
        <div className="text-xs text-slate-500 italic flex items-center gap-2">
          <CheckCircle2 size={14} className="text-emerald-500" />
          All systems nominal. No incoming risks flagged.
        </div>
      ) : (
        <div className="space-y-2">
          {alerts.map(a => (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              className={`p-2.5 border rounded-xl ${severityClass(a.severity)}`}
            >
              <div className="flex items-start gap-2">
                <div className="mt-0.5">{severityIcon(a.severity)}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-bold text-white leading-tight">{a.title}</div>
                  <div className="text-[10px] text-slate-300 leading-snug mt-0.5">{a.detail}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

function severityClass(s: Alert['severity']): string {
  switch (s) {
    case 'crit': return 'border-red-500/40 bg-red-950/30';
    case 'warn': return 'border-amber-500/30 bg-amber-950/20';
    case 'good': return 'border-emerald-500/30 bg-emerald-950/20';
    default: return 'border-slate-700 bg-slate-900/40';
  }
}

function severityIcon(s: Alert['severity']) {
  switch (s) {
    case 'crit': return <Flame size={14} className="text-red-400" />;
    case 'warn': return <AlertTriangle size={14} className="text-amber-400" />;
    case 'good': return <CheckCircle2 size={14} className="text-emerald-400" />;
    default: return <Info size={14} className="text-slate-400" />;
  }
}
