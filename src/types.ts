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

export interface Country {
  id: string;
  name: string;
  resources: ResourceSet;
  alignment: 'Neutral' | 'Player-Aligned' | 'Rival-Aligned';
  stanceTowardsPlayer: DiplomaticStance;
  description: string;
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

export type ActionType = 'Trade' | 'Aid' | 'Intel' | 'Sanction' | 'Military' | 'Alliance' | 'War' | 'Propaganda' | 'Research' | 'ArmsTrade' | 'UnlockTech';

export type TechCategory = 'Military' | 'Economy' | 'Diplomacy';

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

export interface GameState {
  gameStarted: boolean;
  turn: number;
  playerCountryId: string;
  countries: Country[];
  events: GameEvent[];
  newsLog: string[];
  actionHistory: GameActionRecord[];
  unlockedTechIds: string[];
  history: {
    turn: number;
    gdp: number;
    stability: number;
  }[];
}

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}
