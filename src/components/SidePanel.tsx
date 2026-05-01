/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { Shield, TrendingUp, Target, AlertTriangle, CheckCircle2, Info, Flame, Rocket, Swords } from 'lucide-react';
import { GameState } from '../types.ts';
import { Alert, advisorAuto, buildForecast } from '../forecast.ts';
import { SPACE_MILESTONES, SPACE_MILESTONE_ORDER } from '../constants.ts';

interface Props {
  gameState: GameState;
  onOpenFeed: () => void;
}

const ADVISORS = [
  { role: 'Military' as const, icon: Shield, accent: 'text-red-400', ring: 'border-red-500/30' },
  { role: 'Economic' as const, icon: TrendingUp, accent: 'text-yellow-400', ring: 'border-yellow-500/30' },
  { role: 'Intelligence' as const, icon: Target, accent: 'text-purple-400', ring: 'border-purple-500/30' },
];

export function SidePanel({ gameState, onOpenFeed }: Props) {
  const alerts = buildForecast(gameState);

  return (
    <div className="space-y-4">
      <LiveFeedPreview gameState={gameState} onOpenFeed={onOpenFeed} />
      <ForecastCard alerts={alerts} />
      <SpaceRaceCard gameState={gameState} />
      <NuclearCard gameState={gameState} />
      <ConflictsCard gameState={gameState} />

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

const TONE_DOT: Record<string, string> = {
  threat:  'bg-red-500',
  warning: 'bg-amber-400',
  praise:  'bg-emerald-500',
  event:   'bg-blue-400',
  intel:   'bg-purple-500',
  neutral: 'bg-slate-500',
};

function LiveFeedPreview({ gameState, onOpenFeed }: { gameState: GameState; onOpenFeed: () => void }) {
  const feed = gameState.tweetFeed ?? [];
  // Newest 3
  const latest = [...feed].reverse().slice(0, 3);
  if (latest.length === 0) return null;

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400">Live Feed</span>
        </div>
        <button
          onClick={onOpenFeed}
          className="text-[9px] font-bold text-slate-500 hover:text-blue-400 uppercase tracking-wider transition-colors"
        >
          View all →
        </button>
      </div>
      <div className="space-y-2.5">
        {latest.map(tw => {
          const country = gameState.countries.find(c => c.id === tw.countryId);
          const flag = country?.flag ?? '🌐';
          return (
            <motion.div
              key={tw.id}
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex gap-2 items-start"
            >
              <div className="relative flex-shrink-0 mt-0.5">
                <span className="text-sm">{tw.isClassified ? '🔒' : flag}</span>
                <span className={`absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 rounded-full ${TONE_DOT[tw.tone] ?? 'bg-slate-500'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[9px] font-black text-slate-400 truncate">{tw.isClassified ? 'CLASSIFIED INTEL' : tw.leaderHandle}</div>
                <div className="text-[10px] text-slate-300 leading-snug line-clamp-2">{tw.content}</div>
              </div>
            </motion.div>
          );
        })}
      </div>
      <button
        onClick={onOpenFeed}
        className="mt-3 w-full py-2 text-[10px] font-black uppercase tracking-widest border border-slate-700 rounded-xl text-slate-400 hover:border-blue-500 hover:text-blue-400 transition-all"
      >
        Open Intelligence Feed
      </button>
    </div>
  );
}

function SpaceRaceCard({ gameState }: { gameState: GameState }) {
  const achievements = gameState.spaceAchievements ?? [];
  if (achievements.length === 0 && (gameState.countries.every(c => c.resources.science < 100))) return null;

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Rocket size={14} className="text-blue-400" />
        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400">Space Race</span>
      </div>
      <div className="space-y-2">
        {SPACE_MILESTONE_ORDER.map(ms => {
          const info = SPACE_MILESTONES[ms];
          const achieved = achievements.filter(a => a.milestone === ms);
          const first = achieved[0];
          const firstCountry = first ? gameState.countries.find(c => c.id === first.countryId) : null;
          return (
            <div key={ms} className="flex items-center gap-2">
              <span className="text-base w-6 text-center">{info.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-bold text-slate-300">{info.label}</div>
                <div className="text-[8px] text-slate-500">{info.scienceRequired} SCI required</div>
              </div>
              {firstCountry ? (
                <span className="text-xs" title={`${firstCountry.name} — Turn ${first!.turn}`}>{firstCountry.flag}</span>
              ) : (
                <span className="text-[8px] text-slate-600 italic">unclaimed</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function NuclearCard({ gameState }: { gameState: GameState }) {
  const programs = (gameState.nuclearPrograms ?? []).filter(p => p.detected && !gameState.countries.find(c => c.id === p.countryId)?.nuclearArmed);
  const nuclear = gameState.countries.filter(c => c.nuclearArmed && c.id !== gameState.playerCountryId);
  if (nuclear.length === 0 && programs.length === 0) return null;

  return (
    <div className="bg-slate-900/60 border border-amber-900/30 rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-amber-400 text-sm">☢</span>
        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-400">Nuclear Club</span>
      </div>
      <div className="space-y-1.5">
        {nuclear.map(c => (
          <div key={c.id} className="flex items-center gap-2">
            <span className="text-base">{c.flag}</span>
            <span className="text-[10px] font-bold text-slate-300 flex-1">{c.name}</span>
            <span className="text-[8px] text-amber-400 font-bold">CONFIRMED</span>
          </div>
        ))}
        {programs.map(p => {
          const c = gameState.countries.find(x => x.id === p.countryId);
          if (!c) return null;
          return (
            <div key={p.countryId} className="flex items-center gap-2">
              <span className="text-base">{c.flag}</span>
              <span className="text-[10px] font-bold text-slate-300 flex-1">{c.name}</span>
              <div className="flex items-center gap-1">
                <div className="w-12 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-500 rounded-full" style={{ width: `${p.progress}%` }} />
                </div>
                <span className="text-[8px] text-purple-400 font-bold">{p.progress.toFixed(0)}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ConflictsCard({ gameState }: { gameState: GameState }) {
  const conflicts = gameState.regionalConflicts ?? [];
  if (conflicts.length === 0) return null;

  const INTENSITY_COLOR = (i: number) =>
    i >= 75 ? 'text-red-400 bg-red-950/20 border-red-500/20' :
    i >= 50 ? 'text-orange-400 bg-orange-950/20 border-orange-500/20' :
    'text-yellow-400 bg-yellow-950/20 border-yellow-500/20';

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Swords size={14} className="text-red-400" />
        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-red-400">Active Conflicts</span>
      </div>
      <div className="space-y-2">
        {conflicts.map(c => {
          const cA = gameState.countries.find(x => x.id === c.countryAId);
          const cB = gameState.countries.find(x => x.id === c.countryBId);
          return (
            <div key={c.id} className={`px-2.5 py-2 rounded-xl border text-[10px] ${INTENSITY_COLOR(c.intensity)}`}>
              <div className="font-black mb-0.5">{c.name}</div>
              <div className="flex items-center gap-1 text-slate-400">
                <span>{cA?.flag}</span><span>{cA?.name}</span>
                <span className="mx-1">⚔</span>
                <span>{cB?.flag}</span><span>{cB?.name}</span>
              </div>
            </div>
          );
        })}
      </div>
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
