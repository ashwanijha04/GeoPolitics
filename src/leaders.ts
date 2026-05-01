/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type GameTheoryStrategy =
  | 'always-defect'          // NK, Iran under max pressure: never genuinely cooperate
  | 'grudger'                // Russia, Iran: one betrayal = permanent hostility
  | 'tit-for-tat'            // USA, Israel, China: mirror the last action exactly
  | 'tit-for-tat-forgiving'  // India, Japan, EU, Australia: mirror but forgive after 2 good turns
  | 'exploiter'              // China, Saudi: cooperate until they see weakness, then defect
  | 'win-stay-lose-switch'   // Turkey, Nigeria: stay if winning, switch allegiance if losing
  | 'cooperative'            // EU, Indonesia: prefer cooperation even at cost
  | 'random';                // Pakistan, North Korea post-nuke: unpredictable

export type LeaderStyle = 'presidential' | 'aggressive' | 'diplomatic' | 'bombastic' | 'terse' | 'populist' | 'pragmatic';

export interface Leader {
  name: string;
  handle: string;
  title: string;
  strategy: GameTheoryStrategy;
  style: LeaderStyle;
  followers: string; // display string like "48.2M"
  verified: boolean;
}

export const LEADERS: Record<string, Leader> = {
  'usa':          { name: 'The White House',   handle: '@WhiteHouse',      title: 'Office of the President', strategy: 'tit-for-tat',          style: 'presidential', followers: '18.4M', verified: true  },
  'china':        { name: 'Xinhua News',        handle: '@XHNews',           title: 'State Media',             strategy: 'exploiter',             style: 'diplomatic',   followers: '12.1M', verified: true  },
  'russia':       { name: 'Kremlin',            handle: '@KremlinRussia_E',  title: 'Office of the President', strategy: 'grudger',               style: 'aggressive',   followers: '4.8M',  verified: true  },
  'india':        { name: 'Narendra Modi',      handle: '@narendramodi',     title: 'Prime Minister of India', strategy: 'tit-for-tat-forgiving', style: 'populist',     followers: '101M',  verified: true  },
  'eu':           { name: 'Ursula von der Leyen',handle: '@vonderleyen',    title: 'EU Commission President', strategy: 'cooperative',           style: 'diplomatic',   followers: '2.1M',  verified: true  },
  'uk':           { name: '10 Downing Street',  handle: '@10DowningStreet',  title: 'Prime Minister',          strategy: 'tit-for-tat',          style: 'presidential', followers: '3.9M',  verified: true  },
  'japan':        { name: 'PM Kishida',         handle: '@kantei_en',        title: 'Prime Minister of Japan', strategy: 'tit-for-tat-forgiving', style: 'diplomatic',   followers: '1.8M',  verified: true  },
  'brazil':       { name: 'Lula da Silva',      handle: '@LulaOficial',      title: 'President of Brazil',     strategy: 'tit-for-tat-forgiving', style: 'populist',     followers: '6.7M',  verified: true  },
  'saudi-arabia': { name: 'Saudi State Media',  handle: '@SPAEnglish',       title: 'Kingdom of Saudi Arabia', strategy: 'exploiter',             style: 'pragmatic',    followers: '890K',  verified: true  },
  'iran':         { name: 'Ali Khamenei',       handle: '@khamenei_ir',      title: 'Supreme Leader of Iran',  strategy: 'grudger',               style: 'aggressive',   followers: '9.3M',  verified: true  },
  'israel':       { name: 'Israeli PM Office',  handle: '@IsraeliPM',        title: 'Prime Minister of Israel',strategy: 'tit-for-tat',          style: 'terse',        followers: '2.6M',  verified: true  },
  'south-korea':  { name: 'President Yoon',     handle: '@President_KR',     title: 'President of South Korea',strategy: 'tit-for-tat',          style: 'presidential', followers: '1.2M',  verified: true  },
  'taiwan':       { name: 'Taiwan President',   handle: '@iingwen',          title: 'President of Taiwan',     strategy: 'tit-for-tat-forgiving', style: 'diplomatic',   followers: '2.9M',  verified: true  },
  'north-korea':  { name: 'KCNA',               handle: '@KCNA_Watch',       title: 'State Media, DPRK',       strategy: 'always-defect',         style: 'bombastic',    followers: '44K',   verified: false },
  'pakistan':     { name: 'PM Pakistan',        handle: '@CMShehbaz',        title: 'Prime Minister',          strategy: 'random',                style: 'populist',     followers: '5.2M',  verified: true  },
  'turkey':       { name: 'Erdoğan',            handle: '@RTErdogan',        title: 'President of Turkey',     strategy: 'win-stay-lose-switch',  style: 'populist',     followers: '22.1M', verified: true  },
  'australia':    { name: 'PM Albanese',        handle: '@AlboMP',           title: 'Prime Minister',          strategy: 'tit-for-tat-forgiving', style: 'presidential', followers: '680K',  verified: true  },
  'indonesia':    { name: 'President Prabowo',  handle: '@prabowo',          title: 'President of Indonesia',  strategy: 'cooperative',           style: 'diplomatic',   followers: '8.8M',  verified: true  },
  'ukraine':      { name: 'Volodymyr Zelensky', handle: '@ZelenskyyUa',      title: 'President of Ukraine',    strategy: 'tit-for-tat',          style: 'populist',     followers: '7.4M',  verified: true  },
  'nigeria':      { name: 'Bola Tinubu',        handle: '@officialABAT',     title: 'President of Nigeria',    strategy: 'win-stay-lose-switch',  style: 'populist',     followers: '2.1M',  verified: true  },
};

