/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, TrendingUp, Heart, Repeat2, ChevronDown, ChevronUp } from 'lucide-react';
import { Tweet, GameState } from '../types.ts';
import { LEADERS } from '../leaders.ts';

interface Props {
  gameState: GameState;
}

const TONE_STYLE: Record<Tweet['tone'], { border: string; bg: string; dot: string; label: string }> = {
  threat:  { border: 'border-red-500/25',    bg: 'bg-red-950/10',     dot: 'bg-red-500',    label: 'THREAT'     },
  warning: { border: 'border-amber-500/25',  bg: 'bg-amber-950/10',   dot: 'bg-amber-400',  label: 'WARNING'    },
  praise:  { border: 'border-emerald-500/25',bg: 'bg-emerald-950/10', dot: 'bg-emerald-500',label: 'POSITIVE'   },
  event:   { border: 'border-blue-500/25',   bg: 'bg-blue-950/10',    dot: 'bg-blue-400',   label: 'EVENT'      },
  intel:   { border: 'border-purple-500/40', bg: 'bg-purple-950/20',  dot: 'bg-purple-500', label: 'CLASSIFIED' },
  neutral: { border: 'border-slate-800',     bg: 'bg-slate-900/40',   dot: 'bg-slate-500',  label: 'INTEL'      },
};

function fmtNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function TweetCard({ tw, countries }: { tw: Tweet; countries: GameState['countries'] }) {
  const style = TONE_STYLE[tw.tone] ?? TONE_STYLE.neutral;
  const country = countries.find(c => c.id === tw.countryId);
  const flag = country?.flag ?? '🌐';
  const leader = LEADERS[tw.countryId];
  const isIntel = tw.isClassified || tw.countryId === '__intel__';

  if (isIntel) {
    return (
      <motion.div
        initial={{ opacity: 0, x: -6 }}
        animate={{ opacity: 1, x: 0 }}
        className="p-3.5 rounded-2xl border border-purple-500/30 bg-purple-950/15"
      >
        <div className="flex items-center gap-2 mb-2">
          <div className="w-7 h-7 bg-purple-900/50 rounded-lg flex items-center justify-center border border-purple-500/30 flex-shrink-0">
            <Lock size={12} className="text-purple-400" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[9px] font-black uppercase tracking-[0.25em] text-purple-400">CLASSIFIED INTEL</span>
            <span className="text-[9px] text-slate-600 ml-2">Turn {tw.turn}</span>
          </div>
        </div>
        <p className="text-sm text-slate-200 leading-relaxed border-l-2 border-purple-500/40 pl-3">
          {tw.content}
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-3.5 rounded-2xl border ${style.border} ${style.bg}`}
    >
      <div className="flex items-start gap-2.5">
        {/* Avatar */}
        <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-lg flex-shrink-0">
          {flag}
        </div>

        <div className="flex-1 min-w-0">
          {/* Name row */}
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="font-black text-white text-sm leading-tight truncate max-w-[140px]">
              {tw.leaderName}
            </span>
            {leader?.verified && (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
                <circle cx="12" cy="12" r="12" fill="#1d9bf0" />
                <path d="M9 12l2 2 4-4" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
            <div className={`ml-auto flex-shrink-0 w-2 h-2 rounded-full ${style.dot}`} />
          </div>

          {/* Handle + turn */}
          <div className="text-[10px] text-slate-500 mb-2 truncate">
            {tw.leaderHandle} · T{tw.turn}
          </div>

          {/* Content */}
          <p className="text-sm text-slate-200 leading-relaxed mb-2.5">{tw.content}</p>

          {/* Engagement row */}
          <div className="flex items-center gap-4 text-slate-600">
            <span className="flex items-center gap-1">
              <Heart size={12} />
              <span className="text-[10px]">{fmtNum(tw.likes)}</span>
            </span>
            <span className="flex items-center gap-1">
              <Repeat2 size={12} />
              <span className="text-[10px]">{fmtNum(tw.retweets)}</span>
            </span>
            <span className={`ml-auto text-[8px] font-black uppercase px-1.5 py-0.5 rounded-md ${
              tw.tone === 'threat' ? 'bg-red-950/50 text-red-400' :
              tw.tone === 'intel' ? 'bg-purple-950/50 text-purple-400' :
              tw.tone === 'praise' ? 'bg-emerald-950/50 text-emerald-400' :
              tw.tone === 'warning' ? 'bg-amber-950/50 text-amber-400' :
              'bg-slate-800 text-slate-500'
            }`}>{style.label}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function TrendingPills({ gameState }: { gameState: GameState }) {
  const { countries, tweetFeed, playerCountryId } = gameState;
  const tags: string[] = [];

  const atWar = countries.find(c => c.id !== playerCountryId && c.stanceTowardsPlayer === 'At War');
  const hostile = countries.find(c => c.id !== playerCountryId && c.stanceTowardsPlayer === 'Hostile');
  const allies = countries.filter(c => c.id !== playerCountryId && c.stanceTowardsPlayer === 'Ally');
  const player = countries.find(c => c.id === playerCountryId);

  if (atWar) tags.push(`#${atWar.name.replace(/\s+/g, '')}War`);
  if (hostile) tags.push(`#Sanctions${hostile.name.replace(/\s+/g, '')}`);
  if (allies[0]) tags.push(`#${allies[0].name.replace(/\s+/g, '')}Alliance`);
  if (tweetFeed.filter(t => t.tone === 'threat').length > 3) tags.push('#GlobalTensions');
  if (player && player.resources.stability < 50) tags.push(`#${player.name.split(' ')[0]}Crisis`);
  tags.push('#GlobalSovereign');

  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
      {tags.slice(0, 6).map(tag => (
        <span key={tag} className="flex-shrink-0 px-3 py-1.5 bg-slate-800/60 border border-slate-700 rounded-full text-[10px] font-bold text-slate-300 whitespace-nowrap">
          {tag}
        </span>
      ))}
    </div>
  );
}

function LeaderSidebar({ gameState }: { gameState: GameState }) {
  const [open, setOpen] = useState(false);
  const others = gameState.countries.filter(c => c.id !== gameState.playerCountryId);

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between p-4 text-left"
      >
        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-400">
          Leader Profiles ({others.length})
        </span>
        {open ? <ChevronUp size={14} className="text-slate-500" /> : <ChevronDown size={14} className="text-slate-500" />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-1.5 max-h-72 overflow-y-auto">
              {others.map(c => {
                const nucProg = gameState.nuclearPrograms?.find(n => n.countryId === c.id);
                const spaceAch = (gameState.spaceAchievements ?? []).filter(a => a.countryId === c.id).length;
                return (
                  <div key={c.id} className="flex items-center gap-2 p-1.5 rounded-lg">
                    <span className="text-base flex-shrink-0">{c.flag}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] font-bold text-slate-300 truncate">{c.name}</span>
                        {c.nuclearArmed && <span className="text-[8px] text-amber-400">☢</span>}
                        {spaceAch > 0 && <span className="text-[8px]">🚀</span>}
                      </div>
                      {nucProg?.detected && !c.nuclearArmed && (
                        <div className="text-[8px] text-purple-400 font-bold">☢ {nucProg.progress.toFixed(0)}%</div>
                      )}
                    </div>
                    <span className={`text-[8px] px-1.5 py-0.5 rounded border font-bold uppercase flex-shrink-0 ${
                      c.stanceTowardsPlayer === 'Ally'     ? 'border-blue-500/30 text-blue-400' :
                      c.stanceTowardsPlayer === 'Friendly' ? 'border-emerald-500/30 text-emerald-400' :
                      c.stanceTowardsPlayer === 'Hostile' || c.stanceTowardsPlayer === 'At War' ? 'border-red-500/30 text-red-400' :
                      c.stanceTowardsPlayer === 'Suspicious' ? 'border-orange-500/30 text-orange-400' :
                      'border-slate-700 text-slate-500'
                    }`}>{c.stanceTowardsPlayer}</span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function TwitterFeed({ gameState }: Props) {
  const [filter, setFilter] = useState<Tweet['tone'] | 'All'>('All');
  const [showCount, setShowCount] = useState(15);

  const feed = [...(gameState.tweetFeed ?? [])].reverse();
  const filtered = filter === 'All' ? feed : feed.filter(tw => tw.tone === filter);
  const visible = filtered.slice(0, showCount);

  const filterLabels: { key: Tweet['tone'] | 'All'; label: string }[] = [
    { key: 'All',     label: 'All' },
    { key: 'intel',   label: '🔒 Intel' },
    { key: 'threat',  label: '⚔️ Threats' },
    { key: 'warning', label: '⚠️ Warnings' },
    { key: 'praise',  label: '✅ Positive' },
    { key: 'event',   label: '📡 Events' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Intelligence Feed</h2>
          <p className="text-[10px] text-slate-500 mt-0.5">
            {gameState.tweetFeed?.length ?? 0} dispatches · leaders react in real time
          </p>
        </div>
      </div>

      {/* Trending pills — always visible, horizontal scroll on mobile */}
      <TrendingPills gameState={gameState} />

      {/* Filter tabs */}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
        {filterLabels.map(f => (
          <button
            key={f.key}
            onClick={() => { setFilter(f.key); setShowCount(15); }}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[10px] font-black border transition-all ${
              filter === f.key
                ? 'bg-blue-600 border-blue-500 text-white'
                : 'border-slate-700 text-slate-400 bg-slate-900/50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Two-col on desktop, single-col on mobile */}
      <div className="grid lg:grid-cols-[1fr_260px] gap-5 items-start">

        {/* Feed */}
        <div className="space-y-3 min-w-0">
          {visible.length === 0 ? (
            <div className="text-center py-12 text-slate-600 text-sm italic">
              No dispatches yet. Take an action to trigger reactions.
            </div>
          ) : (
            <>
              <AnimatePresence mode="popLayout">
                {visible.map(tw => (
                  <TweetCard key={tw.id} tw={tw} countries={gameState.countries} />
                ))}
              </AnimatePresence>

              {filtered.length > showCount && (
                <button
                  onClick={() => setShowCount(n => n + 15)}
                  className="w-full py-3 border border-slate-800 rounded-xl text-slate-400 text-xs font-bold flex items-center justify-center gap-2 active:bg-slate-800 transition-colors"
                >
                  <ChevronDown size={14} />
                  Load {Math.min(15, filtered.length - showCount)} more
                </button>
              )}
            </>
          )}
        </div>

        {/* Sidebar: hidden on mobile (use accordion leader profiles instead) */}
        <div className="hidden lg:block space-y-4 lg:sticky lg:top-4">
          {/* Trending full card — desktop only */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={13} className="text-emerald-400" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400">Trending</span>
            </div>
            <div className="space-y-3">
              {(() => {
                const { countries, tweetFeed, playerCountryId } = gameState;
                const tags: { tag: string; ctx: string; count: string }[] = [];
                const atWar = countries.find(c => c.id !== playerCountryId && c.stanceTowardsPlayer === 'At War');
                const hostile = countries.find(c => c.id !== playerCountryId && c.stanceTowardsPlayer === 'Hostile');
                const allies = countries.filter(c => c.id !== playerCountryId && c.stanceTowardsPlayer === 'Ally');
                const player = countries.find(c => c.id === playerCountryId);
                if (atWar) tags.push({ tag: `#${atWar.name.replace(/\s+/g, '')}War`, ctx: 'Trending worldwide', count: `${(Math.random()*800+200).toFixed(0)}K` });
                if (hostile) tags.push({ tag: `#Sanctions${hostile.name.replace(/\s+/g, '')}`, ctx: 'Politics', count: `${(Math.random()*200+50).toFixed(0)}K` });
                if (allies[0]) tags.push({ tag: `#${allies[0].name.replace(/\s+/g, '')}Alliance`, ctx: 'Diplomacy', count: `${(Math.random()*150+30).toFixed(0)}K` });
                if (tweetFeed.filter(t => t.tone === 'threat').length > 3) tags.push({ tag: '#GlobalTensions', ctx: 'Worldwide', count: `${(tweetFeed.filter(t=>t.tone==='threat').length*12+80)}K` });
                if (player && player.resources.stability < 50) tags.push({ tag: `#${player.name.split(' ')[0]}Crisis`, ctx: 'Near you', count: `${(Math.random()*300+100).toFixed(0)}K` });
                tags.push({ tag: '#GlobalSovereign', ctx: `Turn ${gameState.turn}`, count: `${gameState.turn * 8 + 14}K` });
                return tags.slice(0, 5).map((t, i) => (
                  <div key={i} className="py-0.5">
                    <div className="text-[9px] text-slate-500">{t.ctx}</div>
                    <div className="text-sm font-black text-white">{t.tag}</div>
                    <div className="text-[9px] text-slate-500">{t.count} posts</div>
                  </div>
                ));
              })()}
            </div>
          </div>

          <LeaderSidebar gameState={gameState} />
        </div>

      </div>

      {/* Leader profiles accordion — mobile only */}
      <div className="lg:hidden">
        <LeaderSidebar gameState={gameState} />
      </div>
    </motion.div>
  );
}
