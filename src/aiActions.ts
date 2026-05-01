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

  // ── Bilateral: countries act against EACH OTHER, independent of player ──────
  processBilateralActions(countries, state, actions);

  return { updatedCountries: countries, actions };
}

// ─── Bilateral (country-vs-country) actions ───────────────────────────────────
// Each conflict pair has a chance to produce an incident every turn.
function processBilateralActions(countries: Country[], state: GameState, actions: AiCountryAction[]) {
  function find(id: string) { return countries.findIndex(c => c.id === id); }
  function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)); }

  // ── Russia → Ukraine (war) ────────────────────────────────────────────────
  const riIdx = find('russia'), ukIdx = find('ukraine');
  if (riIdx !== -1 && ukIdx !== -1 && Math.random() < 0.75) {
    const roll = Math.random();
    if (roll < 0.5) {
      countries[ukIdx].resources.stability = clamp(countries[ukIdx].resources.stability - 7, 0, 100);
      countries[ukIdx].resources.militaryPower = clamp(countries[ukIdx].resources.militaryPower - 5, 0, 200);
      countries[ukIdx].resources.gdp = Math.max(0.01, Number((countries[ukIdx].resources.gdp - 0.08).toFixed(2)));
      actions.push({ countryId: 'russia', countryName: 'Russia', targetCountryId: 'ukraine', targetCountryName: 'Ukraine', description: 'Launches renewed offensive operations in eastern Ukraine. Civilian infrastructure targeted.', hostile: false, isBilateral: true });
    } else {
      countries[ukIdx].resources.stability = clamp(countries[ukIdx].resources.stability - 4, 0, 100);
      countries[riIdx].resources.militaryPower = clamp(countries[riIdx].resources.militaryPower - 3, 0, 200);
      actions.push({ countryId: 'ukraine', countryName: 'Ukraine', targetCountryId: 'russia', targetCountryName: 'Russia', description: 'Conducts long-range drone strikes deep inside Russian territory. Moscow reports fires at oil depots.', hostile: false, isBilateral: true });
    }
  }

  // ── China → Taiwan (coercion) ─────────────────────────────────────────────
  const chIdx = find('china'), twIdx = find('taiwan');
  if (chIdx !== -1 && twIdx !== -1 && Math.random() < 0.55) {
    const roll = Math.random();
    if (roll < 0.45) {
      countries[twIdx].resources.stability = clamp(countries[twIdx].resources.stability - 5, 0, 100);
      actions.push({ countryId: 'china', countryName: 'China', targetCountryId: 'taiwan', targetCountryName: 'Taiwan', description: 'Conducts large-scale military exercises in the Taiwan Strait. 40 warplanes breach median line.', hostile: false, isBilateral: true });
    } else if (roll < 0.75) {
      countries[twIdx].resources.gdp = Math.max(0.01, Number((countries[twIdx].resources.gdp * 0.97).toFixed(2)));
      actions.push({ countryId: 'china', countryName: 'China', targetCountryId: 'taiwan', targetCountryName: 'Taiwan', description: 'Expands trade restrictions on Taiwanese goods. Economic coercion campaign intensifies.', hostile: false, isBilateral: true });
    } else {
      countries[twIdx].resources.militaryPower = clamp(countries[twIdx].resources.militaryPower + 3, 0, 200);
      actions.push({ countryId: 'taiwan', countryName: 'Taiwan', targetCountryId: 'china', targetCountryName: 'China', description: 'Activates emergency defense protocols in response to PLA provocations. Reservists mobilized.', hostile: false, isBilateral: true });
    }
  }

  // ── India ↔ Pakistan (Kashmir) ────────────────────────────────────────────
  const inIdx = find('india'), pkIdx = find('pakistan');
  if (inIdx !== -1 && pkIdx !== -1 && Math.random() < 0.45) {
    const roll = Math.random();
    if (roll < 0.50) {
      countries[inIdx].resources.stability = clamp(countries[inIdx].resources.stability - 2, 0, 100);
      countries[pkIdx].resources.stability = clamp(countries[pkIdx].resources.stability - 3, 0, 100);
      countries[inIdx].resources.militaryPower = clamp(countries[inIdx].resources.militaryPower - 1, 0, 200);
      countries[pkIdx].resources.militaryPower = clamp(countries[pkIdx].resources.militaryPower - 1, 0, 200);
      actions.push({ countryId: 'pakistan', countryName: 'Pakistan', targetCountryId: 'india', targetCountryName: 'India', description: 'Cross-border firing exchange along Line of Control in Kashmir. Both sides report casualties.', hostile: false, isBilateral: true });
    } else if (roll < 0.75) {
      countries[pkIdx].resources.stability = clamp(countries[pkIdx].resources.stability - 4, 0, 100);
      actions.push({ countryId: 'india', countryName: 'India', targetCountryId: 'pakistan', targetCountryName: 'Pakistan', description: 'Indian forces conduct surgical strike across LoC targeting militant launchpads in PoK.', hostile: false, isBilateral: true });
    } else {
      // Rare: both sides pull back from escalation
      countries[inIdx].resources.stability = clamp(countries[inIdx].resources.stability + 1, 0, 100);
      countries[pkIdx].resources.stability = clamp(countries[pkIdx].resources.stability + 1, 0, 100);
      actions.push({ countryId: 'india', countryName: 'India', targetCountryId: 'pakistan', targetCountryName: 'Pakistan', description: 'India-Pakistan hotline call de-escalates Kashmir tensions. Ceasefire holds for now.', hostile: false, isBilateral: true });
    }
  }

  // ── Iran ↔ Israel (proxy & direct) ────────────────────────────────────────
  const irIdx = find('iran'), isIdx = find('israel');
  if (irIdx !== -1 && isIdx !== -1 && Math.random() < 0.40) {
    const roll = Math.random();
    if (roll < 0.55) {
      countries[isIdx].resources.stability = clamp(countries[isIdx].resources.stability - 4, 0, 100);
      actions.push({ countryId: 'iran', countryName: 'Iran', targetCountryId: 'israel', targetCountryName: 'Israel', description: 'Iranian-backed Hezbollah fires rockets into northern Israel. Iron Dome intercepts most projectiles.', hostile: false, isBilateral: true });
    } else {
      countries[irIdx].resources.militaryPower = clamp(countries[irIdx].resources.militaryPower - 4, 0, 200);
      countries[irIdx].resources.stability = clamp(countries[irIdx].resources.stability - 3, 0, 100);
      actions.push({ countryId: 'israel', countryName: 'Israel', targetCountryId: 'iran', targetCountryName: 'Iran', description: 'Israeli air force strikes Iranian-linked weapons depot in Syria. Targeted facility destroyed.', hostile: false, isBilateral: true });
    }
  }

  // ── North Korea → South Korea / Japan (provocation) ──────────────────────
  const nkIdx = find('north-korea'), skIdx = find('south-korea'), jpIdx = find('japan');
  if (nkIdx !== -1 && Math.random() < 0.40) {
    const roll = Math.random();
    if (roll < 0.60) {
      if (skIdx !== -1) countries[skIdx].resources.stability = clamp(countries[skIdx].resources.stability - 3, 0, 100);
      if (jpIdx !== -1) countries[jpIdx].resources.stability = clamp(countries[jpIdx].resources.stability - 2, 0, 100);
      countries[nkIdx].resources.militaryPower = clamp(countries[nkIdx].resources.militaryPower + 2, 0, 200);
      actions.push({ countryId: 'north-korea', countryName: 'North Korea', description: 'Launches ballistic missile that flies over Japanese territorial waters before splashing in Pacific.', hostile: false, isBilateral: true });
    } else {
      if (skIdx !== -1) countries[skIdx].resources.stability = clamp(countries[skIdx].resources.stability - 4, 0, 100);
      actions.push({ countryId: 'north-korea', countryName: 'North Korea', description: 'Shells South Korean islands near disputed maritime boundary. Seoul emergency cabinet meets.', hostile: false, isBilateral: true });
    }
  }

  // ── Saudi Arabia ↔ Iran (proxy) ────────────────────────────────────────────
  const saIdx = find('saudi-arabia');
  if (saIdx !== -1 && irIdx !== -1 && Math.random() < 0.35) {
    const roll = Math.random();
    if (roll < 0.55) {
      countries[saIdx].resources.stability = clamp(countries[saIdx].resources.stability - 3, 0, 100);
      actions.push({ countryId: 'iran', countryName: 'Iran', targetCountryId: 'saudi-arabia', targetCountryName: 'Saudi Arabia', description: 'Houthi drone strike on Saudi oil infrastructure. Aramco production cut by 8% for two days.', hostile: false, isBilateral: true });
    } else {
      countries[irIdx].resources.stability = clamp(countries[irIdx].resources.stability - 2, 0, 100);
      actions.push({ countryId: 'saudi-arabia', countryName: 'Saudi Arabia', targetCountryId: 'iran', targetCountryName: 'Iran', description: 'Saudi-backed forces launch counter-offensive in Yemen against Iranian proxy forces.', hostile: false, isBilateral: true });
    }
  }

  // ── China → India (border provocation) ────────────────────────────────────
  if (chIdx !== -1 && inIdx !== -1 && Math.random() < 0.30) {
    countries[inIdx].resources.stability = clamp(countries[inIdx].resources.stability - 2, 0, 100);
    countries[inIdx].resources.militaryPower = clamp(countries[inIdx].resources.militaryPower - 1, 0, 200);
    actions.push({ countryId: 'china', countryName: 'China', targetCountryId: 'india', targetCountryName: 'India', description: 'PLA troops advance into disputed Himalayan territory. India deploys additional mountain brigades.', hostile: false, isBilateral: true });
  }
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
