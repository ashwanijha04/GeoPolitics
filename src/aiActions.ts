/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AiCountryAction, Country, DiplomaticStance, GameState } from './types.ts';

function shiftStance(stance: DiplomaticStance, direction: 'better' | 'worse'): DiplomaticStance {
  const order: DiplomaticStance[] = ['Ally', 'Friendly', 'Neutral', 'Suspicious', 'Hostile', 'At War'];
  const idx = order.indexOf(stance);
  if (direction === 'better') return order[Math.max(0, idx - 1)];
  return order[Math.min(order.length - 1, idx + 1)];
}

function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)); }

// Personality categories for AI behavior
type PersonalityType = 'nato-ally' | 'rival-superpower' | 'volatile-rogue' | 'pragmatic-neutral' | 'pariah' | 'rising-power' | 'resource-state' | 'war-state';

const PERSONALITIES: Record<string, PersonalityType> = {
  'usa':          'nato-ally',
  'uk':           'nato-ally',
  'eu':           'nato-ally',
  'japan':        'nato-ally',
  'south-korea':  'nato-ally',
  'australia':    'nato-ally',
  'israel':       'nato-ally',
  'china':        'rival-superpower',
  'russia':       'rival-superpower',
  'north-korea':  'pariah',
  'iran':         'volatile-rogue',
  'india':        'rising-power',
  'brazil':       'pragmatic-neutral',
  'indonesia':    'pragmatic-neutral',
  'turkey':       'pragmatic-neutral',
  'pakistan':     'volatile-rogue',
  'taiwan':       'nato-ally',
  'saudi-arabia': 'resource-state',
  'ukraine':      'war-state',
  'nigeria':      'resource-state',
};

export function runAiCountryActions(state: GameState): { updatedCountries: Country[]; actions: AiCountryAction[] } {
  const countries = state.countries.map(c => ({ ...c, resources: { ...c.resources } }));
  const actions: AiCountryAction[] = [];
  const playerIdx = countries.findIndex(c => c.id === state.playerCountryId);
  if (playerIdx === -1) return { updatedCountries: countries, actions };
  const player = countries[playerIdx];

  for (let i = 0; i < countries.length; i++) {
    const c = countries[i];
    if (c.id === state.playerCountryId) continue;

    const personality = PERSONALITIES[c.id] ?? 'pragmatic-neutral';
    const roll = Math.random();

    switch (personality) {
      case 'nato-ally':
        actAsNatoAlly(countries, i, player, roll, actions);
        break;
      case 'rival-superpower':
        actAsRivalSuperpower(countries, i, player, roll, actions, state);
        break;
      case 'volatile-rogue':
        actAsVolatileRogue(countries, i, player, roll, actions, state);
        break;
      case 'pragmatic-neutral':
        actAsPragmaticNeutral(countries, i, player, roll, actions, state);
        break;
      case 'pariah':
        actAsPariah(countries, i, player, roll, actions, state);
        break;
      case 'rising-power':
        actAsRisingPower(countries, i, player, roll, actions, state);
        break;
      case 'resource-state':
        actAsResourceState(countries, i, player, roll, actions, state);
        break;
      case 'war-state':
        actAsWarState(countries, i, player, roll, actions);
        break;
    }
  }

  return { updatedCountries: countries, actions };
}

function actAsNatoAlly(countries: Country[], idx: number, player: Country, roll: number, actions: AiCountryAction[]) {
  const c = countries[idx];
  const stance = c.stanceTowardsPlayer;

  if (stance === 'Ally') {
    if (roll < 0.45) {
      player.resources.gdp = Number((player.resources.gdp + 0.3).toFixed(2));
      c.resources.gdp = Number((c.resources.gdp + 0.15).toFixed(2));
      actions.push({ countryId: c.id, countryName: c.name, description: `Deepens trade integration with ${player.name} as formal allies, boosting both economies.`, hostile: false });
    } else if (roll < 0.75) {
      player.resources.science = clamp(player.resources.science + 14, 0, 9999);
      actions.push({ countryId: c.id, countryName: c.name, description: `Shares classified research data with ${player.name} through allied channels.`, hostile: false });
    } else {
      player.resources.influence = clamp(player.resources.influence + 5, 0, 100);
      actions.push({ countryId: c.id, countryName: c.name, description: `Publicly endorses ${player.name}'s position at the UN Security Council.`, hostile: false });
    }
  } else if (stance === 'Friendly') {
    if (roll < 0.50) {
      player.resources.gdp = Number((player.resources.gdp + 0.2).toFixed(2));
      c.resources.gdp = Number((c.resources.gdp + 0.1).toFixed(2));
      actions.push({ countryId: c.id, countryName: c.name, description: `Expands bilateral trade framework with ${player.name}.`, hostile: false });
    } else {
      countries[idx].stanceTowardsPlayer = shiftStance(stance, 'better');
      actions.push({ countryId: c.id, countryName: c.name, description: `Signals readiness to formalize ties with ${player.name} — an alliance is within reach.`, hostile: false });
    }
  } else {
    if (roll < 0.35) {
      countries[idx].stanceTowardsPlayer = shiftStance(stance, 'better');
      actions.push({ countryId: c.id, countryName: c.name, description: `Opens diplomatic dialogue with ${player.name}, improving bilateral relations.`, hostile: false });
    } else {
      c.resources.stability = clamp(c.resources.stability + 2, 0, 100);
      actions.push({ countryId: c.id, countryName: c.name, description: `Pursues internal consolidation while maintaining watchful neutrality.`, hostile: false });
    }
  }
}

