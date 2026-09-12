import React, { useState } from 'react';
import { Shield, Users, Play, RefreshCw, QrCode, Monitor, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function HostView({ socket, roomState, onCreateRoom, onSetImposterCount, onStartGame, onPlayAgain }) {
  const [errorMsg, setErrorMsg] = useState('');

  const {
    roomId,
    hostIp,
    port,
    phase = 'LOBBY',
    players = [],
    imposterCountSetting = 1,
    currentRound = 1,
    timer = 0
  } = roomState || {};

  const handleImposterChange = (count) => {
    setErrorMsg('');
    if (players.length > 0 && count === 2 && players.length < 5) {
      setErrorMsg('2 Imposters option requires at least 5 players.');
    }
    onSetImposterCount(count);
  };

  const handleStart = () => {
    setErrorMsg('');
    if (players.length < 3) {
      setErrorMsg('At least 3 players are required to start the game.');
      return;
    }
    if (imposterCountSetting === 2 && players.length < 5) {
      setErrorMsg('At least 5 players are required for 2 Imposters.');
      return;
    }
    onStartGame();
  };

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 p-6 flex flex-col items-center justify-center">
      {!roomId ? (
        /* CREATE GAME INITIALIZER */
        <div className="w-full max-w-lg glass-panel p-10 rounded-3xl text-center shadow-2xl flex flex-col items-center">
          <div className="p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-2xl mb-6">
            <Monitor className="w-12 h-12 text-cyan-400" />
          </div>
          <h1 className="text-3xl font-black text-slate-100 mb-2">HOST CONTROL PANEL</h1>
          <p className="text-slate-400 text-sm mb-8">
            Create a new exhibition room. A single QR code will be generated on the exhibition screen for all players to join.
          </p>

          <button
            onClick={() => onCreateRoom(1)}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-lg tracking-wider transition-all shadow-lg hover:shadow-cyan-500/25 flex items-center justify-center gap-2"
          >
            <Play className="w-6 h-6 fill-current" /> CREATE NEW GAME ROOM
          </button>
        </div>
      ) : (
        /* ACTIVE HOST CONTROL PANEL */
        <div className="w-full max-w-3xl glass-panel p-8 rounded-3xl shadow-2xl">
          {/* Top Bar */}
          <div className="flex justify-between items-center pb-6 mb-6 border-b border-slate-800">
            <div>
              <span className="text-xs text-slate-400 uppercase font-mono font-bold tracking-wider">ROOM CODE</span>
              <div className="text-4xl font-black font-mono text-cyan-400 tracking-widest">{roomId}</div>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  const displayUrl = `${window.location.origin}/display?room=${encodeURIComponent(roomId)}`;
                  window.open(displayUrl, '_blank');
                }}
                className="px-4 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-bold hover:bg-cyan-500/20 transition-all flex items-center gap-1.5"
              >
                <Monitor className="w-4 h-4" /> Open Display View ↗
              </button>
              <div className="text-right">
                <span className="text-xs text-slate-400 uppercase font-mono tracking-wider block">CURRENT PHASE</span>
                <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 font-mono font-bold text-sm border border-purple-500/40 inline-block mt-1">
                  {phase} {timer > 0 ? `(${timer}s)` : ''}
                </span>
              </div>
            </div>
          </div>

          {errorMsg && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/40 text-rose-300 text-sm mb-6 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* LOBBY CONTROLS */}
          {phase === 'LOBBY' ? (
            <div className="space-y-6">
              {/* Imposter Count Selector */}
              <div className="glass-panel p-6 rounded-2xl">
                <label className="text-sm font-bold text-slate-300 uppercase tracking-wider block mb-3 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-rose-400" /> SELECT NUMBER OF IMPOSTERS
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => handleImposterChange(1)}
                    className={`py-4 px-6 rounded-xl border text-center font-bold text-lg transition-all flex items-center justify-center gap-2 ${
                      imposterCountSetting === 1
                        ? 'bg-rose-500/20 border-rose-500 text-rose-200 shadow-lg shadow-rose-500/20'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <Shield className="w-5 h-5" /> 1 Imposter
                  </button>

                  <button
                    type="button"
                    onClick={() => handleImposterChange(2)}
                    className={`py-4 px-6 rounded-xl border text-center font-bold text-lg transition-all flex items-center justify-center gap-2 ${
                      imposterCountSetting === 2
                        ? 'bg-rose-500/20 border-rose-500 text-rose-200 shadow-lg shadow-rose-500/20'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <Shield className="w-5 h-5" /> <Shield className="w-5 h-5" /> 2 Imposters
                  </button>
                </div>
                <p className="text-xs text-slate-400 mt-2 font-medium">
                  Note: 2 Imposters mode requires at least 5 joined players.
                </p>
              </div>

              {/* Joined Players Status */}
              <div className="glass-panel p-6 rounded-2xl">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <Users className="w-5 h-5 text-cyan-400" /> Joined Players ({players.length} / 10)
                  </h3>
                  {players.length >= 3 ? (
                    <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> Ready to Start
                    </span>
                  ) : (
                    <span className="text-xs text-amber-400 font-bold">Need at least 3 players</span>
                  )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {players.map((p, i) => (
                    <div key={p.id} className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-3">
                      <span className="text-2xl">{p.avatar}</span>
                      <div className="truncate">
                        <div className="font-bold text-sm truncate">{p.name}</div>
                        <div className="text-xs text-slate-500">Player #{i + 1}</div>
                      </div>
                    </div>
                  ))}
                  {players.length === 0 && (
                    <div className="col-span-full py-8 text-center text-slate-500 text-sm">
                      Waiting for players to scan QR code on exhibition screen...
                    </div>
                  )}
                </div>
              </div>

              {/* Start Game Action */}
              <button
                onClick={handleStart}
                disabled={players.length < 3}
                className={`w-full py-5 rounded-2xl font-black text-xl tracking-wider transition-all shadow-xl flex items-center justify-center gap-3 ${
                  players.length >= 3
                    ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 shadow-emerald-500/20'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                }`}
              >
                <Play className="w-7 h-7 fill-current" /> START GAME NOW
              </button>
            </div>
          ) : (
            /* GAME IN PROGRESS / COMPLETE CONTROL MONITOR */
            <div className="space-y-6 text-center">
              <div className="glass-panel p-8 rounded-2xl flex flex-col items-center">
                <span className="text-xs font-mono text-cyan-400 uppercase font-bold tracking-widest block mb-2">
                  ROUND {currentRound} ACTIVE
                </span>
                <h3 className="text-2xl font-black text-slate-100 mb-2">Game is currently running</h3>
                <p className="text-slate-400 text-sm max-w-md">
                  All gameplay progress is displayed on the Big Exhibition Screen and synchronized with players' mobile phones.
                </p>

                {phase === 'GAME_COMPLETE' && (
                  <button
                    onClick={onPlayAgain}
                    className="mt-6 py-4 px-8 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-lg flex items-center gap-2 shadow-lg transition-all"
                  >
                    <RefreshCw className="w-5 h-5" /> PLAY AGAIN / NEW GAME
                  </button>
                )}
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400 text-left">
                🔒 Privacy Guarantee: Secret words, individual player roles, and silent backend scores are hidden from the host interface.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
