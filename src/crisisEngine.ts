/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Crisis Events: random player-decision points that fire based on game state.
 * Each crisis has 3-4 choices with different costs, risks, and consequences.
 * These are the "chess forks" — no perfect answer, only trade-offs.
 */

import { GameState, ActiveCrisis, DiplomaticStance } from './types.ts';

function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)); }

export function generateCrisis(state: GameState): ActiveCrisis | null {
  if (state.activeCrisis) return null; // one at a time

  const player = state.countries.find(c => c.id === state.playerCountryId);
  if (!player) return null;

  const candidates: ActiveCrisis[] = [];

  // ── Nuclear breakout approaching ────────────────────────────────────────
  const nearNuclear = (state.nuclearPrograms ?? []).find(p =>
    p.progress >= 80 &&
    !state.countries.find(c => c.id === p.countryId)?.nuclearArmed
  );
  if (nearNuclear && Math.random() < 0.55) {
    const c = state.countries.find(x => x.id === nearNuclear.countryId);
    if (c) {
      candidates.push({
        id: `nuclear-${c.id}`,
        turn: state.turn,
        title: `${c.flag} ${c.name}: Nuclear Threshold`,
        description: `Intelligence confirms ${c.name} is ${nearNuclear.progress.toFixed(0)}% toward weaponization. Estimated ${Math.ceil((100 - nearNuclear.progress) / 5)} turns to first device. Every major power is watching your response. The window to act is closing.`,
        urgency: nearNuclear.progress > 90 ? 'critical' : 'high',
        relatedCountryId: c.id,
        options: [
          {
            id: 'strike',
            label: '⚔️ Authorize Military Strike',
            description: `Conduct precision strikes on nuclear facilities. Costs 35 MIL. Sets their program back significantly. High risk of retaliation.`,
            consequence: `Your forces destroy key facilities. ${c.name} program set back, but they vow revenge. Regional tensions spike.`,
          },
          {
            id: 'un',
            label: '🏛 Emergency UN Resolution',
            description: `Push for emergency Security Council action. Costs 35 INF. Requires P5 support. Freezes program if passed.`,
            consequence: `International pressure applied. Program slowed — but diplomatic capital spent.`,
          },
          {
            id: 'diplomacy',
            label: '🤝 Back-Channel Diplomacy',
            description: `Secret talks offering sanctions relief in exchange for freeze. Costs 40 INF. 45% chance of success.`,
            consequence: ``,
          },
          {
            id: 'accept',
            label: '🚫 Accept Nuclear Reality',
            description: `Acknowledge the situation, adjust deterrence posture. Lose influence with allies, gain goodwill from ${c.name}.`,
            consequence: `You accept the new status quo. Allies are deeply disappointed. ${c.name} goes nuclear.`,
          },
        ],
      });
    }
  }

  // ── Ally under military attack ───────────────────────────────────────────
  const attackedAlly = state.countries.find(c =>
    c.stanceTowardsPlayer === 'Ally' &&
    c.id !== state.playerCountryId &&
    c.resources.stability < 50 &&
    c.resources.militaryPower < player.resources.militaryPower * 0.6
  );
  if (attackedAlly && Math.random() < 0.40) {
    candidates.push({
      id: `ally-attack-${attackedAlly.id}`,
      turn: state.turn,
      title: `${attackedAlly.flag} ${attackedAlly.name}: Ally Under Attack`,
      description: `${attackedAlly.name} is under sustained pressure and their military is crumbling. As your formal ally, they are invoking your mutual defense obligations. Your credibility as a security guarantor is on the line.`,
      urgency: 'high',
      relatedCountryId: attackedAlly.id,
      options: [
        {
          id: 'defend',
          label: '🛡 Deploy Forces (Full Defense)',
          description: `Send military assets. Costs 20 MIL. ${attackedAlly.name} gets +20 military and +15 stability. Sends a clear signal.`,
          consequence: `Your forces arrive. ${attackedAlly.name} stabilizes. Your military credibility is intact.`,
        },
        {
          id: 'arms',
          label: '📦 Emergency Arms Package',
          description: `Rush weapons and supplies. Costs 1.5 GDP and 20 SCI. ${attackedAlly.name} gets +25 MIL.`,
          consequence: `Equipment arrives. ${attackedAlly.name} can now defend itself — for now.`,
        },
        {
          id: 'diplomatic',
          label: '📢 Condemn & Sanction Attacker',
          description: `Public condemnation + economic sanctions on the aggressor. Costs 20 INF. Limited military effect but builds coalition.`,
          consequence: `International condemnation flows. Economic pressure begins. Your ally is grateful but unsure.`,
        },
        {
          id: 'abandon',
          label: '❌ Refuse to Intervene',
          description: `Stay out of it. Your ally will remember. Alliance credibility collapses. Other allies will notice.`,
          consequence: `You decline. ${attackedAlly.name} faces its fate alone. Three other allies downgrade their trust in you.`,
        },
      ],
    });
  }

  // ── State on the brink of collapse ─────────────────────────────────────
  const collapsingState = state.countries.find(c =>
    c.id !== state.playerCountryId &&
    c.resources.stability < 20 &&
    c.resources.gdp < 3
  );
  if (collapsingState && Math.random() < 0.45) {
    candidates.push({
      id: `collapse-${collapsingState.id}`,
      turn: state.turn,
      title: `${collapsingState.flag} ${collapsingState.name}: State Collapse Imminent`,
      description: `${collapsingState.name} is in freefall. Stability at ${collapsingState.resources.stability}%, GDP at $${collapsingState.resources.gdp.toFixed(1)}T. A failed state on your strategic periphery creates a vacuum — either you fill it, or rivals will.`,
      urgency: 'high',
      relatedCountryId: collapsingState.id,
      options: [
        {
          id: 'bailout',
          label: '💰 Emergency Financial Bailout',
          description: `Inject $2T into their economy. Saves the state, earns lasting loyalty. Expensive.`,
          consequence: `Your intervention stabilizes the government. Grateful leadership looks to you for guidance.`,
        },
        {
          id: 'aid',
          label: '🤝 Humanitarian Aid & Advisors',
          description: `Send 1.0 GDP in aid plus advisors. Moderate stabilization, builds relationship.`,
          consequence: `Aid flows. Conditions improve slightly. They remember who showed up.`,
        },
        {
          id: 'exploit',
          label: '🏭 Secure Resource Contracts',
          description: `Offer aid conditioned on exclusive resource agreements. Costs 0.5 GDP, gain economic leverage.`,
          consequence: `A deal is struck. Their resources flow to you in exchange for stability support.`,
        },
        {
          id: 'ignore',
          label: '👁 Monitor & Let Play Out',
          description: `Watch without intervening. A rival may step in. Free — but costly in terms of influence.`,
          consequence: `You observe. Another power moves in and fills the vacuum. Your influence in the region weakens.`,
        },
      ],
    });
  }

  // ── Rival economic overtake ──────────────────────────────────────────────
  const rival = state.countries.find(c =>
    (c.stanceTowardsPlayer === 'Hostile' || c.stanceTowardsPlayer === 'At War') &&
    c.resources.gdp > player.resources.gdp * 0.9
  );
  if (rival && Math.random() < 0.35) {
    candidates.push({
      id: `econ-rival-${rival.id}`,
      turn: state.turn,
      title: `${rival.flag} ${rival.name}: Economic Parity Reached`,
      description: `${rival.name}'s GDP has reached $${rival.resources.gdp.toFixed(1)}T — nearly matching your $${player.resources.gdp.toFixed(1)}T. Economic parity enables them to fund a military buildup that threatens your position. History shows what happens when rivals close the gap.`,
      urgency: 'high',
      relatedCountryId: rival.id,
      options: [
        {
          id: 'sanctions',
          label: '⛔ Comprehensive Sanctions Package',
          description: `Maximum economic pressure campaign. Hit their GDP hard. May trigger counter-sanctions.`,
          consequence: `Sanctions bite. Their growth stalls — but they retaliate with counter-sanctions.`,
        },
        {
          id: 'tech-race',
          label: '🔬 Emergency Technology Sprint',
          description: `Invest 3 GDP into accelerated R&D. +40 SCI, +10 MIL. Maintain tech lead.`,
          consequence: `Your scientists work around the clock. You maintain the technological edge that matters most.`,
        },
        {
          id: 'coalition',
          label: '🤝 Build Economic Coalition Against Them',
          description: `Rally allies to coordinate trade restrictions. Costs 40 INF. Multiplied effect if supported.`,
          consequence: `A coalition forms. Coordinated pressure is far more effective than unilateral action.`,
        },
        {
          id: 'compete',
          label: '📈 Accelerate Your Own Growth',
          description: `Focus on domestic economic expansion. Use trade deals aggressively. Costs 20 INF.`,
          consequence: `You choose to outgrow the competition rather than restrict it. The race accelerates.`,
        },
      ],
    });
  }

  // ── Defection: your ally is wavering ────────────────────────────────────
  const waveringAlly = state.countries.find(c =>
    c.stanceTowardsPlayer === 'Friendly' &&
    c.resources.stability < 55 &&
    c.id !== state.playerCountryId &&
    Math.random() < 0.15
  );
  if (waveringAlly && Math.random() < 0.30) {
    candidates.push({
      id: `wavering-${waveringAlly.id}`,
      turn: state.turn,
      title: `${waveringAlly.flag} ${waveringAlly.name}: Shifting Allegiances`,
      description: `${waveringAlly.name} is under economic stress and rival powers are offering tempting alternatives. Their leadership is holding backchannel conversations with your rivals. You have a narrow window to reinforce this relationship before they pivot.`,
      urgency: 'medium',
      relatedCountryId: waveringAlly.id,
      options: [
        {
          id: 'alliance',
          label: '🤝 Formalize Alliance (50 INF)',
          description: `Lock them in with a formal alliance before they drift. Costs 50 INF. Permanent commitment.`,
          consequence: `Papers are signed. Their wavering ends. Rivals are shut out.`,
        },
        {
          id: 'economic',
          label: '💵 Emergency Economic Package (1.5 GDP)',
          description: `Show financial commitment. Boosts their stability significantly and earns deep loyalty.`,
          consequence: `Money talks. Their government stabilizes and firmly aligns with you.`,
        },
        {
          id: 'warn',
          label: '⚠️ Issue a Firm Warning',
          description: `Tell them publicly that defection has consequences. Free — risky. May backfire.`,
          consequence: `The message is delivered. Received with resentment. May accelerate their drift.`,
        },
        {
          id: 'ignore',
          label: '🚫 Call Their Bluff',
          description: `Do nothing. See if they follow through. Risk: they might.`,
          consequence: `You gamble on their loyalty. The rival makes an offer they can't refuse.`,
        },
      ],
    });
  }

  // ── World tension near breaking point ────────────────────────────────────
  if ((state.worldTension ?? 0) >= 75 && Math.random() < 0.50) {
    candidates.push({
      id: `tension-${state.turn}`,
      turn: state.turn,
      title: '⚡ World on the Brink',
      description: `Global tensions are at historic highs. Multiple flashpoints are active simultaneously. One miscalculation could cascade into a global conflict. The international community is looking for leadership. This is your moment to de-escalate — or escalate to your advantage.`,
      urgency: 'critical',
      options: [
        {
          id: 'summit',
          label: '🌐 Convene Emergency Global Summit',
          description: `Host a multilateral conference. Costs 50 INF. If you have any Ally, tension drops -25.`,
          consequence: `Leaders gather. The world steps back from the edge — for now. Your statesmanship is noted.`,
        },
        {
          id: 'ceasefire',
          label: '🕊 Broker Ceasefires in Active Conflicts',
          description: `Use influence to pause active wars. Costs 30 INF. Reduces tension -15.`,
          consequence: `Guns fall quiet in several theaters. Brief respite. Tensions ease slightly.`,
        },
        {
          id: 'dominate',
          label: '⚔️ Seize the Moment — Strike First',
          description: `Use the instability to target your weakest rival. High risk, potentially decisive.`,
          consequence: `You launch. The world is stunned — but you acted while others hesitated.`,
        },
        {
          id: 'warn',
          label: '📡 Broadcast Nuclear Readiness',
          description: `Signal deterrence. Costs nothing. Your rivals pause. Tension rises 10 but rivals stand down.`,
          consequence: `The message is received. Nobody escalates further — nobody cooperates either.`,
        },
      ],
    });
  }

  if (candidates.length === 0) return null;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

export function applyCrisisChoice(
  state: GameState,
  crisisId: string,
  optionId: string,
): { updatedState: Partial<GameState>; resultMessage: string } {
  const player = state.countries.find(c => c.id === state.playerCountryId);
  const crisis = state.activeCrisis;
  if (!player || !crisis) return { updatedState: {}, resultMessage: '' };

  const countries = state.countries.map(c => ({ ...c, resources: { ...c.resources } }));
  const playerIdx = countries.findIndex(c => c.id === state.playerCountryId);
  const relatedIdx = crisis.relatedCountryId
    ? countries.findIndex(c => c.id === crisis.relatedCountryId)
    : -1;

  let worldTension = state.worldTension ?? 50;
  let message = crisis.options.find(o => o.id === optionId)?.consequence ?? '';
  let newNuclearPrograms = [...(state.nuclearPrograms ?? [])];

  // ── Nuclear crisis responses ─────────────────────────────────────────────
  if (crisisId.startsWith('nuclear-')) {
    if (optionId === 'strike' && playerIdx !== -1) {
      countries[playerIdx].resources.militaryPower = Math.max(0, countries[playerIdx].resources.militaryPower - 35);
      if (relatedIdx !== -1) {
        countries[relatedIdx].resources.militaryPower = Math.max(0, countries[relatedIdx].resources.militaryPower - 30);
        countries[relatedIdx].stanceTowardsPlayer = 'Hostile';
      }
      newNuclearPrograms = newNuclearPrograms.map(p =>
        p.countryId === crisis.relatedCountryId ? { ...p, progress: Math.max(20, p.progress - 50) } : p
      );
      worldTension = clamp(worldTension + 20, 0, 100);
    } else if (optionId === 'un' && playerIdx !== -1) {
      countries[playerIdx].resources.influence = Math.max(0, countries[playerIdx].resources.influence - 35);
      if (relatedIdx !== -1) {
        countries[relatedIdx].resources.stability = Math.max(0, countries[relatedIdx].resources.stability - 20);
        countries[relatedIdx].resources.influence = Math.max(0, countries[relatedIdx].resources.influence - 15);
      }
      newNuclearPrograms = newNuclearPrograms.map(p =>
        p.countryId === crisis.relatedCountryId ? { ...p, progress: Math.max(p.progress, p.progress) } : p
      );
    } else if (optionId === 'diplomacy' && playerIdx !== -1) {
      countries[playerIdx].resources.influence = Math.max(0, countries[playerIdx].resources.influence - 40);
      const success = Math.random() < 0.45;
      if (success) {
        message = `Back-channel talks succeed. ${crisis.relatedCountryId} agrees to a temporary freeze. Program advance halved for 4 turns.`;
        // This effect would be tracked separately; for now just cap progress
        newNuclearPrograms = newNuclearPrograms.map(p =>
          p.countryId === crisis.relatedCountryId ? { ...p, progress: p.progress } : p
        );
      } else {
        message = `Diplomacy failed. No agreement reached. Your 40 INF was spent for nothing. They continue.`;
      }
    } else if (optionId === 'accept') {
      if (playerIdx !== -1) countries[playerIdx].resources.influence = Math.max(0, countries[playerIdx].resources.influence - 15);
      if (relatedIdx !== -1) {
        countries[relatedIdx].resources.influence = Math.min(100, countries[relatedIdx].resources.influence + 10);
        newNuclearPrograms = newNuclearPrograms.map(p =>
          p.countryId === crisis.relatedCountryId ? { ...p, progress: 100 } : p
        );
      }
    }
  }

  // ── Ally under attack ────────────────────────────────────────────────────
  else if (crisisId.startsWith('ally-attack-')) {
    if (optionId === 'defend' && playerIdx !== -1) {
      countries[playerIdx].resources.militaryPower = Math.max(0, countries[playerIdx].resources.militaryPower - 20);
      if (relatedIdx !== -1) {
        countries[relatedIdx].resources.militaryPower = Math.min(200, countries[relatedIdx].resources.militaryPower + 20);
        countries[relatedIdx].resources.stability = Math.min(100, countries[relatedIdx].resources.stability + 15);
      }
    } else if (optionId === 'arms' && playerIdx !== -1) {
      countries[playerIdx].resources.gdp = Math.max(0, Number((countries[playerIdx].resources.gdp - 1.5).toFixed(2)));
      countries[playerIdx].resources.science = Math.max(0, countries[playerIdx].resources.science - 20);
      if (relatedIdx !== -1) countries[relatedIdx].resources.militaryPower = Math.min(200, countries[relatedIdx].resources.militaryPower + 25);
    } else if (optionId === 'diplomatic' && playerIdx !== -1) {
      countries[playerIdx].resources.influence = Math.max(0, countries[playerIdx].resources.influence - 20);
    } else if (optionId === 'abandon') {
      // Downgrade 3 friendly/ally countries
      let downgraded = 0;
      for (let i = 0; i < countries.length && downgraded < 3; i++) {
        if (countries[i].stanceTowardsPlayer === 'Ally' || countries[i].stanceTowardsPlayer === 'Friendly') {
          const stances: DiplomaticStance[] = ['Ally', 'Friendly', 'Neutral', 'Suspicious', 'Hostile', 'At War'];
          const idx2 = stances.indexOf(countries[i].stanceTowardsPlayer);
          countries[i] = { ...countries[i], stanceTowardsPlayer: stances[Math.min(stances.length - 1, idx2 + 1)] };
          downgraded++;
        }
      }
      worldTension = clamp(worldTension + 10, 0, 100);
    }
  }

  // ── State collapse ────────────────────────────────────────────────────────
  else if (crisisId.startsWith('collapse-')) {
    if (optionId === 'bailout' && playerIdx !== -1) {
      countries[playerIdx].resources.gdp = Math.max(0, Number((countries[playerIdx].resources.gdp - 2).toFixed(2)));
      if (relatedIdx !== -1) {
        countries[relatedIdx].resources.gdp = Number((countries[relatedIdx].resources.gdp + 1.5).toFixed(2));
        countries[relatedIdx].resources.stability = Math.min(100, countries[relatedIdx].resources.stability + 25);
        countries[relatedIdx].stanceTowardsPlayer = 'Friendly';
      }
    } else if (optionId === 'aid' && playerIdx !== -1) {
      countries[playerIdx].resources.gdp = Math.max(0, Number((countries[playerIdx].resources.gdp - 1.0).toFixed(2)));
      if (relatedIdx !== -1) {
        countries[relatedIdx].resources.stability = Math.min(100, countries[relatedIdx].resources.stability + 12);
      }
    } else if (optionId === 'exploit' && playerIdx !== -1) {
      countries[playerIdx].resources.gdp = Math.max(0, Number((countries[playerIdx].resources.gdp - 0.5).toFixed(2)));
      countries[playerIdx].resources.gdp = Number((countries[playerIdx].resources.gdp + 0.3).toFixed(2));
      if (relatedIdx !== -1) countries[relatedIdx].resources.stability = Math.min(100, countries[relatedIdx].resources.stability + 8);
    } else {
      // ignore — rival fills vacuum
      if (playerIdx !== -1) countries[playerIdx].resources.influence = Math.max(0, countries[playerIdx].resources.influence - 10);
      if (relatedIdx !== -1) countries[relatedIdx].stanceTowardsPlayer = 'Suspicious';
    }
  }

  // ── Economic rival ────────────────────────────────────────────────────────
  else if (crisisId.startsWith('econ-rival-')) {
    if (optionId === 'sanctions') {
      if (relatedIdx !== -1) countries[relatedIdx].resources.gdp = Number((countries[relatedIdx].resources.gdp * 0.90).toFixed(2));
      if (playerIdx !== -1) countries[playerIdx].resources.gdp = Number((countries[playerIdx].resources.gdp * 0.97).toFixed(2)); // counter-sanction
      worldTension = clamp(worldTension + 10, 0, 100);
    } else if (optionId === 'tech-race' && playerIdx !== -1) {
      countries[playerIdx].resources.gdp = Math.max(0, Number((countries[playerIdx].resources.gdp - 3).toFixed(2)));
      countries[playerIdx].resources.science = Math.min(9999, countries[playerIdx].resources.science + 40);
      countries[playerIdx].resources.militaryPower = Math.min(200, countries[playerIdx].resources.militaryPower + 10);
    } else if (optionId === 'coalition' && playerIdx !== -1) {
      countries[playerIdx].resources.influence = Math.max(0, countries[playerIdx].resources.influence - 40);
      if (relatedIdx !== -1) countries[relatedIdx].resources.gdp = Number((countries[relatedIdx].resources.gdp * 0.92).toFixed(2));
      worldTension = clamp(worldTension + 5, 0, 100);
    } else if (optionId === 'compete' && playerIdx !== -1) {
      countries[playerIdx].resources.influence = Math.max(0, countries[playerIdx].resources.influence - 20);
      countries[playerIdx].resources.gdp = Number((countries[playerIdx].resources.gdp + 0.5).toFixed(2));
    }
  }

  // ── Wavering ally ─────────────────────────────────────────────────────────
  else if (crisisId.startsWith('wavering-')) {
    if (optionId === 'alliance' && playerIdx !== -1) {
      countries[playerIdx].resources.influence = Math.max(0, countries[playerIdx].resources.influence - 50);
      if (relatedIdx !== -1) countries[relatedIdx].stanceTowardsPlayer = 'Ally';
    } else if (optionId === 'economic' && playerIdx !== -1) {
      countries[playerIdx].resources.gdp = Math.max(0, Number((countries[playerIdx].resources.gdp - 1.5).toFixed(2)));
      if (relatedIdx !== -1) {
        countries[relatedIdx].resources.stability = Math.min(100, countries[relatedIdx].resources.stability + 15);
        countries[relatedIdx].stanceTowardsPlayer = 'Friendly';
      }
    } else if (optionId === 'warn') {
      if (relatedIdx !== -1) countries[relatedIdx].stanceTowardsPlayer = 'Suspicious';
    } else if (optionId === 'ignore') {
      if (relatedIdx !== -1) countries[relatedIdx].stanceTowardsPlayer = 'Neutral';
    }
  }

  // ── World tension ─────────────────────────────────────────────────────────
  else if (crisisId.startsWith('tension-')) {
    if (optionId === 'summit' && playerIdx !== -1) {
      countries[playerIdx].resources.influence = Math.max(0, countries[playerIdx].resources.influence - 50);
      worldTension = clamp(worldTension - 25, 0, 100);
    } else if (optionId === 'ceasefire' && playerIdx !== -1) {
      countries[playerIdx].resources.influence = Math.max(0, countries[playerIdx].resources.influence - 30);
      worldTension = clamp(worldTension - 15, 0, 100);
    } else if (optionId === 'dominate') {
      worldTension = clamp(worldTension + 15, 0, 100);
    } else if (optionId === 'warn') {
      worldTension = clamp(worldTension + 10, 0, 100);
    }
  }

  return {
    updatedState: {
      countries,
      worldTension,
      nuclearPrograms: newNuclearPrograms,
      activeCrisis: undefined,
    },
    resultMessage: message,
  };
}
