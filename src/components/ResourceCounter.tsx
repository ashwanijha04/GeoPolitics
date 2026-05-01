/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { TrendingUp, Shield, Users, Globe, Wallet, FlaskConical } from 'lucide-react';

interface ResourceProps {
  label: string;
  value: number;
  suffix?: string;
  icon: 'gdp' | 'stability' | 'military' | 'influence' | 'population' | 'science';
  color: string;
  description?: string;
}

export function ResourceCounter({ label, value, suffix = '', icon, color, description }: ResourceProps) {
  const Icon = {
    gdp: Wallet,
    stability: Shield,
    military: TrendingUp,
    influence: Globe,
    population: Users,
    science: FlaskConical,
  }[icon];

  return (
    <div className="flex flex-col p-1.5 md:p-3 border-r border-slate-700 last:border-0 min-w-[70px] md:min-w-[140px] group relative">
      <div className="flex items-center gap-1 md:gap-2 text-[8px] md:text-xs font-mono uppercase text-slate-400 mb-0.5 md:mb-1">
        <Icon size={10} className={`${color} md:w-3.5 md:h-3.5`} />
        <span className="truncate">{label}</span>
      </div>
      <motion.div 
        key={value}
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-xs md:text-xl font-bold font-mono text-white"
      >
        {Number.isInteger(value) ? value : value.toFixed(1)}{suffix}
      </motion.div>
      
      {description && (
        <div className="absolute top-full left-0 mt-1 w-48 p-2 bg-slate-900 border border-slate-700 rounded shadow-xl text-[10px] text-slate-400 hidden group-hover:block z-50">
          {description}
        </div>
      )}
    </div>
  );
}
