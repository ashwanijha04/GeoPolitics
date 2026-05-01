/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Country, TechNode } from './types.ts';

export const TECH_TREE: TechNode[] = [
  // Military
  {
    id: 'railgun-tech',
    name: 'Orbital Railguns',
    description: 'Electromagnetic projectile launchers. Increases Military efficiency by 15%.',
    cost: 150,
    category: 'Military',
    dependencies: [],
    impact: { resource: 'militaryPower', multiplier: 1.15 }
  },
  {
    id: 'ai-drones',
    name: 'Swarm Intelligence',
    description: 'Autonomous drone swarms for saturation strikes. Increases Military power by 25%.',
    cost: 300,
    category: 'Military',
    dependencies: ['railgun-tech'],
    impact: { resource: 'militaryPower', multiplier: 1.25 }
  },
  // Economy
  {
    id: 'fusion-grid',
    name: 'Fusion Grid',
    description: 'Unlimited clean energy for the nation. Increases GDP output by 20%.',
    cost: 200,
    category: 'Economy',
    dependencies: [],
    impact: { resource: 'gdp', multiplier: 1.20 }
  },
  {
    id: 'asteroid-mining',
    name: 'Deep Space Mining',
    description: 'Extracting rare earth minerals from orbit. Increases GDP by 40%.',
    cost: 500,
    category: 'Economy',
    dependencies: ['fusion-grid'],
    impact: { resource: 'gdp', multiplier: 1.40 }
  },
  // Diplomacy
  {
    id: 'quantum-comms',
    name: 'Quantum Communications',
    description: 'Unbreakable encrypted network. Increases global Influence by 20%.',
    cost: 120,
    category: 'Diplomacy',
    dependencies: [],
    impact: { resource: 'influence', multiplier: 1.20 }
  },
  {
    id: 'culture-export',
    name: 'Hyper-Immersive VR',
    description: 'Exporting the nation\'s ideals through VR. Increases Influence by 30%.',
    cost: 250,
    category: 'Diplomacy',
    dependencies: ['quantum-comms'],
    impact: { resource: 'influence', multiplier: 1.30 }
  },
];

export const INITIAL_COUNTRIES: Country[] = [
  {
    id: 'usa',
    name: 'United Federations',
    alignment: 'Player-Aligned',
    stanceTowardsPlayer: 'Ally',
    description: 'The world\'s leading economic and military power, currently led by you.',
    resources: {
      gdp: 25.4,
      stability: 85,
      militaryPower: 92,
      influence: 95,
      population: 335,
      science: 80,
    },
  },
  {
    id: 'rival',
    name: 'Neo-Imperial Bloc',
    alignment: 'Rival-Aligned',
    stanceTowardsPlayer: 'Hostile',
    description: 'A growing military power seeking global dominance.',
    resources: {
      gdp: 18.2,
      stability: 78,
      militaryPower: 88,
      influence: 45,
      population: 1410,
      science: 75,
    },
  },
  {
    id: 'euro',
    name: 'Europa Union',
    alignment: 'Neutral',
    stanceTowardsPlayer: 'Friendly',
    description: 'A coalition of democratic nations focused on soft power.',
    resources: {
      gdp: 16.5,
      stability: 92,
      militaryPower: 45,
      influence: 80,
      population: 450,
      science: 90,
    },
  },
  {
    id: 'pan-asia',
    name: 'Pan-Asian Coalition',
    alignment: 'Neutral',
    stanceTowardsPlayer: 'Neutral',
    description: 'Economic juggernauts focusing on technology and trade.',
    resources: {
      gdp: 14.1,
      stability: 80,
      militaryPower: 60,
      influence: 55,
      population: 650,
      science: 95,
    },
  },
  {
    id: 'global-south',
    name: 'Southern Alliance',
    alignment: 'Neutral',
    stanceTowardsPlayer: 'Suspicious',
    description: 'Resource-rich nations demanding a new global order.',
    resources: {
      gdp: 5.2,
      stability: 65,
      militaryPower: 30,
      influence: 25,
      population: 1200,
      science: 20,
    },
  },
];