// ─── Tweet content templates ────────────────────────────────────────────────
// Indexed by context. {player} and {target} are replaced at generation time.

export const TRADE_TWEETS = {
  target_positive: [
    "Productive trade negotiations with {player} concluded today. This bilateral agreement will benefit both our peoples. 🤝",
    "A landmark trade deal with {player} signals a new chapter of economic cooperation. Our industries will grow together.",
    "We welcome the trade framework agreed with {player}. Prosperity is best built through partnership, not confrontation.",
  ],
  target_neutral: [
    "Trade discussions with {player} continue. We will evaluate outcomes carefully against our national interests.",
    "Our trade teams have reached an initial framework with {player}. Details remain to be negotiated.",
  ],
  observer_hostile: [
    "{player}'s trade deal with {target} is a transparent attempt to build an economic cordon against us. It will fail.",
    "We note {player}'s growing economic entanglement with {target}. Strategic dependencies cut both ways.",
    "No trade agreement can mask {player}'s destabilizing agenda. The region sees through this.",
  ],
  observer_friendly: [
    "Congratulations to {player} and {target} on today's trade agreement. Economic cooperation builds peace.",
    "A strong signal: {player} and {target} choosing commerce over confrontation. This is the right path.",
  ],
};

export const AID_TWEETS = {
  target_positive: [
    "Deeply moved by {player}'s generous aid package. This is what genuine friendship between nations looks like.",
    "The humanitarian assistance from {player} arrives at a critical moment. Our people will not forget this solidarity. 🙏",
    "We thank {player} for this development partnership. True allies stand with you when it matters most.",
  ],
  observer_hostile: [
    "Another round of {player}'s neo-colonial 'aid.' The developing world deserves partners, not patrons.",
    "We see {player}'s so-called aid package for what it is: leverage disguised as charity.",
  ],
  observer_friendly: [
    "{player}'s aid to {target} is a reminder that strong nations lift others up. Commendable.",
    "International solidarity in action. Proud to see {player} stepping up for {target}.",
  ],
};

export const ALLIANCE_TWEETS = {
  target_positive: [
    "A historic day. Our formal alliance with {player} marks the beginning of a new era for our region. United we stand. 🤝",
    "The alliance signed today between {player} and {name} is built on shared values, mutual respect, and common purpose.",
    "To our new allies in {player}: this bond is unbreakable. History will record this as the moment everything changed.",
  ],
  observer_hostile: [
    "The {player}-{target} alliance is a naked provocation that threatens regional stability. We will respond accordingly.",
    "A hostile encirclement strategy masquerading as 'partnership.' We are not deceived.",
    "Let there be no doubt: {player}'s growing alliance network has consequences. They have been warned.",
  ],
  observer_friendly: [
    "Congratulations to {player} and {target}. A powerful alliance for a more stable world.",
    "This is what security architecture should look like. Solidarity, not isolation.",
  ],
};

