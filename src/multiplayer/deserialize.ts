/**
 * Firebase Realtime Database silently converts JavaScript arrays into
 * numbered-key objects: [a, b, c] → { "0": a, "1": b, "2": c }.
 * Any call to .map()/.find()/.filter() on those objects crashes.
 *
 * This function converts every field that should be an array back to
 * an array before we hand the state to React.
 */

import { GameState } from '../types.ts';

/** Convert a Firebase value that might be an object-of-indices back to an array. */
function toArray<T>(val: unknown): T[] {
  if (!val) return [];
  if (Array.isArray(val)) return val as T[];
  if (typeof val === 'object') return Object.values(val) as T[];
  return [];
}

export function deserializeGameState(raw: unknown): GameState {
  const s = raw as Record<string, unknown>;

  // Fix top-level array fields
  const countries = toArray<GameState['countries'][0]>(s.countries).map(c => {
    const country = c as Record<string, unknown>;
    return {
      ...country,
      traits: toArray(country.traits),
    } as GameState['countries'][0];
  });

  const stocks = toArray<GameState['stocks'][0]>(s.stocks).map(st => {
    const stock = st as Record<string, unknown>;
    return {
      ...stock,
      priceHistory: toArray<number>(stock.priceHistory),
    } as GameState['stocks'][0];
  });

  return {
    ...(s as GameState),
    countries,
    stocks,
    portfolio:         toArray(s.portfolio),
    tweetFeed:         toArray(s.tweetFeed),
    history:           toArray(s.history),
    events:            toArray(s.events),
    newsLog:           toArray<string>(s.newsLog),
    actionHistory:     toArray(s.actionHistory),
    unlockedTechIds:   toArray<string>(s.unlockedTechIds),
    nuclearPrograms:   toArray(s.nuclearPrograms),
    spaceAchievements: toArray(s.spaceAchievements),
    regionalConflicts: toArray(s.regionalConflicts),
  };
}
