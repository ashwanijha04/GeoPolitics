/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Strategic AI: every country uses the same action engine as the player.
 * Each non-player country evaluates its situation and picks the best action.
 */

import { Country, GameState, ActionType, AiCountryAction, GameActionRecord } from './types.ts';
import { applyAction } from './actionEngine.ts';

// Geopolitical blocs — determines who is a rival vs ally for AI decisions
const COUNTRY_BLOC: Record<string, 'western' | 'eastern' | 'non-aligned'> = {
  'usa':          'western',
  'uk':           'western',
  'eu':           'western',
  'japan':        'western',
  'south-korea':  'western',
  'australia':    'western',
  'israel':       'western',
  'taiwan':       'western',
  'ukraine':      'western',
  'russia':       'eastern',
  'china':        'eastern',
  'north-korea':  'eastern',
  'iran':         'eastern',
  'pakistan':     'eastern',
  'india':        'non-aligned',
  'brazil':       'non-aligned',
  'turkey':       'non-aligned',
  'saudi-arabia': 'non-aligned',
  'indonesia':    'non-aligned',
  'nigeria':      'non-aligned',
};

function blocOf(id: string) { return COUNTRY_BLOC[id] ?? 'non-aligned'; }

function areRivals(a: Country, b: Country): boolean {
  const ba = blocOf(a.id), bb = blocOf(b.id);
  if (ba === 'western' && bb === 'eastern') return true;
  if (ba === 'eastern' && bb === 'western') return true;
  return false;
}

function areBloc(a: Country, b: Country): boolean {
  const ba = blocOf(a.id), bb = blocOf(b.id);
  return ba !== 'non-aligned' && ba === bb;
}

// Read recent player actions against this country from history
function recentPlayerActionsAgainst(
  history: GameActionRecord[],
  targetName: string,
  sinceT: number,
  hostile = false,
): GameActionRecord[] {
  const hostileActions = new Set(['Military', 'War', 'Sanction', 'Propaganda', 'Intel']);
  return history.filter(r =>
    r.countryName === targetName &&
    r.turn >= sinceT &&
    (!hostile || hostileActions.has(r.action))
  );
}

interface Decision {
  targetId: string;
  action: ActionType;
  priority: number;
}

function pickDecision(actor: Country, countries: Country[], state: GameState): Decision | null {
  const candidates: Decision[] = [];
  const r = actor.resources;
  const currentTurn = state.turn;
  const recentHostile = recentPlayerActionsAgainst(state.actionHistory, actor.name, currentTurn - 3, true);

  // ── RETALIATION (highest priority) ──────────────────────────────────────
  // If player attacked this country recently, retaliate in kind
  if (recentHostile.length > 0) {
    const lastAttack = recentHostile[recentHostile.length - 1];
    const player = countries.find(c => c.id === state.playerCountryId);
    if (player) {
      const retaliateAction = mirrorAction(lastAttack.action, actor);
      if (retaliateAction) {
        candidates.push({ targetId: player.id, action: retaliateAction, priority: 100 });
      }
    }
  }

  // ── SURVIVAL: stabilize ──────────────────────────────────────────────────
  if (r.stability < 35 && r.gdp >= 1.0) {
    // Aid a friendly/ally to build goodwill, or just do research
    const ally = countries.find(c =>
      c.id !== actor.id &&
      c.stanceTowardsPlayer !== 'At War' &&
      areBloc(actor, c) &&
      c.resources.gdp > 3
    );
    if (ally) candidates.push({ targetId: ally.id, action: 'Aid', priority: 80 });
  }

  // ── ARMS BUILDUP when rival is close ────────────────────────────────────
  const rivals = countries.filter(c => c.id !== actor.id && areRivals(actor, c));
  const strongRival = rivals.find(c => c.resources.militaryPower >= r.militaryPower - 5);
  if (strongRival && r.gdp >= 2 && r.influence >= 10) {
    candidates.push({ targetId: actor.id, action: 'Research', priority: 70 });
  }

  // ── MILITARY STRIKE when clearly dominant ───────────────────────────────
  if (r.militaryPower >= 65) {
    const weakRival = rivals
      .filter(c => c.resources.militaryPower < r.militaryPower - 20 && r.militaryPower >= 20)
      .sort((a, b) => a.resources.militaryPower - b.resources.militaryPower)[0];
    if (weakRival) {
      candidates.push({ targetId: weakRival.id, action: 'Military', priority: 65 });
    }
  }

  // ── WAR when massively dominant ──────────────────────────────────────────
  if (r.militaryPower >= 90) {
    const veryWeakRival = rivals
      .filter(c => c.resources.militaryPower < r.militaryPower - 40 && r.militaryPower >= 50)
      .sort((a, b) => a.resources.militaryPower - b.resources.militaryPower)[0];
    if (veryWeakRival && Math.random() < 0.15) {
      candidates.push({ targetId: veryWeakRival.id, action: 'War', priority: 75 });
    }
  }

  // ── SANCTION economically competitive rivals ─────────────────────────────
  const richRival = rivals.find(c =>
    c.resources.gdp > r.gdp * 0.7 &&
    c.stanceTowardsPlayer !== 'Ally'
  );
  if (richRival) {
    candidates.push({ targetId: richRival.id, action: 'Sanction', priority: 45 });
  }

  // ── PROPAGANDA against unstable rivals ──────────────────────────────────
  if (r.influence >= 40) {
    const unstableRival = rivals.find(c => c.resources.stability < 65);
    if (unstableRival) {
      candidates.push({ targetId: unstableRival.id, action: 'Propaganda', priority: 50 });
    }
  }

  // ── INTEL against strong rivals ─────────────────────────────────────────
  if (r.influence >= 20) {
    const strongestRival = rivals.sort((a, b) => b.resources.militaryPower - a.resources.militaryPower)[0];
    if (strongestRival) {
      candidates.push({ targetId: strongestRival.id, action: 'Intel', priority: 35 });
    }
  }

  // ── ARMS TRADE with bloc allies ─────────────────────────────────────────
  if (r.science >= 30) {
    const weakAlly = countries.find(c =>
      c.id !== actor.id &&
      areBloc(actor, c) &&
      c.resources.militaryPower < r.militaryPower - 20
    );
    if (weakAlly) {
      candidates.push({ targetId: weakAlly.id, action: 'ArmsTrade', priority: 40 });
    }
  }

  // ── TRADE with non-rivals for economic growth ────────────────────────────
  if (r.influence >= 10 && r.gdp < 15) {
    const tradePartner = countries.find(c =>
      c.id !== actor.id &&
      !areRivals(actor, c) &&
      c.resources.gdp > 1
    );
    if (tradePartner) {
      candidates.push({ targetId: tradePartner.id, action: 'Trade', priority: 30 });
    }
  }

  // ── ALLIANCE with stable friendly ────────────────────────────────────────
  if (r.influence >= 50) {
    const allianceTarget = countries.find(c =>
      c.id !== actor.id &&
      areBloc(actor, c) &&
      c.resources.stability >= 40 &&
      c.stanceTowardsPlayer !== 'Ally' &&
      c.stanceTowardsPlayer !== 'At War'
    );
    if (allianceTarget) {
      candidates.push({ targetId: allianceTarget.id, action: 'Alliance', priority: 55 });
    }
  }

  // ── DEFAULT: Research ────────────────────────────────────────────────────
  if (r.gdp >= 2 && r.influence >= 10) {
    candidates.push({ targetId: actor.id, action: 'Research', priority: 20 });
  }

  if (candidates.length === 0) return null;
  return candidates.sort((a, b) => b.priority - a.priority)[0];
}

