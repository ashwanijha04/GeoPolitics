/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, TrendingUp, Heart, Repeat2, ChevronDown } from 'lucide-react';
import { Tweet, GameState } from '../types.ts';
import { LEADERS } from '../leaders.ts';

interface Props {
  gameState: GameState;
}

const TONE_STYLE: Record<Tweet['tone'], { border: string; bg: string; badge: string; badgeText: string }> = {
  threat:  { border: 'border-red-500/25',    bg: 'bg-red-950/10',     badge: 'bg-red-500/20 text-red-400 border-red-500/30',    badgeText: 'THREAT'  },
  warning: { border: 'border-amber-500/25',  bg: 'bg-amber-950/10',   badge: 'bg-amber-500/20 text-amber-400 border-amber-500/30', badgeText: 'WARNING' },
  praise:  { border: 'border-emerald-500/25',bg: 'bg-emerald-950/10', badge: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', badgeText: 'POSITIVE' },
  event:   { border: 'border-blue-500/25',   bg: 'bg-blue-950/10',    badge: 'bg-blue-500/20 text-blue-400 border-blue-500/30',  badgeText: 'EVENT'   },
  intel:   { border: 'border-purple-500/40', bg: 'bg-purple-950/20',  badge: 'bg-purple-500/20 text-purple-300 border-purple-500/40', badgeText: '⬛ CLASSIFIED' },
  neutral: { border: 'border-slate-800',     bg: 'bg-slate-900/40',   badge: 'bg-slate-800 text-slate-400 border-slate-700',     badgeText: 'INTEL'   },
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

  return (
    <motion.div
      initial={{ opacity: 0, x: isIntel ? -8 : 8, scale: 0.98 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      className={`p-4 rounded-2xl border ${style.border} ${style.bg} transition-all`}
    >
      {isIntel ? (
        // Classified Intel Card
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-purple-900/50 rounded-xl flex items-center justify-center border border-purple-500/30">
              <Lock size={14} className="text-purple-400" />
            </div>
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.3em] text-purple-400">Classified Intel</div>
              <div className="text-[9px] text-slate-500">Turn {tw.turn} · Eyes Only</div>
            </div>
            <span className={`ml-auto text-[8px] font-black uppercase px-2 py-0.5 rounded border ${style.badge}`}>
              {style.badgeText}
            </span>
          </div>
          <p className="text-sm text-slate-200 leading-relaxed font-mono border-l-2 border-purple-500/40 pl-3">
            {tw.content}
          </p>
        </div>
      ) : (
        // Regular Tweet Card
        <div>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xl flex-shrink-0 font-bold">
              {flag}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                <span className="font-black text-white text-sm truncate">{tw.leaderName}</span>
                {leader?.verified && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
                    <circle cx="12" cy="12" r="12" fill="#1d9bf0" />
                    <path d="M9 12l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
                <span className="text-slate-500 text-xs truncate">{tw.leaderHandle}</span>
                <span className="text-[8px] text-slate-600">· Turn {tw.turn}</span>
                <span className={`ml-auto flex-shrink-0 text-[8px] font-black uppercase px-1.5 py-0.5 rounded border ${style.badge}`}>
                  {style.badgeText}
                </span>
              </div>

              <p className="text-sm text-slate-200 leading-relaxed mb-3">{tw.content}</p>

              <div className="flex items-center gap-5 text-slate-600">
                <button className="flex items-center gap-1.5 hover:text-red-400 transition-colors group">
                  <Heart size={14} className="group-hover:scale-110 transition-transform" />
                  <span className="text-[11px]">{fmtNum(tw.likes)}</span>
                </button>
                <button className="flex items-center gap-1.5 hover:text-emerald-400 transition-colors group">
                  <Repeat2 size={14} className="group-hover:scale-110 transition-transform" />
                  <span className="text-[11px]">{fmtNum(tw.retweets)}</span>
                </button>
                {leader?.followers && (
                  <span className="ml-auto text-[10px] text-slate-600">{leader.followers} followers</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

function TrendingTopics({ gameState }: { gameState: GameState }) {
  const { countries, tweetFeed } = gameState;

  // Derive trending topics from game state
  const topics: { tag: string; posts: string; context: string }[] = [];

  const hostile = countries.filter(c => c.id !== gameState.playerCountryId && c.stanceTowardsPlayer === 'Hostile');
  const atWar   = countries.filter(c => c.id !== gameState.playerCountryId && c.stanceTowardsPlayer === 'At War');
  const allies  = countries.filter(c => c.id !== gameState.playerCountryId && c.stanceTowardsPlayer === 'Ally');

  if (atWar.length > 0) {
    topics.push({ tag: `#${atWar[0].name.replace(/\s+/g, '')}War`, posts: `${(Math.random() * 800 + 200).toFixed(0)}K`, context: 'Trending worldwide' });
  }
  if (hostile.length > 0) {
    topics.push({ tag: `#Sanctions${hostile[0].name.replace(/\s+/g, '')}`, posts: `${(Math.random() * 200 + 50).toFixed(0)}K`, context: 'Trending in Politics' });
  }
  if (allies.length > 0) {
    topics.push({ tag: `#${allies[0].name.replace(/\s+/g, '')}Alliance`, posts: `${(Math.random() * 150 + 30).toFixed(0)}K`, context: 'Trending in Diplomacy' });
  }

  const threatCount = tweetFeed.filter(tw => tw.tone === 'threat').length;
  if (threatCount > 3) {
    topics.push({ tag: '#GlobalTensions', posts: `${(threatCount * 12 + 80).toFixed(0)}K`, context: 'Trending worldwide' });
  }

  const player = countries.find(c => c.id === gameState.playerCountryId);
  if (player && player.resources.stability < 55) {
    topics.push({ tag: `#${player.name.split(' ')[0]}Crisis`, posts: `${(Math.random() * 300 + 100).toFixed(0)}K`, context: 'Trending near you' });
  }
  if (player && player.resources.gdp > 40) {
    topics.push({ tag: '#EconomicDominance', posts: `${(Math.random() * 100 + 40).toFixed(0)}K`, context: 'Trending in Economics' });
  }

  topics.push({ tag: '#GlobalSovereign', posts: `${gameState.turn * 8 + 14}K`, context: 'Turn ' + gameState.turn });

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp size={14} className="text-emerald-400" />
        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400">Trending</span>
      </div>
      <div className="space-y-3">
        {topics.slice(0, 5).map((t, i) => (
          <div key={i} className="cursor-pointer hover:bg-slate-800/50 rounded-lg px-1 py-0.5 transition-colors">
            <div className="text-[9px] text-slate-500">{t.context}</div>
            <div className="text-sm font-black text-white">{t.tag}</div>
            <div className="text-[9px] text-slate-500">{t.posts} posts</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function TwitterFeed({ gameState }: Props) {
  const [filter, setFilter] = useState<Tweet['tone'] | 'All'>('All');
  const [showCount, setShowCount] = useState(20);

  const feed = [...(gameState.tweetFeed ?? [])].reverse(); // newest first
  const filtered = filter === 'All' ? feed : feed.filter(tw => tw.tone === filter);
  const visible = filtered.slice(0, showCount);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto"
    >
      <div className="grid lg:grid-cols-[1fr_280px] gap-6">
        {/* Main feed */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold text-white mb-0.5">Intelligence Feed</h2>
              <p className="text-xs text-slate-500">World leaders react in real time. Classified intercepts below.</p>
            </div>
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
              {gameState.tweetFeed?.length ?? 0} dispatches logged
            </div>
          </div>

          {/* Filter tabs */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {(['All', 'intel', 'threat', 'warning', 'praise', 'event', 'neutral'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider border transition-all ${filter === f ? 'bg-blue-600 border-blue-500 text-white' : 'border-slate-700 text-slate-400 hover:border-slate-500'}`}>
                {f === 'intel' ? '⬛ Intel' : f}
              </button>
            ))}
          </div>

          {/* Tweets */}
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {visible.length === 0 ? (
                <div className="text-center py-16 text-slate-600 text-sm italic">
                  No dispatches yet. Take an action to trigger leader reactions.
                </div>
              ) : (
                visible.map(tw => (
                  <TweetCard key={tw.id} tw={tw} countries={gameState.countries} />
                ))
              )}
            </AnimatePresence>
          </div>

          {filtered.length > showCount && (
            <button
              onClick={() => setShowCount(n => n + 20)}
              className="w-full py-3 border border-slate-800 rounded-xl text-slate-400 text-xs font-bold hover:border-slate-600 hover:text-slate-200 transition-all flex items-center justify-center gap-2"
            >
              <ChevronDown size={14} /> Load {Math.min(20, filtered.length - showCount)} more dispatches
            </button>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4 lg:sticky lg:top-4 self-start">
          <TrendingTopics gameState={gameState} />

          {/* Strategy Guide */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
            <div className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-400 mb-3">Leader Profiles</div>
            <div className="space-y-2 max-h-64 overflow-y-auto no-scrollbar">
              {gameState.countries
                .filter(c => c.id !== gameState.playerCountryId)
                .map(c => {
                  const leader = LEADERS[c.id];
                  if (!leader) return null;
                  const stratColor = {
                    'always-defect': 'text-red-500',
                    'grudger': 'text-orange-400',
                    'tit-for-tat': 'text-yellow-400',
                    'tit-for-tat-forgiving': 'text-emerald-400',
                    'exploiter': 'text-amber-400',
                    'win-stay-lose-switch': 'text-blue-400',
                    'cooperative': 'text-teal-400',
                    'random': 'text-purple-400',
                  }[leader.strategy] ?? 'text-slate-400';
                  return (
                    <div key={c.id} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-800/40 transition-colors">
                      <span className="text-base">{c.flag}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] font-bold text-slate-300 truncate">{c.name}</div>
                        <div className={`text-[9px] font-black uppercase truncate ${stratColor}`}>{leader.strategy}</div>
                      </div>
                      <div className={`text-[8px] px-1.5 py-0.5 rounded border font-bold uppercase ${
                        c.stanceTowardsPlayer === 'Ally' ? 'border-blue-500/30 text-blue-400' :
                        c.stanceTowardsPlayer === 'Friendly' ? 'border-emerald-500/30 text-emerald-400' :
                        c.stanceTowardsPlayer === 'Hostile' || c.stanceTowardsPlayer === 'At War' ? 'border-red-500/30 text-red-400' :
                        'border-slate-700 text-slate-500'
                      }`}>{c.stanceTowardsPlayer}</div>
                    </div>
                  );
              })}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
