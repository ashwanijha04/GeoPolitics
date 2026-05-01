/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GameState, GameOutcome, Country } from './types.ts';

// Bump to v2 — new country structure is incompatible with v1 saves.
const STORAGE_KEY = 'global-sovereign:save:v2';

export function loadGameState(): GameState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GameState;
    if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.countries)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveGameState(state: GameState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Quota / private mode — silently ignore.
  }
}

export function clearSavedGame(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function evaluateOutcome(state: GameState): GameOutcome | null {
  const player = state.countries.find(c => c.id === state.playerCountryId);
  if (!player) return null;

  // Defeat conditions
  if (player.resources.stability <= 0) {
    return { kind: 'Defeated', reason: `${player.name} has fallen into total chaos. Stability collapsed.` };
  }
  if (player.resources.gdp <= 0.5) {
    return { kind: 'Defeated', reason: `${player.name}'s economy has cratered. The state can no longer function.` };
  }

  // Collapse: any hostile country overwhelmingly outguns you
  const hostiles = state.countries.filter(c =>
    c.id !== state.playerCountryId &&
    (c.stanceTowardsPlayer === 'Hostile' || c.stanceTowardsPlayer === 'At War')
  );
  const overwhelmed = hostiles.some(
    c => c.resources.militaryPower >= player.resources.militaryPower + 30 && c.resources.militaryPower >= 90
  );
  if (overwhelmed) {
    const threat = hostiles.find(c => c.resources.militaryPower >= player.resources.militaryPower + 30)!;
    return { kind: 'Collapse', reason: `${threat.name} has achieved overwhelming military superiority. The balance of power has shifted irreversibly.` };
  }

  // Victory: Dominance
  const others = state.countries.filter(c => c.id !== state.playerCountryId);
  const topMil = Math.max(...others.map(c => c.resources.militaryPower));
  const topGdp = Math.max(...others.map(c => c.resources.gdp));
  if (player.resources.militaryPower >= topMil + 25 && player.resources.gdp >= topGdp + 5) {
    return { kind: 'Dominance' };
  }

  // Victory: Prosperity
  if (player.resources.gdp >= 50 && player.resources.stability >= 85) {
    return { kind: 'Prosperity' };
  }

  // Victory: Peace — all others Friendly or Ally + high influence
  const allPositive = others.every(c =>
    c.stanceTowardsPlayer === 'Friendly' || c.stanceTowardsPlayer === 'Ally'
  );
  if (allPositive && player.resources.influence >= 90) {
    return { kind: 'Peace' };
  }

  return null;
}

export function outcomeTitle(outcome: GameOutcome): string {
  switch (outcome.kind) {
    case 'Dominance': return 'Total Dominance';
    case 'Prosperity': return 'Era of Prosperity';
    case 'Peace': return 'Pax Mundi';
    case 'Collapse': return 'Strategic Collapse';
    case 'Defeated': return 'Regime Has Fallen';
  }
}

export function outcomeBlurb(outcome: GameOutcome, player: Country): string {
  switch (outcome.kind) {
    case 'Dominance':
      return `${player.name} stands unrivaled. No power on Earth can match our military and economic reach.`;
    case 'Prosperity':
      return `${player.name} has entered a golden age. The treasury overflows and the people are at peace.`;
    case 'Peace':
      return `${player.name} has woven the world into a stable diplomatic order. Every flag salutes ours.`;
    case 'Collapse':
    case 'Defeated':
      return outcome.reason;
  }
}

export function isVictory(outcome: GameOutcome): boolean {
  return outcome.kind === 'Dominance' || outcome.kind === 'Prosperity' || outcome.kind === 'Peace';
}
