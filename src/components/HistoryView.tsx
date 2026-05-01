/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { MessageSquare } from 'lucide-react';
import { GameState } from '../types.ts';

interface Props {
  gameState: GameState;
}

export function HistoryView({ gameState }: Props) {
  const data = gameState.history;
  const hasEnoughData = data.length >= 2;

  return (
    <motion.div
      key="history"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-5xl mx-auto space-y-8"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white mb-1 text-center md:text-left">Executive Ledger</h2>
          <p className="text-slate-400 text-center md:text-left">Historical record of actions and global stability metrics.</p>
        </div>
        <div className="flex gap-4 justify-center">
          <div className="bg-slate-900 px-6 py-3 border border-slate-800 rounded-2xl text-center shadow-lg">
            <div className="text-[10px] text-slate-500 uppercase font-mono tracking-widest mb-1">Current Turn</div>
            <div className="text-2xl font-black text-white">{gameState.turn}</div>
          </div>
        </div>
      </div>

      <section>
        <div className="flex items-center gap-4 mb-4">
          <h3 className="text-xs font-black text-yellow-400 uppercase tracking-[0.3em] whitespace-nowrap">Economy & Power</h3>
          <div className="h-px w-full bg-yellow-900/20"></div>
        </div>
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 md:p-6">
          {hasEnoughData ? (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 10, right: 16, left: -16, bottom: 0 }}>
                  <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
                  <XAxis dataKey="turn" stroke="#475569" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#475569" tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 12, fontSize: 12 }} labelStyle={{ color: '#cbd5e1' }} />
                  <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                  <Line type="monotone" dataKey="gdp" name="GDP (T)" stroke="#facc15" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="militaryPower" name="Military" stroke="#f87171" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="influence" name="Influence" stroke="#60a5fa" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-slate-600 italic text-sm">
              Advance a few turns to populate the ledger.
            </div>
          )}
        </div>
      </section>

      <section>
        <div className="flex items-center gap-4 mb-4">
          <h3 className="text-xs font-black text-emerald-400 uppercase tracking-[0.3em] whitespace-nowrap">Stability & Science</h3>
          <div className="h-px w-full bg-emerald-900/20"></div>
        </div>
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 md:p-6">
          {hasEnoughData ? (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 10, right: 16, left: -16, bottom: 0 }}>
                  <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
                  <XAxis dataKey="turn" stroke="#475569" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#475569" tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 12, fontSize: 12 }} labelStyle={{ color: '#cbd5e1' }} />
                  <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                  <Line type="monotone" dataKey="stability" name="Stability %" stroke="#34d399" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="science" name="Science" stroke="#a78bfa" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-slate-600 italic text-sm">
              Advance a few turns to populate the ledger.
            </div>
          )}
        </div>
      </section>

      <section>
        <div className="flex items-center gap-4 mb-4">
          <h3 className="text-xs font-black text-blue-400 uppercase tracking-[0.3em] whitespace-nowrap">Strategic Actions</h3>
          <div className="h-px w-full bg-blue-900/20"></div>
        </div>
        <div className="space-y-3">
          {gameState.actionHistory.slice().reverse().map((record, i) => (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              key={i}
              className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4 p-4 bg-slate-900/40 border border-slate-800/50 rounded-2xl hover:bg-slate-800/40 transition-all hover:border-blue-500/30 group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-500 font-mono text-xs border border-slate-700/50 group-hover:bg-blue-600 transition-colors group-hover:text-white">
                  T{record.turn}
                </div>
                <div className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-[10px] font-black text-blue-400 uppercase tracking-tight">
                  {record.action}
                </div>
              </div>
              <div className="flex-1 text-sm text-slate-300 leading-relaxed">
                <span className="text-white font-bold">{record.countryName}</span>: {record.message}
              </div>
            </motion.div>
          ))}
          {gameState.actionHistory.length === 0 && (
            <div className="p-12 text-center text-slate-600 italic border border-dashed border-slate-800 rounded-3xl bg-slate-900/20">
              <MessageSquare size={32} className="mx-auto mb-4 opacity-20" />
              No strategic actions recorded for this term.
            </div>
          )}
        </div>
      </section>
    </motion.div>
  );
}
