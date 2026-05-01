import React from 'react';
import { motion } from 'motion/react';
import { TechNode, TechCategory } from '../types.ts';
import { TECH_TREE } from '../constants.ts';
import { Shield, Wallet, Globe, Lock, CheckCircle, Zap, Eye } from 'lucide-react';

interface ResearchTreeProps {
  unlockedTechIds: string[];
  currentScience: number;
  onUnlock: (techId: string) => void;
}

export function ResearchTree({ unlockedTechIds, currentScience, onUnlock }: ResearchTreeProps) {
  const categories: TechCategory[] = ['Military', 'Economy', 'Diplomacy', 'Intelligence'];

  const getCategoryIcon = (category: TechCategory) => {
    switch (category) {
      case 'Military':     return <Shield size={16} className="text-red-400" />;
      case 'Economy':      return <Wallet size={16} className="text-yellow-400" />;
      case 'Diplomacy':    return <Globe size={16} className="text-blue-400" />;
      case 'Intelligence': return <Eye size={16} className="text-purple-400" />;
    }
  };

  const getCategoryColor = (category: TechCategory) => {
    switch (category) {
      case 'Military':     return 'border-red-500/20 bg-red-950/10';
      case 'Economy':      return 'border-yellow-500/20 bg-yellow-950/10';
      case 'Diplomacy':    return 'border-blue-500/20 bg-blue-950/10';
      case 'Intelligence': return 'border-purple-500/20 bg-purple-950/10';
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-6xl mx-auto space-y-12"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Scientific Research Cluster</h2>
          <p className="text-slate-400">Invest SCIENTIFIC PROGRESS into global dominance protocols.</p>
        </div>
        <div className="bg-slate-900 px-6 py-4 border border-slate-800 rounded-2xl flex items-center gap-4 shadow-xl">
          <Zap className="text-purple-400" size={24} />
          <div>
            <div className="text-[10px] text-slate-500 uppercase font-mono tracking-widest">Available R&D Progress</div>
            <div className="text-2xl font-black text-white">{currentScience} <span className="text-xs text-purple-400 font-mono">SCI</span></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {categories.map((category) => (
          <div key={category} className="space-y-6">
            <div className={`p-3 rounded-xl border flex items-center gap-3 ${getCategoryColor(category)}`}>
              {getCategoryIcon(category)}
              <h3 className="text-sm font-black uppercase tracking-widest text-white">{category} Protocols</h3>
            </div>
            
            <div className="space-y-4">
              {TECH_TREE.filter(t => t.category === category).map((tech) => {
                const isUnlocked = unlockedTechIds.includes(tech.id);
                const canAfford = currentScience >= tech.cost;
                const depsMet = tech.dependencies.every(id => unlockedTechIds.includes(id));
                const isLocked = !isUnlocked && !depsMet;

                return (
                  <motion.div
                    key={tech.id}
                    whileHover={!isUnlocked && !isLocked ? { scale: 1.02 } : {}}
                    className={`relative p-5 rounded-2xl border transition-all ${
                      isUnlocked 
                        ? 'bg-emerald-500/10 border-emerald-500/30' 
                        : isLocked
                        ? 'bg-slate-900/50 border-slate-800 opacity-50'
                        : 'bg-slate-900 border-slate-800 hover:border-blue-500/50'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <h4 className={`font-bold ${isUnlocked ? 'text-emerald-400' : 'text-white'}`}>
                        {tech.name}
                      </h4>
                      {isUnlocked ? (
                        <CheckCircle size={18} className="text-emerald-400" />
                      ) : isLocked ? (
                        <Lock size={16} className="text-slate-600" />
                      ) : (
                        <div className={`text-xs font-mono font-bold ${canAfford ? 'text-purple-400' : 'text-red-400'}`}>
                          {tech.cost} SCI
                        </div>
                      )}
                    </div>
                    
                    <p className="text-xs text-slate-400 mb-4 leading-relaxed line-clamp-2">
                      {tech.description}
                    </p>

                    {!isUnlocked && !isLocked && (
                      <button
                        onClick={() => onUnlock(tech.id)}
                        disabled={!canAfford}
                        className={`w-full py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                          canAfford 
                            ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20' 
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        Initiate Protocol
                      </button>
                    )}

                    {isLocked && (
                      <div className="text-[9px] uppercase text-slate-600 font-bold">
                        Requires: {tech.dependencies.map(id => TECH_TREE.find(t => t.id === id)?.name).join(', ')}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
