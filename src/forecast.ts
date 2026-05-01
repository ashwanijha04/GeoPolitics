/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Country, GameState, ResourceSet } from './types.ts';
import { FORECAST } from './actions.ts';

export type Severity = 'info' | 'good' | 'warn' | 'crit';

export interface Alert {
  id: string;
  severity: Severity;
  title: string;
  detail: string;
}

export interface ResourceDelta {
  resource: keyof ResourceSet;
  before: number;
  after: number;
  delta: number;
}

const RESOURCE_LABEL: Record<keyof ResourceSet, string> = {
  gdp: 'GDP',
  stability: 'Stability',
  militaryPower: 'Military',
  influence: 'Influence',
  science: 'Science',
  population: 'Population',
};

export function resourceLabel(r: keyof ResourceSet): string {
  return RESOURCE_LABEL[r];
}

export function diffResources(prev: ResourceSet, next: ResourceSet): ResourceDelta[] {
  const keys: Array<keyof ResourceSet> = ['gdp', 'stability', 'militaryPower', 'influence', 'science'];
  return keys
    .map(k => ({ resource: k, before: prev[k], after: next[k], delta: Number((next[k] - prev[k]).toFixed(2)) }))
    .filter(d => Math.abs(d.delta) > 0.001);
}

// Forward-looking warnings the player should see *before* pressing Next Month.
export function buildForecast(state: GameState): Alert[] {
  const alerts: Alert[] = [];
  const player = state.countries.find(c => c.id === state.playerCountryId);
  if (!player) return alerts;

  const others = state.countries.filter(c => c.id !== state.playerCountryId);
  const rival = state.countries.find(c => c.id === 'rival');

  if (player.resources.stability <= FORECAST.stabilityCrit) {
    alerts.push({
      id: 'stability-crit',
      severity: 'crit',
      title: 'Civil unrest at breaking point',
      detail: `Stability at ${player.resources.stability}%. One bad event and the regime falls.`,
    });
  } else if (player.resources.stability <= FORECAST.stabilityWarn) {
    alerts.push({
      id: 'stability-warn',
      severity: 'warn',
      title: 'Stability sliding',
      detail: `${player.resources.stability}%. Consider domestic aid or pause aggressive ops.`,
    });
  }

  if (player.resources.gdp <= FORECAST.gdpCrit) {
    alerts.push({
      id: 'gdp-crit',
      severity: 'crit',
      title: 'Economy contracting',
      detail: `GDP $${player.resources.gdp.toFixed(1)}T. Below $1T triggers regime collapse.`,
    });
  }

  if (rival && rival.resources.militaryPower >= player.resources.militaryPower - FORECAST.rivalParityGap) {
    alerts.push({
      id: 'rival-parity',
      severity: 'warn',
      title: 'Rival approaching military parity',
      detail: `${rival.name} now at MIL ${rival.resources.militaryPower} vs your ${player.resources.militaryPower}.`,
    });
  }

  if (player.resources.influence <= FORECAST.influenceLow) {
    alerts.push({
      id: 'inf-low',
      severity: 'warn',
      title: 'Diplomatic capital drained',
      detail: `Only ${player.resources.influence} INF. Trade and aid actions are about to lock out.`,
    });
  }

  // Recent stability slope — if the last 3 turns trended sharply down, flag it.
  const hist = state.history.slice(-4);
  if (hist.length >= 3) {
    const drop = hist[0].stability - hist[hist.length - 1].stability;
    if (drop >= 10) {
      alerts.push({
        id: 'stability-slope',
        severity: 'warn',
        title: `Stability fell ${drop}% in ${hist.length - 1} turns`,
        detail: 'Trend is accelerating. Run Aid or pause aggressive moves.',
      });
    }
  }

  // Alliance opportunities — friendly + stable target you haven't allied with.
  const ripe = others.find(c => c.stanceTowardsPlayer === 'Friendly' && c.resources.stability >= 60);
  if (ripe && player.resources.influence >= 50) {
    alerts.push({
      id: `alliance-${ripe.id}`,
      severity: 'good',
      title: `${ripe.name} ready for alliance`,
      detail: 'Friendly stance + stable. 50 INF locks them in.',
    });
  }

  // Tech-tree headroom.
  if (player.resources.science >= 150 && state.unlockedTechIds.length < 6) {
    alerts.push({
      id: 'sci-ready',
      severity: 'good',
      title: 'Research ready',
      detail: `${player.resources.science} SCI banked. Visit Research to unlock.`,
    });
  }

  return alerts;
}

// Generate per-advisor commentary that reacts to the current state. Keeps the
// council "alive" without an LLM call. The advisor whose domain is most
// relevant should sound most urgent.
export function advisorAuto(state: GameState, role: 'Military' | 'Economic' | 'Intelligence'): string {
  const player = state.countries.find(c => c.id === state.playerCountryId);
  const rival = state.countries.find(c => c.id === 'rival');
  if (!player) return '';

  if (role === 'Military') {
    if (rival && rival.resources.militaryPower >= player.resources.militaryPower) {
      return `${rival.name} now matches our forces (${rival.resources.militaryPower} vs ${player.resources.militaryPower}). We need a procurement cycle, now.`;
    }
    if (player.resources.militaryPower >= 100) return 'We dominate every theater. Recommend selective arms sales — turn capability into capital.';
    return 'Forces are at readiness. Maintain forward presence; intel suggests no imminent escalation.';
  }
  if (role === 'Economic') {
    if (player.resources.gdp < 10) return `Treasury thin at $${player.resources.gdp.toFixed(1)}T. Lean on trade deals; avoid 1.0 GDP aid drops until reserves recover.`;
    if (player.resources.influence < 30) return 'Influence shortfall caps our trade options. Pull back covert ops for a turn and rebuild diplomatic capital.';
    return 'Growth is steady. Two-turn window to push a major trade pact before maintenance costs catch up.';
  }
  // Intelligence
  if (rival && rival.resources.stability < 60) return `${rival.name} cracks visible — stability ${rival.resources.stability}%. A propaganda push could shatter their position.`;
  if (player.resources.influence > 80) return 'Influence at peak. Time to convert soft power into a formal alliance bloc.';
  return 'Cells worldwide report nominal. Consider an Intel Op against the rival to harvest stability.';
}
