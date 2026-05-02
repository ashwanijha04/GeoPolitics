/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, Shield, TrendingUp, AlertTriangle, ChevronDown, ChevronUp,
  DollarSign, Heart, Eye, Ban, Swords, Handshake, FlaskConical,
  ShieldAlert, Vote, Sword } from 'lucide-react';
import { Country, GameState, ActionType } from '../types.ts';

interface Props {
  gameState: GameState;
  player: Country;
  onAction: (countryId: string, action: ActionType) => void;
}

// ─── Rival Threat Bar ────────────────────────────────────────────────────────

function ThreatBar({ player, rival }: { player: Country; rival: Country }) {
  const milDiff = player.resources.militaryPower - rival.resources.militaryPower;
  const isBehind = milDiff < 0 || player.resources.gdp < rival.resources.gdp;
  const turnsToOvertake = milDiff < 0 ? Math.abs(Math.ceil(milDiff / 2)) : null;

  return (
    <div className={`p-4 rounded-2xl border ${isBehind ? 'border-red-500/30 bg-red-950/10' : 'border-slate-700 bg-slate-900/40'}`}>
      <div className="flex items-center gap-2 mb-3">
        <Zap size={13} className={isBehind ? 'text-red-400' : 'text-slate-400'} />
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
          vs {rival.flag} {rival.name}
        </span>
        {turnsToOvertake !== null && turnsToOvertake <= 5 && (
          <span className="ml-auto text-[9px] font-black text-red-400 bg-red-950/50 border border-red-500/30 px-2 py-0.5 rounded-full animate-pulse">
            ⚠ ~{turnsToOvertake} turns to overtake
          </span>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        {[
          { label: 'Military', you: player.resources.militaryPower, them: rival.resources.militaryPower, color: 'bg-red-500' },
          { label: 'GDP', you: player.resources.gdp, them: rival.resources.gdp, color: 'bg-yellow-400' },
          { label: 'Influence', you: player.resources.influence, them: rival.resources.influence, color: 'bg-blue-400' },
          { label: 'Science', you: player.resources.science, them: rival.resources.science, color: 'bg-purple-400' },
        ].map(stat => {
          const total = stat.you + stat.them || 1;
          const leading = stat.you >= stat.them;
          return (
            <div key={stat.label}>
              <div className="flex justify-between text-[9px] mb-1">
                <span className="text-slate-400 uppercase font-bold">{stat.label}</span>
                <span className={`font-black ${leading ? 'text-emerald-400' : 'text-red-400'}`}>
                  {stat.you < 10 ? stat.you.toFixed(1) : Math.round(stat.you)} vs {stat.them < 10 ? stat.them.toFixed(1) : Math.round(stat.them)}
                </span>
              </div>
              <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full ${leading ? stat.color : 'bg-red-700'} rounded-full`}
                  initial={{ width: 0 }}
                  animate={{ width: `${(stat.you / total) * 100}%` }}
                  transition={{ duration: 0.6 }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Action definitions ───────────────────────────────────────────────────────

interface ActionDef {
  action: ActionType;
  label: string;
  icon: ReactNode;
  cost: string;
  color: 'green' | 'amber' | 'red';
  can: (p: Country, t: Country) => boolean;
  reason?: (p: Country, t: Country) => string;
}

function getActions(stance: Country['stanceTowardsPlayer']): ActionDef[] {
  const isHostile = stance === 'Hostile' || stance === 'At War';
  const isAlly    = stance === 'Ally';

  if (isHostile) return [
    { action: 'Sanction',   label: 'Sanction',    icon: <Ban size={14}/>,        cost: 'Free',     color: 'amber',
      can: () => true },
    { action: 'Intel',      label: 'Intel Op',    icon: <Eye size={14}/>,        cost: '20 INF',   color: 'amber',
      can: (p) => p.resources.influence >= 20, reason: () => 'Need 20 INF' },
    { action: 'Propaganda', label: 'Propaganda',  icon: <ShieldAlert size={14}/>,cost: '40 INF',   color: 'amber',
      can: (p) => p.resources.influence >= 40, reason: () => 'Need 40 INF' },
    { action: 'Military',   label: 'Air Strike',  icon: <Swords size={14}/>,     cost: '10 MIL',   color: 'red',
      can: (p) => p.resources.militaryPower >= 20, reason: () => 'Need 20 MIL' },
    { action: 'War',        label: 'Total War',   icon: <Sword size={14}/>,      cost: '30 MIL',   color: 'red',
      can: (p) => p.resources.militaryPower >= 50, reason: () => 'Need 50 MIL' },
    { action: 'UN',         label: 'UN Vote',     icon: <Vote size={14}/>,       cost: '30 INF',   color: 'amber',
      can: (p) => p.resources.influence >= 30, reason: () => 'Need 30 INF' },
  ];

  if (isAlly) return [
    { action: 'Trade',     label: 'Trade Deal',   icon: <DollarSign size={14}/>, cost: '10 INF',   color: 'green',
      can: (p) => p.resources.influence >= 10, reason: () => 'Need 10 INF' },
    { action: 'Research',  label: 'R&D Project',  icon: <FlaskConical size={14}/>,cost: '2 GDP + 10 INF', color: 'green',
      can: (p) => p.resources.gdp >= 2 && p.resources.influence >= 10, reason: () => 'Need 2 GDP + 10 INF' },
    { action: 'ArmsTrade', label: 'Sell Arms',    icon: <ShieldAlert size={14}/>,cost: '30 SCI',   color: 'amber',
      can: (p) => p.resources.science >= 30, reason: () => 'Need 30 SCI' },
    { action: 'Alliance',  label: 'Break Alliance',icon: <Handshake size={14}/>, cost: '—',        color: 'red',
      can: () => true },
  ];

  // Neutral, Friendly, Suspicious
  return [
    { action: 'Trade',     label: 'Trade Deal',   icon: <DollarSign size={14}/>, cost: '10 INF',   color: 'green',
      can: (p) => p.resources.influence >= 10, reason: () => 'Need 10 INF' },
    { action: 'Aid',       label: 'Send Aid',     icon: <Heart size={14}/>,      cost: '1 GDP',    color: 'green',
      can: (p) => p.resources.gdp >= 1, reason: () => 'Need 1 GDP' },
    { action: 'Alliance',  label: 'Propose Ally', icon: <Handshake size={14}/>,  cost: '50 INF',   color: 'green',
      can: (p, t) => p.resources.influence >= 50 && t.resources.stability >= 40,
      reason: (p, t) => p.resources.influence < 50 ? 'Need 50 INF' : 'Target needs 40% stability' },
    { action: 'Research',  label: 'R&D Project',  icon: <FlaskConical size={14}/>,cost: '2 GDP + 10 INF', color: 'green',
      can: (p) => p.resources.gdp >= 2 && p.resources.influence >= 10, reason: () => 'Need 2 GDP + 10 INF' },
    { action: 'Sanction',  label: 'Sanction',     icon: <Ban size={14}/>,        cost: 'Free',     color: 'amber',
      can: () => true },
    { action: 'Intel',     label: 'Intel Op',     icon: <Eye size={14}/>,        cost: '20 INF',   color: 'amber',
      can: (p) => p.resources.influence >= 20, reason: () => 'Need 20 INF' },
  ];
}

const COLOR = {
  green: { btn: 'border-emerald-500/40 text-emerald-300 bg-emerald-950/20 hover:bg-emerald-950/40 active:bg-emerald-900/50',
           disabled: 'border-slate-700 text-slate-600 cursor-not-allowed opacity-50' },
  amber: { btn: 'border-amber-500/30 text-amber-300 bg-amber-950/15 hover:bg-amber-950/30 active:bg-amber-900/40',
           disabled: 'border-slate-700 text-slate-600 cursor-not-allowed opacity-50' },
  red:   { btn: 'border-red-500/40 text-red-300 bg-red-950/15 hover:bg-red-950/30 active:bg-red-900/40',
           disabled: 'border-slate-700 text-slate-600 cursor-not-allowed opacity-50' },
};

// ─── Country Card ─────────────────────────────────────────────────────────────

function CountryCard({ country, player, isOpen, onToggle, onAction }: {
  country: Country;
  player: Country;
  isOpen: boolean;
  onToggle: () => void;
  onAction: (a: ActionType) => void;
}) {
  const stance = country.stanceTowardsPlayer;
  const actions = getActions(stance);

  const borderColor = {
    Ally:     'border-blue-500/40',
    Friendly: 'border-emerald-500/30',
    Neutral:  'border-slate-700',
    Suspicious:'border-orange-500/30',
    Hostile:  'border-red-500/30',
    'At War': 'border-red-600/60',
  }[stance] ?? 'border-slate-700';

  const stanceBadge = {
    Ally:     'bg-blue-500/15 text-blue-400',
    Friendly: 'bg-emerald-500/15 text-emerald-400',
    Neutral:  'bg-slate-800 text-slate-400',
    Suspicious:'bg-orange-500/15 text-orange-400',
    Hostile:  'bg-red-500/15 text-red-400',
    'At War': 'bg-red-600/20 text-red-300',
  }[stance] ?? 'bg-slate-800 text-slate-400';

  return (
    <div className={`rounded-2xl border ${borderColor} overflow-hidden transition-all`}>
      {/* Header row — always visible */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-3.5 text-left hover:bg-slate-800/30 active:bg-slate-800/50 transition-colors"
      >
        <span className="text-2xl flex-shrink-0">{country.flag}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="font-black text-white text-sm truncate">{country.name}</span>
            {country.nuclearArmed && <span className="text-[9px] text-amber-400 flex-shrink-0">☢</span>}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase ${stanceBadge}`}>
              {stance}
            </span>
            <span className="text-[9px] text-slate-500">
              GDP ${country.resources.gdp.toFixed(1)}T
              · MIL {country.resources.militaryPower}
              · <span className={country.resources.stability < 40 ? 'text-red-400' : ''}>{country.resources.stability}%</span>
            </span>
          </div>
        </div>
        <div className={`flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}>
          <ChevronDown size={16} className="text-slate-500" />
        </div>
      </button>

      {/* Expanded action panel — directly below, no scroll needed */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="px-3.5 pb-4 pt-1 border-t border-slate-800/60">
              {/* Stats row */}
              <div className="grid grid-cols-4 gap-2 mb-4 py-2 bg-slate-800/30 rounded-xl px-3">
                {[
                  { label: 'GDP',      value: `$${country.resources.gdp.toFixed(1)}T`,     color: 'text-yellow-400' },
                  { label: 'Military', value: String(country.resources.militaryPower),      color: 'text-red-400'    },
                  { label: 'Stability',value: `${country.resources.stability}%`,            color: country.resources.stability < 40 ? 'text-red-400' : 'text-emerald-400' },
                  { label: 'Science',  value: String(country.resources.science),            color: 'text-purple-400' },
                ].map(s => (
                  <div key={s.label} className="text-center">
                    <div className="text-[8px] uppercase text-slate-500 font-bold">{s.label}</div>
                    <div className={`text-xs font-black ${s.color}`}>{s.value}</div>
                  </div>
                ))}
              </div>

              {/* Action buttons — labeled, sized for mobile tap */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {actions.map(a => {
                  const ok = a.can(player, country);
                  const reason = !ok && a.reason ? a.reason(player, country) : undefined;
                  const cls = ok ? COLOR[a.color].btn : COLOR[a.color].disabled;
                  return (
                    <button
                      key={a.action}
                      onClick={() => ok && onAction(a.action)}
                      disabled={!ok}
                      title={reason}
                      className={`flex flex-col items-start gap-0.5 px-3 py-2.5 rounded-xl border text-left transition-all min-h-[52px] ${cls}`}
                    >
                      <div className="flex items-center gap-1.5">
                        {a.icon}
                        <span className="text-xs font-black leading-tight">{a.label}</span>
                      </div>
                      <span className="text-[9px] opacity-70 leading-tight">{reason ?? `Cost: ${a.cost}`}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── World Theater ────────────────────────────────────────────────────────────

type Group = { label: string; icon: ReactNode; color: string; countries: Country[] };

export function WorldTheater({ gameState, player, onAction }: Props) {
  const [openCountry, setOpenCountry] = useState<string | null>(null);

  const others = gameState.countries.filter(c => c.id !== gameState.playerCountryId);

  const toggle = (id: string) => setOpenCountry(prev => prev === id ? null : id);

  const groups: Group[] = [
    { label: 'Your Coalition', icon: <Shield size={13}/>,      color: 'text-blue-400',
      countries: others.filter(c => c.stanceTowardsPlayer === 'Ally' || c.stanceTowardsPlayer === 'Friendly') },
    { label: 'Contested',      icon: <TrendingUp size={13}/>,  color: 'text-amber-400',
      countries: others.filter(c => c.stanceTowardsPlayer === 'Neutral' || c.stanceTowardsPlayer === 'Suspicious') },
    { label: 'Hostile Bloc',   icon: <AlertTriangle size={13}/>,color: 'text-red-400',
      countries: others.filter(c => c.stanceTowardsPlayer === 'Hostile' || c.stanceTowardsPlayer === 'At War') },
  ].filter(g => g.countries.length > 0);

  const mainRival = others
    .filter(c => c.stanceTowardsPlayer === 'Hostile' || c.stanceTowardsPlayer === 'At War')
    .sort((a, b) => b.resources.militaryPower - a.resources.militaryPower)[0];

  return (
    <div className="space-y-5">
      {mainRival && <ThreatBar player={player} rival={mainRival} />}

      {groups.map(g => (
        <div key={g.label}>
          <div className="flex items-center gap-2 mb-2.5">
            <span className={g.color}>{g.icon}</span>
            <span className={`text-[10px] font-black uppercase tracking-[0.25em] ${g.color}`}>{g.label}</span>
            <div className="h-px flex-1 bg-slate-800" />
            <span className="text-[9px] text-slate-600">{g.countries.length}</span>
          </div>
          <div className="space-y-2">
            {g.countries.map(c => (
              <CountryCard
                key={c.id}
                country={c}
                player={player}
                isOpen={openCountry === c.id}
                onToggle={() => toggle(c.id)}
                onAction={(action) => { onAction(c.id, action); setOpenCountry(null); }}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
