/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GameState, GameEvent } from "../types.ts";

// Toggle to enable real Gemini calls. Currently disabled — the app runs fully on the
// curated fallback content below so it costs nothing and works offline.
const USE_GEMINI = false;

const NEWS_EVENTS: Array<Partial<GameEvent>> = [
  // Stability events
  { title: "Consolidation of Power", description: "Internal political realignments solidify the administration's grip on key institutions.", resource: "stability", valueChange: 6 },
  { title: "Civil Unrest Erupts", description: "Mass protests across three major cities force security deployments, straining federal cohesion.", resource: "stability", valueChange: -8 },
  { title: "Emergency Cabinet Reshuffle", description: "A sudden cabinet purge removes dissenting voices but unnerves the electorate.", resource: "stability", valueChange: -5 },
  { title: "Constitutional Reform Passed", description: "A historic referendum clears the path for sweeping institutional changes, boosting public confidence.", resource: "stability", valueChange: 7 },
  { title: "Pandemic Alert Issued", description: "A novel pathogen spreads through urban centers, triggering emergency protocols and public anxiety.", resource: "stability", valueChange: -10 },
  { title: "National Unity Address", description: "A presidential address during a crisis moment rallies the public and calms rising tensions.", resource: "stability", valueChange: 5 },

  // GDP events
  { title: "Supply Chain Fractures", description: "Critical bottlenecks in major shipping lanes trigger a cascade of production slowdowns.", resource: "gdp", valueChange: -0.5 },
  { title: "Capital Markets Surge", description: "Record investor confidence drives a major rally across equity and bond markets.", resource: "gdp", valueChange: 0.7 },
  { title: "Cyber Attack on Financial Sector", description: "A coordinated intrusion partially freezes interbank transactions for 72 hours.", resource: "gdp", valueChange: -0.4 },
  { title: "Energy Grid Modernized", description: "A next-generation fusion-assisted power grid comes online two years ahead of schedule.", resource: "gdp", valueChange: 0.5 },
  { title: "Trade Embargo Tightens", description: "A coordinated international embargo cuts off access to key commodity markets.", resource: "gdp", valueChange: -0.6 },
  { title: "Commodity Windfall", description: "A rare earth mineral discovery opens lucrative extraction contracts worth hundreds of billions.", resource: "gdp", valueChange: 0.8 },
  { title: "Banking System Under Stress", description: "A regional bank run triggers government intervention and dampens economic confidence.", resource: "gdp", valueChange: -0.5 },

  // Military events
  { title: "Strategic Reserve Overhaul", description: "A sweeping modernization program enhances readiness across all branches of the armed forces.", resource: "militaryPower", valueChange: 4 },
  { title: "Weapons Test Draws Global Attention", description: "A high-profile hypersonic weapons demonstration shifts the regional balance of deterrence.", resource: "militaryPower", valueChange: 5 },
  { title: "Military Scandal Erupts", description: "Procurement fraud revelations shake the officer corps and trigger a congressional investigation.", resource: "militaryPower", valueChange: -6 },
  { title: "Joint Exercises Completed", description: "Intensive multi-theater drills sharpen tactical integration across all combat divisions.", resource: "militaryPower", valueChange: 3 },
  { title: "Desertion Crisis", description: "A wave of low morale desertions strains unit cohesion in forward-deployed forces.", resource: "militaryPower", valueChange: -4 },

  // Influence events
  { title: "Diplomatic Breakthrough", description: "A surprise trilateral summit produces a historic framework agreement, boosting global standing.", resource: "influence", valueChange: 9 },
  { title: "Whistleblower Scandal", description: "Leaked classified documents reveal covert operations abroad, triggering international condemnation.", resource: "influence", valueChange: -11 },
  { title: "Trade Pact Ratified", description: "A comprehensive multilateral trade deal opens new export corridors across four continents.", resource: "influence", valueChange: 7 },
  { title: "UN Veto Backlash", description: "A controversial Security Council veto triggers a wave of diplomatic protests from neutral nations.", resource: "influence", valueChange: -8 },
  { title: "Humanitarian Mission Praised", description: "A rapid-response disaster relief operation earns widespread international praise.", resource: "influence", valueChange: 8 },
  { title: "Ambassador Expulsion Wave", description: "A diplomatic crisis triggers mutual expulsions across seven embassies.", resource: "influence", valueChange: -9 },

  // Science events
  { title: "Tech Sector Breakthrough", description: "Researchers publish a foundational paper on quantum computing, attracting global talent.", resource: "science", valueChange: 20 },
  { title: "AI Arms Race Escalates", description: "A classified defense AI achieves decision-making speeds forty times faster than human analysts.", resource: "science", valueChange: 15 },
  { title: "Brain Drain Accelerates", description: "Restrictive policies push a cohort of elite researchers to seek opportunities abroad.", resource: "science", valueChange: -12 },
  { title: "Space Launch Success", description: "An orbital manufacturing platform completes its first commercial contract, signaling a new era.", resource: "science", valueChange: 18 },
];

function pickFallbackEvent(gameState: GameState): Partial<GameEvent> {
  const event = NEWS_EVENTS[Math.floor(Math.random() * NEWS_EVENTS.length)];
  // 60% target the player; otherwise target a random other country to make
  // the world feel reactive instead of always punishing the player.
  const targetPlayer = Math.random() < 0.6;
  const others = gameState.countries.filter(c => c.id !== gameState.playerCountryId);
  const impactedCountryId = targetPlayer || others.length === 0
    ? gameState.playerCountryId
    : others[Math.floor(Math.random() * others.length)].id;
  return { ...event, impactedCountryId, type: targetPlayer ? "Domestic" : "Global" };
}

const ADVISOR_LINES: Record<string, string[]> = {
  Military: [
    "Our strike groups are at optimal readiness. I recommend maintaining a forward presence in contested zones.",
    "Intelligence suggests rival military expansion. We should prioritize R&D to maintain our technological lead.",
    "The theater is volatile. Any direct action must be calculated to avoid total escalation.",
    "If we delay one more cycle, the rival closes the capability gap. Authorize the next-gen procurement now.",
  ],
  Economic: [
    "Our GDP growth remains steady, but maintenance costs are rising. Trade expansion is our best path forward.",
    "Economic stability is the bedrock of our power. I advise caution with sanctions that could rebound.",
    "The scientific sector is hungry for funding. Long-term prosperity depends on our breakthrough capabilities.",
    "Two of our largest creditors are wobbling. A pre-emptive aid package would lock in cheaper bond yields.",
  ],
  Intelligence: [
    "Information is the ultimate weapon. A propaganda campaign could weaken our rivals without firing a shot.",
    "We are seeing ripples of instability in rival territories. It may be time to deploy deep-cover assets.",
    "Our global influence is our greatest shield. Diplomacy and intel operations should remain our priority.",
    "Three rival cells went dark this week. Either they're reorganizing — or they've gone operational.",
  ],
};

export async function generateNewsEvent(gameState: GameState): Promise<Partial<GameEvent>> {
  if (!USE_GEMINI) return pickFallbackEvent(gameState);
  // Real Gemini path intentionally not wired in this build. Re-enable by setting USE_GEMINI = true
  // and re-importing @google/genai with a valid GEMINI_API_KEY.
  return pickFallbackEvent(gameState);
}

export async function getAdvisorAdvice(_gameState: GameState, advisorRole: string): Promise<string> {
  const options = ADVISOR_LINES[advisorRole] ?? ["Awaiting clear intelligence feeds. Proceed with current operational parameters."];
  return options[Math.floor(Math.random() * options.length)];
}
