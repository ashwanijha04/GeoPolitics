/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Country, DiplomaticStance, NuclearProgram, RegionalConflict, SpaceMilestone, TechNode } from './types.ts';

// Per-turn passive resource modifiers keyed by country ID.
// These represent structural advantages/disadvantages (debt, war drain, tech edge, etc.)
// Applied on top of normal growth each turn.
export const COUNTRY_PASSIVE_MODIFIERS: Record<string, Partial<{
  gdp: number; stability: number; militaryPower: number; influence: number; science: number;
}>> = {
  'usa':          { stability: -0.5, influence: 0.3, militaryPower: 0.4 },
  'china':        { gdp: 0.08, influence: 0.2, stability: -0.3, science: -4 },
  'russia':       { gdp: -0.12, militaryPower: -1.5, influence: -0.2, science: 2 },
  'india':        { gdp: 0.1, science: 3, stability: -0.2 },
  'eu':           { gdp: 0.1, science: 4, stability: 0.3 },
  'uk':           { gdp: -0.05, influence: -0.2, science: 2 },
  'japan':        { stability: 0.3, science: 5, gdp: -0.06 },
  'brazil':       { stability: -0.5, gdp: 0.1, influence: 0.1 },
  'saudi-arabia': { gdp: 0.15, science: 5, militaryPower: 0.3 },
  'iran':         { gdp: -0.1, science: 6, stability: -0.4 },
  'israel':       { science: 7, stability: -0.5, gdp: 0.12 },
  'south-korea':  { science: 5, gdp: 0.1, stability: -0.2 },
  'taiwan':       { stability: -0.5, science: 7, militaryPower: 0.5 },
  'north-korea':  { influence: -1, gdp: -0.02, militaryPower: 1.5, science: -1 },
  'pakistan':     { gdp: -0.08, stability: -0.5, militaryPower: 0.2 },
  'turkey':       { stability: -0.5, influence: 0.2, militaryPower: 0.2 },
  'australia':    { militaryPower: 0.4, science: 3, gdp: 0.1 },
  'indonesia':    { gdp: 0.1, influence: 0.2, science: 2 },
  'ukraine':      { gdp: -0.15, militaryPower: -1.5, stability: -0.5, influence: 0.3 },
  'nigeria':      { stability: -0.5, gdp: 0.1, influence: 0.15 },
};

