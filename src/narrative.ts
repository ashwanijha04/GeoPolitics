/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Generates a short narrative paragraph each turn — makes the game feel like
 * a story you're living through, not a spreadsheet you're filling out.
 */

import { GameState, AiCountryAction } from './types.ts';

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

export function generateNarrative(
  state: GameState,
  aiActions: AiCountryAction[],
  newsTitle: string,
): string {
  const player = state.countries.find(c => c.id === state.playerCountryId);
  if (!player) return '';

  const tension = state.worldTension ?? 0;
  const rivals  = state.countries.filter(c => c.stanceTowardsPlayer === 'Hostile' || c.stanceTowardsPlayer === 'At War');
  const allies  = state.countries.filter(c => c.stanceTowardsPlayer === 'Ally');
  const mainRival = rivals.sort((a, b) => b.resources.militaryPower - a.resources.militaryPower)[0];
  const warAction = aiActions.find(a => a.description.toLowerCase().includes('war') || a.description.toLowerCase().includes('offensive'));
  const strikeAction = aiActions.find(a => a.description.toLowerCase().includes('strike') || a.description.toLowerCase().includes('missile'));
  const diplomaticAction = aiActions.find(a => !a.hostile && a.isBilateral);

  // Opening — world mood
  const openings = tension >= 75
    ? [
        `The world held its breath as Month ${state.turn} began.`,
        `Sirens and scrambled jets defined Month ${state.turn}.`,
        `Month ${state.turn} opened under the shadow of imminent conflict.`,
      ]
    : tension >= 50
    ? [
        `Tensions simmered as Month ${state.turn} unfolded.`,
        `The geopolitical temperature continued to rise in Month ${state.turn}.`,
        `Uneasy stability defined the opening of Month ${state.turn}.`,
      ]
    : [
        `Month ${state.turn} brought cautious optimism to the chancelleries of the world.`,
        `The diplomatic calendar was full as Month ${state.turn} began.`,
        `A period of relative calm settled over Month ${state.turn} — but fragile.`,
      ];
  let para = pick(openings) + ' ';

  // Middle — biggest event
  if (warAction) {
    para += `${warAction.countryName} escalated dramatically — ${warAction.description.toLowerCase()} `;
  } else if (strikeAction) {
    para += `${strikeAction.countryName} made headlines when they ${strikeAction.description.toLowerCase()} `;
  } else if (newsTitle && newsTitle !== 'Month passed peacefully.') {
    para += `The dominant story was: ${newsTitle.toLowerCase()}. `;
  }

  // Middle — rival or diplomatic development
  if (mainRival) {
    const gap = player.resources.militaryPower - mainRival.resources.militaryPower;
    if (gap < 5 && gap > -5) {
      para += pick([
        `${mainRival.name} is now within striking distance militarily — a dangerous parity.`,
        `Intelligence confirms ${mainRival.name} has nearly closed the military gap.`,
        `${mainRival.name}'s defense spending surge has alarmed your high command.`,
      ]) + ' ';
    } else if (gap < -10) {
      para += pick([
        `Your advisors are concerned: ${mainRival.name} now outguns you.`,
        `The military balance has tilted in ${mainRival.name}'s favor.`,
      ]) + ' ';
    }
  }

  if (diplomaticAction && !warAction) {
    para += pick([
      `On the diplomatic front, ${diplomaticAction.countryName} signaled room for engagement.`,
      `A quiet development: ${diplomaticAction.countryName} made a cooperative overture this month.`,
    ]) + ' ';
  }

  // Closer — player situation
  if (player.resources.stability < 45) {
    para += pick([
      `At home, the administration faces mounting pressure to deliver results.`,
      `Domestic stability is fraying — your cabinet is under pressure.`,
    ]);
  } else if (allies.length >= 3) {
    para += pick([
      `Your coalition remains solid — for now.`,
      `Allied capitals reaffirmed their commitment this month.`,
    ]);
  } else if (player.resources.gdp > 30) {
    para += pick([
      `Your economy continues to outperform, giving you strategic room to maneuver.`,
      `Financial markets rewarded your nation's stability with record gains.`,
    ]);
  } else {
    para += pick([
      `The situation demands strategic patience and precise execution.`,
      `Every decision this month carries consequences that will echo for years.`,
    ]);
  }

  return para.trim();
}

