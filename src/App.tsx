/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Globe,
  Terminal,
  History,
  Play,
  Map as WorldMapIcon,
  MessageSquare,
  Shield,
  TrendingUp,
  Target,
  FlaskConical,
  RotateCcw,
  CheckCircle2,
  BarChart2,
} from 'lucide-react';
import { ResourceCounter } from './components/ResourceCounter.tsx';
import { NewsTicker } from './components/NewsTicker.tsx';
import { CountryEntry } from './components/CountryEntry.tsx';
import { ToastContainer } from './components/ToastContainer.tsx';
import { ResearchTree } from './components/ResearchTree.tsx';
import { HistoryView } from './components/HistoryView.tsx';
import { OutcomeModal } from './components/OutcomeModal.tsx';
import { SidePanel } from './components/SidePanel.tsx';
import { TurnRecapModal } from './components/TurnRecapModal.tsx';
import { StockMarket } from './components/StockMarket.tsx';
import { TwitterFeed } from './components/TwitterFeed.tsx';
import { INITIAL_COUNTRIES, TECH_TREE, COUNTRY_PASSIVE_MODIFIERS, RIVAL_COUNTRIES, getInitialStance, INITIAL_NUCLEAR_PROGRAMS, NUCLEAR_ADVANCE_PER_TURN, SPACE_MILESTONES, SPACE_MILESTONE_ORDER, INITIAL_REGIONAL_CONFLICTS } from './constants.ts';
import { GameState, Country, ResourceSet, ActionType, Toast, HistoryPoint, TurnRecap, Stock, StockHolding, SpaceMilestone, Tweet, AiCountryAction } from './types.ts';
import { generateNewsEvent, getAdvisorAdvice } from './services/geminiService.ts';
import { clearSavedGame, evaluateOutcome, loadGameState, saveGameState } from './gameLogic.ts';
import { buildForecast } from './forecast.ts';
import { runAiCountryActions } from './aiActions.ts';
import { INITIAL_STOCKS, tickStockMarket } from './stockMarket.ts';
import { generateActionTweets, generateTurnTweets, generateIntelHints } from './twitterFeed.ts';
import { runStrategicAiActions } from './aiStrategy.ts';
import { generateCrisis, applyCrisisChoice } from './crisisEngine.ts';
import { CrisisModal } from './components/CrisisModal.tsx';

const INITIAL_STATE: GameState = {
  gameStarted: false,
  turn: 1,
  playerCountryId: 'usa',
  countries: INITIAL_COUNTRIES,
  events: [],
  newsLog: ['Initial reports incoming...'],
  actionHistory: [],
  unlockedTechIds: [],
  history: [],
  stocks: INITIAL_STOCKS.map(s => ({ ...s, priceHistory: [] })),
  portfolio: [],
  tweetFeed: [],
  nuclearPrograms: INITIAL_NUCLEAR_PROGRAMS.map(p => ({ ...p })),
  spaceAchievements: [],
  regionalConflicts: INITIAL_REGIONAL_CONFLICTS.map(c => ({ ...c })),
  worldTension: 45,
  activeCrisis: undefined,
};

function snapshot(country: Country, turn: number): HistoryPoint {
  return {
    turn,
    gdp: country.resources.gdp,
    stability: country.resources.stability,
    militaryPower: country.resources.militaryPower,
    influence: country.resources.influence,
    science: country.resources.science,
  };
}