// Starting stanceTowardsPlayer when you play a given country.
// Only non-Neutral entries are listed; everything else defaults to Neutral.
const STARTING_STANCES: Record<string, Partial<Record<string, DiplomaticStance>>> = {
  'usa': {
    'china': 'Suspicious', 'russia': 'Hostile', 'iran': 'Hostile', 'north-korea': 'Hostile',
    'uk': 'Ally', 'eu': 'Ally', 'japan': 'Ally', 'south-korea': 'Ally', 'australia': 'Ally',
    'israel': 'Friendly', 'ukraine': 'Friendly', 'india': 'Friendly', 'taiwan': 'Friendly',
    'pakistan': 'Suspicious', 'saudi-arabia': 'Neutral', 'turkey': 'Neutral',
  },
  'china': {
    'usa': 'Hostile', 'taiwan': 'Hostile', 'japan': 'Suspicious', 'south-korea': 'Suspicious',
    'australia': 'Suspicious', 'india': 'Suspicious', 'russia': 'Friendly', 'north-korea': 'Friendly',
    'pakistan': 'Friendly', 'iran': 'Friendly', 'brazil': 'Friendly', 'indonesia': 'Friendly',
    'uk': 'Suspicious', 'eu': 'Suspicious', 'ukraine': 'Suspicious', 'israel': 'Neutral',
    'saudi-arabia': 'Neutral', 'nigeria': 'Friendly', 'turkey': 'Neutral',
  },
  'russia': {
    'usa': 'Hostile', 'uk': 'Hostile', 'eu': 'Hostile', 'ukraine': 'At War', 'australia': 'Hostile',
    'japan': 'Suspicious', 'south-korea': 'Suspicious', 'israel': 'Suspicious', 'taiwan': 'Suspicious',
    'china': 'Friendly', 'iran': 'Friendly', 'north-korea': 'Friendly', 'india': 'Friendly',
    'saudi-arabia': 'Neutral', 'turkey': 'Neutral', 'pakistan': 'Neutral',
  },
  'india': {
    'pakistan': 'Hostile', 'china': 'Suspicious', 'north-korea': 'Suspicious',
    'russia': 'Friendly', 'usa': 'Friendly', 'eu': 'Friendly', 'uk': 'Friendly',
    'japan': 'Friendly', 'australia': 'Friendly', 'israel': 'Friendly', 'south-korea': 'Neutral',
    'iran': 'Neutral', 'saudi-arabia': 'Neutral', 'taiwan': 'Neutral',
  },
  'eu': {
    'russia': 'Hostile', 'north-korea': 'Hostile',
    'usa': 'Ally', 'uk': 'Friendly', 'japan': 'Friendly', 'south-korea': 'Friendly',
    'australia': 'Friendly', 'ukraine': 'Friendly', 'india': 'Friendly', 'taiwan': 'Friendly',
    'china': 'Suspicious', 'iran': 'Suspicious', 'israel': 'Neutral', 'turkey': 'Neutral',
    'saudi-arabia': 'Neutral', 'pakistan': 'Neutral',
  },
  'uk': {
    'russia': 'Hostile', 'iran': 'Hostile', 'north-korea': 'Hostile',
    'usa': 'Ally', 'eu': 'Friendly', 'australia': 'Ally', 'japan': 'Friendly',
    'south-korea': 'Friendly', 'ukraine': 'Friendly', 'india': 'Friendly', 'israel': 'Friendly',
    'china': 'Suspicious', 'turkey': 'Neutral', 'saudi-arabia': 'Neutral', 'taiwan': 'Friendly',
  },
  'japan': {
    'north-korea': 'Hostile', 'russia': 'Suspicious',
    'china': 'Suspicious', 'usa': 'Ally', 'south-korea': 'Friendly',
    'australia': 'Friendly', 'india': 'Friendly', 'eu': 'Friendly', 'uk': 'Friendly',
    'taiwan': 'Friendly', 'ukraine': 'Neutral', 'indonesia': 'Neutral',
  },
  'brazil': {
    'usa': 'Neutral', 'china': 'Friendly', 'russia': 'Neutral', 'eu': 'Neutral',
    'iran': 'Neutral', 'north-korea': 'Suspicious', 'india': 'Neutral', 'south-korea': 'Neutral',
  },
  'saudi-arabia': {
    'iran': 'Hostile', 'russia': 'Neutral', 'china': 'Neutral', 'usa': 'Neutral',
    'israel': 'Suspicious', 'uk': 'Friendly', 'eu': 'Neutral',
    'pakistan': 'Friendly', 'turkey': 'Neutral', 'indonesia': 'Neutral',
  },
  'iran': {
    'usa': 'Hostile', 'israel': 'Hostile', 'saudi-arabia': 'Hostile', 'uk': 'Hostile', 'eu': 'Hostile',
    'australia': 'Hostile', 'north-korea': 'Friendly', 'russia': 'Friendly', 'china': 'Friendly',
    'india': 'Neutral', 'turkey': 'Neutral', 'pakistan': 'Neutral',
  },
  'israel': {
    'iran': 'Hostile', 'north-korea': 'Hostile',
    'usa': 'Ally', 'uk': 'Friendly', 'eu': 'Friendly', 'india': 'Friendly',
    'saudi-arabia': 'Suspicious', 'russia': 'Suspicious', 'china': 'Neutral', 'turkey': 'Suspicious',
    'australia': 'Friendly', 'japan': 'Friendly',
  },
  'south-korea': {
    'north-korea': 'Hostile', 'russia': 'Suspicious',
    'china': 'Suspicious', 'usa': 'Ally', 'japan': 'Friendly', 'australia': 'Friendly',
    'eu': 'Friendly', 'uk': 'Friendly', 'india': 'Neutral', 'taiwan': 'Friendly',
  },
  'taiwan': {
    'china': 'Hostile',
    'usa': 'Friendly', 'japan': 'Friendly', 'south-korea': 'Friendly', 'australia': 'Friendly',
    'eu': 'Friendly', 'uk': 'Friendly', 'india': 'Neutral',
    'russia': 'Suspicious', 'north-korea': 'Suspicious',
  },
  'north-korea': {
    'usa': 'Hostile', 'south-korea': 'Hostile', 'japan': 'Hostile', 'australia': 'Hostile',
    'uk': 'Hostile', 'eu': 'Hostile', 'israel': 'Hostile',
    'china': 'Friendly', 'russia': 'Friendly', 'iran': 'Friendly',
    'india': 'Suspicious', 'pakistan': 'Neutral',
  },
  'pakistan': {
    'india': 'Hostile', 'israel': 'Hostile',
    'usa': 'Suspicious', 'uk': 'Suspicious', 'eu': 'Suspicious', 'australia': 'Suspicious',
    'china': 'Friendly', 'iran': 'Neutral', 'saudi-arabia': 'Friendly',
    'russia': 'Neutral', 'north-korea': 'Neutral', 'turkey': 'Friendly', 'indonesia': 'Neutral',
  },
  'turkey': {
    'usa': 'Neutral', 'russia': 'Neutral', 'eu': 'Suspicious', 'ukraine': 'Neutral',
    'greece': 'Suspicious', 'armenia': 'Suspicious',
    'china': 'Neutral', 'saudi-arabia': 'Neutral', 'iran': 'Neutral',
    'uk': 'Neutral', 'japan': 'Neutral', 'israel': 'Suspicious',
    'pakistan': 'Friendly', 'indonesia': 'Neutral',
  },
  'australia': {
    'russia': 'Hostile', 'north-korea': 'Hostile', 'iran': 'Hostile',
    'china': 'Suspicious',
    'usa': 'Ally', 'uk': 'Ally', 'japan': 'Friendly', 'south-korea': 'Friendly',
    'india': 'Friendly', 'eu': 'Friendly', 'israel': 'Friendly', 'taiwan': 'Friendly',
    'indonesia': 'Neutral',
  },
  'indonesia': {
    'china': 'Neutral', 'usa': 'Neutral', 'australia': 'Neutral', 'india': 'Neutral',
    'japan': 'Neutral', 'south-korea': 'Neutral', 'eu': 'Neutral',
    'russia': 'Neutral', 'north-korea': 'Suspicious',
    'malaysia': 'Neutral', 'singapore': 'Friendly',
  },
  'ukraine': {
    'russia': 'At War',
    'usa': 'Friendly', 'uk': 'Friendly', 'eu': 'Friendly', 'australia': 'Friendly',
    'japan': 'Friendly', 'south-korea': 'Friendly', 'israel': 'Neutral',
    'china': 'Suspicious', 'north-korea': 'Hostile', 'iran': 'Hostile',
    'turkey': 'Neutral', 'india': 'Neutral',
  },
  'nigeria': {
    'usa': 'Neutral', 'china': 'Neutral', 'russia': 'Neutral', 'uk': 'Neutral',
    'eu': 'Neutral', 'france': 'Suspicious', 'india': 'Neutral',
    'brazil': 'Neutral', 'south-africa': 'Neutral', 'iran': 'Neutral',
  },
};

