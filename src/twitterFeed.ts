/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GameState, Tweet, ActionType } from './types.ts';
import {
  LEADERS,
  TRADE_TWEETS, AID_TWEETS, ALLIANCE_TWEETS, SANCTION_TWEETS,
  WAR_TWEETS, INTEL_TWEETS, PROPAGANDA_TWEETS, MILITARY_TWEETS,
  RESEARCH_TWEETS, AMBIENT_TWEETS, INTEL_HINT_TEMPLATES,
} from './leaders.ts';

let _tweetIdCounter = 0;
function makeId() { return `tw_${++_tweetIdCounter}_${Math.random().toString(36).slice(2, 7)}`; }

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

function fmt(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? `[${k}]`);
}

function makeLikes() { return Math.floor(Math.random() * 80000) + 200; }
function makeRetweets() { return Math.floor(Math.random() * 25000) + 50; }

function tweet(
  countryId: string,
  content: string,
  turn: number,
  tone: Tweet['tone'],
  isClassified = false,
): Tweet {
  const leader = LEADERS[countryId];
  const country = { flag: '🌐', name: countryId }; // fallback
  return {
    id: makeId(),
    turn,
    countryId,
    leaderName: leader?.name ?? countryId,
    leaderHandle: leader?.handle ?? `@${countryId}`,
    flag: '🌐', // will be filled from countries array at render time
    content,
    likes: isClassified ? 0 : makeLikes(),
    retweets: isClassified ? 0 : makeRetweets(),
    tone,
    isClassified,
  };
}

// ─── Action-triggered tweets ─────────────────────────────────────────────────