function actAsRivalSuperpower(countries: Country[], idx: number, player: Country, roll: number, actions: AiCountryAction[], state: GameState) {
  const c = countries[idx];

  if (roll < 0.28) {
    player.resources.gdp = Math.max(0.1, Number((player.resources.gdp * 0.97).toFixed(2)));
    c.resources.influence = clamp(c.resources.influence + 5, 0, 100);
    actions.push({ countryId: c.id, countryName: c.name, description: `Coordinates a global economic bloc to restrict ${player.name}'s trade access. GDP contracts.`, hostile: true });
  } else if (roll < 0.52) {
    c.resources.militaryPower = clamp(c.resources.militaryPower + 7, 0, 120);
    actions.push({ countryId: c.id, countryName: c.name, description: `Announces record defense appropriations. Military power grows.`, hostile: true });
  } else if (roll < 0.72) {
    player.resources.stability = clamp(player.resources.stability - 4, 0, 100);
    player.resources.influence = clamp(player.resources.influence - 5, 0, 100);
    actions.push({ countryId: c.id, countryName: c.name, description: `Intelligence operatives execute infrastructure disruption campaign in ${player.name}. Stability and influence fall.`, hostile: true });
  } else {
    // Diplomatic offensive — woo a neutral
    const target = countries.find(ct =>
      ct.id !== state.playerCountryId && ct.id !== c.id &&
      ct.stanceTowardsPlayer !== 'Ally' && ct.stanceTowardsPlayer !== 'Hostile' && ct.stanceTowardsPlayer !== 'At War'
    );
    if (target) {
      const tIdx = countries.findIndex(ct => ct.id === target.id);
      countries[tIdx].stanceTowardsPlayer = shiftStance(target.stanceTowardsPlayer, 'worse');
      c.resources.influence = clamp(c.resources.influence + 8, 0, 100);
      actions.push({ countryId: c.id, countryName: c.name, description: `Offers economic partnership to ${target.name}, pulling them out of ${player.name}'s orbit.`, hostile: true });
    } else {
      c.resources.militaryPower = clamp(c.resources.militaryPower + 4, 0, 120);
      actions.push({ countryId: c.id, countryName: c.name, description: `Escalates military exercises and forward deployments near contested regions.`, hostile: true });
    }
  }

  // Bonus escalation: direct military action if superpower parity achieved
  if (c.resources.militaryPower >= 98 && c.resources.militaryPower >= player.resources.militaryPower - 5 && Math.random() < 0.20) {
    player.resources.militaryPower = clamp(player.resources.militaryPower - 8, 0, 200);
    player.resources.stability = clamp(player.resources.stability - 5, 0, 100);
    actions.push({ countryId: c.id, countryName: c.name, description: `Conducts forward military operations against ${player.name}'s strategic assets. Forces take damage.`, hostile: true });
  }
}

