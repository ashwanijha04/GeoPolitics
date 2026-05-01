/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import { Country, ActionType } from '../types.ts';
import { ACTION_INFO, type ActionInfo } from '../actions.ts';
import {
  AlertCircle,
  Heart,
  Shield,
  TrendingDown,
  DollarSign,
  Target,
  Handshake,
  FlaskConical,
  Megaphone,
  Sword,
  Vote,
} from 'lucide-react';

interface CountryEntryProps {
  country: Country;
  player: Country;
  onAction: (action: ActionType) => void;
  key?: string | number;
}

type AffordCheck = { ok: boolean; reason?: string };

export function CountryEntry({ country, player, onAction }: CountryEntryProps) {
  const isPlayer = country.alignment === 'Player-Aligned';
  const isAlly = country.stanceTowardsPlayer === 'Ally';

  const can = (action: ActionType): AffordCheck => {
    const r = player.resources;
    switch (action) {
      case 'Trade': return r.influence >= 10 ? { ok: true } : { ok: false, reason: 'Need 10 INF' };
      case 'Aid': return r.gdp >= 1.0 ? { ok: true } : { ok: false, reason: 'Need 1.0 GDP' };
      case 'Intel': return r.influence >= 20 ? { ok: true } : { ok: false, reason: 'Need 20 INF' };
      case 'Propaganda': return r.influence >= 40 ? { ok: true } : { ok: false, reason: 'Need 40 INF' };
      case 'Research': return r.gdp >= 2.0 && r.influence >= 10 ? { ok: true } : { ok: false, reason: 'Need 2.0 GDP & 10 INF' };
      case 'ArmsTrade': return r.science >= 30 ? { ok: true } : { ok: false, reason: 'Need 30 SCI' };
      case 'Military': return r.militaryPower >= 20 ? { ok: true } : { ok: false, reason: 'Need 20 MIL' };
      case 'War': return r.militaryPower >= 50 ? { ok: true } : { ok: false, reason: 'Need 50 MIL' };
      case 'Sanction': return { ok: true };
      case 'Alliance':
        if (isAlly) return { ok: true };
        if (r.influence < 50) return { ok: false, reason: 'Need 50 INF' };
        if (country.resources.stability < 40) return { ok: false, reason: 'Target STBL < 40' };
        return { ok: true };
      case 'UN':
        if (r.influence < 30) return { ok: false, reason: 'Need 30 INF' };
        if (isAlly) return { ok: false, reason: 'Cannot sanction ally' };
        return { ok: true };
      default: return { ok: true };
    }
  };

  const getStanceColor = (stance: string) => {
    switch (stance) {
      case 'Ally': return 'text-blue-400 border-blue-400';
      case 'Friendly': return 'text-emerald-400 border-emerald-400';
      case 'Neutral': return 'text-slate-400 border-slate-400';
      case 'Suspicious': return 'text-orange-400 border-orange-400';
      case 'Hostile': return 'text-red-400 border-red-400';
      case 'At War': return 'text-red-600 border-red-600 bg-red-900/10';
      default: return 'text-slate-400 border-slate-400';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex flex-col p-4 border border-slate-800 bg-slate-900/50 hover:border-slate-700 transition-all rounded-lg"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-lg leading-none">{country.flag}</span>
            <h3 className="font-bold text-base md:text-lg text-slate-100">{country.name}</h3>
            <span className={`text-[9px] md:text-[10px] uppercase font-bold px-1.5 py-0.5 border ${getStanceColor(country.stanceTowardsPlayer)} rounded`}>
              {country.stanceTowardsPlayer}
            </span>
            {country.nuclearArmed && (
              <span className="text-[8px] font-black text-amber-400 bg-amber-950/30 border border-amber-500/20 px-1.5 py-0.5 rounded">☢ NUCLEAR</span>
            )}
          </div>
          <p className="text-xs md:text-sm text-slate-400 italic line-clamp-2 md:line-clamp-none leading-relaxed">{country.description}</p>
        </div>

        <div className="grid grid-cols-4 md:flex gap-2 md:gap-6 px-0 md:px-6 py-2 md:py-0 border-y md:border-y-0 border-slate-800/30">
          <Stat label="GDP" value={`$${country.resources.gdp}T`} accent={country.resources.gdp > 10 ? 'text-yellow-400' : 'text-white'} />
          <Stat label="Stability" value={`${country.resources.stability}%`} accent={country.resources.stability < 50 ? 'text-red-400' : 'text-emerald-400'} />
          <Stat label="Military" value={String(country.resources.militaryPower)} accent="text-white" pill />
          <Stat label="Science" value={String(country.resources.science)} accent="text-blue-400" />
        </div>
      </div>

      {!isPlayer && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 pt-1">
          <ActionButton action="Trade" icon={<TrendingDown className="rotate-180" size={14} />} affordance={can('Trade')} onClick={() => onAction('Trade')} />
          <ActionButton action="Aid" icon={<Heart size={14} />} affordance={can('Aid')} onClick={() => onAction('Aid')} />
          <ActionButton action="Alliance" icon={<Handshake size={14} />} affordance={can('Alliance')} onClick={() => onAction('Alliance')} overrideLabel={isAlly ? 'Break Alliance' : undefined} variant={isAlly ? 'aggressive' : undefined} />
          <ActionButton action="Research" icon={<FlaskConical size={14} />} affordance={can('Research')} onClick={() => onAction('Research')} />
          <ActionButton action="ArmsTrade" icon={<DollarSign size={14} />} affordance={can('ArmsTrade')} onClick={() => onAction('ArmsTrade')} />
          <ActionButton action="Intel" icon={<Target size={14} />} affordance={can('Intel')} onClick={() => onAction('Intel')} />
          <ActionButton action="Propaganda" icon={<Megaphone size={14} />} affordance={can('Propaganda')} onClick={() => onAction('Propaganda')} />
          <ActionButton action="Sanction" icon={<AlertCircle size={14} />} affordance={can('Sanction')} onClick={() => onAction('Sanction')} />
          <ActionButton action="Military" icon={<Shield size={14} />} affordance={can('Military')} onClick={() => onAction('Military')} />
          <ActionButton action="War" icon={<Sword size={14} className="animate-pulse" />} affordance={can('War')} onClick={() => onAction('War')} />
          {!isAlly && <ActionButton action="UN" icon={<Vote size={14} />} affordance={can('UN')} onClick={() => onAction('UN')} />}
        </div>
      )}
    </motion.div>
  );
}