export function generateActionTweets(
  state: GameState,
  action: ActionType,
  targetId: string,
  success: boolean,
): Tweet[] {
  if (!success) return [];
  const results: Tweet[] = [];
  const t = state.turn;
  const player = state.countries.find(c => c.id === state.playerCountryId);
  const target = state.countries.find(c => c.id === targetId);
  if (!player || !target) return results;

  const pName = player.name;
  const tName = target.name;
  const vars = { player: pName, target: tName, name: player.name };

  // Observers: 2 most relevant non-player, non-target countries
  const observers = state.countries
    .filter(c => c.id !== state.playerCountryId && c.id !== targetId)
    .sort((a, b) => {
      // Prioritize hostile and friendly over neutral
      const priority = (s: string) => s === 'Hostile' || s === 'At War' ? 2 : s === 'Ally' || s === 'Friendly' ? 1 : 0;
      return priority(b.stanceTowardsPlayer) - priority(a.stanceTowardsPlayer);
    })
    .slice(0, 2);

  switch (action) {
    case 'Trade': {
      results.push(tweet(targetId, fmt(pick(TRADE_TWEETS.target_positive), vars), t, 'praise'));
      for (const obs of observers) {
        const isHostile = obs.stanceTowardsPlayer === 'Hostile' || obs.stanceTowardsPlayer === 'At War';
        const pool = isHostile ? TRADE_TWEETS.observer_hostile : TRADE_TWEETS.observer_friendly;
        results.push(tweet(obs.id, fmt(pick(pool), vars), t, isHostile ? 'threat' : 'praise'));
      }
      break;
    }
    case 'Aid': {
      results.push(tweet(targetId, fmt(pick(AID_TWEETS.target_positive), vars), t, 'praise'));
      const hostile = observers.find(o => o.stanceTowardsPlayer === 'Hostile' || o.stanceTowardsPlayer === 'At War');
      if (hostile) results.push(tweet(hostile.id, fmt(pick(AID_TWEETS.observer_hostile), vars), t, 'threat'));
      break;
    }
    case 'Alliance': {
      results.push(tweet(targetId, fmt(pick(ALLIANCE_TWEETS.target_positive), vars), t, 'praise'));
      const hostiles = observers.filter(o => o.stanceTowardsPlayer === 'Hostile' || o.stanceTowardsPlayer === 'Suspicious');
      for (const h of hostiles.slice(0, 2)) {
        results.push(tweet(h.id, fmt(pick(ALLIANCE_TWEETS.observer_hostile), vars), t, 'threat'));
      }
      break;
    }
    case 'Sanction': {
      results.push(tweet(targetId, fmt(pick(SANCTION_TWEETS.target), vars), t, 'threat'));
      const ally = state.countries.find(c =>
        c.id !== state.playerCountryId && c.id !== targetId &&
        (c.stanceTowardsPlayer === 'Hostile' || c.stanceTowardsPlayer === 'Suspicious')
      );
      if (ally) results.push(tweet(ally.id, fmt(pick(SANCTION_TWEETS.observer_hostile), vars), t, 'threat'));
      const friend = state.countries.find(c =>
        c.id !== state.playerCountryId && c.id !== targetId &&
        (c.stanceTowardsPlayer === 'Ally' || c.stanceTowardsPlayer === 'Friendly')
      );
      if (friend) results.push(tweet(friend.id, fmt(pick(SANCTION_TWEETS.observer_friendly), vars), t, 'praise'));
      break;
    }
    case 'War': {
      results.push(tweet(targetId, fmt(pick(WAR_TWEETS.target), vars), t, 'threat'));
      const condemners = state.countries
        .filter(c => c.id !== state.playerCountryId && c.id !== targetId && (c.stanceTowardsPlayer === 'Hostile' || c.stanceTowardsPlayer === 'Suspicious'))
        .slice(0, 2);
      for (const c of condemners) {
        results.push(tweet(c.id, fmt(pick(WAR_TWEETS.observer_condemn), vars), t, 'threat'));
      }
      const supporter = state.countries.find(c =>
        c.id !== state.playerCountryId && c.id !== targetId &&
        (c.stanceTowardsPlayer === 'Ally')
      );
      if (supporter) results.push(tweet(supporter.id, fmt(pick(WAR_TWEETS.observer_support), vars), t, 'praise'));
      break;
    }
    case 'Military': {
      results.push(tweet(targetId, fmt(pick(MILITARY_TWEETS.target), vars), t, 'threat'));
      const con = observers.find(o => o.stanceTowardsPlayer === 'Hostile');
      if (con) results.push(tweet(con.id, fmt(pick(MILITARY_TWEETS.observer_condemn), vars), t, 'threat'));
      break;
    }
    case 'Intel': {
      results.push(tweet(targetId, fmt(pick(INTEL_TWEETS.target), vars), t, 'warning'));
      break;
    }
    case 'Propaganda': {
      results.push(tweet(targetId, fmt(pick(PROPAGANDA_TWEETS.target), vars), t, 'warning'));
      break;
    }
    case 'Research': {
      results.push(tweet(state.playerCountryId, fmt(pick(RESEARCH_TWEETS.announcer), { ...vars, name: pName }), t, 'event'));
      const rival = state.countries.find(c =>
        c.id !== state.playerCountryId && (c.stanceTowardsPlayer === 'Hostile' || c.stanceTowardsPlayer === 'At War')
      );
      if (rival) results.push(tweet(rival.id, fmt(pick(RESEARCH_TWEETS.observer_rival), vars), t, 'warning'));
      break;
    }
    case 'ArmsTrade': {
      results.push(tweet(state.playerCountryId,
        `Arms export contract signed with ${tName}. Strategic partnership deepens as our defense industry delivers. 💰`,
        t, 'event'));
      const rival = state.countries.find(c =>
        c.id !== state.playerCountryId && (c.stanceTowardsPlayer === 'Hostile')
      );
      if (rival) results.push(tweet(rival.id,
        `${pName}'s arms sale to ${tName} escalates regional militarization. This will not go unanswered.`,
        t, 'threat'));
      break;
    }
  }

  return results;
}

// ─── Per-turn AI action tweets ────────────────────────────────────────────────

export function generateTurnTweets(
  state: GameState,
  aiActionDescriptions: string[],
): Tweet[] {
  const results: Tweet[] = [];
  const t = state.turn;
  const player = state.countries.find(c => c.id === state.playerCountryId);
  if (!player) return results;

  // 1-2 ambient leader tweets from random countries
  const candidates = state.countries.filter(c => c.id !== state.playerCountryId);
  const shuffled = [...candidates].sort(() => Math.random() - 0.5).slice(0, 2);

  for (const country of shuffled) {
    // Ambient style key: "{id}-{style}"
    const leader = LEADERS[country.id];
    if (!leader) continue;
    const styleKey = `${country.id}-${leader.style}`;
    const pool = AMBIENT_TWEETS[styleKey];
    if (pool && Math.random() < 0.55) {
      const base = pick(pool);
      results.push(tweet(country.id, base, t, country.stanceTowardsPlayer === 'Hostile' ? 'threat' : 'neutral'));
    }
  }

  // AI action summary tweet from most active hostile country
  const hostile = state.countries.find(c =>
    c.id !== state.playerCountryId && (c.stanceTowardsPlayer === 'Hostile' || c.stanceTowardsPlayer === 'At War')
  );
  if (hostile && aiActionDescriptions.length > 0 && Math.random() < 0.6) {
    const action = aiActionDescriptions.find(d => d.includes(hostile.name)) ?? aiActionDescriptions[0];
    const shortAction = action.length > 100 ? action.slice(0, 97) + '…' : action;
    results.push(tweet(hostile.id,
      `Our strategic measures continue. ${shortAction}`,
      t, 'threat'));
  }

  return results;
}

