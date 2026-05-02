/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from 'react';
import { Room, RoomPlayer, subscribeToRoom, pushState, setPlayerReady, resetAllReady } from './gameRoom.ts';
import { GameState } from '../types.ts';

export interface MultiplayerCtx {
  room: Room;
  uid: string;
  me: RoomPlayer | null;
  isHost: boolean;
  allReady: boolean;
  humanPlayers: RoomPlayer[];
}

export function useMultiplayer(roomCode: string | null, uid: string) {
  const [ctx, setCtx] = useState<MultiplayerCtx | null>(null);

  useEffect(() => {
    if (!roomCode || !uid) { setCtx(null); return; }

    const unsub = subscribeToRoom(roomCode, (room) => {
      if (!room) { setCtx(null); return; }
      const humanPlayers = Object.values(room.players ?? {});
      const me = humanPlayers.find(p => p.uid === uid) ?? null;
      const isHost = room.config.hostUid === uid;
      const allReady = humanPlayers.length >= 2 && humanPlayers.every(p => p.readyForTurn);
      setCtx({ room, uid, me, isHost, allReady, humanPlayers });
    });

    return unsub;
  }, [roomCode, uid]);

  const syncState = useCallback(async (state: GameState) => {
    if (roomCode) await pushState(roomCode, state);
  }, [roomCode]);

  const submitTurn = useCallback(async () => {
    if (roomCode && uid) await setPlayerReady(roomCode, uid, true);
  }, [roomCode, uid]);

  const clearReady = useCallback(async () => {
    if (roomCode) await resetAllReady(roomCode);
  }, [roomCode]);

  return { ctx, syncState, submitTurn, clearReady };
}