function actAsVolatileRogue(countries: Country[], idx: number, player: Country, roll: number, actions: AiCountryAction[], state: GameState) {
  const c = countries[idx];
  const isHostile = c.stanceTowardsPlayer === 'Hostile' || c.stanceTowardsPlayer === 'At War' || c.stanceTowardsPlayer === 'Suspicious';

  if (isHostile) {
    if (roll < 0.40) {
      player.resources.stability = clamp(player.resources.stability - 3, 0, 100);
      player.resources.influence = clamp(player.resources.influence - 4, 0, 100);
      actions.push({ countryId: c.id, countryName: c.name, description: `Proxy networks and disinformation campaigns create unrest inside ${player.name}.`, hostile: true });
    } else if (roll < 0.65) {
      c.resources.militaryPower = clamp(c.resources.militaryPower + 5, 0, 100);
      c.resources.science = clamp(c.resources.science + 8, 0, 9999);
      actions.push({ countryId: c.id, countryName: c.name, description: `Accelerates its weapons program in direct defiance of international pressure.`, hostile: true });
    } else if (roll < 0.80) {
      // Seek allies among hostile nations
      const rivalIdx = countries.findIndex(ct => ct.stanceTowardsPlayer === 'Hostile' && ct.id !== c.id && ct.id !== state.playerCountryId);
      if (rivalIdx !== -1) {
        countries[rivalIdx].resources.influence = clamp(countries[rivalIdx].resources.influence + 6, 0, 100);
        actions.push({ countryId: c.id, countryName: c.name, description: `Forms covert strategic partnership with other hostile states against ${player.name}.`, hostile: true });
      } else {
        c.resources.militaryPower = clamp(c.resources.militaryPower + 4, 0, 100);
        actions.push({ countryId: c.id, countryName: c.name, description: `Doubles down on military self-sufficiency amid international isolation.`, hostile: true });
      }
    } else {
      c.resources.stability = clamp(c.resources.stability - 4, 0, 100);
      actions.push({ countryId: c.id, countryName: c.name, description: `Faces internal unrest as economic pressure and international isolation mount.`, hostile: false });
    }
  } else {
    // Cautious engagement
    if (roll < 0.40) {
      c.resources.stability = clamp(c.resources.stability + 4, 0, 100);
      c.resources.gdp = Number((c.resources.gdp + 0.05).toFixed(2));
      actions.push({ countryId: c.id, countryName: c.name, description: `Pursues internal economic stabilization, improving conditions at home.`, hostile: false });
    } else if (roll < 0.65) {
      player.resources.gdp = Number((player.resources.gdp + 0.08).toFixed(2));
      c.resources.gdp = Number((c.resources.gdp + 0.1).toFixed(2));
      actions.push({ countryId: c.id, countryName: c.name, description: `Expands limited economic exchanges with ${player.name}, a tentative opening.`, hostile: false });
    } else {
      c.resources.militaryPower = clamp(c.resources.militaryPower + 4, 0, 100);
      c.resources.science = clamp(c.resources.science + 6, 0, 9999);
      actions.push({ countryId: c.id, countryName: c.name, description: `Continues weapons and science programs regardless of diplomatic status.`, hostile: false });
    }
  }
}

function actAsPragmaticNeutral(countries: Country[], idx: number, player: Country, roll: number, actions: AiCountryAction[], state: GameState) {
  const c = countries[idx];

  if (roll < 0.22) {
    // Trade with the most powerful hostile (self-interest)
    const rivalIdx = countries.findIndex(ct => (ct.stanceTowardsPlayer === 'Hostile' || ct.stanceTowardsPlayer === 'At War') && ct.id !== state.playerCountryId);
    if (rivalIdx !== -1) {
      countries[rivalIdx].resources.gdp = Number((countries[rivalIdx].resources.gdp + 0.35).toFixed(2));
      c.resources.gdp = Number((c.resources.gdp + 0.25).toFixed(2));
      actions.push({ countryId: c.id, countryName: c.name, description: `Signs profitable trade agreements with ${countries[rivalIdx].name}, growing a rival power's economy.`, hostile: true });
    }
  } else if (roll < 0.45) {
    c.resources.science = clamp(c.resources.science + 15, 0, 9999);
    c.resources.gdp = Number((c.resources.gdp + 0.1).toFixed(2));
    actions.push({ countryId: c.id, countryName: c.name, description: `Focuses on domestic development, growing the economy and investing in technology.`, hostile: false });
  } else if (roll < 0.70) {
    if (c.stanceTowardsPlayer !== 'Ally') {
      countries[idx].stanceTowardsPlayer = shiftStance(c.stanceTowardsPlayer, 'better');
      actions.push({ countryId: c.id, countryName: c.name, description: `Signals interest in expanded engagement with ${player.name}, cautiously improving ties.`, hostile: false });
    } else {
      player.resources.gdp = Number((player.resources.gdp + 0.2).toFixed(2));
      c.resources.gdp = Number((c.resources.gdp + 0.2).toFixed(2));
      actions.push({ countryId: c.id, countryName: c.name, description: `Deepens trade as allies, generating shared prosperity.`, hostile: false });
    }
  } else {
    player.resources.gdp = Number((player.resources.gdp + 0.12).toFixed(2));
    c.resources.gdp = Number((c.resources.gdp + 0.12).toFixed(2));
    actions.push({ countryId: c.id, countryName: c.name, description: `Pursues balanced trade with ${player.name}, the pragmatic mutual-gain choice.`, hostile: false });
  }
}