// Countries that start as 'Rival-Aligned' for a given player country.
// These are the nations actively opposed to you at game start.
export const RIVAL_COUNTRIES: Record<string, string[]> = {
  'usa':          ['russia', 'iran', 'north-korea'],
  'china':        ['usa', 'taiwan'],
  'russia':       ['usa', 'uk', 'ukraine'],
  'india':        ['pakistan'],
  'eu':           ['russia'],
  'uk':           ['russia', 'iran'],
  'japan':        ['north-korea'],
  'brazil':       [],
  'saudi-arabia': ['iran'],
  'iran':         ['usa', 'israel', 'saudi-arabia'],
  'israel':       ['iran'],
  'south-korea':  ['north-korea'],
  'taiwan':       ['china'],
  'north-korea':  ['usa', 'south-korea', 'japan'],
  'pakistan':     ['india'],
  'turkey':       [],
  'australia':    ['russia'],
  'indonesia':    [],
  'ukraine':      ['russia'],
  'nigeria':      [],
};

export function getInitialStance(playerCountryId: string, targetCountryId: string): DiplomaticStance {
  const stances = STARTING_STANCES[playerCountryId];
  if (!stances) return 'Neutral';
  return stances[targetCountryId] ?? 'Neutral';
}

export const TECH_TREE: TechNode[] = [
  // Military
  {
    id: 'ai-combat',
    name: 'AI Combat Systems',
    description: 'Machine-learning targeting and battlefield coordination. +20% military effectiveness.',
    cost: 180,
    category: 'Military',
    dependencies: [],
    impact: { resource: 'militaryPower', multiplier: 1.20 },
  },
  {
    id: 'hypersonic',
    name: 'Hypersonic Arsenal',
    description: 'Mach 5+ glide vehicles that defeat any current missile defense. +35% military power.',
    cost: 380,
    category: 'Military',
    dependencies: ['ai-combat'],
    impact: { resource: 'militaryPower', multiplier: 1.35 },
  },
  // Economy
  {
    id: 'fusion-grid',
    name: 'Fusion Grid',
    description: 'Unlimited clean energy eliminates energy import dependency. +20% GDP.',
    cost: 200,
    category: 'Economy',
    dependencies: [],
    impact: { resource: 'gdp', multiplier: 1.20 },
  },
  {
    id: 'space-economy',
    name: 'Space Economy',
    description: 'Orbital manufacturing and asteroid mining open infinite resource frontiers. +40% GDP.',
    cost: 500,
    category: 'Economy',
    dependencies: ['fusion-grid'],
    impact: { resource: 'gdp', multiplier: 1.40 },
  },
  // Diplomacy
  {
    id: 'quantum-comms',
    name: 'Quantum Communications',
    description: 'Unbreakable encrypted diplomatic network. +20% global influence.',
    cost: 120,
    category: 'Diplomacy',
    dependencies: [],
    impact: { resource: 'influence', multiplier: 1.20 },
  },
  {
    id: 'ai-propaganda',
    name: 'AI Narrative Engine',
    description: 'Personalized global information campaigns at scale. +30% influence.',
    cost: 260,
    category: 'Diplomacy',
    dependencies: ['quantum-comms'],
    impact: { resource: 'influence', multiplier: 1.30 },
  },
  // Intelligence
  {
    id: 'cyber-command',
    name: 'Cyber Command',
    description: 'Offensive and defensive cyber operations division. +25% science output.',
    cost: 150,
    category: 'Intelligence',
    dependencies: [],
    impact: { resource: 'science', multiplier: 1.25 },
  },
  {
    id: 'agi-breakthrough',
    name: 'AGI Breakthrough',
    description: 'Artificial General Intelligence accelerates every domain of national power. +50% science.',
    cost: 450,
    category: 'Intelligence',
    dependencies: ['cyber-command'],
    impact: { resource: 'science', multiplier: 1.50 },
  },
];

