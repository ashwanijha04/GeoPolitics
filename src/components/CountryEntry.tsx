/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { Country, ActionType } from '../types.ts';
import { AlertCircle, Heart, Shield, TrendingDown, DollarSign, Target, Handshake, FlaskConical } from 'lucide-react';

interface CountryEntryProps {
  country: Country;
  onAction: (action: ActionType) => void;
  key?: string | number;
}

export function CountryEntry({ country, onAction }: CountryEntryProps) {
  const isPlayer = country.alignment === 'Player-Aligned';
  const isAlly = country.stanceTowardsPlayer === 'Ally';

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
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-base md:text-lg text-slate-100">{country.name}</h3>
            <span className={`text-[9px] md:text-[10px] uppercase font-bold px-1.5 py-0.5 border ${getStanceColor(country.stanceTowardsPlayer)} rounded`}>
              {country.stanceTowardsPlayer}
            </span>
          </div>
          <p className="text-xs md:text-sm text-slate-400 italic line-clamp-2 md:line-clamp-none leading-relaxed">{country.description}</p>
        </div>

        <div className="grid grid-cols-3 md:flex gap-2 md:gap-6 px-0 md:px-6 py-2 md:py-0 border-y md:border-y-0 border-slate-800/30">
          <div className="text-center">
            <div className="text-[9px] uppercase text-slate-500 mb-0.5">GDP</div>
            <div className={`font-mono font-bold text-xs md:text-sm ${country.resources.gdp > 10 ? 'text-yellow-400' : 'text-white'}`}>${country.resources.gdp}T</div>
          </div>
          <div className="text-center">
            <div className="text-[9px] uppercase text-slate-500 mb-0.5">Stability</div>
            <div className={`font-mono font-bold text-xs md:text-sm ${country.resources.stability < 50 ? 'text-red-400' : 'text-emerald-400'}`}>{country.resources.stability}%</div>
          </div>
          <div className="text-center">
            <div className="text-[9px] uppercase text-slate-500 mb-0.5">Military</div>
            <div className="font-mono font-bold text-white text-xs md:text-sm px-2 py-0.5 rounded bg-slate-800">{country.resources.militaryPower}</div>
          </div>
          <div className="text-center">
            <div className="text-[9px] uppercase text-slate-500 mb-0.5">Science</div>
            <div className="font-mono font-bold text-blue-400 text-xs md:text-sm">{country.resources.science}</div>
          </div>
        </div>
      </div>

      {!isPlayer && (
        <div className="flex flex-wrap gap-2 pt-1">
          <ActionButton onClick={() => onAction('Trade')} icon={<TrendingDown className="rotate-180" size={14} />} label="Trade" color="blue" title="Boost Economy" />
          <ActionButton onClick={() => onAction('Aid')} icon={<Heart size={14} />} label="Aid" color="emerald" title="Send Humanitarian Support" />
          <ActionButton onClick={() => onAction('Alliance')} icon={<Handshake size={14} />} label={isAlly ? 'Break' : 'Ally'} color={isAlly ? 'red' : 'blue'} variant={isAlly ? 'ghost' : 'solid'} title="Forge or Break Alliance" />
          <ActionButton onClick={() => onAction('Intel')} icon={<Target size={14} />} label="Intel" color="orange" title="Intelligence Operation" />
          <ActionButton onClick={() => onAction('Propaganda')} icon={<Target size={14} className="text-purple-400" />} label="Propaganda" color="purple" title="Inject Fake News" />
          <ActionButton onClick={() => onAction('Research')} icon={<FlaskConical size={14} />} label="R&D" color="blue" title="Scientific Collaboration" />
          <ActionButton onClick={() => onAction('ArmsTrade')} icon={<DollarSign size={14} />} label="Sell" color="yellow" title="Sell Advanced Munitions" />
          <ActionButton onClick={() => onAction('Sanction')} icon={<AlertCircle size={14} />} label="Sanction" color="red" title="Economic Restrictions" />
          <ActionButton onClick={() => onAction('Military')} icon={<Shield size={14} />} label="Strike" color="red" title="Military Strike" />
          <ActionButton onClick={() => onAction('War')} icon={<AlertCircle size={14} className="animate-pulse" />} label="Total War" color="red" variant="solid" title="Declare Total War" />
        </div>
      )}
    </motion.div>
  );
}

function ActionButton({ onClick, icon, label, color, variant = 'ghost', title }: any) {
  const colors: any = {
    blue: variant === 'solid' ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-500' : 'border-blue-500/30 text-blue-400 hover:bg-blue-500/10 hover:border-blue-500/50',
    emerald: 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/50',
    orange: 'border-orange-500/30 text-orange-400 hover:bg-orange-500/10 hover:border-orange-500/50',
    purple: 'border-purple-500/30 text-purple-400 hover:bg-purple-500/10 hover:border-purple-500/50',
    yellow: 'border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10 hover:border-yellow-500/50',
    red: variant === 'solid' ? 'bg-red-600 text-white border-red-600 hover:bg-red-500' : 'border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50',
  };

  return (
    <button 
      onClick={onClick}
      title={title}
      className={`flex items-center gap-2 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider border rounded transition-all flex-grow md:flex-grow-0 justify-center min-w-[80px] ${colors[color]}`}
    >
      {icon}
      {label}
    </button>
  );
}
