/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ResourceSet {
  gdp: number; // in trillions
  stability: number; // 0-100
  militaryPower: number; // 0-100
  influence: number; // 0-100
  population: number; // in millions
  science: number; // 0-1000
}

export type DiplomaticStance = 'Ally' | 'Friendly' | 'Neutral' | 'Suspicious' | 'Hostile' | 'At War';

export interface Trait {
  name: string;
  description: string;
}

export type Difficulty = 'Easy' | 'Medium' | 'Hard' | 'Extreme';

export interface Country {
  id: string;
  name: string;
  flag: string;
  region: string;
  resources: ResourceSet;
  alignment: 'Neutral' | 'Player-Aligned' | 'Rival-Aligned';
  stanceTowardsPlayer: DiplomaticStance;
  description: string;
  traits: Trait[];
  difficulty: Difficulty;
  nuclearArmed: boolean;
}

export interface GameEvent {
  id: string;
  turn: number;
  title: string;
  description: string;
  impactedCountryId?: string;
  resource?: keyof ResourceSet;
  valueChange?: number;
  impacts: {
    countryId: string;
    resource: keyof ResourceSet;
    value: number;
  }[];
  type: 'Global' | 'Regional' | 'Domestic';
}

export type ActionType = 'Trade' | 'Aid' | 'Intel' | 'Sanction' | 'Military' | 'Alliance' | 'War' | 'Propaganda' | 'Research' | 'ArmsTrade' | 'UnlockTech' | 'UN';

export type TechCategory = 'Military' | 'Economy' | 'Diplomacy' | 'Intelligence';

export interface TechNode {
  id: string;
  name: string;
  description: string;
  cost: number;
  category: TechCategory;
  dependencies: string[];
  impact: {
    resource: keyof ResourceSet;
    multiplier: number;
  };
}

export interface ActionImpact {
  resource: keyof ResourceSet;
  value: number;
}
export interface GameActionRecord {
  turn: number;
  countryName: string;
  action: ActionType;
  message: string;
}

export type GameOutcome =
  | { kind: 'Dominance' }
  | { kind: 'Prosperity' }
  | { kind: 'Peace' }
  | { kind: 'Collapse'; reason: string }
  | { kind: 'Defeated'; reason: string };

export interface HistoryPoint {
  turn: number;
  gdp: number;
  stability: number;
  militaryPower: number;
  influence: number;
  science: number;
}

export interface AiCountryAction {
  countryId: string;
  countryName: string;
  description: string;
  hostile: boolean;
  targetCountryId?: string;   // set when two non-player countries clash
  targetCountryName?: string;
  isBilateral?: boolean;      // country-vs-country, not vs player
}

export interface NuclearProgram {
  countryId: string;
  progress: number;     // 0–100; hits 100 = goes nuclear
  detected: boolean;    // revealed by Intel Op
}

export type SpaceMilestone = 'satellite' | 'moon' | 'station' | 'mars';
export interface SpaceAchievement {
  countryId: string;
  milestone: SpaceMilestone;
  turn: number;
}

export interface RegionalConflict {
  id: string;
  countryAId: string;
  countryBId: string;
  name: string;
  intensity: number;  // 0–100; higher = worse drain each turn
}

export interface TurnRecap {
  turn: number;
  eventTitle: string;
  eventDescription: string;
  eventResource?: keyof ResourceSet;
  eventValueChange?: number;
  eventTargetId?: string;
  playerBefore: ResourceSet;
  playerAfter: ResourceSet;
  aiActions: AiCountryAction[];
}

export type GameTheoryStrategy =
  | 'always-defect' | 'grudger' | 'tit-for-tat' | 'tit-for-tat-forgiving'
  | 'exploiter' | 'win-stay-lose-switch' | 'cooperative' | 'random';

export interface Tweet {
  id: string;
  turn: number;
  countryId: string;
  leaderName: string;
  leaderHandle: string;
  flag: string;
  content: string;
  likes: number;
  retweets: number;
  tone: 'threat' | 'praise' | 'neutral' | 'intel' | 'warning' | 'event';
  isClassified?: boolean;
}

export type StockSector = 'Tech' | 'Energy' | 'Defense' | 'Finance' | 'Auto' | 'Materials' | 'Pharma' | 'Consumer';

export interface Stock {
  ticker: string;
  name: string;
  countryId: string;
  sector: StockSector;
  marketCap: number;      // current value, trillions USD
  baseMarketCap: number;  // starting baseline
  priceHistory: number[]; // last 12 turns of marketCap
  changePct: number;      // % change last turn
}

export interface StockHolding {
  ticker: string;
  invested: number;  // GDP invested
  boughtAt: number;  // marketCap when bought (for P&L calc)
}

export interface GameState {
  gameStarted: boolean;
  turn: number;
  playerCountryId: string;
  countries: Country[];
  events: GameEvent[];
  newsLog: string[];
  actionHistory: GameActionRecord[];
  unlockedTechIds: string[];
  history: HistoryPoint[];
  outcome?: GameOutcome;
  lastRecap?: TurnRecap;
  stocks: Stock[];
  portfolio: StockHolding[];
  tweetFeed: Tweet[];
  nuclearPrograms: NuclearProgram[];
  spaceAchievements: SpaceAchievement[];
  regionalConflicts: RegionalConflict[];
}

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}