export const INITIAL_COUNTRIES: Country[] = [
  {
    id: 'usa',
    name: 'United States',
    flag: '🇺🇸',
    region: 'Americas',
    alignment: 'Neutral',
    stanceTowardsPlayer: 'Neutral',
    difficulty: 'Easy',
    nuclearArmed: true,
    description: 'The world\'s preeminent military and economic power — but deeply polarized at home. Russia and China are closing the gap. Every ally you neglect is a target for their diplomacy.',
    traits: [
      { name: 'Polarized Democracy', description: 'Domestic divisions erode stability every turn.' },
      { name: 'Dollar Hegemony', description: 'Global reserve currency generates passive influence gains.' },
      { name: 'Military-Industrial Complex', description: 'Permanent defense contracts fuel steady military growth.' },
    ],
    resources: { gdp: 27.4, stability: 72, militaryPower: 96, influence: 90, population: 335, science: 90 },
  },
  {
    id: 'china',
    name: 'China',
    flag: '🇨🇳',
    region: 'Asia-Pacific',
    alignment: 'Neutral',
    stanceTowardsPlayer: 'Neutral',
    difficulty: 'Medium',
    nuclearArmed: true,
    description: 'A rising superpower with an ancient mandate. The Belt & Road rewires the global economy, but Taiwan remains a permanent flashpoint and Western tech restrictions are slowing your chip industry.',
    traits: [
      { name: 'Belt & Road Initiative', description: 'Global infrastructure investment generates GDP and influence each turn.' },
      { name: 'Taiwan Flashpoint', description: 'The unresolved Taiwan claim creates constant stability pressure.' },
      { name: 'Tech Decoupling', description: 'Western chip export restrictions reduce science output each turn.' },
    ],
    resources: { gdp: 17.7, stability: 76, militaryPower: 85, influence: 70, population: 1412, science: 82 },
  },
  {
    id: 'russia',
    name: 'Russia',
    flag: '🇷🇺',
    region: 'Europe',
    alignment: 'Neutral',
    stanceTowardsPlayer: 'Neutral',
    difficulty: 'Hard',
    nuclearArmed: true,
    description: 'A nuclear superpower hemorrhaging resources in Ukraine. Sanctions have fractured the economy, talent is fleeing, but the nuclear arsenal keeps adversaries cautious. Can you rebuild the empire?',
    traits: [
      { name: 'Ukraine War Drain', description: 'Active conflict bleeds GDP and military strength each turn.' },
      { name: 'Western Sanctions', description: 'Economic isolation permanently suppresses GDP growth.' },
      { name: 'Nuclear Arsenal', description: 'Strategic deterrence prevents direct great-power attack.' },
    ],
    resources: { gdp: 2.2, stability: 62, militaryPower: 80, influence: 38, population: 144, science: 68 },
  },
  {
    id: 'india',
    name: 'India',
    flag: '🇮🇳',
    region: 'Asia-Pacific',
    alignment: 'Neutral',
    stanceTowardsPlayer: 'Neutral',
    difficulty: 'Medium',
    nuclearArmed: true,
    description: 'The world\'s most populous nation and fastest-growing major economy. Multi-alignment keeps both superpowers engaged, but Pakistan and China on your borders demand constant vigilance.',
    traits: [
      { name: 'Demographic Dividend', description: 'Youngest major workforce drives strong GDP growth each turn.' },
      { name: 'Multi-Alignment', description: 'Strategic autonomy lets India benefit from all blocs.' },
      { name: 'Border Tensions', description: 'Active disputes with Pakistan and China drain stability.' },
    ],
    resources: { gdp: 3.7, stability: 72, militaryPower: 68, influence: 62, population: 1441, science: 70 },
  },
  {
    id: 'eu',
    name: 'European Union',
    flag: '🇪🇺',
    region: 'Europe',
    alignment: 'Neutral',
    stanceTowardsPlayer: 'Neutral',
    difficulty: 'Easy',
    nuclearArmed: false,
    description: 'The world\'s largest single market and a beacon of democratic governance. Low military power is a known weakness, but your economic and regulatory reach shapes global standards.',
    traits: [
      { name: 'Common Market', description: 'Integrated economy provides passive GDP gains each turn.' },
      { name: 'Green Transition', description: 'Cleantech leadership accelerates science output.' },
      { name: 'Democratic Solidarity', description: 'Values-based diplomacy stabilizes your bloc each turn.' },
    ],
    resources: { gdp: 18.3, stability: 82, militaryPower: 52, influence: 80, population: 448, science: 86 },
  },
  {
    id: 'uk',
    name: 'United Kingdom',
    flag: '🇬🇧',
    region: 'Europe',
    alignment: 'Neutral',
    stanceTowardsPlayer: 'Neutral',
    difficulty: 'Medium',
    nuclearArmed: true,
    description: 'A post-imperial power recalibrating after Brexit. Global finance hub, nuclear deterrent, and Five Eyes intelligence — but economic growth has stalled and influence is quietly fading.',
    traits: [
      { name: 'Post-Brexit Strain', description: 'Trade friction with Europe suppresses GDP and influence.' },
      { name: 'Nuclear Arsenal', description: 'Independent nuclear deterrent anchors defense posture.' },
      { name: 'Financial Hub', description: 'City of London generates passive GDP gains.' },
    ],
    resources: { gdp: 3.1, stability: 68, militaryPower: 62, influence: 70, population: 68, science: 82 },
  },
  {
    id: 'japan',
    name: 'Japan',
    flag: '🇯🇵',
    region: 'Asia-Pacific',
    alignment: 'Neutral',
    stanceTowardsPlayer: 'Neutral',
    difficulty: 'Easy',
    nuclearArmed: false,
    description: 'The world\'s third-largest economy and a technology powerhouse. Article 9 pacifism is being reconsidered as North Korea missiles and Chinese pressure grow. Your science base is unmatched.',
    traits: [
      { name: 'Tech Powerhouse', description: 'World-class R&D ecosystem generates strong science gains.' },
      { name: 'Security Pivot', description: 'Rearmament push delivers steady military growth.' },
      { name: 'Aging Population', description: 'Demographic decline slowly suppresses GDP growth.' },
    ],
    resources: { gdp: 4.2, stability: 86, militaryPower: 58, influence: 72, population: 124, science: 92 },
  },
  {
    id: 'brazil',
    name: 'Brazil',
    flag: '🇧🇷',
    region: 'Americas',
    alignment: 'Neutral',
    stanceTowardsPlayer: 'Neutral',
    difficulty: 'Medium',
    nuclearArmed: false,
    description: 'A resource giant with a turbulent democracy. BRICS membership gives you access to both superpowers. The Amazon deforestation crisis strains your global standing while inequality fuels unrest.',
    traits: [
      { name: 'Amazon Pressure', description: 'International scrutiny over deforestation drains influence and stability.' },
      { name: 'BRICS Member', description: 'Membership in the emerging market bloc opens trade options with all sides.' },
      { name: 'Resource Wealth', description: 'Vast natural resources provide passive GDP gains.' },
    ],
    resources: { gdp: 2.1, stability: 52, militaryPower: 42, influence: 45, population: 215, science: 48 },
  },
  {
    id: 'saudi-arabia',
    name: 'Saudi Arabia',
    flag: '🇸🇦',
    region: 'Middle East',
    alignment: 'Neutral',
    stanceTowardsPlayer: 'Neutral',
    difficulty: 'Medium',
    nuclearArmed: false,
    description: 'Oil superpower executing a generational economic transformation. Vision 2030 is building a post-oil economy, but the existential rivalry with Iran and dependence on foreign security guarantees define your constraints.',
    traits: [
      { name: 'Oil Dominance', description: 'Petroleum exports drive passive GDP growth every turn.' },
      { name: 'Vision 2030', description: 'Diversification push accelerates science and military modernization.' },
      { name: 'Iran Rivalry', description: 'Existential competition with Tehran shapes all regional decisions.' },
    ],
    resources: { gdp: 1.1, stability: 70, militaryPower: 55, influence: 52, population: 36, science: 38 },
  },
  {
    id: 'iran',
    name: 'Iran',
    flag: '🇮🇷',
    region: 'Middle East',
    alignment: 'Neutral',
    stanceTowardsPlayer: 'Neutral',
    difficulty: 'Hard',
    nuclearArmed: false,
    description: 'A revolutionary state one enrichment step from nuclear status, running a vast proxy warfare network from Lebanon to Yemen. Sanctions strangle your economy, but your science program and regional influence are your leverage.',
    traits: [
      { name: 'Nuclear Program', description: 'Accelerated enrichment program rapidly builds science each turn.' },
      { name: 'Western Sanctions', description: 'Economic isolation steadily drains GDP each turn.' },
      { name: 'Proxy Warfare', description: 'Regional proxy network maintains influence but risks stability.' },
    ],
    resources: { gdp: 0.7, stability: 58, militaryPower: 50, influence: 32, population: 88, science: 52 },
  },
  {
    id: 'israel',
    name: 'Israel',
    flag: '🇮🇱',
    region: 'Middle East',
    alignment: 'Neutral',
    stanceTowardsPlayer: 'Neutral',
    difficulty: 'Hard',
    nuclearArmed: true,
    description: 'A military and tech powerhouse surrounded by adversaries. The Startup Nation generates disproportionate science output, but the Gaza conflict and Iran nuclear threat create permanent instability.',
    traits: [
      { name: 'Startup Nation', description: 'World-leading per-capita innovation generates strong science and GDP gains.' },
      { name: 'Regional War', description: 'Active conflict drains stability and strains military readiness each turn.' },
      { name: 'Iron Dome', description: 'Missile defense doctrine drives continuous military R&D.' },
    ],
    resources: { gdp: 0.55, stability: 60, militaryPower: 72, influence: 48, population: 10, science: 88 },
  },
  {
    id: 'south-korea',
    name: 'South Korea',
    flag: '🇰🇷',
    region: 'Asia-Pacific',
    alignment: 'Neutral',
    stanceTowardsPlayer: 'Neutral',
    difficulty: 'Medium',
    nuclearArmed: false,
    description: 'A technology and industrial powerhouse living under permanent nuclear threat from the North. TSMC-rivaling chipmakers and world-class conglomerates are your foundation — North Korea is your ceiling.',
    traits: [
      { name: 'Semiconductor Hub', description: 'Chip manufacturing exports drive strong science and GDP each turn.' },
      { name: 'North Korea Threat', description: 'Existential nuclear threat demands persistent defense investment.' },
      { name: 'Chaebol Economy', description: 'Conglomerate-driven growth, concentrated but powerful.' },
    ],
    resources: { gdp: 1.7, stability: 80, militaryPower: 62, influence: 60, population: 52, science: 88 },
  },
  {
    id: 'taiwan',
    name: 'Taiwan',
    flag: '🇹🇼',
    region: 'Asia-Pacific',
    alignment: 'Neutral',
    stanceTowardsPlayer: 'Neutral',
    difficulty: 'Hard',
    nuclearArmed: false,
    description: 'The world\'s semiconductor crown jewel living under permanent annexation threat. Your chip fabs are the global chokepoint — making you indispensable to allies but an obsession for Beijing.',
    traits: [
      { name: 'Chip Supremacy', description: 'TSMC and foundry dominance generate exceptional science gains every turn.' },
      { name: 'China Pressure', description: 'Constant military and diplomatic coercion erodes stability each turn.' },
      { name: 'Self-Defense Drive', description: 'Existential threat demands maximum military investment.' },
    ],
    resources: { gdp: 0.82, stability: 78, militaryPower: 50, influence: 40, population: 24, science: 90 },
  },
  {
    id: 'north-korea',
    name: 'North Korea',
    flag: '🇰🇵',
    region: 'Asia-Pacific',
    alignment: 'Neutral',
    stanceTowardsPlayer: 'Neutral',
    difficulty: 'Extreme',
    nuclearArmed: true,
    description: 'The world\'s most isolated state with a nuclear arsenal disproportionate to its GDP. Extreme hard mode: sanctions poverty, international pariah status, and constant military priority. Survival is itself a victory.',
    traits: [
      { name: 'Juche Isolation', description: 'Self-reliance doctrine drains influence and GDP every turn.' },
      { name: 'Nuclear Deterrence', description: 'Weapons program is the top priority — military grows every turn.' },
      { name: 'Sanctions Poverty', description: 'International isolation severely limits GDP growth.' },
    ],
    resources: { gdp: 0.04, stability: 55, militaryPower: 58, influence: 8, population: 26, science: 35 },
  },
  {
    id: 'pakistan',
    name: 'Pakistan',
    flag: '🇵🇰',
    region: 'Asia-Pacific',
    alignment: 'Neutral',
    stanceTowardsPlayer: 'Neutral',
    difficulty: 'Hard',
    nuclearArmed: true,
    description: 'A nuclear-armed state teetering on economic collapse. The military\'s ISI apparatus wields enormous covert influence, but IMF debt and India on your border define the room to maneuver.',
    traits: [
      { name: 'Economic Crisis', description: 'IMF dependency and debt servicing drain GDP each turn.' },
      { name: 'ISI Network', description: 'Deep-cover intelligence operations build passive influence.' },
      { name: 'Nuclear State', description: 'Nuclear deterrent provides military leverage despite weak economy.' },
    ],
    resources: { gdp: 0.35, stability: 42, militaryPower: 52, influence: 28, population: 238, science: 32 },
  },
  {
    id: 'turkey',
    name: 'Turkey',
    flag: '🇹🇷',
    region: 'Europe',
    alignment: 'Neutral',
    stanceTowardsPlayer: 'Neutral',
    difficulty: 'Medium',
    nuclearArmed: false,
    description: 'The NATO swing state that sells drones to both sides. Your Bosphorus chokepoint and geographic position between Europe and Asia makes you indispensable — but your inflation crisis is a ticking clock.',
    traits: [
      { name: 'Strategic Crossroads', description: 'Control of critical sea lanes generates passive influence.' },
      { name: 'Inflation Spiral', description: 'Chronic inflation erodes stability and economic output.' },
      { name: 'NATO Swing State', description: 'Dual-track diplomacy lets you engage both blocs.' },
    ],
    resources: { gdp: 1.1, stability: 55, militaryPower: 60, influence: 52, population: 85, science: 50 },
  },
  {
    id: 'australia',
    name: 'Australia',
    flag: '🇦🇺',
    region: 'Asia-Pacific',
    alignment: 'Neutral',
    stanceTowardsPlayer: 'Neutral',
    difficulty: 'Easy',
    nuclearArmed: false,
    description: 'A wealthy, stable democracy in the Indo-Pacific. AUKUS is delivering nuclear submarines while China trade dependencies create complex leverage. Your resource exports are the envy of the developing world.',
    traits: [
      { name: 'AUKUS Partner', description: 'Nuclear submarine partnership drives strong military modernization.' },
      { name: 'China Trade Link', description: 'Resource exports to China provide passive GDP — but create dependency.' },
      { name: 'Five Eyes Intelligence', description: 'Signals intelligence network generates science and influence gains.' },
    ],
    resources: { gdp: 1.7, stability: 84, militaryPower: 55, influence: 58, population: 26, science: 78 },
  },
  {
    id: 'indonesia',
    name: 'Indonesia',
    flag: '🇮🇩',
    region: 'Asia-Pacific',
    alignment: 'Neutral',
    stanceTowardsPlayer: 'Neutral',
    difficulty: 'Medium',
    nuclearArmed: false,
    description: 'The world\'s largest archipelago democracy and ASEAN\'s anchor state. Critical minerals and a 280-million-person market make you courted by every major power. Strategic autonomy is your brand.',
    traits: [
      { name: 'ASEAN Anchor', description: 'Regional bloc leadership generates passive influence each turn.' },
      { name: 'Resource Archipelago', description: 'Nickel, coal, and palm oil exports drive passive GDP growth.' },
      { name: 'Demographic Momentum', description: 'Young, growing population supports long-term economic expansion.' },
    ],
    resources: { gdp: 1.4, stability: 70, militaryPower: 42, influence: 45, population: 275, science: 40 },
  },
  {
    id: 'ukraine',
    name: 'Ukraine',
    flag: '🇺🇦',
    region: 'Europe',
    alignment: 'Neutral',
    stanceTowardsPlayer: 'Neutral',
    difficulty: 'Extreme',
    nuclearArmed: false,
    description: 'A nation in existential war. Your survival depends on Western support, your innovation economy, and sheer resilience. Extreme hard mode: every turn is a fight to keep the lights on while rebuilding.',
    traits: [
      { name: 'Active Warzone', description: 'Ongoing conflict drains GDP, military, and stability every turn.' },
      { name: 'Western Aid Lifeline', description: 'International support generates passive influence and offsets war losses.' },
      { name: 'Resilience', description: 'Each crisis survived strengthens national resolve.' },
    ],
    resources: { gdp: 0.18, stability: 38, militaryPower: 44, influence: 42, population: 37, science: 52 },
  },
  {
    id: 'nigeria',
    name: 'Nigeria',
    flag: '🇳🇬',
    region: 'Africa',
    alignment: 'Neutral',
    stanceTowardsPlayer: 'Neutral',
    difficulty: 'Hard',
    nuclearArmed: false,
    description: 'Africa\'s largest economy and demographic giant — and one of its most volatile. Oil wealth fuels the treasury while Boko Haram and banditry drain stability. The prize: becoming the continent\'s undisputed hegemon.',
    traits: [
      { name: 'Oil Revenue', description: 'Petroleum exports generate passive GDP each turn but create volatility.' },
      { name: 'Security Challenges', description: 'Insurgency and organized crime drain stability and military every turn.' },
      { name: "Africa's Giant", description: 'Continental leadership ambitions generate passive influence.' },
    ],
    resources: { gdp: 0.44, stability: 46, militaryPower: 38, influence: 30, population: 224, science: 22 },
  },
];


