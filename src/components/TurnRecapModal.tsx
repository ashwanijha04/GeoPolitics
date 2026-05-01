/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { ArrowDown, ArrowUp, AlertCircle, Globe } from 'lucide-react';
import { Country, TurnRecap } from '../types.ts';
import { Alert, diffResources, resourceLabel } from '../forecast.ts';

interface Props {
  recap: TurnRecap;
  forecast: Alert[];
  player: Country;
  onAcknowledge: () => void;
}

export function TurnRecapModal({ recap, forecast, player, onAcknowledge }: Props) {
  const deltas = diffResources(recap.playerBefore, recap.playerAfter);
  const eventDelta = recap.eventValueChange ?? 0;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="max-w-2xl w-full bg-slate-900 border border-blue-500/30 rounded-3xl shadow-2xl shadow-blue-900/40 relative overflow-y-auto max-h-[90vh]"
      >
        <div className="absolute top-0 right-0 p-4 opacity-5">
          <Globe size={140} />
        </div>

        <div className="p-6 md:p-8 border-b border-slate-800">
          <div className="flex items-center gap-2 text-blue-400 font-bold mb-2 uppercase tracking-tighter text-xs">
            <AlertCircle size={14} /> Turn {recap.turn} Recap
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-white italic tracking-tight mb-3">{recap.eventTitle}</h2>
          <p className="text-slate-300 leading-relaxed text-sm md:text-base">{recap.eventDescription}</p>

          {recap.eventResource && (
            <div className="mt-4 p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-xs flex items-center gap-3">
              <span className="text-slate-500 uppercase font-bold">Direct impact</span>
              <span className={`font-bold ${eventDelta > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {recap.eventTargetId === player.id ? player.name : recap.eventTargetId ?? 'Regional'} • {resourceLabel(recap.eventResource)} {eventDelta > 0 ? '+' : ''}{eventDelta}
              </span>
            </div>
          )}
        </div>

        <div className="p-6 md:p-8 border-b border-slate-800">
          <div className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400 mb-3">Your bottom line</div>
          {deltas.length === 0 ? (
            <div className="text-sm text-slate-500 italic">No measurable change to your position.</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {deltas.map(d => {
                const positive = d.delta > 0;
                return (
                  <div key={d.resource} className={`p-3 rounded-xl border ${positive ? 'border-emerald-500/30 bg-emerald-950/20' : 'border-red-500/30 bg-red-950/20'}`}>
                    <div className="text-[9px] font-bold uppercase text-slate-400 tracking-widest mb-0.5">{resourceLabel(d.resource)}</div>
                    <div className={`flex items-center gap-1 font-black text-lg ${positive ? 'text-emerald-300' : 'text-red-300'}`}>
                      {positive ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                      {positive ? '+' : ''}{formatDelta(d.delta, d.resource)}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      {format(d.before, d.resource)} → {format(d.after, d.resource)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {recap.aiActions.length > 0 && (
          <div className="p-6 md:p-8 border-b border-slate-800">
            <div className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-3">World Events This Turn</div>
            <ul className="space-y-2.5">
              {recap.aiActions.map((action, i) => (
                <li key={i} className="flex gap-2.5 items-start">
                  <span className={`mt-1.5 flex-shrink-0 w-1.5 h-1.5 rounded-full ${action.hostile ? 'bg-red-500' : 'bg-emerald-500'}`} />
                  <span className="text-sm leading-snug text-slate-300">
                    <span className={`font-bold ${action.hostile ? 'text-red-300' : 'text-emerald-300'}`}>{action.countryName}:</span>{' '}
                    {action.description}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {forecast.length > 0 && (
          <div className="p-6 md:p-8 border-b border-slate-800">
            <div className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-400 mb-3">What to watch next turn</div>
            <ul className="space-y-2">
              {forecast.slice(0, 4).map(a => (
                <li key={a.id} className="text-sm text-slate-200 flex gap-2">
                  <span className="text-slate-500">•</span>
                  <div>
                    <span className="font-bold">{a.title}.</span>{' '}
                    <span className="text-slate-400">{a.detail}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="p-6 md:p-8">
          <button
            onClick={onAcknowledge}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest rounded-xl transition-all shadow-lg"
          >
            Acknowledge & Resume
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function formatDelta(v: number, resource: string): string {
  if (resource === 'gdp') return `$${v.toFixed(2)}T`;
  return Math.abs(v) < 1 ? v.toFixed(2) : Math.round(v).toString();
}

function format(v: number, resource: string): string {
  if (resource === 'gdp') return `$${v.toFixed(2)}T`;
  if (resource === 'stability') return `${Math.round(v)}%`;
  return Math.round(v).toString();
}
