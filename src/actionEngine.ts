/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Shared pure action logic. Both the player (via performAction in App.tsx)
 * and AI countries (via runStrategicAiActions) call applyAction so all
 * resource mutations are symmetric and identical.
 */

import { Country, ActionType, DiplomaticStance } from './types.ts';

export interface ActionResult {
  updatedActor: Country;
  updatedTarget: Country;
  message: string;
  success: boolean;
  toastType: 'success' | 'warning' | 'error' | 'info';
}

function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)); }

function shiftStance(stance: DiplomaticStance, dir: 'better' | 'worse'): DiplomaticStance {
  const order: DiplomaticStance[] = ['Ally', 'Friendly', 'Neutral', 'Suspicious', 'Hostile', 'At War'];
  const i = order.indexOf(stance);
  return dir === 'better' ? order[Math.max(0, i - 1)] : order[Math.min(order.length - 1, i + 1)];
}

export function applyAction(
  actor: Country,
  target: Country,
  action: ActionType,
): ActionResult {
  const a: Country = { ...actor, resources: { ...actor.resources } };
  const t: Country = { ...target, resources: { ...target.resources } };
  let message = '';
  let success = false;
  let toastType: ActionResult['toastType'] = 'info';

  switch (action) {
    case 'Trade':
      if (a.resources.influence >= 10) {
        a.resources.influence -= 10;
        a.resources.gdp = Number((a.resources.gdp + 0.5).toFixed(2));
        t.resources.gdp = Number((t.resources.gdp + 0.3).toFixed(2));
        message = `${a.name} signs major trade agreement with ${t.name}.`;
        success = true; toastType = 'success';
      } else { message = `${a.name}: insufficient influence for trade.`; toastType = 'error'; }
      break;

    case 'Aid':
      if (a.resources.gdp >= 1.0) {
        a.resources.gdp = Number((a.resources.gdp - 1.0).toFixed(2));
        t.resources.stability = clamp(t.resources.stability + 10, 0, 100);
        t.resources.influence = clamp(t.resources.influence + 5, 0, 100);
        message = `${a.name} dispatches humanitarian aid package to ${t.name}.`;
        success = true; toastType = 'success';
      } else { message = `${a.name}: insufficient GDP for aid.`; toastType = 'error'; }
      break;

    case 'Intel':
      if (a.resources.influence >= 20) {
        a.resources.influence -= 20;
        t.resources.stability = clamp(t.resources.stability - 5, 0, 100);
        message = `${a.name} covert operation disrupts critical infrastructure in ${t.name}.`;
        success = true; toastType = 'warning';
      } else { message = `${a.name}: insufficient influence for intel op.`; toastType = 'error'; }
      break;

    case 'Sanction':
      t.resources.gdp = Number((t.resources.gdp * 0.95).toFixed(2));
      t.resources.stability = clamp(t.resources.stability - 2, 0, 100);
      message = `${a.name} imposes economic sanctions on ${t.name}.`;
      success = true; toastType = 'warning';
      break;

    case 'Military':
      if (a.resources.militaryPower >= 20) {
        a.resources.militaryPower = clamp(a.resources.militaryPower - 10, 0, 200);
        t.resources.militaryPower = clamp(t.resources.militaryPower - 15, 0, 200);
        t.resources.stability = clamp(t.resources.stability - 10, 0, 100);
        t.stanceTowardsPlayer = shiftStance(t.stanceTowardsPlayer, 'worse');
        message = `${a.name} conducts precision military strikes against ${t.name}.`;
        success = true; toastType = 'warning';
      } else { message = `${a.name}: insufficient military for strike.`; toastType = 'error'; }
      break;

    case 'War':
      if (a.resources.militaryPower >= 50) {
        a.resources.militaryPower = clamp(a.resources.militaryPower - 30, 0, 200);
        a.resources.stability = clamp(a.resources.stability - 10, 0, 100); // war costs attacker too
        a.resources.gdp = Number((a.resources.gdp * 0.97).toFixed(2));    // economic war cost
        t.resources.militaryPower = clamp(t.resources.militaryPower - 50, 0, 200);
        t.resources.stability = clamp(t.resources.stability - 40, 0, 100);
        t.resources.gdp = Number((t.resources.gdp * 0.7).toFixed(2));
        t.stanceTowardsPlayer = 'At War';
        message = `${a.name} declares Total War on ${t.name}. The world watches in horror.`;
        success = true; toastType = 'error';
      } else { message = `${a.name}: insufficient military for war (need 50).`; toastType = 'error'; }
      break;

    case 'Propaganda':
      if (a.resources.influence >= 40) {
        a.resources.influence -= 40;
        t.resources.stability = clamp(t.resources.stability - 25, 0, 100);
        // 20% backfire chance
        if (Math.random() < 0.20) {
          a.resources.stability = clamp(a.resources.stability - 5, 0, 100);
          message = `${a.name} propaganda campaign against ${t.name} BACKFIRES. Exposed internationally.`;
        } else {
          message = `${a.name} coordinated disinformation campaign destabilizes ${t.name}.`;
        }
        success = true; toastType = 'warning';
      } else { message = `${a.name}: insufficient influence for propaganda.`; toastType = 'error'; }
      break;

    case 'Research':
      if (a.resources.gdp >= 2.0 && a.resources.influence >= 10) {
        a.resources.gdp = Number((a.resources.gdp - 2.0).toFixed(2));
        a.resources.influence -= 10;
        a.resources.science = clamp(a.resources.science + 25, 0, 9999);
        a.resources.militaryPower = clamp(a.resources.militaryPower + 5, 0, 200);
        message = `${a.name} launches joint R&D initiative — science and military capability grow.`;
        success = true; toastType = 'success';
      } else { message = `${a.name}: insufficient resources for R&D (need 2.0 GDP, 10 INF).`; toastType = 'error'; }
      break;

    case 'ArmsTrade':
      if (a.resources.science >= 30) {
        a.resources.science -= 30;
        a.resources.gdp = Number((a.resources.gdp + 3.5).toFixed(2));
        t.resources.militaryPower = clamp(t.resources.militaryPower + 20, 0, 200);
        t.resources.influence = clamp(t.resources.influence - 10, 0, 100);
        message = `${a.name} sells advanced weapon systems to ${t.name}. Treasury receives major windfall.`;
        success = true; toastType = 'success';
      } else { message = `${a.name}: insufficient science for arms export.`; toastType = 'error'; }
      break;

    case 'Alliance':
      if (a.resources.influence >= 50 && t.resources.stability >= 40) {
        a.resources.influence -= 50;
        a.resources.gdp = Number((a.resources.gdp + 0.2).toFixed(2));
        t.resources.stability = clamp(t.resources.stability + 10, 0, 100);
        t.stanceTowardsPlayer = 'Ally';
        message = `${a.name} and ${t.name} formalize a historic alliance.`;
        success = true; toastType = 'success';
      } else { message = `${a.name}: cannot form alliance (need 50 INF, target needs 40% STBL).`; toastType = 'error'; }
      break;
  }

  return {
    updatedActor: { ...a, resources: { ...a.resources, gdp: Math.max(0, a.resources.gdp) } },
    updatedTarget: { ...t, resources: { ...t.resources, gdp: Math.max(0, t.resources.gdp) } },
    message,
    success,
    toastType,
  };
}