export const SANCTION_TWEETS = {
  target: [
    "{player} has chosen economic warfare. Our people have survived worse. We will not bend.",
    "Sanctions are a declaration of economic war. {player} will bear full responsibility for the consequences.",
    "Every sanction {player} imposes only strengthens our resolve to build self-sufficient alternatives.",
    "{player}'s cowardly sanctions attack our civilians, not our leadership. History will judge this cruelty.",
  ],
  observer_hostile: [
    "We stand with {target} against {player}'s illegal economic coercion. Solidarity is not optional.",
    "{player}'s sanctions violate international law and will deepen regional instability. We condemn them.",
  ],
  observer_friendly: [
    "{player}'s targeted sanctions send a necessary message. Accountability must have teeth.",
    "We support {player}'s economic measures. Irresponsible behavior has consequences.",
  ],
};

export const WAR_TWEETS = {
  target: [
    "{player} has made the gravest miscalculation in modern history. Our response will be devastating and total.",
    "An act of war. Our armed forces are on full alert. {player} has chosen a path of destruction. 🔴",
    "This aggression will not stand. Every last inch of our territory will be defended. {player} has awoken a sleeping giant.",
    "To our allies: {player} has crossed every red line. We call on the international community to act.",
  ],
  observer_condemn: [
    "We condemn in the strongest possible terms {player}'s military aggression against {target}. This is a crime.",
    "The UN Charter is clear. {player}'s actions constitute a flagrant violation of international law. Cease immediately.",
    "No justification exists for this attack. The international community stands with {target}.",
    "Horrified by {player}'s military assault. We demand an immediate ceasefire and withdrawal.",
  ],
  observer_support: [
    "Our ally {player} has taken a difficult but necessary decision to restore security. We stand with them.",
    "{target}'s provocations left {player} with no choice. We support the right to self-defense.",
    "Sometimes difficult measures are necessary. We trust {player}'s judgment on matters of security.",
  ],
};

export const INTEL_TWEETS = {
  target: [
    "A cowardly act of sabotage by {player}'s intelligence services. We have identified the operatives.",
    "{player}'s espionage against us is confirmed. This constitutes an act of aggression. We will respond.",
    "Our security services have neutralized {player}'s covert operation. But the provocation has been noted.",
  ],
  observer_hostile: [
    "{player}'s spy networks are active across the region. No country with sovereignty is safe.",
  ],
};

export const PROPAGANDA_TWEETS = {
  target: [
    "{player}'s disinformation campaign has been exposed and dismantled. Their lies fool no one.",
    "The {player} information warfare operation targeting our citizens is an act of psychological aggression.",
    "We have documented {player}'s coordinated disinformation network. The evidence has been shared with allies.",
    "Our people are not naive. {player}'s propaganda fails because truth is stronger than lies. 🇺🇦",
  ],
};

export const MILITARY_TWEETS = {
  target: [
    "{player} has attacked us. Our armed forces are engaged. The aggressor will pay a heavy price. ⚔️",
    "A military strike by {player} killed our people. The world will not forget this war crime.",
    "{player} chose force. Now they will face our full military response. There will be no ceasefire.",
  ],
  observer_condemn: [
    "We call for immediate cessation of {player}'s military attacks on {target}. This cannot stand.",
    "Appalled by {player}'s strike on {target}. We demand accountability.",
  ],
  observer_support: [
    "We stand with our ally {player} in ensuring regional security.",
    "Proportional responses to threats are legitimate. We support {player}'s right to defend its interests.",
  ],
};

export const RESEARCH_TWEETS = {
  announcer: [
    "Proud to announce a major breakthrough in advanced defense research. The future belongs to the prepared. 🔬",
    "Our scientists have achieved what many thought impossible. {name}'s technological leadership is reaffirmed.",
    "A new era of strategic capability begins today. Rivals take note: we do not stand still. ⚡",
  ],
  observer_rival: [
    "We observe {player}'s military-technological advances with concern. The arms race they are forcing will destabilize the world.",
    "{player}'s research expansion changes the strategic calculus. We will not be left behind.",
  ],
  observer_friendly: [
    "Remarkable progress by {player}. Scientific leadership is the foundation of lasting security.",
    "Congratulations to {player} on this breakthrough. Knowledge shared is power multiplied. 🧬",
  ],
};

