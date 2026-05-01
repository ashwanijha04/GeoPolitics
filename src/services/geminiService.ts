/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, Type } from "@google/genai";
import { GameState, GameEvent } from "../types.ts";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generateNewsEvent(gameState: GameState): Promise<Partial<GameEvent>> {
  const playerCountry = gameState.countries.find(c => c.id === gameState.playerCountryId);
  const rivalCountry = gameState.countries.find(c => c.id === 'rival');

  const prompt = `
    You are a geopolitical simulation engine. Based on the current world state, generate a significant event.
    Current Turn: ${gameState.turn}
    Active Player Leader of: ${playerCountry?.name}
    
    Player Stats: GDP: ${playerCountry?.resources.gdp}T, Stability: ${playerCountry?.resources.stability}%, Military: ${playerCountry?.resources.militaryPower}
    Rival Country: ${rivalCountry?.name} (GDP: ${rivalCountry?.resources.gdp}T, Military: ${rivalCountry?.resources.militaryPower})

    Recent Events: ${gameState.newsLog.slice(-3).join(', ')}

    You MUST generate either a Global Event or a Domestic Crisis for the player's country (${playerCountry?.name}).
    Identify a tension, political scandal, economic opportunity, or military threat.
    
    If it is a Domestic Crisis, the 'impactedCountryId' MUST be '${gameState.playerCountryId}'.
    Examples: Labor strikes in your capital, a legislative breakthrough, stock market crash, or a popular uprising.
  `;

  const fallbackEvents: any[] = [
    { title: "Consolidation of Power", description: "Internal political shifts stabilize the current administration's grip on the region.", resource: "stability", valueChange: 5 },
    { title: "Supply Chain Bottleneck", description: "Logistical delays in major shipping lanes cause a slight economic slowdown.", resource: "gdp", valueChange: -0.2 },
    { title: "Strategic Reserve Update", description: "Modernization of reserve forces increases readiness across all sectors.", resource: "militaryPower", valueChange: 2 },
    { title: "Diplomatic Outreach", description: "A series of successful summits improves our standing with regional partners.", resource: "influence", valueChange: 10 },
    { title: "Tech Sector Expansion", description: "Breakthroughs in consumer technology provide a boost to national science output.", resource: "science", valueChange: 15 }
  ];

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["title", "description", "impactedCountryId", "resource", "valueChange"],
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            impactedCountryId: { type: Type.STRING, description: "ID of the most affected country: usa, rival, euro, pan-asia, global-south" },
            resource: { type: Type.STRING, description: "Resource to change: gdp, stability, militaryPower, influence, science" },
            valueChange: { type: Type.NUMBER, description: "Numerical change (e.g. -5, 10)" },
            type: { type: Type.STRING, enum: ["Global", "Regional", "Domestic"] }
          }
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.warn("Gemini Quota/Error - Using fallback event:", error);
    const event = fallbackEvents[Math.floor(Math.random() * fallbackEvents.length)];
    return {
      ...event,
      impactedCountryId: gameState.playerCountryId,
      type: "Domestic"
    };
  }
}

export async function getAdvisorAdvice(gameState: GameState, advisorRole: string): Promise<string> {
  const playerCountry = gameState.countries.find(c => c.id === gameState.playerCountryId);
  const recentEvents = gameState.newsLog.slice(-3).join('. ');
  
  const roleContext = {
    'Military': 'Focus on threats, troop readiness, and global power projection. Suggest strikes or alliances if necessary.',
    'Economic': 'Focus on GDP growth, trade stability, and maintenance costs. Suggest trade or sanctions.',
    'Intelligence': 'Focus on shadow operations, propaganda, and rival country stability. Suggest intel or propaganda.'
  }[advisorRole as 'Military' | 'Economic' | 'Intelligence'] || '';

  const fallbackAdvice: Record<string, string[]> = {
    'Military': [
      "Our strike groups are at optimal readiness. I recommend maintaining a forward presence in contested zones.",
      "Intelligence suggests rival military expansion. We should prioritize R&D to maintain our technological lead.",
      "The theater is volatile. Any direct action must be calculated to avoid total escalation."
    ],
    'Economic': [
      "Our GDP growth remains steady, but maintenance costs are rising. Trade expansion is our best path forward.",
      "Economic stability is the bedrock of our power. I advise caution with sanctions that could rebound.",
      "The scientific sector is hungry for funding. Long-term prosperity depends on our breakthrough capabilities."
    ],
    'Intelligence': [
      "Information is the ultimate weapon. A propaganda campaign could weaken our rivals without firing a shot.",
      "We are seeing ripples of instability in rival territories. It may be time to deploy deep-cover assets.",
      "Our global influence is our greatest shield. Diplomacy and intel operations should remain our priority."
    ]
  };

  const prompt = `
    You are the ${advisorRole} Advisor for the ${playerCountry?.name}.
    Role Mission: ${roleContext}
    
    Current stats: GDP: ${playerCountry?.resources.gdp}T, Science: ${playerCountry?.resources.science}, Military: ${playerCountry?.resources.militaryPower}, Stability: ${playerCountry?.resources.stability}%
    Recent News: ${recentEvents}
    
    Global Landscape: ${JSON.stringify(gameState.countries.map(c => ({ name: c.name, stance: c.stanceTowardsPlayer, stability: c.resources.stability })))}

    Provide a direct, high-stakes strategic directive (max 2-3 short sentences). Tone should be urgent and professional.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview", 
      contents: prompt,
    });

    return response.text.trim();
  } catch (error) {
    console.warn("Gemini Quota/Error - Using fallback advice:", error);
    const options = fallbackAdvice[advisorRole] || ["Awaiting clear intelligence feeds. Proceed with current operational parameters."];
    return options[Math.floor(Math.random() * options.length)];
  }
}
