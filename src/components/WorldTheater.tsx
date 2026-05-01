/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { Zap, Shield, TrendingUp, AlertTriangle, ChevronRight } from 'lucide-react';
import { Country, GameState, ActionType } from '../types.ts';

interface Props {
  gameState: GameState;
  player: Country;
  onAction: (countryId: string, action: ActionType) => void;
  onOpenCountry: (countryId: string) => void;
}

function ThreatBar({ player, rival }: { player: Country; rival: Country }) {
  const milDiff = player.resources.militaryPower - rival.resources.militaryPower;
  const gdpDiff = player.resources.gdp - rival.resources.gdp;
  const isBehind = milDiff < 0 || gdpDiff < 0;
  const turnsToOvertake = milDiff < 0 ? Math.abs(Math.ceil(milDiff / 2)) : null;

  return (
    <div className={`p-4 rounded-2xl border ${isBehind ? 'border-red-500/30 bg-red-950/10' : 'border-slate-700 bg-slate-900/40'}`}>
      <div className="flex items-center gap-2 mb-3">
        <Zap size={14} className={isBehind ? 'text-red-400' : 'text-slate-400'} />
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Rival Threat: {rival.flag} {rival.name}</span>
        {turnsToOvertake !== null && turnsToOvertake <= 5 && (
          <span className="ml-auto text-[9px] font-black text-red-400 bg-red-950/50 border border-red-500/30 px-2 py-0.5 rounded animate-pulse">
            ⚠ OVERTAKE IN ~{turnsToOvertake} TURNS
          </span>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Military', you: player.resources.militaryPower, them: rival.resources.militaryPower, color: 'bg-red-500' },
          { label: 'GDP ($T)', you: player.resources.gdp, them: rival.resources.gdp, color: 'bg-yellow-400' },
          { label: 'Influence', you: player.resources.influence, them: rival.resources.influence, color: 'bg-blue-400' },
          { label: 'Science', you: player.resources.science, them: rival.resources.science, color: 'bg-purple-400' },
        ].map(stat => {
          const total = stat.you + stat.them || 1;
          const youPct = (stat.you / total) * 100;
          const leading = stat.you >= stat.them;
          return (
            <div key={stat.label}>
              <div className="flex justify-between text-[9px] mb-1">
                <span className="text-slate-400 font-bold uppercase">{stat.label}</span>
                <span className={leading ? 'text-emerald-400 font-black' : 'text-red-400 font-black'}>
                  {typeof stat.you === 'number' && stat.you < 10 ? stat.you.toFixed(1) : Math.round(stat.you)}
                  {' '}vs{' '}
                  {typeof stat.them === 'number' && stat.them < 10 ? stat.them.toFixed(1) : Math.round(stat.them)}
                </span>
              </div>
              <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full ${leading ? stat.color : 'bg-red-700'} rounded-full`}
                  initial={{ width: 0 }}
                  animate={{ width: `${youPct}%` }}
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

type Group = { label: string; icon: React.ReactNode; color: string; bg: string; countries: Country[] };

function MiniCountryCard({ country, player, onAction, onOpen }: {
  country: Country;
  player: Country;
  onAction: (action: ActionType) => void;
  onOpen: () => void;
}) {
  const stance = country.stanceTowardsPlayer;
  const isHostile = stance === 'Hostile' || stance === 'At War';
  const isAlly = stance === 'Ally';

  const quickActions: { action: ActionType; label: string; icon: string; available: boolean }[] = isHostile
    ? [
        { action: 'Sanction',    label: 'Sanction', icon: '⛔', available: true },
        { action: 'Intel',       label: 'Intel',    icon: '🔍', available: player.resources.influence >= 20 },
        { action: 'Military',    label: 'Strike',   icon: '⚔️', available: player.resources.militaryPower >= 20 },
      ]
    : isAlly
    ? [
        { action: 'Trade',    label: 'Trade',    icon: '📈', available: player.resources.influence >= 10 },
        { action: 'Research', label: 'R&D',      icon: '🔬', available: player.resources.gdp >= 2 },
        { action: 'ArmsTrade',label: 'Arms',     icon: '🔫', available: player.resources.science >= 30 },
      ]
    : [
        { action: 'Trade',    label: 'Trade',    icon: '📈', available: player.resources.influence >= 10 },
        { action: 'Aid',      label: 'Aid',      icon: '🤝', available: player.resources.gdp >= 1 },
        { action: 'Alliance', label: 'Ally',     icon: '🤝', available: player.resources.influence >= 50 && country.resources.stability >= 40 },
      ];

  const stanceColor = {
    Ally: 'border-blue-500/40 bg-blue-950/10',
    Friendly: 'border-emerald-500/30 bg-emerald-950/10',
    Neutral: 'border-slate-700 bg-slate-900/40',
    Suspicious: 'border-orange-500/30 bg-orange-950/10',
    Hostile: 'border-red-500/30 bg-red-950/10',
    'At War': 'border-red-600/50 bg-red-950/20',
  }[stance] ?? 'border-slate-700 bg-slate-900/40';

  return (
    <div className={`p-3 rounded-xl border ${stanceColor} flex items-center gap-3`}>
      <button onClick={onOpen} className="flex items-center gap-2 flex-1 min-w-0 hover:opacity-80 transition-opacity text-left">
        <span className="text-xl flex-shrink-0">{country.flag}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-black text-white text-sm truncate">{country.name}</span>
            {country.nuclearArmed && <span className="text-[9px] text-amber-400">☢</span>}
          </div>
          <div className="flex gap-2 text-[9px] text-slate-500">
            <span>GDP ${country.resources.gdp.toFixed(1)}T</span>
            <span>MIL {country.resources.militaryPower}</span>
            <span className={country.resources.stability < 40 ? 'text-red-400' : ''}>{country.resources.stability}%</span>
          </div>
        </div>
        <ChevronRight size={12} className="text-slate-600 flex-shrink-0" />
      </button>
      <div className="flex gap-1 flex-shrink-0">
        {quickActions.map(qa => (
          <button
            key={qa.action}
            onClick={() => onAction(qa.action)}
            disabled={!qa.available}
            title={qa.label}
            className={`w-7 h-7 rounded-lg text-xs flex items-center justify-center transition-all ${
              qa.available ? 'hover:bg-slate-700 bg-slate-800 border border-slate-700' : 'opacity-20 cursor-not-allowed bg-slate-900'
            }`}
          >
            {qa.icon}
          </button>
        ))}
      </div>
    </div>
  );
}

export function WorldTheater({ gameState, player, onAction, onOpenCountry }: Props) {
  const others = gameState.countries.filter(c => c.id !== gameState.playerCountryId);

  const groups: Group[] = [
    {
      label: 'Your Coalition',
      icon: <Shield size={13} />,
      color: 'text-blue-400',
      bg: '',
      countries: others.filter(c => c.stanceTowardsPlayer === 'Ally' || c.stanceTowardsPlayer === 'Friendly'),
    },
    {
      label: 'Contested — Neutrals',
      icon: <TrendingUp size={13} />,
      color: 'text-amber-400',
      bg: '',
      countries: others.filter(c => c.stanceTowardsPlayer === 'Neutral' || c.stanceTowardsPlayer === 'Suspicious'),
    },
    {
      label: 'Hostile Bloc',
      icon: <AlertTriangle size={13} />,
      color: 'text-red-400',
      bg: '',
      countries: others.filter(c => c.stanceTowardsPlayer === 'Hostile' || c.stanceTowardsPlayer === 'At War'),
    },
  ].filter(g => g.countries.length > 0);

  const mainRival = others
    .filter(c => c.stanceTowardsPlayer === 'Hostile' || c.stanceTowardsPlayer === 'At War')
    .sort((a, b) => b.resources.militaryPower - a.resources.militaryPower)[0];

  return (
    <div className="space-y-6">
      {/* Rival threat monitor */}
      {mainRival && <ThreatBar player={player} rival={mainRival} />}

      {/* Country groups */}
      {groups.map(g => (
        <div key={g.label}>
          <div className="flex items-center gap-2 mb-3">
            <span className={g.color}>{g.icon}</span>
            <span className={`text-[10px] font-black uppercase tracking-[0.25em] ${g.color}`}>{g.label}</span>
            <div className="h-px flex-1 bg-slate-800" />
            <span className="text-[9px] text-slate-600">{g.countries.length} nations</span>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {g.countries.map(c => (
              <MiniCountryCard
                key={c.id}
                country={c}
                player={player}
                onAction={(action) => onAction(c.id, action)}
                onOpen={() => onOpenCountry(c.id)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