function mirrorAction(original: string, actor: Country): ActionType | null {
  // Retaliate with equivalent or proportional action
  if (original === 'War' && actor.resources.militaryPower >= 50) return 'War';
  if (original === 'Military' && actor.resources.militaryPower >= 20) return 'Military';
  if (original === 'Sanction') return 'Sanction';
  if (original === 'Propaganda' && actor.resources.influence >= 40) return 'Propaganda';
  if (original === 'Intel' && actor.resources.influence >= 20) return 'Intel';
  if (original === 'ArmsTrade') return 'Sanction'; // respond to arms trade with sanction
  // Weaker fallback
  if (actor.resources.influence >= 20) return 'Intel';
  return 'Sanction'; // always possible
}

export function runStrategicAiActions(
  state: GameState,
): { updatedCountries: Country[]; strategicActions: AiCountryAction[] } {
  const countries = state.countries.map(c => ({ ...c, resources: { ...c.resources } }));
  const strategicActions: AiCountryAction[] = [];

  for (let i = 0; i < countries.length; i++) {
    const actor = countries[i];
    if (actor.id === state.playerCountryId) continue;

    // Only ~55% of countries make a strategic decision each turn — makes the world feel less mechanical
    if (Math.random() > 0.55) continue;

    const decision = pickDecision(actor, countries, state);
    if (!decision) continue;

    // Research is self-targeted
    const targetIdx = decision.action === 'Research'
      ? i
      : countries.findIndex(c => c.id === decision.targetId);
    if (targetIdx === -1) continue;

    const result = applyAction(countries[i], countries[targetIdx], decision.action);
    if (!result.success) continue;

    countries[i] = result.updatedActor;
    if (targetIdx !== i) countries[targetIdx] = result.updatedTarget;

    const isAgainstPlayer = decision.targetId === state.playerCountryId;
    const hostileActions = new Set(['Military', 'War', 'Sanction', 'Propaganda', 'Intel']);

    strategicActions.push({
      countryId: actor.id,
      countryName: actor.name,
      description: result.message,
      hostile: hostileActions.has(decision.action) && isAgainstPlayer,
      targetCountryId: decision.targetId,
      targetCountryName: countries[targetIdx]?.name,
      isBilateral: !isAgainstPlayer,
    });
  }

  return { updatedCountries: countries, strategicActions };
}