export const AMBIENT_TWEETS: Record<string, string[]> = {
  'russia-aggressive': [
    "NATO expansion will never be tolerated. History will absolve us.",
    "The West's 'rules-based order' is a fiction used to dominate. The world is waking up.",
    "We do not threaten. We state facts. Those who ignore them do so at their peril.",
    "Russia has never been defeated when truly united. Remember that.",
  ],
  'china-diplomatic': [
    "China's development does not come at the expense of others. Win-win cooperation is not rhetoric — it is policy.",
    "The Taiwan question is an internal affair of China. External interference will have consequences.",
    "Some powers fear a multipolar world because they cannot dominate it. Their anxiety is understandable.",
    "China's rise is peaceful. But do not mistake peace for passivity.",
  ],
  'north-korea-bombastic': [
    "Our nuclear deterrent is complete. Any aggressor will be met with fire and fury beyond imagination.",
    "The DPRK stands firm against imperialist pressure. We will never surrender our sovereignty. 🚀",
    "Our missile test was a complete success. The great general's strategy is infallible.",
    "Sanctions have failed. Military exercises have failed. The Democratic People's Republic endures.",
  ],
  'iran-aggressive': [
    "America's era of dominance in the Middle East is over. History is turning.",
    "The Zionist entity's days are numbered. Resistance always prevails.",
    "Every sanction imposed on us only reveals the bankruptcy of Western diplomacy.",
    "We have resisted for 45 years. We will resist for 45 more. Our resolve is not for sale.",
  ],
  'india-diplomatic': [
    "India's foreign policy is guided by our national interest and ancient wisdom. We choose partners, not masters.",
    "A billion people's aspirations cannot be contained. India's moment has arrived. 🇮🇳",
    "We believe in dialogue, not discord. In partnership, not dependence.",
    "India has always valued every nation's sovereignty. We expect the same in return.",
  ],
  'ukraine-populist': [
    "We are fighting not just for Ukraine but for the very idea that sovereignty matters.",
    "The world needs to understand: if aggression succeeds here, it succeeds everywhere.",
    "We are grateful to our allies. But Ukrainians are doing the fighting. Never forget that.",
    "Glory to Ukraine. The truth is our weapon and it never runs out of ammunition. 🇺🇦",
  ],
  'israel-terse': [
    "Israel has the right and the obligation to defend its citizens. No apology required.",
    "Our enemies mistake restraint for weakness. They will not make that mistake twice.",
    "The IDF operates with precision. Every response is proportional to the threat.",
  ],
};

// Intel hint templates — these are the "chess hints" shown as classified intercepts
export const INTEL_HINT_TEMPLATES = {
  rival_military_rising: (rivalName: string, mil: number, playerMil: number) =>
    `🔴 CLASSIFIED: ${rivalName} military power at ${mil} and rising. You are at ${playerMil}. They will escalate within 2-3 turns if this gap closes further. Strike or invest now.`,
  country_tipping: (countryName: string, stability: number) =>
    `🟡 ANALYST: ${countryName} stability at ${stability}% and declining. They will seek a new patron within 3 turns. An aid package now could lock in their alignment permanently.`,
  grudger_memory: (countryName: string) =>
    `🔴 PSYCH PROFILE: ${countryName} leadership has never forgotten past betrayals. They will defect at the first opportunity, regardless of current stance. Do not extend trust.`,
  alliance_window: (countryName: string, stability: number, influence: number) =>
    `🟢 OPPORTUNITY: ${countryName} at ${stability}% stability and warming. 50 INF secures a formal alliance. Window is narrow — rival envoys arrive next month. Act first.`,
  market_signal: (companyName: string, ticker: string, trend: string) =>
    `📊 MARKET INTEL: ${companyName} (${ticker}) showing ${trend} technical pattern. Geopolitical signals suggest continued movement. Position accordingly.`,
  exploit_weakness: (countryName: string) =>
    `🟡 STRATEGIC NOTE: ${countryName} shows exploiter behavior pattern. They will cooperate while you're strong. The moment you show weakness they defect. Never expose vulnerability.`,
  tit_for_tat_signal: (countryName: string) =>
    `🟢 BEHAVIORAL INTEL: ${countryName} runs pure tit-for-tat. Whatever you do to them, they do back — no more, no less. One cooperative gesture now resets the board entirely.`,
  nuclear_threshold: (countryName: string, sciVal: number) =>
    `🔴 PROLIFERATION ALERT: ${countryName} at ${sciVal} science. Nuclear threshold at ~200. If they cross it, military deterrence against them becomes extremely costly. Window to act: 3 turns.`,
};
