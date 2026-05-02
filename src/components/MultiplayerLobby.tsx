/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Globe, Users, Copy, CheckCircle2, Loader2, Play, ArrowLeft } from 'lucide-react';
import { INITIAL_COUNTRIES } from '../constants.ts';
import { deserializeGameState } from '../multiplayer/deserialize.ts';
import { createRoom, joinRoom, selectCountry, startGame, Room, RoomPlayer } from '../multiplayer/gameRoom.ts';
import { subscribeToRoom } from '../multiplayer/gameRoom.ts';
import { useEffect } from 'react';
import { GameState } from '../types.ts';

interface Props {
  onGameStart: (roomCode: string, uid: string, countryId: string, isHost: boolean, initialState?: GameState) => void;
  onBack: () => void;
  prefillCode?: string;
}

const DIFFICULTY_COLOR = {
  Easy: 'text-emerald-400',
  Medium: 'text-yellow-400',
  Hard: 'text-orange-400',
  Extreme: 'text-red-400',
};

export function MultiplayerLobby({ onGameStart, onBack, prefillCode }: Props) {
  const [screen, setScreen] = useState<'home' | 'create' | 'join' | 'lobby'>(
    prefillCode ? 'join' : 'home'
  );
  const [playerName, setPlayerName] = useState('');
  const [joinCode, setJoinCode] = useState(prefillCode ?? '');
  const [roomCode, setRoomCode] = useState('');
  const [uid, setUid] = useState('');
  const [room, setRoom] = useState<Room | null>(null);
  const [selectedCountry, setSelectedCountry] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Subscribe to room once we're in it
  useEffect(() => {
    if (!roomCode) return;
    const unsub = subscribeToRoom(roomCode, setRoom);
    return unsub;
  }, [roomCode]);

  const takenCountries = Object.values(room?.players ?? {}).map(p => p.countryId).filter(Boolean);
  const shareUrl = roomCode ? `${window.location.origin}${window.location.pathname}?room=${roomCode}` : '';

  const handleCreate = async () => {
    if (!playerName.trim()) { setError('Enter your name first.'); return; }
    setLoading(true); setError('');
    try {
      const result = await createRoom(playerName.trim());
      setRoomCode(result.roomCode);
      setUid(result.uid);
      setScreen('lobby');
    } catch (e: any) {
      setError(`Failed to create room: ${e?.message ?? 'Check your connection.'}`);
    }
    setLoading(false);
  };

  const handleJoin = async () => {
    if (!playerName.trim()) { setError('Enter your name first.'); return; }
    if (!joinCode.trim()) { setError('Enter the room code.'); return; }
    setLoading(true); setError('');
    try {
      const result = await joinRoom(joinCode.trim(), playerName.trim());
      if (result.error) { setError(result.error); setLoading(false); return; }
      setRoomCode(joinCode.trim().toUpperCase());
      setUid(result.uid);
      setScreen('lobby');
    } catch (e: any) {
      setError(`Failed to join: ${e?.message ?? 'Check the code and try again.'}`);
    }
    setLoading(false);
  };

  const handleSelectCountry = async (countryId: string) => {
    if (!roomCode || !uid) return;
    setSelectedCountry(countryId);
    await selectCountry(roomCode, uid, countryId);
  };

  const handleStartGame = async () => {
    if (!selectedCountry) { setError('Pick your country first.'); return; }
    const myPlayer = room?.players[uid];
    if (!myPlayer?.isHost) return;

    // Build initial state — each human player controls their country, rest are AI
    const { INITIAL_COUNTRIES: IC, RIVAL_COUNTRIES, getInitialStance } = await import('../constants.ts');
    const { INITIAL_STOCKS } = await import('../stockMarket.ts');
    const { INITIAL_NUCLEAR_PROGRAMS, INITIAL_REGIONAL_CONFLICTS } = await import('../constants.ts');

    const players = Object.values(room!.players);
    const rivals = RIVAL_COUNTRIES[selectedCountry] ?? [];

    const countries = IC.map(c => {
      const humanPlayer = players.find(p => p.countryId === c.id);
      if (humanPlayer) {
        // Another human picked this country
        const stance = getInitialStance(selectedCountry, c.id);
        return { ...c, alignment: (rivals.includes(c.id) ? 'Rival-Aligned' : 'Neutral') as any, stanceTowardsPlayer: stance };
      }
      if (c.id === selectedCountry) {
        return { ...c, alignment: 'Player-Aligned' as const, stanceTowardsPlayer: 'Ally' as const };
      }
      const stance = getInitialStance(selectedCountry, c.id);
      return { ...c, alignment: (rivals.includes(c.id) ? 'Rival-Aligned' : 'Neutral') as any, stanceTowardsPlayer: stance };
    });

    const initialState: GameState = {
      gameStarted: true,
      turn: 1,
      playerCountryId: selectedCountry,
      countries,
      events: [],
      newsLog: [`Room ${roomCode} — ${players.length} leaders enter the arena.`],
      actionHistory: [],
      unlockedTechIds: [],
      history: [],
      stocks: INITIAL_STOCKS.map(s => ({ ...s, priceHistory: [] })),
      portfolio: [],
      tweetFeed: [],
      nuclearPrograms: INITIAL_NUCLEAR_PROGRAMS.map(p => ({ ...p })),
      spaceAchievements: [],
      regionalConflicts: INITIAL_REGIONAL_CONFLICTS.map(c => ({ ...c })),
      worldTension: 45,
    };

    await startGame(roomCode, initialState);
    onGameStart(roomCode, uid, selectedCountry, true, initialState);
  };

  // Non-host: detect game start from Firebase
  // Watch both config.started AND room.state so we catch the state when it arrives
  useEffect(() => {
    if (!room?.config?.started || !uid || !selectedCountry) return;
    const myPlayer = room?.players?.[uid];
    if (myPlayer?.isHost) return; // host already started
    if (!room.state) return;      // wait for host to push state
    // Deserialize: Firebase converts arrays → numbered objects; this fixes it
    const safeState = deserializeGameState(room.state);
    onGameStart(roomCode, uid, selectedCountry, false, {
      ...safeState,
      playerCountryId: selectedCountry,
    });
  }, [room?.config?.started, !!room?.state]);

  const copyCode = () => {
    navigator.clipboard.writeText(shareUrl || roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[200] bg-slate-950 flex flex-col overflow-y-auto">
      <div className="max-w-2xl w-full mx-auto px-4 py-8 flex-1">

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <button onClick={screen === 'home' ? onBack : () => setScreen('home')}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all">
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Users size={16} className="text-white" />
            </div>
            <span className="font-black text-white uppercase tracking-tight">Multiplayer</span>
          </div>
        </div>

        <AnimatePresence mode="wait">

          {/* HOME */}
          {screen === 'home' && (
            <motion.div key="home" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
              <h1 className="text-3xl font-black text-white mb-2">Play with Friends</h1>
              <p className="text-slate-400 mb-8">Each player controls a different country. One world, multiple leaders.</p>
              <button onClick={() => setScreen('create')}
                className="w-full p-5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-lg transition-all shadow-xl shadow-blue-900/30 flex items-center justify-between">
                <span>Create Room</span>
                <Globe size={24} />
              </button>
              <button onClick={() => setScreen('join')}
                className="w-full p-5 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-black text-lg transition-all border border-slate-700 flex items-center justify-between">
                <span>Join with Code</span>
                <Users size={24} />
              </button>
            </motion.div>
          )}

          {/* CREATE */}
          {screen === 'create' && (
            <motion.div key="create" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
              <h2 className="text-2xl font-black text-white">Create a Room</h2>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Your Name</label>
                <input value={playerName} onChange={e => setPlayerName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleCreate()}
                  placeholder="Enter your name..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 outline-none focus:border-blue-500 transition-all" />
              </div>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <button onClick={handleCreate} disabled={loading}
                className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-black rounded-xl transition-all flex items-center justify-center gap-2">
                {loading ? <Loader2 size={18} className="animate-spin" /> : <><Play size={18} /> Create Room</>}
              </button>
            </motion.div>
          )}

          {/* JOIN */}
          {screen === 'join' && (
            <motion.div key="join" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
              <h2 className="text-2xl font-black text-white">Join a Room</h2>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Room Code</label>
                <input value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="e.g. INDIA7"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 outline-none focus:border-blue-500 font-mono text-lg tracking-widest uppercase transition-all" />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Your Name</label>
                <input value={playerName} onChange={e => setPlayerName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleJoin()}
                  placeholder="Enter your name..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 outline-none focus:border-blue-500 transition-all" />
              </div>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <button onClick={handleJoin} disabled={loading}
                className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-black rounded-xl transition-all flex items-center justify-center gap-2">
                {loading ? <Loader2 size={18} className="animate-spin" /> : <><Users size={18} /> Join Game</>}
              </button>
            </motion.div>
          )}

          {/* LOBBY */}
          {screen === 'lobby' && room && (
            <motion.div key="lobby" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">

              {/* Room code + share */}
              <div className="p-4 bg-slate-900 border border-blue-500/30 rounded-2xl">
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Room Code</div>
                <div className="flex items-center gap-3">
                  <span className="text-3xl font-black text-white font-mono tracking-widest">{roomCode}</span>
                  <button onClick={copyCode} className="ml-auto flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-bold text-slate-300 transition-all">
                    {copied ? <><CheckCircle2 size={14} className="text-emerald-400" /> Copied!</> : <><Copy size={14} /> Copy Link</>}
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">Share this code or link with friends</p>
              </div>

              {/* Players */}
              <div>
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">
                  Players ({Object.keys(room.players).length}/6)
                </div>
                <div className="space-y-2">
                  {Object.values(room.players).map(p => (
                    <div key={p.uid} className="flex items-center gap-3 p-3 bg-slate-900 border border-slate-800 rounded-xl">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${p.online ? 'bg-emerald-500' : 'bg-slate-600'}`} />
                      <span className="text-white font-bold flex-1">{p.name}</span>
                      {p.isHost && <span className="text-[9px] font-black uppercase text-amber-400 bg-amber-950/30 border border-amber-500/20 px-2 py-0.5 rounded">HOST</span>}
                      {p.countryId ? (
                        <span className="text-sm">{INITIAL_COUNTRIES.find(c => c.id === p.countryId)?.flag ?? '🌐'}</span>
                      ) : (
                        <span className="text-[10px] text-slate-500 italic">picking…</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Country picker */}
              <div>
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">
                  {selectedCountry ? 'Your Country' : 'Pick Your Country'}
                </div>
                <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
                  {INITIAL_COUNTRIES.map(c => {
                    const taken = takenCountries.includes(c.id) && c.id !== selectedCountry;
                    const mine = c.id === selectedCountry;
                    return (
                      <button key={c.id} onClick={() => !taken && handleSelectCountry(c.id)}
                        disabled={taken}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          mine    ? 'border-blue-500 bg-blue-950/30' :
                          taken   ? 'border-slate-800 opacity-30 cursor-not-allowed' :
                          'border-slate-800 hover:border-slate-600 bg-slate-900/50'
                        }`}>
                        <div className="text-xl mb-1">{c.flag}</div>
                        <div className="text-xs font-black text-white truncate">{c.name}</div>
                        <div className={`text-[9px] font-bold ${DIFFICULTY_COLOR[c.difficulty]}`}>{c.difficulty}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {error && <p className="text-red-400 text-sm">{error}</p>}

              {/* Start / waiting */}
              {room.players[uid]?.isHost ? (
                <button onClick={handleStartGame} disabled={!selectedCountry}
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-black rounded-xl transition-all flex items-center justify-center gap-2 text-base">
                  <Play size={20} fill="currentColor" /> Start Game
                </button>
              ) : (
                <div className="text-center py-4 text-slate-400 text-sm animate-pulse">
                  {selectedCountry ? 'Waiting for host to start…' : 'Pick a country, then wait for host.'}
                </div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
