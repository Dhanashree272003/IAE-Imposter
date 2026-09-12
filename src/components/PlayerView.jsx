import React, { useEffect, useState } from 'react';
import { playSound } from '../utils/sound';
import { User, Shield, Lock, Send, Clock, CheckCircle2, AlertCircle, HelpCircle, Sparkles, Trophy } from 'lucide-react';

const AVATAR_OPTIONS = ['🤖', '👾', '🕵️', '⚡', '🔮', '🚀', '🦊', '🛡️', '💎', '🐉'];

export default function PlayerView({ socket, roomState, privateRole, onJoinRoom, onSubmitAnswer, onSubmitVote }) {
  const [playerName, setPlayerName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('🤖');
  const [answerInput, setAnswerInput] = useState('');
  const [selectedSuspect, setSelectedSuspect] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [hasJoined, setHasJoined] = useState(false);
  const [myPlayerId, setMyPlayerId] = useState('');

  const {
    roomId,
    phase = 'LOBBY',
    players = [],
    currentRound = 1,
    timer = 0,
    aiQuestion = '',
    answers = {},
    finalResult = null
  } = roomState || {};

  // Check saved session for auto-join / reconnection
  useEffect(() => {
    const savedId = localStorage.getItem('imposter_player_id');
    const savedRoom = localStorage.getItem('imposter_room_id');
    const queryParams = new URLSearchParams(window.location.search);
    const roomFromUrl = queryParams.get('room') || savedRoom;

    if (savedId && roomFromUrl && socket && !hasJoined) {
      socket.emit('reconnect_player', { roomId: roomFromUrl, playerId: savedId }, (res) => {
        if (res.success) {
          setHasJoined(true);
          setMyPlayerId(savedId);
        }
      });
    }
  }, [socket, hasJoined]);

  // Read query param room code from URL
  const queryParams = new URLSearchParams(window.location.search);
  const rawRoomParam = (queryParams.get('room') || '').trim();
  const roomCodeFromUrl = (rawRoomParam && rawRoomParam.toLowerCase() !== 'undefined' && rawRoomParam.toLowerCase() !== 'null')
    ? rawRoomParam.toUpperCase()
    : '';

  const isQrJoin = Boolean(roomCodeFromUrl);
  const [inputRoomId, setInputRoomId] = useState(roomCodeFromUrl || roomId || '');

  const handleJoin = (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!playerName.trim()) {
      setErrorMsg('Please enter your display name.');
      return;
    }

    const targetRoomId = (isQrJoin ? roomCodeFromUrl : inputRoomId).trim().toUpperCase();
    if (!targetRoomId || targetRoomId === 'UNDEFINED' || targetRoomId === 'NULL') {
      setErrorMsg('Please enter a valid room code.');
      return;
    }

    const avatarToSend = selectedAvatar || '🤖';
    const existingId = localStorage.getItem('imposter_player_id');
    onJoinRoom({ roomId: targetRoomId, name: playerName.trim(), avatar: avatarToSend, playerId: existingId }, (res) => {
      if (res.success) {
        setHasJoined(true);
        setMyPlayerId(res.playerId);
        localStorage.setItem('imposter_player_id', res.playerId);
        localStorage.setItem('imposter_room_id', res.roomId);
      } else {
        setErrorMsg(res.error || 'Failed to join room.');
      }
    });
  };

  const handleAnswerSubmit = (e) => {
    e.preventDefault();
    if (!answerInput.trim()) return;
    onSubmitAnswer(answerInput.trim(), (res) => {
      if (res.success) {
        playSound.submit();
      } else {
        setErrorMsg(res.error || 'Failed to submit answer.');
      }
    });
  };

  const handleVoteSubmit = () => {
    if (!selectedSuspect) return;
    onSubmitVote(selectedSuspect, (res) => {
      if (res.success) {
        playSound.submit();
      } else {
        setErrorMsg(res.error || 'Failed to submit vote.');
      }
    });
  };

  // Find current player info
  const myPlayer = players.find(p => p.id === myPlayerId);
  const hasSubmittedAnswer = Boolean(myPlayer?.hasSubmittedAnswer);
  const hasVoted = Boolean(myPlayer?.hasVoted);

  // Other players to vote for (exclude self)
  const voteCandidates = players.filter(p => p.id !== myPlayerId);

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 p-4 flex flex-col justify-between max-w-md mx-auto relative select-none">
      {/* Top Mobile Bar */}
      <header className="flex justify-between items-center glass-panel px-5 py-3 rounded-2xl mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-cyan-400" />
          <span className="font-black text-sm text-cyan-400 tracking-wider">AI IMPOSTER</span>
        </div>
        {hasJoined && (
          <div className="flex items-center gap-3">
            <span className="text-xl">{myPlayer?.avatar || selectedAvatar || '🤖'}</span>
            <span className="font-bold text-sm text-slate-200">{myPlayer?.name || playerName}</span>
          </div>
        )}
      </header>

      {/* MAIN MOBILE SCREEN FLOW */}
      <main className="flex-1 flex flex-col justify-center my-2">
        {/* ================= 1. JOIN SCREEN ================= */}
        {!hasJoined && (
          <form onSubmit={handleJoin} className="glass-panel p-6 rounded-3xl space-y-5 animate-fade-in">
            <div className="text-center space-y-1">
              <h2 className="text-2xl font-black tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
                JOIN AI IMPOSTER
              </h2>
              <p className="text-xs text-slate-400">Enter your display name to join the game</p>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {isQrJoin ? (
              <div className="p-3.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex justify-between items-center text-xs">
                <span className="text-slate-400 font-mono uppercase font-bold tracking-wider">Joining Room</span>
                <span className="font-mono font-black text-cyan-400 text-base tracking-widest">{roomCodeFromUrl}</span>
              </div>
            ) : (
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Room Code *</label>
                <input
                  type="text"
                  value={inputRoomId}
                  onChange={(e) => setInputRoomId(e.target.value.toUpperCase())}
                  placeholder="e.g. TECH7"
                  className="w-full bg-slate-900 border border-slate-700 focus:border-cyan-400 rounded-xl px-4 py-3 font-mono font-bold text-cyan-400 text-lg uppercase tracking-wider outline-none"
                />
              </div>
            )}

            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Your Display Name *</label>
              <input
                type="text"
                maxLength={20}
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Enter your name..."
                className="w-full bg-slate-900 border border-slate-700 focus:border-cyan-400 rounded-xl px-4 py-3 font-bold text-slate-100 outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Avatar (Optional)</label>
              <div className="grid grid-cols-5 gap-2">
                {AVATAR_OPTIONS.map((av) => (
                  <button
                    key={av}
                    type="button"
                    onClick={() => setSelectedAvatar(av)}
                    className={`text-2xl p-2 rounded-xl border transition-all ${
                      selectedAvatar === av
                        ? 'bg-cyan-500/20 border-cyan-400 scale-110 shadow-lg shadow-cyan-500/20'
                        : 'bg-slate-900 border-slate-800 opacity-70 hover:opacity-100'
                    }`}
                  >
                    {av}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-lg tracking-wider transition-all shadow-lg shadow-cyan-500/20"
            >
              JOIN GAME
            </button>
          </form>
        )}

        {/* ================= 2. LOBBY / WAITING SCREEN ================= */}
        {hasJoined && phase === 'LOBBY' && (
          <div className="glass-panel p-8 rounded-3xl text-center space-y-6 animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto animate-bounce">
              <Clock className="w-8 h-8 text-cyan-400" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-slate-100">YOU'RE IN!</h3>
              <p className="text-sm text-slate-400">
                Connected to Room <span className="font-mono font-bold text-cyan-400">{roomId}</span>
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-400">
              Please watch the exhibition big screen. The host will start the game shortly.
            </div>
          </div>
        )}

        {/* ================= 3. ROLE & SECRET REVEAL SCREEN ================= */}
        {hasJoined && (phase === 'ROLE_ASSIGNMENT' || (privateRole && (phase.includes('ROUND') || phase.includes('VOTING')))) && (
          <div className="space-y-4 animate-fade-in">
            {privateRole?.isImposter ? (
              /* IMPOSTER CARD */
              <div className="glass-panel-imposter p-6 rounded-3xl text-center space-y-4">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-500/20 text-rose-300 font-black text-xs border border-rose-500/40 uppercase tracking-widest">
                  <Shield className="w-4 h-4" /> PRIVATE ROLE
                </div>
                <h3 className="text-3xl font-black text-rose-500 tracking-wider">
                  🔴 YOU ARE THE IMPOSTER
                </h3>
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-rose-500/30 text-left">
                  <span className="text-xs text-rose-400 uppercase font-mono font-bold block mb-1">Your Useful Hint</span>
                  <p className="text-sm font-medium text-rose-100 leading-relaxed">
                    "{privateRole.hint}"
                  </p>
                </div>
                <p className="text-xs text-slate-400 italic">
                  💡 Keep your phone screen hidden! Blend in with answers based on your hint.
                </p>
              </div>
            ) : (
              /* REGULAR PLAYER CARD */
              <div className="glass-panel-glow p-6 rounded-3xl text-center space-y-4">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/20 text-cyan-300 font-black text-xs border border-cyan-500/40 uppercase tracking-widest">
                  <Lock className="w-4 h-4" /> PRIVATE SECRET WORD
                </div>
                <div>
                  <span className="text-xs text-slate-400 uppercase font-mono tracking-wider block">YOUR SECRET WORD</span>
                  <h3 className="text-4xl font-black text-cyan-300 tracking-widest font-mono mt-1">
                    🔐 {privateRole?.secretWord}
                  </h3>
                </div>
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-cyan-500/30 text-left">
                  <span className="text-xs text-cyan-400 uppercase font-mono font-bold block mb-1">Brief Description</span>
                  <p className="text-xs font-medium text-slate-200 leading-relaxed">
                    {privateRole?.description}
                  </p>
                </div>
                <p className="text-xs text-slate-400 italic">
                  🔒 Do NOT reveal your secret word to anyone!
                </p>
              </div>
            )}
          </div>
        )}

        {/* ================= 4. QUESTION READ PHASE ================= */}
        {hasJoined && (phase === 'ROUND_1_QUESTION' || phase === 'ROUND_2_QUESTION') && (
          <div className="glass-panel p-6 rounded-3xl text-center space-y-4 mt-4 animate-fade-in">
            <span className="text-xs text-purple-400 font-mono font-bold uppercase tracking-widest block">
              ROUND {currentRound} • QUESTION READ
            </span>
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-lg font-bold text-slate-100">
              "{aiQuestion}"
            </div>
            <div className="text-3xl font-black font-mono text-purple-400 animate-pulse">{timer}s</div>
            <p className="text-xs text-slate-400">Prepare your answer. Typing phase will open next.</p>
          </div>
        )}

        {/* ================= 5. ANSWER TYPING PHASE ================= */}
        {hasJoined && (phase === 'ROUND_1_ANSWER' || phase === 'ROUND_2_ANSWER') && (
          <div className="glass-panel p-6 rounded-3xl space-y-4 mt-4 animate-fade-in">
            <div className="flex justify-between items-center">
              <span className="text-xs text-cyan-400 font-mono font-bold uppercase tracking-widest">
                ROUND {currentRound} • TYPE ANSWER
              </span>
              <span className="text-xl font-mono font-black text-cyan-400">{timer}s</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
              <span className="font-bold text-cyan-400 block mb-1">Question:</span> "{aiQuestion}"
            </div>

            {!hasSubmittedAnswer ? (
              <form onSubmit={handleAnswerSubmit} className="space-y-4">
                <textarea
                  maxLength={100}
                  rows={3}
                  value={answerInput}
                  onChange={(e) => setAnswerInput(e.target.value)}
                  placeholder="Type your short answer here (approx 1-2 phrases)..."
                  className="w-full bg-slate-900 border border-slate-700 focus:border-cyan-400 rounded-2xl p-4 text-sm text-slate-100 outline-none resize-none"
                ></textarea>
                <div className="flex justify-between text-xs text-slate-500 px-1">
                  <span>Short responses encouraged</span>
                  <span>{answerInput.length}/100</span>
                </div>
                <button
                  type="submit"
                  disabled={!answerInput.trim()}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-base tracking-wider transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  <Send className="w-5 h-5" /> SUBMIT ANSWER
                </button>
              </form>
            ) : (
              <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/40 text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                <h4 className="font-black text-emerald-300 text-lg">ANSWER SUBMITTED</h4>
                <p className="text-xs text-slate-400">Waiting for other players to finish typing...</p>
              </div>
            )}
          </div>
        )}

        {/* ================= 6. ANALYSIS PHASE ================= */}
        {hasJoined && (phase === 'ROUND_1_ANALYSIS' || phase === 'ROUND_2_ANALYSIS') && (
          <div className="glass-panel p-6 rounded-3xl space-y-4 mt-4 animate-fade-in">
            <div className="flex justify-between items-center">
              <span className="text-xs text-purple-400 font-mono font-bold uppercase tracking-widest">
                ROUND {currentRound} • ANALYZE ANSWERS
              </span>
              <span className="text-xl font-mono font-black text-purple-400">{timer}s</span>
            </div>

            <p className="text-xs text-slate-300">
              Read all submitted answers on the exhibition screen or below to decide who sounds like the Imposter!
            </p>

            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {players.map((p) => (
                <div key={p.id} className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-left">
                  <div className="font-bold text-xs text-slate-300 flex items-center gap-2 mb-1">
                    <span>{p.avatar}</span> <span>{p.name}</span>
                  </div>
                  <p className="text-xs text-cyan-300 italic">
                    "{answers[p.id] || 'No answer submitted'}"
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= 7. PRIVATE VOTING PHASE ================= */}
        {hasJoined && (phase === 'ROUND_1_VOTING' || phase === 'ROUND_2_VOTING') && (
          <div className="glass-panel-imposter p-6 rounded-3xl space-y-4 mt-4 animate-fade-in">
            <div className="flex justify-between items-center">
              <span className="text-xs text-rose-400 font-mono font-bold uppercase tracking-widest">
                ROUND {currentRound} • PRIVATE VOTE
              </span>
              <span className="text-2xl font-mono font-black text-rose-500">{timer}s</span>
            </div>

            {!hasVoted ? (
              <div className="space-y-4">
                <h4 className="text-lg font-black text-slate-100 text-center">
                  WHO DO YOU SUSPECT IS THE IMPOSTER?
                </h4>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {voteCandidates.map((cand) => (
                    <button
                      key={cand.id}
                      type="button"
                      onClick={() => setSelectedSuspect(cand.id)}
                      className={`w-full p-4 rounded-2xl border text-left flex items-center justify-between transition-all ${
                        selectedSuspect === cand.id
                          ? 'bg-rose-500/20 border-rose-500 text-rose-200 shadow-md shadow-rose-500/20'
                          : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3 font-bold text-sm">
                        <span className="text-2xl">{cand.avatar}</span>
                        <span>{cand.name}</span>
                      </div>
                      {selectedSuspect === cand.id && (
                        <CheckCircle2 className="w-5 h-5 text-rose-400" />
                      )}
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleVoteSubmit}
                  disabled={!selectedSuspect}
                  className={`w-full py-4 rounded-2xl font-black text-base tracking-wider transition-all shadow-lg ${
                    selectedSuspect
                      ? 'bg-rose-500 hover:bg-rose-400 text-slate-950 shadow-rose-500/30'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  }`}
                >
                  SUBMIT CONFIDENTIAL VOTE
                </button>
              </div>
            ) : (
              <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/40 text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-rose-400 mx-auto" />
                <h4 className="font-black text-rose-300 text-lg">VOTE SUBMITTED</h4>
                <p className="text-xs text-slate-400">Your vote has been sent securely to the backend.</p>
              </div>
            )}
          </div>
        )}

        {/* ================= 8. FINAL REVEAL VIEW ================= */}
        {hasJoined && (phase === 'FINAL_REVEAL' || phase === 'GAME_COMPLETE') && (
          <div className="glass-panel p-6 rounded-3xl text-center space-y-4 mt-4 animate-fade-in">
            <Trophy className="w-12 h-12 text-amber-400 mx-auto animate-bounce" />
            <h3 className="text-2xl font-black text-slate-100">GAME OVER</h3>
            <p className="text-xs text-slate-300">
              Look at the Exhibition Big Screen for the dramatic final reveal and winner announcement!
            </p>
          </div>
        )}
      </main>

      {/* Footer Info */}
      <footer className="text-center text-[10px] font-mono text-slate-500 py-2 border-t border-slate-800/80">
        ROOM: <span className="text-cyan-400 font-bold">{roomId || '---'}</span> • PHONE INTERFACE
      </footer>
    </div>
  );
}