export function generateHotDecisions(state: GameState): Array<{
  id: string;
  icon: string;
  title: string;
  detail: string;
  urgency: 'critical' | 'warn' | 'opportunity';
  countryId?: string;
  suggestedAction?: string;
}> {
  const player = state.countries.find(c => c.id === state.playerCountryId);
  if (!player) return [];
  const decisions = [];

  const rivals = state.countries.filter(c => c.stanceTowardsPlayer === 'Hostile' || c.stanceTowardsPlayer === 'At War');
  const mainRival = rivals.sort((a, b) => b.resources.militaryPower - a.resources.militaryPower)[0];

  // Military parity threat
  if (mainRival && mainRival.resources.militaryPower >= player.resources.militaryPower - 8) {
    decisions.push({
      id: 'mil-parity',
      icon: '⚔️',
      title: `${mainRival.name} reaches military parity`,
      detail: `They have ${mainRival.resources.militaryPower} vs your ${player.resources.militaryPower}. Invest in R&D or strike now.`,
      urgency: 'critical' as const,
      countryId: mainRival.id,
      suggestedAction: 'Research',
    });
  }

  // Nuclear threshold
  const nearNuclear = (state.nuclearPrograms ?? []).find(p =>
    p.progress >= 70 &&
    !state.countries.find(c => c.id === p.countryId)?.nuclearArmed
  );
  if (nearNuclear) {
    const nc = state.countries.find(c => c.id === nearNuclear.countryId);
    if (nc) {
      decisions.push({
        id: 'nuke-threshold',
        icon: '☢️',
        title: `${nc.name} is ${nearNuclear.progress.toFixed(0)}% toward nuclear`,
        detail: `An estimated ${Math.ceil((100 - nearNuclear.progress) / 5)} turns remain. The window to act is closing.`,
        urgency: nearNuclear.progress > 85 ? 'critical' as const : 'warn' as const,
        countryId: nc.id,
        suggestedAction: 'UN',
      });
    }
  }

  // Stability collapse risk
  if (player.resources.stability < 40) {
    decisions.push({
      id: 'stbl-low',
      icon: '🔥',
      title: `Domestic stability at ${player.resources.stability}%`,
      detail: `Below 0% ends your mandate. Reduce aggressive ops and build alliances.`,
      urgency: 'critical' as const,
    });
  }

  // Alliance window
  const ripeAlly = state.countries.find(c =>
    c.stanceTowardsPlayer === 'Friendly' &&
    c.resources.stability >= 50 &&
    c.id !== state.playerCountryId &&
    player.resources.influence >= 40
  );
  if (ripeAlly) {
    decisions.push({
      id: `ally-window-${ripeAlly.id}`,
      icon: '🤝',
      title: `${ripeAlly.flag} ${ripeAlly.name} is ready for alliance`,
      detail: `Stability ${ripeAlly.resources.stability}%, Friendly stance. 50 INF locks them in before rivals move.`,
      urgency: 'opportunity' as const,
      countryId: ripeAlly.id,
      suggestedAction: 'Alliance',
    });
  }

  // Tipping neutral being courted by rivals
  const tipping = state.countries.find(c =>
    c.stanceTowardsPlayer === 'Suspicious' &&
    c.resources.stability < 50 &&
    c.id !== state.playerCountryId
  );
  if (tipping) {
    decisions.push({
      id: `tipping-${tipping.id}`,
      icon: '📉',
      title: `${tipping.flag} ${tipping.name} drifting toward rivals`,
      detail: `Stability ${tipping.resources.stability}%, stance Suspicious. Aid now reverses the drift.`,
      urgency: 'warn' as const,
      countryId: tipping.id,
      suggestedAction: 'Aid',
    });
  }

  // World tension alert
  if ((state.worldTension ?? 0) >= 70) {
    decisions.push({
      id: 'high-tension',
      icon: '⚡',
      title: `World tension at ${state.worldTension} — crisis zone`,
      detail: `Trade deals and alliances reduce tension. War or strikes will push it past the breaking point.`,
      urgency: 'warn' as const,
    });
  }

  // Opportunity: rich neutral to trade with
  const tradeable = state.countries.find(c =>
    c.stanceTowardsPlayer === 'Neutral' &&
    c.resources.gdp > 5 &&
    player.resources.influence >= 10
  );
  if (tradeable && decisions.length < 4) {
    decisions.push({
      id: `trade-${tradeable.id}`,
      icon: '💰',
      title: `${tradeable.flag} ${tradeable.name} is open to trade`,
      detail: `$${tradeable.resources.gdp.toFixed(1)}T economy, neutral stance. A trade deal grows both economies.`,
      urgency: 'opportunity' as const,
      countryId: tradeable.id,
      suggestedAction: 'Trade',
    });
  }

  return decisions.slice(0, 4);
}
