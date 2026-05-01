/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ActionType } from './types.ts';

// Single source of truth for the *displayed* cost / effect of each action.
// The actual numerical mutations live in performAction; keep these strings
// in sync if you tweak the gameplay numbers.
export interface ActionInfo {
  label: string;
  cost: string;
  effect: string;
  blurb: string;
  tone: 'good' | 'risky' | 'aggressive' | 'neutral';
}

export const ACTION_INFO: Record<Exclude<ActionType, 'UnlockTech'>, ActionInfo> = {
  Trade: {
    label: 'Trade',
    cost: '−10 INF',
    effect: '+0.5 GDP (you), +0.3 GDP (them)',
    blurb: 'Mutual bilateral deal. Cheap GDP, slow burn on influence.',
    tone: 'good',
  },
  Aid: {
    label: 'Aid',
    cost: '−1.0 GDP',
    effect: '+10 STBL & +5 INF (them)',
    blurb: 'Humanitarian package. Stabilises a target country and earns goodwill.',
    tone: 'good',
  },
  Alliance: {
    label: 'Ally',
    cost: '−50 INF (requires 40% target STBL)',
    effect: 'Locks ally status, +10 STBL (them), +0.2 GDP (you)',
    blurb: 'Big upfront cost, long-term GDP edge and a defensive partner.',
    tone: 'good',
  },
  Intel: {
    label: 'Intel Op',
    cost: '−20 INF',
    effect: '−5 STBL (them)',
    blurb: 'Covert sabotage. Quietly degrades a rival without provoking war.',
    tone: 'risky',
  },
  Propaganda: {
    label: 'Propaganda',
    cost: '−40 INF',
    effect: '−25 STBL (them)',
    blurb: 'Mass disinformation. Severe destabilisation, expensive on influence.',
    tone: 'risky',
  },
  Research: {
    label: 'R&D',
    cost: '−2.0 GDP, −10 INF',
    effect: '+25 SCI, +5 MIL (you)',
    blurb: 'Joint scientific project. Fastest path to tech-tree breakthroughs.',
    tone: 'good',
  },
  ArmsTrade: {
    label: 'Arms Sale',
    cost: '−30 SCI',
    effect: '+3.5 GDP (you), +20 MIL & −10 INF (them)',
    blurb: 'Cash in on tech. Strengthens the buyer militarily — pick targets carefully.',
    tone: 'risky',
  },
  Sanction: {
    label: 'Sanction',
    cost: 'Free',
    effect: 'GDP ×0.95 & −2 STBL (them)',
    blurb: 'Cheap economic pressure. No upfront cost, modest impact.',
    tone: 'risky',
  },
  Military: {
    label: 'Strike',
    cost: '−10 MIL',
    effect: '−15 MIL & −10 STBL (them)',
    blurb: 'Surgical air strike. Provokes hostility but degrades capability fast.',
    tone: 'aggressive',
  },
  War: {
    label: 'Total War',
    cost: '−30 MIL (requires 50 MIL)',
    effect: '−50 MIL, −40 STBL, GDP ×0.7, marks Hostile',
    blurb: 'Endgame option. Cripples them — and burns a third of your military.',
    tone: 'aggressive',
  },
};

// Forecast/warning thresholds — single place to tune the alert system.
export const FORECAST = {
  stabilityWarn: 50,
  stabilityCrit: 25,
  gdpCrit: 5.0,
  rivalParityGap: 5, // if rival military within this of yours → warn
  influenceLow: 30,
};
