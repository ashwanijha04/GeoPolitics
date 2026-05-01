/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GameState, GameEvent, ResourceSet } from "../types.ts";

const USE_GEMINI = false;

interface SmartEvent {
  title: string;
  description: string;
  resource: keyof ResourceSet;
  valueChange: number;
  preferredTargets?: string[]; // country IDs to preferentially impact
  globalEffect?: boolean;      // affects all countries slightly
}

// ── Real-world-inspired events ───────────────────────────────────────────────
const NEWS_EVENTS: SmartEvent[] = [

  // ── Technology & AI ──────────────────────────────────────────────────────
  { title: "AI Chip Export Controls Tighten", description: "Washington expands controls on advanced AI semiconductors. Beijing vows retaliation as chip supply to Chinese data centers halts.", resource: "science", valueChange: -28, preferredTargets: ["china", "russia"] },
  { title: "AGI Breakthrough at Major Lab", description: "A Silicon Valley lab demonstrates reasoning capabilities beyond any prior AI. Markets surge. Defense ministries scramble for briefings.", resource: "science", valueChange: 30 },
  { title: "Global Cyberattack Traced to State Actor", description: "A coordinated intrusion disables financial clearinghouses in 12 countries. 72 hours of chaos before containment. Attribution points to a hostile state.", resource: "gdp", valueChange: -0.5 },
  { title: "Quantum Computing Milestone Achieved", description: "First practical quantum computer breaks RSA encryption in minutes. Intelligence agencies worldwide declare cryptographic emergency.", resource: "science", valueChange: 22 },
  { title: "Tech Giant Announces Manufacturing Exodus", description: "Apple, Samsung and TSMC announce plans to diversify production out of China. $800B in supply chain restructuring begins.", resource: "gdp", valueChange: -0.4, preferredTargets: ["china"] },
  { title: "Undersea Data Cable Severed", description: "Two critical transpacific cables cut simultaneously near Taiwan. Suspected sabotage. Internet traffic rerouted through degraded paths.", resource: "stability", valueChange: -7, preferredTargets: ["taiwan", "japan", "south-korea"] },

  // ── Energy & Resources ───────────────────────────────────────────────────
  { title: "OPEC+ Shock Production Cut", description: "Saudi Arabia and Russia announce surprise 2M barrel/day cuts. Oil hits $140/barrel. Inflation spikes in import-dependent nations.", resource: "gdp", valueChange: -0.6 },
  { title: "Aramco Pipeline Drone Strike", description: "Houthi drones breach Saudi air defenses, striking the Abqaiq facility for the third time. Global oil supply disrupted for weeks.", resource: "gdp", valueChange: -0.3, preferredTargets: ["saudi-arabia"] },
  { title: "North Sea Gas Discovery", description: "Record-breaking natural gas field discovered off Norway's coast. EU energy dependency on Russia reaches new lows.", resource: "gdp", valueChange: 0.5, preferredTargets: ["eu", "uk"] },
  { title: "Fusion Energy Goes Commercial", description: "First commercial fusion reactor delivers power to the grid. Fossil fuel markets enter terminal decline. Energy geopolitics transform overnight.", resource: "gdp", valueChange: 0.8 },
  { title: "Rare Earth Embargo Imposed", description: "China restricts exports of 17 rare earth elements critical for EV batteries, missiles, and electronics. Western defense procurement freezes.", resource: "militaryPower", valueChange: -8, preferredTargets: ["usa", "eu", "japan"] },
  { title: "Arctic Ice Opens New Trade Route", description: "Record-low Arctic ice creates year-round northern shipping lane. Russia gains enormous strategic leverage over global maritime routes.", resource: "influence", valueChange: 12, preferredTargets: ["russia"] },

  // ── Military & Security ──────────────────────────────────────────────────
  { title: "Hypersonic Missile Test Stuns West", description: "A classified missile completes a 36-minute global circumnavigation at Mach 27. Existing missile defense systems are rendered obsolete overnight.", resource: "militaryPower", valueChange: 8 },
  { title: "Carrier Strike Group Sunk in Exercise", description: "War game simulation proves modern anti-ship missiles can sink US carrier within 4 minutes. Pentagon in damage-control mode.", resource: "stability", valueChange: -9, preferredTargets: ["usa"] },
  { title: "Bioweapon Lab Leak Suspected", description: "Intelligence agencies assess 70% probability that a suspicious outbreak originated in a military research facility. WHO access denied.", resource: "stability", valueChange: -12 },
  { title: "Wagner Group Seizes African Capital", description: "Russian mercenaries install a puppet government in another African nation. France demands action. West African stability collapses further.", resource: "influence", valueChange: -10, preferredTargets: ["eu", "france"] },
  { title: "Special Forces Hostage Rescue Succeeds", description: "Delta Force / SAS operators extract 23 hostages from a fortified compound. Surveillance technology credited. Military prestige soars.", resource: "militaryPower", valueChange: 6 },
  { title: "Stealth Drone Program Revealed", description: "Satellite imagery reveals operational deployment of fully autonomous combat drones with 4,000km range. Air defense doctrine rendered obsolete.", resource: "militaryPower", valueChange: 10 },

  // ── Economy & Finance ────────────────────────────────────────────────────
  { title: "Global Bond Market Seizes Up", description: "Sudden loss of confidence in US Treasuries triggers a cascade. IMF calls emergency session. The dollar's reserve currency status questioned.", resource: "gdp", valueChange: -0.7, preferredTargets: ["usa"] },
  { title: "BRICS Currency Pilot Launches", description: "Brazil, Russia, India, China and South Africa launch a gold-backed trade settlement currency. Dollar-denominated trade falls 4% in one quarter.", resource: "influence", valueChange: -8, preferredTargets: ["usa"] },
  { title: "Property Market Implosion", description: "The world's largest property developer defaults on $300B in bonds. Contagion spreads to the banking sector. GDP contracts sharply.", resource: "gdp", valueChange: -0.8, preferredTargets: ["china"] },
  { title: "Sovereign Debt Crisis Erupts", description: "IMF emergency bailout packages prove insufficient as three nations simultaneously default. Austerity riots begin.", resource: "stability", valueChange: -10 },
  { title: "AI Trading Algorithms Cause Flash Crash", description: "Synchronized AI trading systems amplify a minor data error into a 22% market crash in 90 minutes. Trillions wiped before circuit breakers activate.", resource: "gdp", valueChange: -0.6 },
  { title: "Trade Deal Unlocks Trillion-Dollar Market", description: "Historic bilateral trade framework eliminates tariffs on 8,000 product categories. Export industries surge.", resource: "gdp", valueChange: 0.7 },

  // ── Domestic & Political ─────────────────────────────────────────────────
  { title: "Mass Protests Demand Leader's Resignation", description: "Millions pour into the streets over corruption allegations. Security forces hold for now, but the government is shaken to its core.", resource: "stability", valueChange: -14 },
  { title: "Snap Election Called Mid-Crisis", description: "Facing collapse of coalition government, the premier calls early elections. Policy paralysis grips the capital for two months.", resource: "stability", valueChange: -8 },
  { title: "Anti-Corruption Crackdown Nets 200 Officials", description: "Sweeping purge of military and civilian bureaucracy removes potential challengers. Public approves. Governance improves dramatically.", resource: "stability", valueChange: 12 },
  { title: "Population Hits 1.4 Billion", description: "Demographic milestone reached. Young workforce floods labor markets, driving productivity gains. Infrastructure strains enormously.", resource: "gdp", valueChange: 0.4, preferredTargets: ["india"] },
  { title: "Assassination Attempt on Head of State", description: "Security services foil a plot targeting the head of government. Alleged foreign fingerprints trigger a diplomatic crisis.", resource: "stability", valueChange: -10 },
  { title: "Constitutional Crisis Paralyzes Government", description: "Supreme court ruling invalidating emergency powers creates a three-way standoff between branches. Markets spiral.", resource: "stability", valueChange: -11 },

  // ── Diplomacy & Geopolitics ──────────────────────────────────────────────
  { title: "Secret Summit Changes Everything", description: "Leaked documents reveal a clandestine two-day summit between rival powers. A secret codicil reshapes territorial claims in three regions.", resource: "influence", valueChange: 10 },
  { title: "Ambassador Expulsion Cascade", description: "Diplomatic crisis escalates to mutual expulsion of 40 ambassadors across seven countries. Back-channels go dark.", resource: "influence", valueChange: -12 },
  { title: "NATO Article 5 Invoked for First Time", description: "A cyberattack on critical infrastructure triggers NATO's mutual defense clause for the first time in history. Alliance unity tested.", resource: "militaryPower", valueChange: 8, preferredTargets: ["usa", "eu", "uk"] },
  { title: "UN Security Council Deadlocked Again", description: "Russia and China veto the 14th resolution on an ongoing crisis. The UN's authority reaches its lowest point since 1945.", resource: "influence", valueChange: -8 },
  { title: "Peace Agreement Ends 30-Year Conflict", description: "Two nations sign a landmark peace deal brokered over 18 months. A generation of refugees can finally return home.", resource: "stability", valueChange: 14 },
  { title: "Whistleblower Exposes Mass Surveillance", description: "Documents reveal systematic surveillance of allied nations' leaders. Trust shatters. Emergency sessions in every capital.", resource: "influence", valueChange: -15 },

  // ── Space & Science ──────────────────────────────────────────────────────
  { title: "Moon Mining Rights Dispute Erupts", description: "Two nations simultaneously claim the same lunar water ice deposits. Space lawyers argue. Rocket engines warm up.", resource: "influence", valueChange: -8 },
  { title: "Mars Mission Launched Successfully", description: "First crewed Mars mission launches. The nation's soft power surges globally. History will record this date.", resource: "influence", valueChange: 20 },
  { title: "Satellite Killed by Anti-Space Weapon", description: "A critical GPS and reconnaissance satellite destroyed in a direct-ascent missile test. Space debris cascades threaten all orbital assets.", resource: "militaryPower", valueChange: -7 },
  { title: "Pandemic Pathogen Detected", description: "WHO declares a Public Health Emergency. International borders close within 48 hours. Economic activity collapses in affected regions.", resource: "stability", valueChange: -15 },
  { title: "Climate Tipping Point Breached", description: "Arctic permafrost releases methane at rates 40x projected. Emergency G20 session called. Massive domestic spending commitments demanded.", resource: "gdp", valueChange: -0.5 },
  { title: "Scientific Breakthrough in Longevity", description: "Gene therapy trials show a 40-year lifespan extension. Pension systems face existential crisis. Pharmaceutical stocks hit records.", resource: "science", valueChange: 25 },

  // ── Regional flashpoints ─────────────────────────────────────────────────
  { title: "South China Sea Collision Incident", description: "US and Chinese warships collide in disputed waters. One sailor killed. Both navies at battle stations. The world watches.", resource: "stability", valueChange: -10, preferredTargets: ["china", "usa"] },
  { title: "Taiwan Strait 72-Hour Blockade Drill", description: "PLA Navy seals Taiwan's sea lanes in a rehearsal for invasion. 200 commercial ships unable to enter or leave. Markets in free fall.", resource: "stability", valueChange: -15, preferredTargets: ["taiwan", "japan", "south-korea"] },
  { title: "Kashmir Line of Control Violated", description: "Indian artillery strikes Pakistani military positions 4km inside disputed territory. Both nuclear powers mobilize reserve forces.", resource: "militaryPower", valueChange: -8, preferredTargets: ["india", "pakistan"] },
  { title: "Hormuz Strait Temporarily Mined", description: "Iran seeds the Strait of Hormuz with naval mines. 21% of global oil supply halted. Military vessels from 6 nations converge.", resource: "gdp", valueChange: -0.7, preferredTargets: ["iran", "saudi-arabia"] },
  { title: "Korean Peninsula Night of Fire", description: "North Korea fires 200 artillery shells at South Korean islands. Seoul puts 3.5 million residents on emergency alert.", resource: "stability", valueChange: -12, preferredTargets: ["south-korea", "japan"] },
  { title: "African Coup Belt Widens", description: "Fifth coup in the Sahel region in two years. France evacuates 4,000 nationals. Russia gains another foothold.", resource: "influence", valueChange: -10, preferredTargets: ["eu", "nigeria"] },

  // ── Good news events ─────────────────────────────────────────────────────
  { title: "Record Harvest Solves Food Crisis", description: "Exceptional growing conditions produce global grain surplus. Food prices fall 30%. Political stability improves in 40 nations.", resource: "stability", valueChange: 8 },
  { title: "Major Drug Discovery Announced", description: "A breakthrough treatment for the world's deadliest cancers reaches Phase 3 trials. Life expectancy projections revised upward.", resource: "stability", valueChange: 6 },
  { title: "Megafire Suppressed Before Catastrophe", description: "International coordination between 12 air forces extinguishes record wildfire. A template for future climate cooperation established.", resource: "stability", valueChange: 5 },
  { title: "Debt Forgiveness Deal for Poorest Nations", description: "G7 agrees to forgive $400B in debt for 45 nations. Trust in Western institutions recovers. Rival narratives of exploitation weaken.", resource: "influence", valueChange: 12 },
];