// ─── Intel hints ─────────────────────────────────────────────────────────────

export function generateIntelHints(state: GameState): Tweet[] {
  const hints: Tweet[] = [];
  const t = state.turn;
  const player = state.countries.find(c => c.id === state.playerCountryId);
  if (!player) return hints;

  const hostiles = state.countries.filter(c =>
    c.id !== state.playerCountryId && (c.stanceTowardsPlayer === 'Hostile' || c.stanceTowardsPlayer === 'At War')
  );

  // Rival military rising
  for (const rival of hostiles) {
    if (rival.resources.militaryPower >= player.resources.militaryPower - 10 && Math.random() < 0.6) {
      hints.push(tweet('__intel__',
        INTEL_HINT_TEMPLATES.rival_military_rising(rival.name, rival.resources.militaryPower, player.resources.militaryPower),
        t, 'intel', true));
      break;
    }
  }

  // Tipping country — low stability neutral
  const tipping = state.countries.find(c =>
    c.id !== state.playerCountryId &&
    c.resources.stability < 55 &&
    c.stanceTowardsPlayer !== 'Ally' &&
    Math.random() < 0.5
  );
  if (tipping) {
    hints.push(tweet('__intel__',
      INTEL_HINT_TEMPLATES.country_tipping(tipping.name, tipping.resources.stability),
      t, 'intel', true));
  }

  // Grudger warning
  const grudger = state.countries.find(c => {
    const leader = LEADERS[c.id];
    return leader?.strategy === 'grudger' && c.stanceTowardsPlayer !== 'Hostile' && c.id !== state.playerCountryId && Math.random() < 0.35;
  });
  if (grudger) {
    hints.push(tweet('__intel__',
      INTEL_HINT_TEMPLATES.grudger_memory(grudger.name),
      t, 'intel', true));
  }

  // Alliance window
  const ripe = state.countries.find(c =>
    c.id !== state.playerCountryId &&
    c.stanceTowardsPlayer === 'Friendly' &&
    c.resources.stability >= 55 &&
    player.resources.influence >= 40 &&
    Math.random() < 0.55
  );
  if (ripe) {
    hints.push(tweet('__intel__',
      INTEL_HINT_TEMPLATES.alliance_window(ripe.name, ripe.resources.stability, player.resources.influence),
      t, 'intel', true));
  }

  // Nuclear threshold warning
  const nearNuclear = state.countries.find(c =>
    c.id !== state.playerCountryId &&
    !c.nuclearArmed &&
    c.resources.science >= 130 &&
    (c.stanceTowardsPlayer === 'Hostile' || c.stanceTowardsPlayer === 'Suspicious') &&
    Math.random() < 0.5
  );
  if (nearNuclear) {
    hints.push(tweet('__intel__',
      INTEL_HINT_TEMPLATES.nuclear_threshold(nearNuclear.name, nearNuclear.resources.science),
      t, 'intel', true));
  }

  // Exploiter behavior warning
  const exploiter = state.countries.find(c => {
    const leader = LEADERS[c.id];
    return leader?.strategy === 'exploiter' &&
      c.stanceTowardsPlayer === 'Friendly' &&
      c.id !== state.playerCountryId &&
      Math.random() < 0.3;
  });
  if (exploiter) {
    hints.push(tweet('__intel__',
      INTEL_HINT_TEMPLATES.exploit_weakness(exploiter.name),
      t, 'intel', true));
  }

  // Tit-for-tat reset opportunity
  const tatCountry = state.countries.find(c => {
    const leader = LEADERS[c.id];
    return leader?.strategy === 'tit-for-tat' &&
      c.stanceTowardsPlayer === 'Suspicious' &&
      c.id !== state.playerCountryId &&
      Math.random() < 0.4;
  });
  if (tatCountry) {
    hints.push(tweet('__intel__',
      INTEL_HINT_TEMPLATES.tit_for_tat_signal(tatCountry.name),
      t, 'intel', true));
  }

  return hints.slice(0, 2); // max 2 hints per turn
}