function Stat({ label, value, accent, pill }: { label: string; value: string; accent: string; pill?: boolean }) {
  return (
    <div className="text-center">
      <div className="text-[9px] uppercase text-slate-500 mb-0.5">{label}</div>
      <div className={`font-mono font-bold text-xs md:text-sm ${accent} ${pill ? 'px-2 py-0.5 rounded bg-slate-800 inline-block' : ''}`}>
        {value}
      </div>
    </div>
  );
}

function ActionButton({
  action,
  icon,
  onClick,
  affordance,
  overrideLabel,
  variant,
}: {
  action: Exclude<ActionType, 'UnlockTech'>;
  icon: ReactNode;
  onClick: () => void;
  affordance: AffordCheck;
  overrideLabel?: string;
  variant?: ActionInfo['tone'];
}) {
  const info = ACTION_INFO[action];
  const tone = variant ?? info.tone;
  const blockedReason = affordance.ok ? null : affordance.reason ?? 'Locked';
  const disabled = !affordance.ok;

  const toneClass = disabled
    ? 'border-slate-800 text-slate-600 bg-slate-900/40 cursor-not-allowed'
    : tone === 'good'
      ? 'border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10 hover:border-emerald-400'
      : tone === 'risky'
        ? 'border-orange-500/30 text-orange-300 hover:bg-orange-500/10 hover:border-orange-400'
        : tone === 'aggressive'
          ? 'border-red-500/40 text-red-300 hover:bg-red-500/10 hover:border-red-400'
          : 'border-slate-700 text-slate-300 hover:bg-slate-800';

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={`${info.label} — ${info.blurb}\nCost: ${info.cost}\nEffect: ${info.effect}${blockedReason ? `\nBlocked: ${blockedReason}` : ''}`}
      className={`group relative flex flex-col items-start gap-1 px-3 py-2 text-left border rounded-lg transition-all ${toneClass}`}
    >
      <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-wider">
        {icon}
        <span>{overrideLabel ?? info.label}</span>
      </div>
      <div className="text-[9px] font-mono text-slate-500 leading-tight">
        <div>cost {info.cost}</div>
        <div className="opacity-80">→ {info.effect}</div>
      </div>
      {blockedReason && (
        <span className="absolute top-1 right-1 text-[8px] font-bold uppercase text-red-400/80 bg-red-950/40 px-1 rounded">
          {blockedReason}
        </span>
      )}
    </button>
  );
}