function pickEvent(state: GameState): SmartEvent {
  // Prefer events whose preferred targets include current game countries
  const countryIds = new Set(state.countries.map(c => c.id));

  const relevant = NEWS_EVENTS.filter(e =>
    !e.preferredTargets ||
    e.preferredTargets.some(t => countryIds.has(t))
  );

  const pool = relevant.length > 0 ? relevant : NEWS_EVENTS;
  return pool[Math.floor(Math.random() * pool.length)];
}

function pickTarget(event: SmartEvent, state: GameState): string {
  const preferred = (event.preferredTargets ?? []).filter(t =>
    state.countries.some(c => c.id === t)
  );

  // 65% chance to hit preferred target if one exists
  if (preferred.length > 0 && Math.random() < 0.65) {
    return preferred[Math.floor(Math.random() * preferred.length)];
  }

  // Otherwise: 55% player, 45% other
  if (Math.random() < 0.55) return state.playerCountryId;
  const others = state.countries.filter(c => c.id !== state.playerCountryId);
  return others[Math.floor(Math.random() * others.length)].id;
}

function pickFallbackEvent(state: GameState): Partial<GameEvent> {
  const event = pickEvent(state);
  const impactedCountryId = pickTarget(event, state);
  const isPlayerTarget = impactedCountryId === state.playerCountryId;

  return {
    ...event,
    impactedCountryId,
    type: isPlayerTarget ? 'Domestic' : 'Global',
    impacts: [],
  };
}