function actAsPariah(countries: Country[], idx: number, player: Country, roll: number, actions: AiCountryAction[], state: GameState) {
  const c = countries[idx];

  if (roll < 0.40) {
    c.resources.militaryPower = clamp(c.resources.militaryPower + 6, 0, 100);
    c.resources.science = clamp(c.resources.science + 5, 0, 9999);
    actions.push({ countryId: c.id, countryName: c.name, description: `Continues weapons development program, prioritizing military power above all else.`, hostile: true });
  } else if (roll < 0.60) {
    player.resources.stability = clamp(player.resources.stability - 3, 0, 100);
    actions.push({ countryId: c.id, countryName: c.name, description: `Conducts provocative military test, sending a destabilizing message to the region.`, hostile: true });
  } else if (roll < 0.78) {
    const allyIdx = countries.findIndex(ct => ct.stanceTowardsPlayer === 'Hostile' && ct.id !== c.id && ct.id !== state.playerCountryId);
    if (allyIdx !== -1) {
      countries[allyIdx].resources.militaryPower = clamp(countries[allyIdx].resources.militaryPower + 4, 0, 120);
      actions.push({ countryId: c.id, countryName: c.name, description: `Provides weapons and technical assistance to hostile states, strengthening the anti-${player.name} coalition.`, hostile: true });
    } else {
      c.resources.militaryPower = clamp(c.resources.militaryPower + 5, 0, 100);
      actions.push({ countryId: c.id, countryName: c.name, description: `Pushes weapons program forward in complete defiance of international sanctions.`, hostile: true });
    }
  } else {
    c.resources.stability = clamp(c.resources.stability - 5, 0, 100);
    actions.push({ countryId: c.id, countryName: c.name, description: `Faces mounting internal food shortages and economic collapse under sanctions.`, hostile: false });
  }
}

function actAsRisingPower(countries: Country[], idx: number, player: Country, roll: number, actions: AiCountryAction[], state: GameState) {
  const c = countries[idx];

  if (roll < 0.28) {
    c.resources.science = clamp(c.resources.science + 18, 0, 9999);
    c.resources.gdp = Number((c.resources.gdp + 0.12).toFixed(2));
    actions.push({ countryId: c.id, countryName: c.name, description: `Launches major domestic technology and infrastructure initiative, cementing long-term power.`, hostile: false });
  } else if (roll < 0.52) {
    player.resources.gdp = Number((player.resources.gdp + 0.15).toFixed(2));
    c.resources.gdp = Number((c.resources.gdp + 0.15).toFixed(2));
    actions.push({ countryId: c.id, countryName: c.name, description: `Expands trade framework with ${player.name} — mutual economic growth, independent of blocs.`, hostile: false });
  } else if (roll < 0.72) {
    if (c.stanceTowardsPlayer !== 'Ally') {
      countries[idx].stanceTowardsPlayer = shiftStance(c.stanceTowardsPlayer, 'better');
      actions.push({ countryId: c.id, countryName: c.name, description: `Signals strategic interest in closer ties with ${player.name}, consistent with multi-alignment doctrine.`, hostile: false });
    } else {
      player.resources.influence = clamp(player.resources.influence + 5, 0, 100);
      c.resources.influence = clamp(c.resources.influence + 5, 0, 100);
      actions.push({ countryId: c.id, countryName: c.name, description: `Jointly promotes a new multilateral framework with ${player.name}, elevating both nations' standing.`, hostile: false });
    }
  } else {
    // Also engage with rivals for leverage
    const rivalIdx = countries.findIndex(ct => (ct.stanceTowardsPlayer === 'Hostile') && ct.id !== state.playerCountryId);
    if (rivalIdx !== -1 && Math.random() < 0.4) {
      countries[rivalIdx].resources.gdp = Number((countries[rivalIdx].resources.gdp + 0.2).toFixed(2));
      c.resources.gdp = Number((c.resources.gdp + 0.1).toFixed(2));
      actions.push({ countryId: c.id, countryName: c.name, description: `Diversifies partnerships by engaging with ${countries[rivalIdx].name} — strategic autonomy maintained at all costs.`, hostile: true });
    } else {
      c.resources.stability = clamp(c.resources.stability + 3, 0, 100);
      actions.push({ countryId: c.id, countryName: c.name, description: `Focuses on domestic consolidation, strengthening the foundation for long-term rise.`, hostile: false });
    }
  }
}