// ── Nuclear programs ─────────────────────────────────────────────────────────
// Non-nuclear countries with active programs. Progress 0–100; at 100 → nuclear.
export const INITIAL_NUCLEAR_PROGRAMS: NuclearProgram[] = [
  { countryId: 'iran',          progress: 62, detected: false }, // very close
  { countryId: 'saudi-arabia',  progress: 14, detected: false }, // early stage
  { countryId: 'south-korea',   progress: 8,  detected: false }, // latent capability
  { countryId: 'turkey',        progress: 4,  detected: false }, // speculative
];

// Per-turn nuclear program advancement (if country is not yet nuclear)
export const NUCLEAR_ADVANCE_PER_TURN: Record<string, number> = {
  'iran':         6,   // fastest — declared ambition
  'saudi-arabia': 2,
  'south-korea':  1,
  'turkey':       0.5,
};

// ── Space race thresholds (cumulative science) ───────────────────────────────
export const SPACE_MILESTONES: Record<SpaceMilestone, { scienceRequired: number; label: string; icon: string; influenceBonus: number; militaryBonus: number }> = {
  satellite: { scienceRequired: 150,  label: 'First Satellite',  icon: '🛰️',  influenceBonus: 8,  militaryBonus: 2  },
  moon:      { scienceRequired: 400,  label: 'Moon Landing',     icon: '🌕',  influenceBonus: 20, militaryBonus: 5  },
  station:   { scienceRequired: 700,  label: 'Space Station',    icon: '🚀',  influenceBonus: 15, militaryBonus: 8  },
  mars:      { scienceRequired: 1200, label: 'Mars Mission',     icon: '🔴',  influenceBonus: 40, militaryBonus: 15 },
};
export const SPACE_MILESTONE_ORDER: SpaceMilestone[] = ['satellite', 'moon', 'station', 'mars'];

// ── Starting regional conflicts ──────────────────────────────────────────────
export const INITIAL_REGIONAL_CONFLICTS: RegionalConflict[] = [
  {
    id: 'kashmir',
    countryAId: 'india',
    countryBId: 'pakistan',
    name: 'Kashmir Conflict',
    intensity: 55,
  },
  {
    id: 'taiwan-strait',
    countryAId: 'china',
    countryBId: 'taiwan',
    name: 'Taiwan Strait Crisis',
    intensity: 65,
  },
  {
    id: 'russia-ukraine',
    countryAId: 'russia',
    countryBId: 'ukraine',
    name: 'Russo-Ukrainian War',
    intensity: 90,
  },
  {
    id: 'middle-east',
    countryAId: 'iran',
    countryBId: 'israel',
    name: 'Iran-Israel Confrontation',
    intensity: 50,
  },
];