export async function generateNewsEvent(state: GameState): Promise<Partial<GameEvent>> {
  if (!USE_GEMINI) return pickFallbackEvent(state);
  return pickFallbackEvent(state);
}

// ── Advisor lines (context-aware) ────────────────────────────────────────────
const ADVISOR_LINES: Record<string, string[]> = {
  Military: [
    "Our strike groups are at optimal readiness. I recommend maintaining a forward presence in contested zones.",
    "Intelligence suggests rival military expansion. We need to prioritize R&D to maintain our technological edge.",
    "The theater is volatile. Any direct action must be calculated to avoid total escalation.",
    "If we delay another cycle, the rival closes the capability gap. Authorize the procurement now.",
    "Our hypersonic program is six months from deployment. The window to act conventionally is closing.",
    "Three carrier strike groups have been repositioned. We have options — the question is cost.",
  ],
  Economic: [
    "GDP growth is steady, but maintenance costs are rising. Trade expansion is our best path forward.",
    "Economic stability is the bedrock of our power. Caution with sanctions that could rebound.",
    "The scientific sector is hungry for funding. Long-term prosperity depends on breakthrough capabilities.",
    "Two of our largest creditors are wobbling. A pre-emptive aid package would lock in cheaper bond yields.",
    "The rival's GDP growth is 3 points above ours this quarter. We need to accelerate trade deals immediately.",
    "Our sanctions regime is working, but it's also costing us. Time to offer an off-ramp before it unravels.",
  ],
  Intelligence: [
    "Information is the ultimate weapon. Propaganda could weaken rivals without firing a shot.",
    "We're seeing ripples of instability in rival territories. Time to deploy deep-cover assets.",
    "Our global influence is our greatest shield. Diplomacy and intel should remain the priority.",
    "Three rival cells went dark this week. Either reorganizing — or they've gone operational.",
    "We have confirmation of a covert nuclear program. The question is whether to expose it or exploit it.",
    "Social media analysis shows 34% of the rival's population favors leadership change. A propaganda push now could be decisive.",
  ],
};

export async function getAdvisorAdvice(_state: GameState, role: string): Promise<string> {
  const options = ADVISOR_LINES[role] ?? ["Awaiting clear intelligence. Proceed with current parameters."];
  return options[Math.floor(Math.random() * options.length)];
}
