/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  ref, set, get, onValue, update, onDisconnect, DataSnapshot,
} from 'firebase/database';
import { db, getOrCreateUid, generateRoomCode } from './firebase.ts';

import { GameState } from '../types.ts';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RoomPlayer {
  uid: string;
  name: string;
  countryId: string;   // '' until they pick
  online: boolean;
  readyForTurn: boolean;
  isHost: boolean;
  lastSeen: number;
}

export interface RoomConfig {
  hostUid: string;
  started: boolean;
  createdAt: number;
}

export interface Room {
  config: RoomConfig;
  state?: GameState;
  players: Record<string, RoomPlayer>;
}

// ─── Room management ─────────────────────────────────────────────────────────

export async function createRoom(playerName: string): Promise<{ roomCode: string; uid: string }> {
  const uid = await getOrCreateUid();

  // Find a unique code
  let roomCode = generateRoomCode();
  for (let i = 0; i < 10; i++) {
    const snap = await get(ref(db, `games/${roomCode}/config`));
    if (!snap.exists()) break;
    roomCode = generateRoomCode();
  }

  const now = Date.now();
  await set(ref(db, `games/${roomCode}`), {
    config: { hostUid: uid, started: false, createdAt: now },
    players: {
      [uid]: { uid, name: playerName, countryId: '', online: true, readyForTurn: false, isHost: true, lastSeen: now },
    },
  });

  // Auto-mark offline if disconnected
  onDisconnect(ref(db, `games/${roomCode}/players/${uid}/online`)).set(false);

  return { roomCode, uid };
}

export async function joinRoom(
  roomCode: string,
  playerName: string,
): Promise<{ uid: string; error?: string }> {
  const uid = await getOrCreateUid();
  const upper = roomCode.toUpperCase().trim();

  const snap: DataSnapshot = await get(ref(db, `games/${upper}`));
  if (!snap.exists()) return { uid, error: 'Room not found. Check the code.' };

  const room = snap.val() as Room;
  if (room.config.started) return { uid, error: 'Game already in progress.' };

  const playerCount = Object.keys(room.players ?? {}).length;
  if (playerCount >= 6) return { uid, error: 'Room is full (max 6 players).' };

  const now = Date.now();
  await update(ref(db, `games/${upper}/players/${uid}`), {
    uid, name: playerName, countryId: '', online: true,
    readyForTurn: false, isHost: false, lastSeen: now,
  });

  onDisconnect(ref(db, `games/${upper}/players/${uid}/online`)).set(false);

  return { uid };
}

export async function selectCountry(roomCode: string, uid: string, countryId: string): Promise<void> {
  await update(ref(db, `games/${roomCode}/players/${uid}`), { countryId });
}

export async function startGame(roomCode: string, initialState: GameState): Promise<void> {
  await update(ref(db, `games/${roomCode}`), {
    'config/started': true,
    state: initialState,
  });
}

export async function pushState(roomCode: string, state: GameState): Promise<void> {
  await set(ref(db, `games/${roomCode}/state`), state);
}

export async function setPlayerReady(roomCode: string, uid: string, ready: boolean): Promise<void> {
  await update(ref(db, `games/${roomCode}/players/${uid}`), {
    readyForTurn: ready,
    lastSeen: Date.now(),
  });
}

export async function resetAllReady(roomCode: string): Promise<void> {
  const snap = await get(ref(db, `games/${roomCode}/players`));
  if (!snap.exists()) return;
  const updates: Record<string, boolean> = {};
  Object.keys(snap.val() as Record<string, unknown>).forEach(uid => {
    updates[`games/${roomCode}/players/${uid}/readyForTurn`] = false;
  });
  await update(ref(db, '/'), updates);
}

export function subscribeToRoom(
  roomCode: string,
  onChange: (room: Room | null) => void,
): () => void {
  const unsub = onValue(ref(db, `games/${roomCode}`), snap => {
    onChange(snap.exists() ? (snap.val() as Room) : null);
  });
  return unsub;
}
