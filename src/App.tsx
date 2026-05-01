/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Globe, 
  Terminal, 
  ChevronRight, 
  History, 
  Activity, 
  Play, 
  Settings,
  User,
  LogOut,
  Map as WorldMapIcon,
  MessageSquare,
  Shield,
  TrendingUp,
  Target,
  FlaskConical,
  AlertCircle as AlertCircleIcon
} from 'lucide-react';
import { ResourceCounter } from './components/ResourceCounter.tsx';
import { NewsTicker } from './components/NewsTicker.tsx';
import { CountryEntry } from './components/CountryEntry.tsx';
import { ToastContainer } from './components/ToastContainer.tsx';
import { ResearchTree } from './components/ResearchTree.tsx';
import { INITIAL_COUNTRIES, TECH_TREE } from './constants.ts';
import { GameState, Country, GameEvent, ResourceSet, ActionType, Toast } from './types.ts';
import { generateNewsEvent, getAdvisorAdvice } from './services/geminiService.ts';

export default function App() {
  const [gameState, setGameState] = useState<GameState>({
    gameStarted: false,
    turn: 1,
    playerCountryId: 'usa',
    countries: INITIAL_COUNTRIES,
    events: [],
    newsLog: ["Initial reports incoming..."],
    actionHistory: [],
    unlockedTechIds: [],
    history: [],
  });

  const [activeTab, setActiveTab] = useState<'world' | 'intel' | 'history' | 'advisors' | 'research'>('world');
  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingEvent, setPendingEvent] = useState<Partial<GameEvent> | null>(null);
  const [advisorMessage, setAdvisorMessage] = useState<string>('Welcome back, Commander. Awaiting your orders.');
  const [showBriefing, setShowBriefing] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (message: string, type: Toast['type'] = 'info') => {
    setToasts(prev => {
      // Prevent duplicate messages appearing twice
      if (prev.some(t => t.message === message)) return prev;
      
      const id = Math.random().toString(36).substr(2, 9);
      const newToasts = [...prev, { id, message, type }];
      // Limit to 3 toasts max at once for readability
      return newToasts.slice(-3);
    });
    
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.message !== message));
    }, 4000);
  };

  const startGame = (countryId: string) => {
    const updatedCountries = INITIAL_COUNTRIES.map(c => {
      if (c.id === countryId) {
        return { ...c, alignment: 'Player-Aligned' as const, stanceTowardsPlayer: 'Ally' as const };
      }
      let stance: any = 'Neutral';
      if (c.id === 'rival') stance = 'Hostile';
      if (c.id === 'usa' && countryId !== 'usa') stance = 'Suspicious';
      
      return { ...c, alignment: c.id === 'rival' ? 'Rival-Aligned' as const : 'Neutral' as const, stanceTowardsPlayer: stance };
    });

    const selected = updatedCountries.find(c => c.id === countryId)!;
    setGameState(prev => ({
      ...prev,
      gameStarted: true,
      playerCountryId: countryId,
      countries: updatedCountries,
      unlockedTechIds: [],
      newsLog: [`Executive transition complete. You have assumed the presidency of the ${selected.name}.`],
      history: [{ turn: 1, gdp: selected.resources.gdp, stability: selected.resources.stability }]
    }));
    setShowBriefing(true);
  };

  const playerCountry = gameState.countries.find(c => c.id === gameState.playerCountryId)!;

  const unlockTech = (techId: string) => {
    const tech = TECH_TREE.find(t => t.id === techId);
    if (!tech) return;

    if (gameState.unlockedTechIds.includes(techId)) {
      addToast("Technology already mastered.", "info");
      return;
    }

    if (playerCountry.resources.science < tech.cost) {
      addToast(`Insufficient Scientific Progress. Need ${tech.cost} SCI.`, "error");
      return;
    }

    setGameState(prev => {
      const updatedCountries = prev.countries.map(c => {
        if (c.id === prev.playerCountryId) {
          const newResources = { ...c.resources };
          newResources.science -= tech.cost;
          // Apply instant buff
          newResources[tech.impact.resource] *= tech.impact.multiplier;
          return { ...c, resources: newResources };
        }
        return c;
      });

      return {
        ...prev,
        countries: updatedCountries,
        unlockedTechIds: [...prev.unlockedTechIds, techId],
        newsLog: [...prev.newsLog, `BREAKTHROUGH: ${playerCountry.name} masters ${tech.name}.`],
        actionHistory: [
          ...prev.actionHistory,
          { turn: prev.turn, countryName: playerCountry.name, action: 'UnlockTech', message: `Mastered ${tech.name}: ${tech.description}` }
        ]
      };
    });

    addToast(`BREAKTHROUGH: ${tech.name} unlocked!`, "success");
  };

  const nextTurn = useCallback(async () => {
    setIsProcessing(true);
    
    // 1. Generate core world event from Gemini
    const newsEvent = await generateNewsEvent(gameState);
    setPendingEvent(newsEvent);
    
    // 2. Process passive changes (economy, military maintenance etc)
    const updatedCountries = gameState.countries.map(country => {
      const isPlayer = country.id === gameState.playerCountryId;
      
      // Growth factors
      const stabilityFactor = country.resources.stability / 100;
      const gdpGrowth = 0.02 + (Math.random() * 0.03 * stabilityFactor); // 2-5% growth
      const scienceGrowth = 0.5 + (country.resources.gdp / 10) * (stabilityFactor);
      
      let newGdp = country.resources.gdp * (1 + (gdpGrowth / 12));
      let newScience = country.resources.science + scienceGrowth;
      let newStability = Math.min(100, Math.max(0, country.resources.stability + (Math.random() * 2 - 1)));
      let newInfluence = country.resources.influence;

      // Influence reflects global standing
      if (country.stanceTowardsPlayer === 'Ally') {
        newInfluence = Math.min(100, newInfluence + 1);
      }

      // Military maintenance
      const maintenance = (country.resources.militaryPower / 100) * 0.5; // Up to 0.5T per turn
      newGdp = Math.max(0, newGdp - (maintenance / 12));

      // Apply event impact if this country is targeted
      let finalGdp = newGdp;
      let finalStability = newStability;
      let finalMilitary = country.resources.militaryPower;
      let finalInfluence = newInfluence;
      let finalScience = newScience;

      if (newsEvent.impactedCountryId === country.id) {
        const val = newsEvent.valueChange || 0;
        switch (newsEvent.resource as keyof ResourceSet) {
          case 'gdp': finalGdp += val; break;
          case 'stability': finalStability += val; break;
          case 'militaryPower': finalMilitary += val; break;
          case 'influence': finalInfluence += val; break;
          case 'science': finalScience += val; break;
        }
      }

      return {
        ...country,
        resources: {
          ...country.resources,
          gdp: Number(finalGdp.toFixed(2)),
          stability: Math.round(finalStability),
          militaryPower: Math.round(finalMilitary),
          influence: Math.round(finalInfluence),
          science: Math.round(finalScience),
        }
      };
    });

    setGameState(prev => ({
      ...prev,
      turn: prev.turn + 1,
      countries: updatedCountries,
      newsLog: [...prev.newsLog, newsEvent.title || "Month passed peacefully."],
      history: [...prev.history, { 
        turn: prev.turn + 1, 
        gdp: updatedCountries.find(c => c.id === prev.playerCountryId)!.resources.gdp,
        stability: updatedCountries.find(c => c.id === prev.playerCountryId)!.resources.stability
      }]
    }));

    setIsProcessing(false);
    addToast(`Turn ${gameState.turn + 1}: ${newsEvent.title}`, (newsEvent.valueChange || 0) < 0 ? 'warning' : 'info');
  }, [gameState]);

  const fetchAdvisorInfo = async (role: string) => {
    setIsProcessing(true);
    const advice = await getAdvisorAdvice(gameState, role);
    setAdvisorMessage(advice);
    setIsProcessing(false);
  };

  const performAction = useCallback((countryId: string, action: ActionType) => {
    if (isProcessing) return;

    setGameState(prev => {
      const updatedCountries = prev.countries.map(c => ({ ...c, resources: { ...c.resources } }));
      const targetIdx = updatedCountries.findIndex(c => c.id === countryId);
      const playerIdx = updatedCountries.findIndex(c => c.id === prev.playerCountryId);
      
      if (targetIdx === -1 || playerIdx === -1) return prev;

      const target = updatedCountries[targetIdx];
      const player = updatedCountries[playerIdx];

      let logMessage = "";
      let toastType: Toast['type'] = 'info';

      switch (action) {
        case 'Trade':
          if (player.resources.influence >= 10) {
            player.resources.influence -= 10;
            player.resources.gdp += 0.5;
            target.resources.gdp += 0.3;
            logMessage = `Major trade agreement signed with ${target.name}.`;
            toastType = 'success';
          } else {
            logMessage = "Insufficient influence for trade deal.";
            toastType = 'error';
          }
          break;
        case 'Aid':
          if (player.resources.gdp >= 1.0) {
            player.resources.gdp -= 1.0;
            target.resources.stability = Math.min(100, target.resources.stability + 10);
            target.resources.influence += 5;
            logMessage = `Humanitarian aid package dispatched to ${target.name}.`;
            toastType = 'success';
          } else {
            logMessage = "Insufficient GDP for aid package.";
            toastType = 'error';
          }
          break;
        case 'Intel':
          if (player.resources.influence >= 20) {
            player.resources.influence -= 20;
            target.resources.stability = Math.max(0, target.resources.stability - 5);
            logMessage = `Covert intelligence operation compromised key infrastructure in ${target.name}.`;
            toastType = 'warning';
          } else {
            logMessage = "Insufficient influence for intelligence op.";
            toastType = 'error';
          }
          break;
        case 'Sanction':
          target.resources.gdp *= 0.95;
          target.resources.stability = Math.max(0, target.resources.stability - 2);
          logMessage = `Economic sanctions imposed on ${target.name}.`;
          toastType = 'warning';
          break;
        case 'Military':
          if (player.resources.militaryPower >= 20) {
            player.resources.militaryPower -= 10;
            target.resources.militaryPower = Math.max(0, target.resources.militaryPower - 15);
            target.resources.stability = Math.max(0, target.resources.stability - 10);
            logMessage = `Precision air strike conducted against ${target.name} military hubs.`;
            toastType = 'warning';
          } else {
            logMessage = "Insufficient military strength for a strike.";
            toastType = 'error';
          }
          break;
        case 'War':
          if (player.resources.militaryPower >= 50) {
            player.resources.militaryPower -= 30;
            target.resources.militaryPower = Math.max(0, target.resources.militaryPower - 50);
            target.resources.stability = Math.max(0, target.resources.stability - 40);
            target.resources.gdp *= 0.7;
            target.stanceTowardsPlayer = 'Hostile';
            logMessage = `Total War declared on ${target.name}. The world watches in horror.`;
            toastType = 'error';
          } else {
            logMessage = "Insufficient military strength (50 required) for Total War.";
            toastType = 'error';
          }
          break;
        case 'Propaganda':
          if (player.resources.influence >= 40) {
            player.resources.influence -= 40;
            target.resources.stability = Math.max(0, target.resources.stability - 25);
            logMessage = `Coordinated misinformation campaign has destabilized ${target.name}.`;
            toastType = 'warning';
          } else {
            logMessage = "Insufficient influence (40 required) for propaganda.";
            toastType = 'error';
          }
          break;
        case 'Research':
          if (player.resources.gdp >= 2.0 && player.resources.influence >= 10) {
            player.resources.gdp -= 2.0;
            player.resources.influence -= 10;
            player.resources.science += 25;
            player.resources.militaryPower += 5; // tech boost
            logMessage = `Joint R&D project initiated with scientific teams in ${target.name}.`;
            toastType = 'success';
          } else {
            logMessage = "Insufficient resources (2.0 GDP, 10 INF) for R&D project.";
            toastType = 'error';
          }
          break;
        case 'ArmsTrade':
          if (player.resources.science >= 30) {
            player.resources.science -= 30;
            player.resources.gdp += 3.5; // Massive profit
            target.resources.militaryPower += 20;
            target.resources.influence -= 10; // dependance
            logMessage = `Advanced weapon systems sold to ${target.name}. Treasury saw a major boost.`;
            toastType = 'success';
          } else {
            logMessage = "Insufficient scientific tech (30 SCI) to export advanced weaponry.";
            toastType = 'error';
          }
          break;
        case 'Alliance':
          if (target.stanceTowardsPlayer === 'Ally') {
            // Break Alliance
            target.stanceTowardsPlayer = 'Suspicious';
            target.resources.stability = Math.max(0, target.resources.stability - 15);
            player.resources.stability = Math.max(0, player.resources.stability - 5);
            logMessage = `Alliance with ${target.name} dissolved. Relationship soured.`;
            toastType = 'warning';
          } else {
            // Forge Alliance
            const cost = 50;
            if (player.resources.influence >= cost) {
              if (target.resources.stability >= 40) {
                player.resources.influence -= cost;
                target.stanceTowardsPlayer = 'Ally';
                target.resources.stability = Math.min(100, target.resources.stability + 10);
                player.resources.gdp += 0.2;
                logMessage = `Historic alliance signed with ${target.name}.`;
                toastType = 'success';
              } else {
                logMessage = `${target.name} is too unstable (needs 40% stability) to commit.`;
                toastType = 'error';
              }
            } else {
              logMessage = `Insufficient influence (${cost} required) for an alliance.`;
              toastType = 'error';
            }
          }
          break;
      }

      addToast(logMessage, toastType);

      if (logMessage === "") return prev;

      return {
        ...prev,
        countries: updatedCountries,
        actionHistory: [
          ...prev.actionHistory,
          { turn: prev.turn, countryName: target.name, action, message: logMessage }
        ],
        newsLog: [...prev.newsLog, logMessage]
      };
    });
  }, [isProcessing, addToast]);

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 font-sans selection:bg-blue-500/30 overflow-hidden">
      {/* Cinematic Overlays */}
      <div className="fixed inset-0 pointer-events-none z-[1000] opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/micro-carbon.png')]" />
      <div className="fixed inset-0 pointer-events-none z-[1001] opacity-[0.05] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />
      
      <AnimatePresence mode="wait">
        {!gameState.gameStarted ? (
          <motion.div 
            key="selector"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-slate-950 flex flex-col p-4 overflow-y-auto"
          >
            <div className="max-w-6xl w-full mx-auto px-4 py-12">
              <div className="text-center mb-10 md:mb-16">
                <motion.div 
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="inline-flex items-center gap-2 px-3 py-1 bg-blue-600/20 text-blue-400 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] mb-4 border border-blue-500/20"
                >
                  <Globe size={14} className="animate-pulse" /> New Global Order Established
                </motion.div>
                <h1 className="text-4xl md:text-7xl font-black text-white italic tracking-tighter mb-4 uppercase leading-tight">Select Your Mandate</h1>
                <p className="text-slate-400 text-sm md:text-xl max-w-2xl mx-auto">Assuming control of a superpower requires absolute resolve. Choose your theater of operations.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
                {INITIAL_COUNTRIES.filter(c => c.id !== 'rival' && c.id !== 'global-south').map((country, idx) => (
                  <motion.button
                    key={country.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0, transition: { delay: idx * 0.1 } }}
                    whileHover={{ scale: 1.02, translateY: -5 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => startGame(country.id)}
                    className="flex flex-col p-6 md:p-10 bg-slate-900 border border-slate-800 rounded-3xl text-left hover:border-blue-500 transition-all group relative overflow-hidden shadow-2xl"
                  >
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                      <Globe size={120} />
                    </div>
                    <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center text-blue-400 mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors border border-slate-700">
                      <Globe size={28} />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">{country.name}</h3>
                    <p className="text-slate-400 text-sm mb-8 flex-1 italic line-clamp-4 md:line-clamp-none opacity-80 group-hover:opacity-100 transition-opacity leading-relaxed">{country.description}</p>
                    <div className="space-y-3 pt-6 border-t border-slate-800">
                      <div className="flex justify-between items-center text-[10px] uppercase font-black tracking-widest text-slate-500">
                        <span>Economy</span>
                        <span className="text-yellow-400 text-xs">${country.resources.gdp}T</span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] uppercase font-black tracking-widest text-slate-500">
                        <span>Military</span>
                        <span className="text-red-400 text-xs">{country.resources.militaryPower} PWR</span>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
              
              <p className="mt-12 text-center text-slate-600 text-[10px] uppercase tracking-[0.2em] font-mono">
                System Initialized • Historical Simulation Engine • v1.0.4
              </p>
            </div>
          </motion.div>
        ) : (
          <div key="game" className="flex flex-col h-screen overflow-hidden">
            <ToastContainer toasts={toasts} />
            {/* Top Header / Resource Bar */}
            <header className="flex-none bg-slate-900 border-b border-slate-800 z-[60]">
        <div className="flex h-14 md:h-16 items-center px-4 md:px-6">
          <div className="flex items-center gap-2 md:gap-3 border-r border-slate-700 pr-4 md:pr-6 mr-4 md:mr-6">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-600 rounded flex items-center justify-center text-white shadow-lg shadow-blue-900/20">
              <Globe size={18} className="md:hidden" />
              <Globe size={24} className="hidden md:block" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-sm md:text-xl font-black tracking-tighter uppercase italic line-clamp-1">Global Sovereign</h1>
              <div className="text-[8px] md:text-[10px] text-slate-500 font-mono tracking-widest uppercase flex items-center gap-2">
                <span>{playerCountry.name}</span>
                <span className="opacity-30">•</span>
                <span>Turn {gameState.turn}</span>
              </div>
            </div>
            <div className="sm:hidden font-black italic text-xs">GS v1.0</div>
          </div>

          <div className="flex-1 flex items-center overflow-x-auto no-scrollbar gap-1">
            <ResourceCounter label="GDP" value={playerCountry.resources.gdp} suffix="T" icon="gdp" color="text-yellow-400" description="Gross Domestic Product. Earned through trade, alliances, and time." />
            <ResourceCounter label="STBL" value={playerCountry.resources.stability} suffix="%" icon="stability" color="text-emerald-400" description="National Stability. Impacted by events, war, and aid." />
            <ResourceCounter label="MIL" value={playerCountry.resources.militaryPower} suffix="" icon="military" color="text-red-500" description="Military Strength. Built through R&D and spending. Consumed by war." />
            <ResourceCounter label="INF" value={playerCountry.resources.influence} suffix="" icon="influence" color="text-blue-400" description="Global Influence. Used for diplomacy and intel. Earned via trade and aid." />
            <ResourceCounter label="SCI" value={playerCountry.resources.science} suffix="" icon="science" color="text-purple-400" description="Scientific Progress. Gained via R&D. Used to build weapons and sell tech." />
          </div>

          <div className="flex items-center ml-2">
            <motion.button 
              whileTap={{ scale: 0.95 }}
              onClick={nextTurn}
              disabled={isProcessing}
              className="flex items-center justify-center w-10 h-10 md:w-auto md:px-6 md:py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-all shadow-lg disabled:opacity-50"
            >
              {isProcessing ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Play size={18} fill="currentColor" /><span className="hidden md:inline ml-2">NEXT Turn</span></>}
            </motion.button>
          </div>
        </div>
      </header>

            <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
              {/* Navigation - Sidebar (Desktop) / Bottom (Mobile) */}
              <aside className="fixed bottom-0 left-0 w-full md:sticky md:top-0 md:w-20 bg-slate-900 border-t md:border-t-0 md:border-r border-slate-800 h-16 md:h-full flex md:flex-col items-center justify-around md:justify-start py-0 md:py-6 gap-0 md:gap-8 z-50">
                <NavItem active={activeTab === 'world'} icon={<WorldMapIcon size={24} />} onClick={() => setActiveTab('world')} label="World" />
                <NavItem active={activeTab === 'advisors'} icon={<MessageSquare size={24} />} onClick={() => setActiveTab('advisors')} label="Advisors" />
                <NavItem active={activeTab === 'intel'} icon={<Activity size={24} />} onClick={() => setActiveTab('intel')} label="Intel" />
                <NavItem active={activeTab === 'research'} icon={<FlaskConical size={24} />} onClick={() => setActiveTab('research')} label="Research" />
                <NavItem active={activeTab === 'history'} icon={<History size={24} />} onClick={() => setActiveTab('history')} label="History" />
              </aside>

              {/* Main Content Area */}
              <main className="flex-1 p-4 md:p-8 overflow-y-auto pb-32 md:pb-16 bg-[url('https://www.transparenttextures.com/patterns/micro-carbon.png')]">
          <AnimatePresence mode="wait">
            {activeTab === 'world' && (
              <motion.div 
                key="world"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="max-w-5xl mx-auto"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 md:mb-8 gap-4">
                  <div>
                    <h2 className="text-2xl md:text-3xl font-bold text-white mb-1">Geopolitical Theater</h2>
                    <p className="text-sm md:text-base text-slate-400">Execute strategic actions on sovereign nations.</p>
                  </div>
                  <div className="px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg flex items-center self-start gap-2 text-xs md:text-sm text-slate-300">
                    <Terminal size={14} className="text-blue-400" />
                    Feed: <span className="text-emerald-400 font-mono">LIVE_DECRYPTED</span>
                  </div>
                </div>

                <div className="grid gap-4">
                  {gameState.countries.map(country => (
                    <CountryEntry 
                      key={country.id} 
                      country={country} 
                      onAction={(action) => performAction(country.id, action as any)}
                    />
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'research' && (
              <ResearchTree 
                unlockedTechIds={gameState.unlockedTechIds}
                currentScience={playerCountry.resources.science}
                onUnlock={unlockTech}
              />
            )}

            {activeTab === 'advisors' && (
              <motion.div 
                key="advisors"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-4xl mx-auto space-y-8"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-3xl font-bold text-white mb-2 text-center md:text-left">Policy Council</h2>
                    <p className="text-slate-400 text-center md:text-left">Consult your cabinet for direct strategic assessments.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    { role: 'Military', icon: <Shield size={24} />, color: 'text-red-400', desc: 'Threats & Defense' },
                    { role: 'Economic', icon: <TrendingUp size={24} />, color: 'text-yellow-400', desc: 'Growth & Trade' },
                    { role: 'Intelligence', icon: <Target size={24} />, color: 'text-purple-400', desc: 'Espionage & Influence' }
                  ].map(advisor => (
                    <button 
                      key={advisor.role}
                      onClick={() => fetchAdvisorInfo(advisor.role)}
                      disabled={isProcessing}
                      className="p-6 bg-slate-900 border border-slate-800 rounded-2xl hover:border-blue-500/50 hover:bg-slate-800/50 transition-all text-left group relative overflow-hidden disabled:opacity-50"
                    >
                      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        {advisor.icon}
                      </div>
                      <div className={`w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center ${advisor.color} mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors border border-slate-700`}>
                        {advisor.icon}
                      </div>
                      <h3 className="font-bold text-lg text-white mb-1">{advisor.role}</h3>
                      <p className="text-xs text-slate-500 uppercase tracking-widest font-black">{advisor.desc}</p>
                    </button>
                  ))}
                </div>

                <div className="bg-slate-900/80 border border-blue-900/30 p-6 md:p-10 rounded-3xl relative overflow-hidden shadow-2xl">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-600"></div>
                  <div className="flex flex-col md:flex-row items-start gap-6">
                    <div className="w-12 h-12 bg-blue-900/50 rounded-2xl flex items-center justify-center text-blue-400 flex-shrink-0 animate-pulse">
                      <MessageSquare size={24} />
                    </div>
                    <div className="space-y-4 flex-1">
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] uppercase font-black text-blue-400 tracking-[0.3em] whitespace-nowrap">Classified Assessment</span>
                        <div className="h-px w-full bg-blue-900/30"></div>
                      </div>
                      <div className="min-h-[100px]">
                        {isProcessing ? (
                          <div className="flex flex-col gap-2">
                            <div className="h-4 w-full bg-slate-800 rounded animate-pulse" />
                            <div className="h-4 w-3/4 bg-slate-800 rounded animate-pulse" />
                            <div className="h-4 w-1/2 bg-slate-800 rounded animate-pulse" />
                          </div>
                        ) : (
                          <p className="text-lg md:text-2xl text-slate-100 leading-relaxed italic font-serif">
                            "{advisorMessage}"
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'history' && (
              <motion.div 
                key="history"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-4xl mx-auto space-y-8"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-3xl font-bold text-white mb-1 text-center md:text-left">Executive Ledger</h2>
                    <p className="text-slate-400 text-center md:text-left">Historical record of actions and global stability metrics.</p>
                  </div>
                  <div className="flex gap-4 justify-center">
                    <div className="bg-slate-900 px-6 py-3 border border-slate-800 rounded-2xl text-center shadow-lg">
                      <div className="text-[10px] text-slate-500 uppercase font-mono tracking-widest mb-1">Current Turn</div>
                      <div className="text-2xl font-black text-white">{gameState.turn}</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-10">
                  <section>
                    <div className="flex items-center gap-4 mb-6">
                      <h3 className="text-xs font-black text-blue-400 uppercase tracking-[0.3em] whitespace-nowrap">Strategic Actions</h3>
                      <div className="h-px w-full bg-blue-900/20"></div>
                    </div>
                    <div className="space-y-3">
                      {gameState.actionHistory.slice().reverse().map((record, i) => (
                        <motion.div 
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          key={i} 
                          className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4 p-4 bg-slate-900/40 border border-slate-800/50 rounded-2xl hover:bg-slate-800/40 transition-all hover:border-blue-500/30 group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-500 font-mono text-xs border border-slate-700/50 group-hover:bg-blue-600 transition-colors group-hover:text-white">
                              T{record.turn}
                            </div>
                            <div className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-[10px] font-black text-blue-400 uppercase tracking-tight">
                              {record.action}
                            </div>
                          </div>
                          <div className="flex-1 text-sm text-slate-300 leading-relaxed">
                            <span className="text-white font-bold">{record.countryName}</span>: {record.message}
                          </div>
                        </motion.div>
                      ))}
                      {gameState.actionHistory.length === 0 && (
                        <div className="p-12 text-center text-slate-600 italic border border-dashed border-slate-800 rounded-3xl bg-slate-900/20">
                          <MessageSquare size={32} className="mx-auto mb-4 opacity-20" />
                          No strategic actions recorded for this term.
                        </div>
                      )}
                    </div>
                  </section>

                  <section>
                    <div className="flex items-center gap-4 mb-6">
                      <h3 className="text-xs font-black text-emerald-400 uppercase tracking-[0.3em] whitespace-nowrap">Global Archival State</h3>
                      <div className="h-px w-full bg-emerald-900/20"></div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {gameState.history.slice().reverse().map((h, i) => (
                        <div key={i} className="p-5 bg-slate-900 border border-slate-800 rounded-2xl relative overflow-hidden group hover:border-emerald-500/30 transition-all">
                          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-600/5 blur-2xl rounded-full -mr-12 -mt-12" />
                          <div className="text-[10px] font-mono text-slate-500 mb-3 tracking-widest flex justify-between">
                            <span>TURN {h.turn}</span>
                            <span className="text-emerald-500/50">RECORDED</span>
                          </div>
                          <div className="flex justify-between items-end">
                            <div>
                              <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">GDP Output</div>
                              <div className="text-2xl font-black text-white italic tracking-tighter">${h.gdp}T</div>
                            </div>
                            <div className="text-right">
                              <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">National STBL</div>
                              <div className="text-2xl font-black text-emerald-400 italic tracking-tighter">{h.stability}%</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      <NewsTicker news={gameState.newsLog} />

      {/* Briefing Overlay */}
            <AnimatePresence>
              {showBriefing && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-2xl w-full bg-slate-900 border border-blue-500/30 rounded-3xl p-6 md:p-10 shadow-2xl relative overflow-y-auto max-h-[90vh]"
                  >
                    <div className="absolute -top-12 -right-12 w-48 h-48 bg-blue-600/10 rounded-full blur-3xl" />
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 bg-blue-600 rounded-lg">
                        <Terminal size={24} className="text-white" />
                      </div>
                      <h2 className="text-2xl font-bold text-white uppercase tracking-tight">Presidential Briefing</h2>
                    </div>

                    <div className="space-y-6 text-slate-300">
                      <p className="text-lg leading-relaxed">
                        Welcome, Mr. President. The situation is critical. As the leader of <span className="text-blue-400 font-bold">{playerCountry.name}</span>, every decision you make ripples across the globe.
                      </p>
                      
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                          <h4 className="text-xs font-bold text-blue-400 uppercase mb-2">Diplomacy</h4>
                          <p className="text-sm">Forging alliances boosts GDP and Influence, but breaking them causes global instability.</p>
                        </div>
                        <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                          <h4 className="text-xs font-bold text-purple-400 uppercase mb-2">Science & Arms</h4>
                          <p className="text-sm">Invest in R&D to unlock tech. Sell advanced munitions to allies (or rivals) for massive profit.</p>
                        </div>
                      </div>

                      <p className="text-sm italic text-slate-500">
                        Use the "NEXT MONTH" button to progress time and see the results of your actions.
                      </p>
                    </div>

                    <button 
                      onClick={() => setShowBriefing(false)}
                      className="w-full mt-10 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all shadow-lg"
                    >
                      BEGIN MANDATE
                    </button>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

            {/* Modal for pending event */}
      <AnimatePresence>
        {pendingEvent && !isProcessing && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="max-w-lg w-full bg-slate-900 border border-blue-500/30 rounded-2xl p-6 md:p-8 shadow-2xl shadow-blue-900/40 relative overflow-y-auto max-h-[90vh]"
            >
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Globe size={120} />
              </div>
              <div className="flex items-center gap-2 text-blue-400 font-bold mb-4 uppercase tracking-tighter">
                <AlertCircleIcon size={18} /> Geopolitical Event
              </div>
              <h2 className="text-3xl font-black text-white mb-4 italic tracking-tight">{pendingEvent.title}</h2>
              <p className="text-slate-300 mb-8 leading-relaxed text-lg">
                {pendingEvent.description}
              </p>
              
              <div className="p-4 bg-slate-950/50 rounded-xl border border-slate-800 mb-8">
                <div className="text-xs uppercase text-slate-500 mb-2">Estimated Impact</div>
                <div className={`text-lg font-bold ${(pendingEvent.valueChange || 0) > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {gameState.countries.find(c => c.id === pendingEvent.impactedCountryId)?.name || 'Regional'}: {pendingEvent.resource} {' '}
                  {(pendingEvent.valueChange || 0) > 0 ? '+' : ''}{pendingEvent.valueChange}
                </div>
              </div>

              <button 
                onClick={() => setPendingEvent(null)}
                className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest rounded-xl transition-all"
              >
                ACKNOWLEDGE
              </button>
            </motion.div>
          </div>
        )}
            </AnimatePresence>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function NavItem({ active, icon, onClick, label }: { active: boolean, icon: React.ReactNode, onClick: () => void, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={`group relative flex flex-col items-center justify-center py-2 px-1 md:p-3 rounded-xl transition-all flex-1 md:flex-none ${active ? 'text-white md:bg-blue-600 md:shadow-lg md:shadow-blue-900/40' : 'text-slate-500 hover:text-slate-200 md:hover:bg-slate-800'}`}
    >
      <div className={`${active && 'md:scale-110'} transition-transform`}>
        {icon}
      </div>
      <span className="md:hidden text-[9px] font-bold uppercase mt-1 tracking-tighter truncate w-full text-center">
        {label}
      </span>
      <span className="hidden md:block absolute left-full ml-4 px-2 py-1 bg-slate-800 text-white text-[10px] uppercase font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
        {label}
      </span>
      {active && (
        <>
          <motion.div layoutId="nav-glow" className="hidden md:block absolute inset-0 rounded-xl bg-blue-500/20 blur-md -z-10" />
          <motion.div layoutId="nav-indicator" className="md:hidden absolute top-0 w-8 h-1 bg-blue-500 rounded-b-full" />
        </>
      )}
    </button>
  );
}

// Sub-icons icons
function TrendingUpIcon({ size }: { size: number }) { return <TrendingUp size={size} />; }