function actAsResourceState(countries: Country[], idx: number, player: Country, roll: number, actions: AiCountryAction[], state: GameState) {
  const c = countries[idx];

  if (roll < 0.35) {
    c.resources.gdp = Number((c.resources.gdp + 0.15).toFixed(2));
    c.resources.science = clamp(c.resources.science + 5, 0, 9999);
    actions.push({ countryId: c.id, countryName: c.name, description: `Executes resource extraction expansion and economic diversification programs.`, hostile: false });
  } else if (roll < 0.58) {
    player.resources.gdp = Number((player.resources.gdp + 0.12).toFixed(2));
    c.resources.gdp = Number((c.resources.gdp + 0.18).toFixed(2));
    actions.push({ countryId: c.id, countryName: c.name, description: `Expands resource export agreements with ${player.name}, enriching both nations.`, hostile: false });
  } else if (roll < 0.78) {
    if (c.stanceTowardsPlayer !== 'Ally') {
      countries[idx].stanceTowardsPlayer = shiftStance(c.stanceTowardsPlayer, 'better');
      actions.push({ countryId: c.id, countryName: c.name, description: `Signals openness to deeper economic partnership with ${player.name} in exchange for security guarantees.`, hostile: false });
    } else {
      player.resources.influence = clamp(player.resources.influence + 4, 0, 100);
      actions.push({ countryId: c.id, countryName: c.name, description: `Leverages resource wealth to support ${player.name}'s diplomatic agenda in multilateral forums.`, hostile: false });
    }
  } else {
    // Play rivals against each other
    const rivalIdx = countries.findIndex(ct => (ct.stanceTowardsPlayer === 'Hostile') && ct.id !== state.playerCountryId);
    if (rivalIdx !== -1 && Math.random() < 0.45) {
      countries[rivalIdx].resources.gdp = Number((countries[rivalIdx].resources.gdp + 0.2).toFixed(2));
      c.resources.gdp = Number((c.resources.gdp + 0.1).toFixed(2));
      actions.push({ countryId: c.id, countryName: c.name, description: `Sells strategic resources to ${countries[rivalIdx].name}, playing both sides for maximum economic leverage.`, hostile: true });
    } else {
      c.resources.stability = clamp(c.resources.stability + 3, 0, 100);
      c.resources.militaryPower = clamp(c.resources.militaryPower + 2, 0, 100);
      actions.push({ countryId: c.id, countryName: c.name, description: `Invests resource windfall in domestic security and modernization programs.`, hostile: false });
    }
  }
}

function actAsWarState(countries: Country[], idx: number, player: Country, roll: number, actions: AiCountryAction[]) {
  const c = countries[idx];

  if (c.stanceTowardsPlayer === 'Friendly' || c.stanceTowardsPlayer === 'Ally') {
    if (roll < 0.45) {
      player.resources.influence = clamp(player.resources.influence + 4, 0, 100);
      c.resources.militaryPower = clamp(c.resources.militaryPower + 3, 0, 100);
      actions.push({ countryId: c.id, countryName: c.name, description: `Appeals to ${player.name} and the international community for continued support, rallying global sympathy.`, hostile: false });
    } else if (roll < 0.75) {
      c.resources.science = clamp(c.resources.science + 8, 0, 9999);
      c.resources.militaryPower = clamp(c.resources.militaryPower + 4, 0, 100);
      actions.push({ countryId: c.id, countryName: c.name, description: `Deploys improvised military innovations on the front lines. Battlefield technology rapidly evolves.`, hostile: false });
    } else {
      c.resources.stability = clamp(c.resources.stability + 3, 0, 100);
      actions.push({ countryId: c.id, countryName: c.name, description: `Demonstrates remarkable civilian resilience despite active conflict, maintaining national cohesion.`, hostile: false });
    }
  } else {
    // Struggling alone
    c.resources.stability = clamp(c.resources.stability - 3, 0, 100);
    c.resources.gdp = Math.max(0.01, Number((c.resources.gdp - 0.05).toFixed(2)));
    actions.push({ countryId: c.id, countryName: c.name, description: `Faces continued war losses without adequate international support. Conditions deteriorate.`, hostile: false });
  }
}