export default function App() {
  const [gameState, setGameState] = useState<GameState>(() => loadGameState() ?? INITIAL_STATE);
  const [activeTab, setActiveTab] = useState<'world' | 'history' | 'advisors' | 'research' | 'markets' | 'feed'>('world');
  const [isProcessing, setIsProcessing] = useState(false);
  const [recapOpen, setRecapOpen] = useState(false);
  const [advisorMessage, setAdvisorMessage] = useState<string>('Welcome back, Commander. Awaiting your orders.');
  const [showBriefing, setShowBriefing] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Persist on every meaningful change.
  useEffect(() => {
    if (gameState.gameStarted) saveGameState(gameState);
  }, [gameState]);

  const playerCountry = useMemo(
    () => gameState.countries.find(c => c.id === gameState.playerCountryId),
    [gameState.countries, gameState.playerCountryId],
  );

  const addToast = useCallback((message: string, type: Toast['type'] = 'info') => {
    setToasts(prev => {
      if (prev.some(t => t.message === message)) return prev;
      const id = Math.random().toString(36).slice(2, 11);
      return [...prev, { id, message, type }].slice(-3);
    });
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.message !== message));
    }, 4000);
  }, []);

  const startGame = (countryId: string) => {
    const rivals = RIVAL_COUNTRIES[countryId] ?? [];
    const updatedCountries = INITIAL_COUNTRIES.map(c => {
      if (c.id === countryId) {
        return { ...c, alignment: 'Player-Aligned' as const, stanceTowardsPlayer: 'Ally' as const };
      }
      const stance = getInitialStance(countryId, c.id);
      const alignment = rivals.includes(c.id) ? 'Rival-Aligned' as const : 'Neutral' as const;
      return { ...c, alignment, stanceTowardsPlayer: stance };
    });

    const selected = updatedCountries.find(c => c.id === countryId)!;
    setGameState({
      ...INITIAL_STATE,
      gameStarted: true,
      playerCountryId: countryId,
      countries: updatedCountries,
      newsLog: [`Intel cleared. You have assumed command of ${selected.flag} ${selected.name}.`],
      history: [snapshot(selected, 1)],
      stocks: INITIAL_STOCKS.map(s => ({ ...s, priceHistory: [] })),
      portfolio: [],
      tweetFeed: [],
      nuclearPrograms: INITIAL_NUCLEAR_PROGRAMS.map(p => ({ ...p })),
      spaceAchievements: [],
      regionalConflicts: INITIAL_REGIONAL_CONFLICTS.map(c => ({ ...c })),
      worldTension: 45,
      activeCrisis: undefined,
    });
    setShowBriefing(true);
  };

  const restart = () => {
    clearSavedGame();
    setGameState(INITIAL_STATE);
    setRecapOpen(false);
    setShowBriefing(false);
    setActiveTab('world');
  };

  const unlockTech = (techId: string) => {
    if (!playerCountry || gameState.outcome) return;
    const tech = TECH_TREE.find(t => t.id === techId);
    if (!tech) return;

    if (gameState.unlockedTechIds.includes(techId)) {
      addToast('Technology already mastered.', 'info');
      return;
    }
    if (playerCountry.resources.science < tech.cost) {
      addToast(`Insufficient Scientific Progress. Need ${tech.cost} SCI.`, 'error');
      return;
    }

    setGameState(prev => {
      const updatedCountries = prev.countries.map(c => {
        if (c.id !== prev.playerCountryId) return c;
        const newResources = { ...c.resources };
        newResources.science -= tech.cost;
        newResources[tech.impact.resource] = Number(
          (newResources[tech.impact.resource] * tech.impact.multiplier).toFixed(2),
        );
        return { ...c, resources: newResources };
      });
      const next: GameState = {
        ...prev,
        countries: updatedCountries,
        unlockedTechIds: [...prev.unlockedTechIds, techId],
        newsLog: [...prev.newsLog, `BREAKTHROUGH: ${playerCountry.name} masters ${tech.name}.`],
        actionHistory: [
          ...prev.actionHistory,
          { turn: prev.turn, countryName: playerCountry.name, action: 'UnlockTech', message: `Mastered ${tech.name}: ${tech.description}` },
        ],
      };
      next.outcome = evaluateOutcome(next) ?? undefined;
      return next;
    });

    addToast(`BREAKTHROUGH: ${tech.name} unlocked!`, 'success');
  };

  const nextTurn = useCallback(async () => {
    if (!playerCountry || gameState.outcome) return;
    setIsProcessing(true);

    const newsEvent = await generateNewsEvent(gameState);
    const playerBefore = { ...playerCountry.resources };

    // Capture stances BEFORE this turn for stock market delta detection
    const prevStances: Record<string, string> = {};
    for (const c of gameState.countries) prevStances[c.id] = c.stanceTowardsPlayer;

    const passiveCountries = gameState.countries.map(country => {
      const stabilityFactor = country.resources.stability / 100;
      const gdpGrowth = 0.02 + (Math.random() * 0.03 * stabilityFactor);
      const scienceGrowth = 0.5 + (country.resources.gdp / 10) * stabilityFactor;

      let newGdp = country.resources.gdp * (1 + gdpGrowth / 12);
      let newScience = country.resources.science + scienceGrowth;
      let newStability = Math.min(100, Math.max(0, country.resources.stability + (Math.random() * 2 - 1)));
      let newInfluence = country.resources.influence;

      if (country.stanceTowardsPlayer === 'Ally') newInfluence = Math.min(100, newInfluence + 1);

      const maintenance = (country.resources.militaryPower / 100) * 0.5;
      newGdp = Math.max(0, newGdp - maintenance / 12);

      // Apply country-specific passive modifiers (traits / structural conditions)
      const mods = COUNTRY_PASSIVE_MODIFIERS[country.id] ?? {};
      let finalGdp      = newGdp      + (mods.gdp ?? 0);
      let finalStability = newStability + (mods.stability ?? 0);
      let finalMilitary  = country.resources.militaryPower + (mods.militaryPower ?? 0);
      let finalInfluence = newInfluence + (mods.influence ?? 0);
      let finalScience   = newScience  + (mods.science ?? 0);

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
          gdp: Number(Math.max(0, finalGdp).toFixed(2)),
          stability: Math.round(Math.min(100, Math.max(0, finalStability))),
          militaryPower: Math.round(Math.min(200, Math.max(0, finalMilitary))),
          influence: Math.round(Math.min(100, Math.max(0, finalInfluence))),
          science: Math.round(Math.max(0, finalScience)),
        },
      };
    });

    // AI-controlled countries act (personality-based, player-facing)
    const { updatedCountries: afterPersonality, actions: aiActions } = runAiCountryActions({
      ...gameState,
      countries: passiveCountries,
    });

    // AI countries now also make STRATEGIC decisions using the full action engine
    // (same mechanics as player: strikes, wars, sanctions, trade, alliances)
    const { updatedCountries, strategicActions } = runStrategicAiActions({
      ...gameState,
      countries: afterPersonality,
    });
    const allAiActions = [...aiActions, ...strategicActions];

    // Tick global stock market
    const { updatedStocks, marketHeadlines, portfolioGdpDelta } = tickStockMarket(
      gameState.stocks ?? INITIAL_STOCKS,
      gameState.portfolio ?? [],
      { ...gameState, countries: updatedCountries },
      prevStances,
    );

    setGameState(prev => {
      const newTurn = prev.turn + 1;
      let player = updatedCountries.find(c => c.id === prev.playerCountryId)!;

      // Apply unrealised portfolio mark-to-market as passive GDP change
      if (Math.abs(portfolioGdpDelta) > 0.001) {
        player = {
          ...player,
          resources: {
            ...player.resources,
            gdp: Number(Math.max(0, player.resources.gdp + portfolioGdpDelta).toFixed(2)),
          },
        };
        // Sync back into updatedCountries array
        const idx = updatedCountries.findIndex(c => c.id === prev.playerCountryId);
        if (idx !== -1) updatedCountries[idx] = player;
      }

      const recap: TurnRecap = {
        turn: newTurn,
        eventTitle: newsEvent.title || 'Month passed peacefully.',
        eventDescription: newsEvent.description || 'No major incidents this cycle.',
        eventResource: newsEvent.resource as keyof ResourceSet | undefined,
        eventValueChange: newsEvent.valueChange,
        eventTargetId: newsEvent.impactedCountryId,
        playerBefore,
        playerAfter: { ...player.resources },
        aiActions: allAiActions,
      };
      const aiNewsLines = allAiActions.filter(a => a.hostile).map(a => `${a.countryName}: ${a.description}`);

      // Generate world leader tweets and classified intel hints for this turn
      // ── Nuclear program advancement ──────────────────────────────────────
      const newlyNuclear: string[] = [];
      const updatedNuclearPrograms = (prev.nuclearPrograms ?? []).map(prog => {
        const country = updatedCountries.find(c => c.id === prog.countryId);
        if (!country || country.nuclearArmed) return prog;
        const advance = NUCLEAR_ADVANCE_PER_TURN[prog.countryId] ?? 1;
        const newProgress = Math.min(100, prog.progress + advance);
        if (newProgress >= 100) newlyNuclear.push(prog.countryId);
        return { ...prog, progress: newProgress };
      });
      // Promote countries that crossed 100%
      for (const id of newlyNuclear) {
        const idx = updatedCountries.findIndex(c => c.id === id);
        if (idx !== -1) {
          updatedCountries[idx] = {
            ...updatedCountries[idx],
            nuclearArmed: true,
            resources: {
              ...updatedCountries[idx].resources,
              militaryPower: Math.min(200, updatedCountries[idx].resources.militaryPower + 25),
            },
          };
        }
      }

      // ── Space race milestone check ────────────────────────────────────────
      const newAchievements = [...(prev.spaceAchievements ?? [])];
      const newSpaceNews: string[] = [];
      for (const country of updatedCountries) {
        for (const ms of SPACE_MILESTONE_ORDER) {
          const threshold = SPACE_MILESTONES[ms as SpaceMilestone];
          const alreadyAchieved = newAchievements.some(a => a.milestone === ms && a.countryId === country.id);
          const firstAchieved = newAchievements.some(a => a.milestone === ms);
          if (!alreadyAchieved && country.resources.science >= threshold.scienceRequired) {
            newAchievements.push({ countryId: country.id, milestone: ms as SpaceMilestone, turn: newTurn });
            const idx = updatedCountries.findIndex(c => c.id === country.id);
            if (idx !== -1) {
              updatedCountries[idx] = {
                ...updatedCountries[idx],
                resources: {
                  ...updatedCountries[idx].resources,
                  influence: Math.min(100, updatedCountries[idx].resources.influence + threshold.influenceBonus + (firstAchieved ? 0 : 10)),
                  militaryPower: Math.min(200, updatedCountries[idx].resources.militaryPower + threshold.militaryBonus),
                },
              };
            }
            const bonus = firstAchieved ? '' : ' (FIRST IN THE WORLD)';
            newSpaceNews.push(`🚀 SPACE MILESTONE: ${country.name} achieves ${threshold.label}${bonus}!`);
          }
        }
      }

      const turnTweets = generateTurnTweets(
        { ...prev, countries: updatedCountries },
        allAiActions.map(a => a.description),
      );
      const intelTweets = generateIntelHints({ ...prev, countries: updatedCountries });
      // Generate tweets for bilateral + strategic AI actions
      const aiActionTweets = allAiActions
        .filter(a => Math.random() < 0.55) // not every action needs a tweet
        .slice(0, 4)
        .map(action => {
          const country = updatedCountries.find(c => c.id === action.countryId);
          const flag = country?.flag ?? '🌐';
          const leader = { name: action.countryName, handle: `@${action.countryId}` };
          const tone: Tweet['tone'] = action.hostile ? 'threat' : action.isBilateral ? 'neutral' : 'praise';
          return {
            id: `ai_${action.countryId}_${newTurn}_${Math.random().toString(36).slice(2,6)}`,
            turn: newTurn,
            countryId: action.countryId,
            leaderName: leader.name,
            leaderHandle: leader.handle,
            flag,
            content: action.description,
            likes: Math.floor(Math.random() * 40000) + 500,
            retweets: Math.floor(Math.random() * 12000) + 100,
            tone,
            isClassified: false,
          } as Tweet;
        });

      // Newest at front so feed shows most recent first
      const allNewTweets = [...intelTweets, ...turnTweets, ...aiActionTweets];

      const nuclearBreakingNews = newlyNuclear.map(id => {
        const c = updatedCountries.find(x => x.id === id);
        return c ? `☢️ BREAKING: ${c.flag} ${c.name} has conducted its first nuclear test. The world changes.` : '';
      }).filter(Boolean);

      const next: GameState = {
        ...prev,
        turn: newTurn,
        countries: updatedCountries,
        newsLog: [...prev.newsLog, recap.eventTitle, ...aiNewsLines, ...marketHeadlines, ...newSpaceNews, ...nuclearBreakingNews],
        history: [...prev.history, snapshot(player, newTurn)],
        lastRecap: recap,
        stocks: updatedStocks,
        portfolio: prev.portfolio ?? [],
        tweetFeed: [...(prev.tweetFeed ?? []), ...allNewTweets].slice(-100),
        nuclearPrograms: updatedNuclearPrograms,
        spaceAchievements: newAchievements,
        regionalConflicts: prev.regionalConflicts ?? INITIAL_REGIONAL_CONFLICTS,
        worldTension: calcWorldTension(prev.worldTension ?? 45, allAiActions),
        activeCrisis: !prev.activeCrisis ? (generateCrisis({ ...next }) ?? undefined) : prev.activeCrisis,
      };
      next.outcome = evaluateOutcome(next) ?? undefined;
      return next;
    });

    setIsProcessing(false);
    setRecapOpen(true);
    addToast(`Turn ${gameState.turn + 1}: ${newsEvent.title}`, (newsEvent.valueChange || 0) < 0 ? 'warning' : 'info');
  }, [gameState, playerCountry, addToast]);

  const handleCrisisChoice = useCallback((optionId: string) => {
    setGameState(prev => {
      if (!prev.activeCrisis) return prev;
      const { updatedState, resultMessage } = applyCrisisChoice(prev, prev.activeCrisis.id, optionId);
      const next = {
        ...prev,
        ...updatedState,
        newsLog: [...prev.newsLog, resultMessage].filter(Boolean),
      } as GameState;
      next.outcome = evaluateOutcome(next) ?? undefined;
      return next;
    });
    addToast('Decision executed. Consequences now in play.', 'info');
  }, [addToast]);

  const buyStock = useCallback((ticker: string, amount: number) => {
    setGameState(prev => {
      const stock = (prev.stocks ?? []).find(s => s.ticker === ticker);
      if (!stock) return prev;
      const player = prev.countries.find(c => c.id === prev.playerCountryId);
      if (!player || player.resources.gdp < amount) {
        addToast('Insufficient GDP to invest.', 'error');
        return prev;
      }
      const updatedCountries = prev.countries.map(c =>
        c.id === prev.playerCountryId
          ? { ...c, resources: { ...c.resources, gdp: Number((c.resources.gdp - amount).toFixed(2)) } }
          : c
      );
      const existingIdx = (prev.portfolio ?? []).findIndex(h => h.ticker === ticker);
      let newPortfolio: StockHolding[];
      if (existingIdx >= 0) {
        newPortfolio = prev.portfolio.map((h, i) =>
          i === existingIdx
            ? { ...h, invested: h.invested + amount }
            : h
        );
      } else {
        newPortfolio = [...(prev.portfolio ?? []), { ticker, invested: amount, boughtAt: stock.marketCap }];
      }
      addToast(`Bought $${amount.toFixed(2)}T position in ${ticker}.`, 'success');
      return { ...prev, countries: updatedCountries, portfolio: newPortfolio };
    });
  }, [addToast]);

  const sellStock = useCallback((ticker: string) => {
    setGameState(prev => {
      const holding = (prev.portfolio ?? []).find(h => h.ticker === ticker);
      const stock = (prev.stocks ?? []).find(s => s.ticker === ticker);
      if (!holding || !stock) return prev;
      const currentValue = holding.invested * (stock.marketCap / holding.boughtAt);
      const pnl = currentValue - holding.invested;
      const updatedCountries = prev.countries.map(c =>
        c.id === prev.playerCountryId
          ? { ...c, resources: { ...c.resources, gdp: Number((c.resources.gdp + currentValue).toFixed(2)) } }
          : c
      );
      const newPortfolio = (prev.portfolio ?? []).filter(h => h.ticker !== ticker);
      const sign = pnl >= 0 ? '+' : '';
      addToast(`Sold ${ticker} for ${sign}$${pnl.toFixed(2)}T P&L.`, pnl >= 0 ? 'success' : 'warning');
      return { ...prev, countries: updatedCountries, portfolio: newPortfolio };
    });
  }, [addToast]);

  const fetchAdvisorInfo = async (role: string) => {
    setIsProcessing(true);
    const advice = await getAdvisorAdvice(gameState, role);
    setAdvisorMessage(advice);
    setIsProcessing(false);
  };

  const performAction = useCallback((countryId: string, action: ActionType) => {
    if (isProcessing || gameState.outcome) return;

    setGameState(prev => {
      const updatedCountries = prev.countries.map(c => ({ ...c, resources: { ...c.resources } }));
      const targetIdx = updatedCountries.findIndex(c => c.id === countryId);
      const playerIdx = updatedCountries.findIndex(c => c.id === prev.playerCountryId);
      if (targetIdx === -1 || playerIdx === -1) return prev;

      const target = updatedCountries[targetIdx];
      const player = updatedCountries[playerIdx];

      let logMessage = '';
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
            logMessage = 'Insufficient influence for trade deal.';
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
            logMessage = 'Insufficient GDP for aid package.';
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
            logMessage = 'Insufficient influence for intelligence op.';
            toastType = 'error';
          }
          break;
        case 'Sanction':
          target.resources.gdp = Number((target.resources.gdp * 0.95).toFixed(2));
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
            logMessage = 'Insufficient military strength for a strike.';
            toastType = 'error';
          }
          break;
        case 'War':
          if (player.resources.militaryPower >= 50) {
            player.resources.militaryPower -= 30;
            target.resources.militaryPower = Math.max(0, target.resources.militaryPower - 50);
            target.resources.stability = Math.max(0, target.resources.stability - 40);
            target.resources.gdp = Number((target.resources.gdp * 0.7).toFixed(2));
            target.stanceTowardsPlayer = 'Hostile';
            logMessage = `Total War declared on ${target.name}. The world watches in horror.`;
            toastType = 'error';
          } else {
            logMessage = 'Insufficient military strength (50 required) for Total War.';
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
            logMessage = 'Insufficient influence (40 required) for propaganda.';
            toastType = 'error';
          }
          break;
        case 'Research':
          if (player.resources.gdp >= 2.0 && player.resources.influence >= 10) {
            player.resources.gdp -= 2.0;
            player.resources.influence -= 10;
            player.resources.science += 25;
            player.resources.militaryPower += 5;
            logMessage = `Joint R&D project initiated with scientific teams in ${target.name}.`;
            toastType = 'success';
          } else {
            logMessage = 'Insufficient resources (2.0 GDP, 10 INF) for R&D project.';
            toastType = 'error';
          }
          break;
        case 'ArmsTrade':
          if (player.resources.science >= 30) {
            player.resources.science -= 30;
            player.resources.gdp += 3.5;
            target.resources.militaryPower += 20;
            target.resources.influence -= 10;
            logMessage = `Advanced weapon systems sold to ${target.name}. Treasury saw a major boost.`;
            toastType = 'success';
          } else {
            logMessage = 'Insufficient scientific tech (30 SCI) to export advanced weaponry.';
            toastType = 'error';
          }
          break;
        case 'Alliance':
          if (target.stanceTowardsPlayer === 'Ally') {
            target.stanceTowardsPlayer = 'Suspicious';
            target.resources.stability = Math.max(0, target.resources.stability - 15);
            player.resources.stability = Math.max(0, player.resources.stability - 5);
            logMessage = `Alliance with ${target.name} dissolved. Relationship soured.`;
            toastType = 'warning';
          } else {
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
        case 'UN': {
          if (player.resources.influence >= 30) {
            player.resources.influence -= 30;
            // P5 members: usa, russia, china, uk, eu
            const p5 = ['usa', 'russia', 'china', 'uk', 'eu'];
            const playerIsP5 = p5.includes(prev.playerCountryId);
            const alliedP5 = prev.countries.filter(c =>
              p5.includes(c.id) && c.id !== prev.playerCountryId &&
              (c.stanceTowardsPlayer === 'Ally' || c.stanceTowardsPlayer === 'Friendly')
            );
            const hostileP5 = prev.countries.filter(c =>
              p5.includes(c.id) && c.id !== prev.playerCountryId &&
              (c.stanceTowardsPlayer === 'Hostile' || c.stanceTowardsPlayer === 'At War')
            );
            const vetoed = hostileP5.length > 0 || (!playerIsP5 && alliedP5.length === 0);
            if (vetoed) {
              player.resources.influence = Math.max(0, player.resources.influence - 5);
              logMessage = `UN resolution against ${target.name} VETOED by ${hostileP5[0]?.name ?? 'Security Council member'}. International embarrassment costs influence.`;
              toastType = 'warning';
            } else {
              target.resources.stability = Math.max(0, target.resources.stability - 15);
              target.resources.influence = Math.max(0, target.resources.influence - 10);
              logMessage = `UN Security Council passes resolution condemning ${target.name}. International isolation intensifies.`;
              toastType = 'success';
            }
          } else {
            logMessage = 'Insufficient influence (30 required) for UN resolution.';
            toastType = 'error';
          }
          break;
        }
      }

      addToast(logMessage, toastType);
      if (logMessage === '') return prev;

      const actionSucceeded = toastType !== 'error';
      const newTweets = actionSucceeded
        ? generateActionTweets(prev, action, countryId, true)
        : [];

      const next: GameState = {
        ...prev,
        countries: updatedCountries,
        actionHistory: [
          ...prev.actionHistory,
          { turn: prev.turn, countryName: target.name, action, message: logMessage },
        ],
        newsLog: [...prev.newsLog, logMessage],
        tweetFeed: [...(prev.tweetFeed ?? []), ...newTweets].slice(-80),
      };
      next.outcome = evaluateOutcome(next) ?? undefined;
      return next;
    });
  }, [isProcessing, gameState.outcome, addToast]);

  // Defensive: if a corrupted save targets a country that no longer exists, reset.
  if (gameState.gameStarted && !playerCountry) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-200 flex items-center justify-center p-6">
        <div className="max-w-md text-center space-y-4">
          <h2 className="text-2xl font-bold text-white">Save data corrupted</h2>
          <p className="text-slate-400 text-sm">We couldn't load your previous game. Start a new mandate?</p>
          <button onClick={restart} className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl">
            Reset
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 font-sans selection:bg-blue-500/30 overflow-hidden">
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

              <CountrySelector onSelect={startGame} />
            </div>
          </motion.div>
        ) : (
          <div key="game" className="flex flex-col h-screen overflow-hidden">
            <ToastContainer toasts={toasts} />
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
                      <span>{playerCountry!.name}</span>
                      <span className="opacity-30">•</span>
                      <span>Turn {gameState.turn}</span>
                    </div>
                  </div>
                  <div className="sm:hidden font-black italic text-xs">GS v1.1</div>
                </div>

                <div className="flex-1 flex items-center overflow-x-auto no-scrollbar gap-1">
                  {/* World Tension pill */}
                  <div className={`flex-shrink-0 flex items-center gap-1 px-2 py-1 rounded-lg border text-[10px] font-black uppercase ${
                    (gameState.worldTension ?? 0) >= 75 ? 'border-red-500/40 bg-red-950/20 text-red-400' :
                    (gameState.worldTension ?? 0) >= 50 ? 'border-amber-500/30 bg-amber-950/20 text-amber-400' :
                    'border-slate-700 bg-slate-900 text-slate-400'
                  }`} title="World Tension">
                    <span>⚡</span>
                    <span className="hidden md:inline">{gameState.worldTension ?? 0}</span>
                  </div>
                  <ResourceCounter label="GDP" value={playerCountry!.resources.gdp} suffix="T" icon="gdp" color="text-yellow-400" description="Gross Domestic Product. Earned through trade, alliances, and time." />
                  <ResourceCounter label="STBL" value={playerCountry!.resources.stability} suffix="%" icon="stability" color="text-emerald-400" description="National Stability. Impacted by events, war, and aid." />
                  <ResourceCounter label="MIL" value={playerCountry!.resources.militaryPower} suffix="" icon="military" color="text-red-500" description="Military Strength. Built through R&D and spending. Consumed by war." />
                  <ResourceCounter label="INF" value={playerCountry!.resources.influence} suffix="" icon="influence" color="text-blue-400" description="Global Influence. Used for diplomacy and intel. Earned via trade and aid." />
                  <ResourceCounter label="SCI" value={playerCountry!.resources.science} suffix="" icon="science" color="text-purple-400" description="Scientific Progress. Gained via R&D. Used to build weapons and sell tech." />
                </div>

                <div className="flex items-center gap-2 ml-2">
                  <button
                    onClick={() => {
                      if (window.confirm('Reset the campaign? Your save will be wiped.')) restart();
                    }}
                    title="Reset and start a new game"
                    className="hidden md:flex items-center gap-2 px-3 py-2.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all text-xs font-bold uppercase tracking-wider"
                  >
                    <RotateCcw size={14} /> Reset
                  </button>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={recapOpen ? () => setRecapOpen(false) : nextTurn}
                    disabled={isProcessing || !!gameState.outcome}
                    className={`flex items-center justify-center w-10 h-10 md:w-auto md:px-6 md:py-2.5 text-white font-bold rounded-lg transition-all shadow-lg disabled:opacity-50 ${recapOpen ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-blue-600 hover:bg-blue-500'}`}
                  >
                    {isProcessing
                      ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      : recapOpen
                        ? <><CheckCircle2 size={18} /><span className="hidden md:inline ml-2">ACKNOWLEDGE</span></>
                        : <><Play size={18} fill="currentColor" /><span className="hidden md:inline ml-2">NEXT MONTH</span></>
                    }
                  </motion.button>
                </div>
              </div>
            </header>

            <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
              <aside className="fixed bottom-0 left-0 w-full md:sticky md:top-0 md:w-20 bg-slate-900 border-t md:border-t-0 md:border-r border-slate-800 h-16 md:h-full flex md:flex-col items-center justify-around md:justify-start py-0 md:py-6 gap-0 md:gap-8 z-50">
                <NavItem active={activeTab === 'world'} icon={<WorldMapIcon size={24} />} onClick={() => setActiveTab('world')} label="World" />
                <NavItem active={activeTab === 'feed'} icon={<MessageSquare size={24} />} onClick={() => setActiveTab('feed')} label="Feed" badge={(gameState.tweetFeed?.length ?? 0)} />
                <NavItem active={activeTab === 'markets'} icon={<BarChart2 size={24} />} onClick={() => setActiveTab('markets')} label="Markets" />
                <NavItem active={activeTab === 'advisors'} icon={<Target size={24} />} onClick={() => setActiveTab('advisors')} label="Advisors" />
                <NavItem active={activeTab === 'research'} icon={<FlaskConical size={24} />} onClick={() => setActiveTab('research')} label="Research" />
                <NavItem active={activeTab === 'history'} icon={<History size={24} />} onClick={() => setActiveTab('history')} label="History" />
              </aside>

              <main className="flex-1 p-4 md:p-8 overflow-y-auto pb-32 md:pb-16 bg-[url('https://www.transparenttextures.com/patterns/micro-carbon.png')]">
                <AnimatePresence mode="wait">
                  {activeTab === 'world' && (
                    <motion.div
                      key="world"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="max-w-7xl mx-auto"
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

                      <div className="grid lg:grid-cols-[minmax(0,1fr)_320px] gap-6">
                        <div className="grid gap-4 min-w-0">
                          {gameState.countries.map(country => (
                            <CountryEntry
                              key={country.id}
                              country={country}
                              player={playerCountry!}
                              onAction={(action) => performAction(country.id, action as ActionType)}
                            />
                          ))}
                        </div>
                        <div className="lg:sticky lg:top-4 self-start">
                          <SidePanel gameState={gameState} onOpenFeed={() => setActiveTab('feed')} />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'research' && (
                    <ResearchTree
                      unlockedTechIds={gameState.unlockedTechIds}
                      currentScience={playerCountry!.resources.science}
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
                          { role: 'Intelligence', icon: <Target size={24} />, color: 'text-purple-400', desc: 'Espionage & Influence' },
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

                  {activeTab === 'feed' && (
                    <TwitterFeed gameState={gameState} />
                  )}

                  {activeTab === 'markets' && (
                    <StockMarket
                      gameState={gameState}
                      playerGdp={playerCountry!.resources.gdp}
                      onBuy={buyStock}
                      onSell={sellStock}
                    />
                  )}

                  {activeTab === 'history' && <HistoryView gameState={gameState} />}
                </AnimatePresence>
              </main>
            </div>

            <NewsTicker news={gameState.newsLog} />

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
                        Welcome, Mr. President. The world does not wait for you. As leader of <span className="text-blue-400 font-bold">{playerCountry!.name}</span>, every decision you make ripples across the globe — and every other power is making their own.
                      </p>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                          <h4 className="text-xs font-bold text-red-400 uppercase mb-2">Live World</h4>
                          <p className="text-sm">Other nations act every turn. The rival builds power, neutrals shift allegiances, and allies can drift. Watch the "World Events" section each month.</p>
                        </div>
                        <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                          <h4 className="text-xs font-bold text-blue-400 uppercase mb-2">Diplomacy</h4>
                          <p className="text-sm">Forge alliances for GDP and Influence. A neglected nation may fall into rival hands before you notice.</p>
                        </div>
                        <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                          <h4 className="text-xs font-bold text-purple-400 uppercase mb-2">Science & Arms</h4>
                          <p className="text-sm">Invest in R&D to unlock game-changing tech. Sell advanced weapons to strengthen allies — or neutrals you want on your side.</p>
                        </div>
                        <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                          <h4 className="text-xs font-bold text-emerald-400 uppercase mb-2">Victory Paths</h4>
                          <p className="text-sm">Win through Military Dominance, Economic Prosperity, or Diplomatic Peace. Lose if your stability or economy collapses — or the rival outguns you.</p>
                        </div>
                      </div>

                      <p className="text-sm italic text-slate-500">
                        Press "NEXT MONTH" to advance time. Each turn recap shows what the world did while you planned.
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

            <AnimatePresence>
              {recapOpen && gameState.lastRecap && playerCountry && !gameState.outcome && (
                <TurnRecapModal
                  recap={gameState.lastRecap}
                  forecast={buildForecast(gameState)}
                  player={playerCountry}
                  onAcknowledge={() => setRecapOpen(false)}
                />
              )}
            </AnimatePresence>

            <AnimatePresence>
              {gameState.outcome && playerCountry && (
                <OutcomeModal
                  outcome={gameState.outcome}
                  player={playerCountry}
                  turn={gameState.turn}
                  onRestart={restart}
                />
              )}
            </AnimatePresence>

            <AnimatePresence>
              {gameState.activeCrisis && !gameState.outcome && !recapOpen && (
                <CrisisModal
                  crisis={gameState.activeCrisis}
                  onChoose={handleCrisisChoice}
                />
              )}
            </AnimatePresence>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function calcWorldTension(current: number, actions: AiCountryAction[]): number {
  let delta = 0;
  for (const a of actions) {
    if (a.description.toLowerCase().includes('war') || a.description.toLowerCase().includes('offensive')) delta += 8;
    else if (a.description.toLowerCase().includes('strike') || a.description.toLowerCase().includes('missile') || a.description.toLowerCase().includes('attack')) delta += 5;
    else if (a.description.toLowerCase().includes('sanction')) delta += 2;
    else if (a.description.toLowerCase().includes('alliance') || a.description.toLowerCase().includes('trade') || a.description.toLowerCase().includes('aid')) delta -= 1;
    else if (a.description.toLowerCase().includes('ceasefire') || a.description.toLowerCase().includes('de-escalat')) delta -= 4;
  }
  return Math.max(0, Math.min(100, current + delta));
}

const DIFFICULTY_STYLE = {
  Easy:    'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  Medium:  'bg-yellow-500/10  text-yellow-400  border-yellow-500/30',
  Hard:    'bg-orange-500/10  text-orange-400  border-orange-500/30',
  Extreme: 'bg-red-500/10     text-red-400     border-red-500/30',
};

const REGIONS = ['Americas', 'Europe', 'Asia-Pacific', 'Middle East', 'Africa'] as const;

function CountrySelector({ onSelect }: { onSelect: (id: string) => void }) {
  const [filter, setFilter] = React.useState<typeof REGIONS[number] | 'All'>('All');

  const grouped = React.useMemo(() => {
    const list = filter === 'All' ? INITIAL_COUNTRIES : INITIAL_COUNTRIES.filter(c => c.region === filter);
    const out: Record<string, typeof INITIAL_COUNTRIES> = {};
    for (const c of list) {
      if (!out[c.region]) out[c.region] = [];
      out[c.region].push(c);
    }
    return out;
  }, [filter]);

  return (
    <div className="space-y-8">
      {/* Region filter */}
      <div className="flex flex-wrap gap-2 justify-center">
        {(['All', ...REGIONS] as const).map(r => (
          <button key={r} onClick={() => setFilter(r)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold border uppercase tracking-wider transition-all ${filter === r ? 'bg-blue-600 border-blue-500 text-white' : 'border-slate-700 text-slate-400 hover:border-blue-500'}`}>
            {r}
          </button>
        ))}
      </div>

      {Object.entries(grouped).map(([region, countries]) => (
        <div key={region}>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">{region}</span>
            <div className="h-px flex-1 bg-slate-800" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {countries.map((country, idx) => (
              <motion.button
                key={country.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0, transition: { delay: idx * 0.04 } }}
                whileHover={{ scale: 1.02, translateY: -3 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onSelect(country.id)}
                className="flex flex-col p-4 bg-slate-900 border border-slate-800 rounded-2xl text-left hover:border-blue-500/60 transition-all group relative overflow-hidden shadow-xl"
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="text-3xl leading-none">{country.flag}</span>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${DIFFICULTY_STYLE[country.difficulty]}`}>
                      {country.difficulty}
                    </span>
                    {country.nuclearArmed && (
                      <span className="text-[8px] font-bold text-amber-400 bg-amber-950/30 border border-amber-500/20 px-1.5 py-0.5 rounded">☢ NUCLEAR</span>
                    )}
                  </div>
                </div>
                <h3 className="font-black text-white text-sm mb-1 group-hover:text-blue-300 transition-colors">{country.name}</h3>
                <p className="text-[10px] text-slate-500 leading-snug mb-3 line-clamp-2 flex-1">{country.description.split('.')[0]}.</p>
                <div className="space-y-1.5 pt-2 border-t border-slate-800">
                  <div className="flex justify-between text-[9px] font-bold uppercase text-slate-600">
                    <span>GDP</span><span className="text-yellow-400">${country.resources.gdp}T</span>
                  </div>
                  <div className="flex justify-between text-[9px] font-bold uppercase text-slate-600">
                    <span>Military</span><span className="text-red-400">{country.resources.militaryPower} PWR</span>
                  </div>
                  <div className="flex justify-between text-[9px] font-bold uppercase text-slate-600">
                    <span>Stability</span>
                    <span className={country.resources.stability >= 70 ? 'text-emerald-400' : country.resources.stability >= 50 ? 'text-yellow-400' : 'text-red-400'}>
                      {country.resources.stability}%
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {country.traits.slice(0, 2).map(t => (
                    <span key={t.name} className="text-[8px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-mono truncate max-w-[120px]" title={t.description}>
                      {t.name}
                    </span>
                  ))}
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      ))}

      <p className="text-center text-slate-600 text-[10px] uppercase tracking-[0.2em] font-mono pt-4">
        20 Nations · Real 2024 Data · Every Country Playable
      </p>
    </div>
  );
}

function NavItem({ active, icon, onClick, label, badge }: { active: boolean, icon: React.ReactNode, onClick: () => void, label: string, badge?: number }) {
  return (
    <button
      onClick={onClick}
      className={`group relative flex flex-col items-center justify-center py-2 px-1 md:p-3 rounded-xl transition-all flex-1 md:flex-none ${active ? 'text-white md:bg-blue-600 md:shadow-lg md:shadow-blue-900/40' : 'text-slate-500 hover:text-slate-200 md:hover:bg-slate-800'}`}
    >
      <div className={`relative ${active && 'md:scale-110'} transition-transform`}>
        {icon}
        {badge != null && badge > 0 && !active && (
          <span className="absolute -top-1 -right-1 min-w-[14px] h-3.5 bg-blue-500 rounded-full text-[7px] font-black text-white flex items-center justify-center px-0.5">
            {badge > 99 ? '99+' : badge}
          </span>
        )}
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
