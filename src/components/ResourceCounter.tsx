/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
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

  // Track the last value so we can flash a +X / -X pill on change.
  const prev = useRef(value);
  const [flash, setFlash] = useState<{ id: number; delta: number } | null>(null);
  useEffect(() => {
    const delta = Number((value - prev.current).toFixed(2));
    if (delta !== 0) {
      const id = Date.now() + Math.random();
      setFlash({ id, delta });
      const t = setTimeout(() => setFlash(curr => (curr && curr.id === id ? null : curr)), 1800);
      prev.current = value;
      return () => clearTimeout(t);
    }
    prev.current = value;
  }, [value]);

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

      <AnimatePresence>
        {flash && (
          <motion.div
            key={flash.id}
            initial={{ opacity: 0, y: 0 }}
            animate={{ opacity: 1, y: -10 }}
            exit={{ opacity: 0, y: -18 }}
            className={`absolute right-2 top-2 text-[10px] md:text-xs font-black font-mono px-1.5 py-0.5 rounded ${
              flash.delta > 0
                ? 'text-emerald-300 bg-emerald-950/60 border border-emerald-500/40'
                : 'text-red-300 bg-red-950/60 border border-red-500/40'
            }`}
          >
            {flash.delta > 0 ? '+' : ''}{Math.abs(flash.delta) < 1 ? flash.delta.toFixed(2) : Math.round(flash.delta)}
          </motion.div>
        )}
      </AnimatePresence>

      {description && (
        <div className="absolute top-full left-0 mt-1 w-48 p-2 bg-slate-900 border border-slate-700 rounded shadow-xl text-[10px] text-slate-400 hidden group-hover:block z-50">
          {description}
        </div>
      )}
    </div>
  );
}
