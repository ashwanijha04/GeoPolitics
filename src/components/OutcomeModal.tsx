/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { Trophy, Skull } from 'lucide-react';
import { Country, GameOutcome } from '../types.ts';
import { isVictory, outcomeBlurb, outcomeTitle } from '../gameLogic.ts';

interface Props {
  outcome: GameOutcome;
  player: Country;
  turn: number;
  onRestart: () => void;
}

export function OutcomeModal({ outcome, player, turn, onRestart }: Props) {
  const victory = isVictory(outcome);
  const accent = victory ? 'text-emerald-400' : 'text-red-400';
  const ring = victory ? 'border-emerald-500/30 shadow-emerald-900/40' : 'border-red-500/30 shadow-red-900/40';
  const Icon = victory ? Trophy : Skull;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-md">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={`max-w-xl w-full bg-slate-900 border ${ring} rounded-3xl p-8 md:p-10 shadow-2xl relative overflow-hidden`}
      >
        <div className={`absolute -top-16 -right-16 w-64 h-64 ${victory ? 'bg-emerald-500/10' : 'bg-red-500/10'} blur-3xl rounded-full`} />
        <div className="flex items-center gap-3 mb-6">
          <div className={`p-3 rounded-2xl border ${ring} ${accent}`}>
            <Icon size={28} />
          </div>
          <div>
            <div className="text-[10px] uppercase font-black tracking-[0.3em] text-slate-500">{victory ? 'Victory' : 'Defeat'} • Turn {turn}</div>
            <h2 className="text-3xl font-black text-white italic tracking-tight">{outcomeTitle(outcome)}</h2>
          </div>
        </div>

        <p className="text-slate-300 text-lg leading-relaxed mb-8">
          {outcomeBlurb(outcome, player)}
        </p>

        <div className="grid grid-cols-2 gap-3 mb-8">
          <Stat label="GDP" value={`$${player.resources.gdp}T`} accent="text-yellow-400" />
          <Stat label="Stability" value={`${player.resources.stability}%`} accent="text-emerald-400" />
          <Stat label="Military" value={String(player.resources.militaryPower)} accent="text-red-400" />
          <Stat label="Influence" value={String(player.resources.influence)} accent="text-blue-400" />
        </div>

        <button
          onClick={onRestart}
          className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest rounded-xl transition-all shadow-lg"
        >
          New Mandate
        </button>
      </motion.div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl">
      <div className="text-[10px] text-slate-500 uppercase font-mono tracking-widest">{label}</div>
      <div className={`text-lg font-black ${accent}`}>{value}</div>
    </div>
  );
}
