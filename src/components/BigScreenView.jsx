import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { playSound } from '../utils/sound';
import { Users, Shield, Flame, Award, HelpCircle, CheckCircle2, Clock, Sparkles, AlertCircle } from 'lucide-react';

export default function BigScreenView({ roomState }) {
  const qrCanvasRef = useRef(null);
  const [revealStep, setRevealStep] = useState(0);

  const {
    roomId,
    hostIp,
    port,
    phase = 'LOBBY',
    players = [],
    imposterCountSetting = 1,
    currentRound = 1,
    timer = 0,
    timerDuration = 30,
    aiQuestion = '',
    answers = {},
    finalResult = null
  } = roomState || {};

  // Validate roomId to prevent generating broken/undefined QR codes
  const validRoomId = (roomId && roomId !== 'undefined' && roomId !== 'null' && String(roomId).trim() !== '')
    ? String(roomId).trim().toUpperCase()
    : null;

  // Build mobile join URL:
  // - On local network: use hostIp:port from server (phones can't resolve 'localhost')
  // - On production: use window.location.origin (Vercel domain)
  const isLocalDev = typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  const qrBase = (isLocalDev && hostIp && hostIp !== 'localhost' && port)
    ? `http://${hostIp}:${port}`
    : (typeof window !== 'undefined' ? window.location.origin : '');
  const joinUrl = (validRoomId && qrBase)
    ? `${qrBase}/join?room=${encodeURIComponent(validRoomId)}`
    : '';

  // Generate QR Code on canvas safely
  useEffect(() => {
    if (!validRoomId) {
      console.warn('[BigScreenView] Room ID unavailable, skipping QR code generation.');
      return;
    }

    if (qrCanvasRef.current && joinUrl) {
      QRCode.toCanvas(
        qrCanvasRef.current,
        joinUrl,
        {
          width: 260,
          margin: 2,
          color: {
            dark: '#00f0ff',
            light: '#0b1329',
          },
        },
        (err) => {
          if (err) console.error('[BigScreenView] QR code generation error:', err);
        }
      );
    }
  }, [joinUrl, validRoomId, phase]);

  // Audio timer ticks
  useEffect(() => {
    if (timer > 0 && timer <= 5) {
      playSound.tick();
    }
  }, [timer]);

  // Dramatic final reveal sequence driver
  useEffect(() => {
    if (phase === 'FINAL_REVEAL') {
      setRevealStep(1); // "You think you've caught the Imposter..."
      
      const t1 = setTimeout(() => {
        setRevealStep(2); // "Let's see..."
        playSound.suspensePulse(180);
      }, 3000);

      const t2 = setTimeout(() => {
        setRevealStep(3); // Countdown 3
        playSound.suspensePulse(240);
      }, 5500);

      const t3 = setTimeout(() => {
        setRevealStep(4); // Countdown 2
        playSound.suspensePulse(300);
      }, 7000);

      const t4 = setTimeout(() => {
        setRevealStep(5); // Countdown 1
        playSound.suspensePulse(360);
      }, 8500);

      const t5 = setTimeout(() => {
        setRevealStep(6); // Final Big Reveal!
        if (finalResult?.isImposterCaught) {
          playSound.victory();
        } else {
          playSound.imposterWin();
        }
      }, 10000);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
        clearTimeout(t4);
        clearTimeout(t5);
      };
    } else {
      setRevealStep(0);
    }
  }, [phase, finalResult]);

  // Timer ring percentage calculation
  const timerPercentage = timerDuration > 0 ? (timer / timerDuration) * 100 : 0;

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 p-6 flex flex-col justify-between select-none relative overflow-hidden">
      {/* Dynamic Background Glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Header Banner */}
      <header className="flex justify-between items-center z-10 glass-panel px-8 py-4 rounded-2xl mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-xl">
            <Flame className="w-8 h-8 text-cyan-400 animate-pulse" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-500">
              AI IMPOSTER
            </h1>
            <p className="text-xs text-slate-400 tracking-widest uppercase font-semibold">Exhibition & Office Arena</p>
          </div>
        </div>

        {/* Room Code Badge */}
        <div className="flex items-center gap-6">
          <div className="text-right">
            <span className="text-xs text-slate-400 uppercase font-mono tracking-wider">Room Code</span>
            <div className="text-3xl font-black font-mono text-cyan-400 tracking-widest">{validRoomId || '---'}</div>
          </div>
          <div className="h-10 w-px bg-slate-800"></div>
          <div className="text-right">
            <span className="text-xs text-slate-400 uppercase font-mono tracking-wider">Imposters</span>
            <div className="text-xl font-bold text-rose-400 flex items-center justify-end gap-1">
              <Shield className="w-5 h-5" /> {imposterCountSetting}
            </div>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT CONTAINER */}
      <main className="flex-1 flex flex-col justify-center items-center z-10 my-4">
        {/* ================= 1. LOBBY PHASE ================= */}
        {phase === 'LOBBY' && (
          <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            {/* QR CODE BOX */}
            <div className="md:col-span-5 flex flex-col items-center glass-panel-glow p-8 rounded-3xl text-center shadow-2xl">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-semibold text-xs mb-4 uppercase tracking-wider">
                <Sparkles className="w-4 h-4" /> Scan Phone QR Code
              </span>

              {validRoomId ? (
                <>
                  <div className="p-4 bg-[#0b1329] rounded-2xl border border-cyan-500/30 shadow-inner mb-4">
                    <canvas ref={qrCanvasRef} className="rounded-xl"></canvas>
                  </div>
                  <p className="text-sm font-mono text-slate-300 break-all bg-slate-900/80 px-4 py-2 rounded-lg border border-slate-800">
                    {joinUrl}
                  </p>
                  <p className="text-xs text-slate-400 mt-2 font-medium">
                    Scan with your phone camera to join Room <span className="font-mono font-bold text-cyan-400">{validRoomId}</span>
                  </p>
                </>
              ) : (
                <div className="p-6 bg-slate-900/90 rounded-2xl border border-rose-500/30 text-center my-4 space-y-3 w-full">
                  <div className="text-rose-400 font-bold text-base flex items-center justify-center gap-2">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" /> Room ID Unavailable
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Please create a game room in the Host Control Panel to generate a valid join QR code.
                  </p>
                </div>
              )}
            </div>

            {/* JOINED PLAYERS LIST */}
            <div className="md:col-span-7 flex flex-col glass-panel p-8 rounded-3xl min-h-[420px] justify-between">
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold flex items-center gap-3">
                    <Users className="w-7 h-7 text-cyan-400" /> Joined Players
                  </h2>
                  <span className="px-4 py-1.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono font-bold text-lg border border-cyan-500/40">
                    {players.length} / 10
                  </span>
                </div>

                {players.length === 0 ? (
                  <div className="text-center py-16 text-slate-500 flex flex-col items-center gap-3">
                    <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center animate-bounce">
                      <Users className="w-8 h-8 text-slate-600" />
                    </div>
                    <p className="text-lg font-medium">Waiting for players to scan QR code...</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4 max-h-[300px] overflow-y-auto pr-2">
                    {players.map((p, idx) => (
                      <div key={p.id} className="flex items-center gap-4 p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 animate-fade-in shadow-md">
                        <span className="text-3xl p-2 bg-slate-800 rounded-xl border border-slate-700">{p.avatar}</span>
                        <div>
                          <div className="font-bold text-lg text-slate-100">{p.name}</div>
                          <div className="text-xs text-cyan-400 font-mono font-medium">Player #{idx + 1}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800 flex justify-between items-center text-xs text-slate-400">
                <span>Minimum 3 players required to start</span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Ready for Host signal
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ================= 2. ROLE ASSIGNMENT PHASE ================= */}
        {phase === 'ROLE_ASSIGNMENT' && (
          <div className="text-center max-w-3xl glass-panel-glow p-12 rounded-3xl animate-fade-in flex flex-col items-center">
            <Shield className="w-20 h-20 text-rose-500 animate-pulse mb-6" />
            <h2 className="text-4xl font-black tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-purple-300 to-cyan-400 mb-4">
              ROLES ASSIGNED
            </h2>
            <p className="text-xl text-slate-300 mb-8 max-w-xl">
              Check your mobile phone privately! Secret terms have been distributed to regular players and a hint to the Imposter(s).
            </p>
            <div className="flex items-center gap-3 px-6 py-3 rounded-full bg-slate-900 border border-slate-700 text-cyan-400 font-mono font-bold text-lg">
              <Clock className="w-5 h-5 animate-spin" /> Starting Round 1 in {timer}s...
            </div>
          </div>
        )}

        {/* ================= 3. QUESTION READ PHASE ================= */}
        {(phase === 'ROUND_1_QUESTION' || phase === 'ROUND_2_QUESTION') && (
          <div className="w-full max-w-4xl glass-panel-glow p-10 rounded-3xl text-center flex flex-col items-center shadow-2xl animate-fade-in">
            {/* Round Badge */}
            <div className="px-6 py-2 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 text-sm font-bold font-mono uppercase tracking-widest mb-6">
              ROUND {currentRound} • QUESTION READING
            </div>

            {/* AI Question Box */}
            <div className="w-full p-8 rounded-2xl bg-slate-900/90 border border-cyan-500/40 mb-8 shadow-inner">
              <div className="flex items-center justify-center gap-2 text-cyan-400 font-semibold text-sm mb-3">
                <HelpCircle className="w-5 h-5" /> AI GENERATED QUESTION
              </div>
              <h3 className="text-3xl font-extrabold text-slate-100 leading-relaxed max-w-2xl mx-auto">
                "{aiQuestion}"
              </h3>
            </div>

            {/* Synchronized Timer Ring */}
            <div className="flex flex-col items-center">
              <div className="text-6xl font-black font-mono text-cyan-400 animate-pulse mb-2">{timer}</div>
              <p className="text-xs text-slate-400 uppercase font-mono tracking-wider">Seconds to read question</p>
            </div>
          </div>
        )}

        {/* ================= 4. ANSWER PHASE ================= */}
        {(phase === 'ROUND_1_ANSWER' || phase === 'ROUND_2_ANSWER') && (
          <div className="w-full max-w-5xl flex flex-col items-center">
            {/* Question Banner */}
            <div className="w-full glass-panel p-6 rounded-2xl text-center mb-8 border-l-4 border-l-cyan-400">
              <span className="text-xs font-mono text-cyan-400 uppercase font-bold tracking-widest block mb-1">
                ROUND {currentRound} QUESTION
              </span>
              <p className="text-2xl font-bold text-slate-200">"{aiQuestion}"</p>
            </div>

            {/* Main Answering Box */}
            <div className="w-full glass-panel-glow p-8 rounded-3xl mb-8 flex flex-col items-center text-center">
              <div className="flex justify-between items-center w-full mb-6">
                <h3 className="text-xl font-bold flex items-center gap-2 text-slate-100">
                  <Clock className="w-6 h-6 text-cyan-400" /> ANSWERING IN PROGRESS ON MOBILE PHONES
                </h3>
                <span className="text-4xl font-black font-mono text-cyan-400 px-6 py-2 rounded-2xl bg-slate-900 border border-cyan-500/30">
                  {timer}s
                </span>
              </div>

              {/* Player Answer Submitted Indicators Grid */}
              <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                {players.map((p) => (
                  <div
                    key={p.id}
                    className={`p-4 rounded-2xl border flex items-center gap-3 transition-all duration-300 ${
                      p.hasSubmittedAnswer
                        ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-300'
                        : 'bg-slate-900/60 border-slate-800 text-slate-500'
                    }`}
                  >
                    <span className="text-2xl">{p.avatar}</span>
                    <div className="text-left overflow-hidden">
                      <div className="font-bold text-sm truncate">{p.name}</div>
                      <div className="text-xs font-mono">
                        {p.hasSubmittedAnswer ? '✓ Answered' : 'Typing...'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ================= 5. ANALYSIS PHASE ================= */}
        {(phase === 'ROUND_1_ANALYSIS' || phase === 'ROUND_2_ANALYSIS') && (
          <div className="w-full max-w-6xl flex flex-col items-center animate-fade-in">
            <div className="flex justify-between items-center w-full mb-6 glass-panel px-8 py-4 rounded-2xl">
              <div>
                <span className="text-xs text-purple-400 uppercase font-mono font-bold tracking-widest block">
                  ROUND {currentRound} • ANSWER ANALYSIS
                </span>
                <h3 className="text-2xl font-black text-slate-100">WHO SOUNDS LIKE THE IMPOSTER?</h3>
              </div>
              <div className="flex items-center gap-3 px-6 py-2 rounded-xl bg-slate-900 border border-purple-500/40 text-purple-300 font-mono font-bold text-2xl">
                <Clock className="w-6 h-6 text-purple-400" /> {timer}s
              </div>
            </div>

            {/* Answer Display Cards Grid */}
            <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[500px] overflow-y-auto pr-2">
              {players.map((p) => {
                const answerText = answers[p.id] || '(No response submitted)';
                return (
                  <div key={p.id} className="glass-panel p-6 rounded-2xl border-l-4 border-l-cyan-400 flex flex-col justify-between shadow-lg hover:border-cyan-400 transition-all">
                    <div className="flex items-center gap-3 mb-3 pb-3 border-b border-slate-800">
                      <span className="text-3xl p-1 bg-slate-900 rounded-lg">{p.avatar}</span>
                      <div>
                        <div className="font-bold text-lg text-slate-100">{p.name}</div>
                        <div className="text-xs text-slate-400 font-mono">Submitted Answer</div>
                      </div>
                    </div>
                    <p className="text-xl font-medium text-cyan-200 italic leading-relaxed">
                      "{answerText}"
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ================= 6. VOTING PHASE ================= */}
        {(phase === 'ROUND_1_VOTING' || phase === 'ROUND_2_VOTING') && (
          <div className="w-full max-w-4xl glass-panel-imposter p-10 rounded-3xl text-center flex flex-col items-center shadow-2xl animate-fade-in">
            <div className="px-6 py-2 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-sm font-bold font-mono uppercase tracking-widest mb-6">
              ROUND {currentRound} • PRIVATE VOTING IN PROGRESS
            </div>

            <h3 className="text-3xl font-black text-slate-100 mb-4">
              VOTE NOW ON YOUR MOBILE PHONES!
            </h3>
            <p className="text-slate-300 text-lg mb-8 max-w-lg">
              Select the player you suspect is the Imposter. Votes are strictly confidential and calculated by the backend!
            </p>

            <div className="text-6xl font-black font-mono text-rose-500 animate-pulse mb-8">{timer}s</div>

            {/* Voting Submission Status */}
            <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-4">
              {players.map((p) => (
                <div
                  key={p.id}
                  className={`p-4 rounded-xl border flex items-center gap-3 transition-all ${
                    p.hasVoted
                      ? 'bg-rose-500/20 border-rose-500/60 text-rose-200'
                      : 'bg-slate-900/60 border-slate-800 text-slate-500'
                  }`}
                >
                  <span className="text-2xl">{p.avatar}</span>
                  <div className="text-left">
                    <div className="font-bold text-sm">{p.name}</div>
                    <div className="text-xs font-mono">{p.hasVoted ? '✓ Vote Cast' : 'Deciding...'}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= 7. DRAMATIC FINAL REVEAL PHASE ================= */}
        {(phase === 'FINAL_REVEAL' || phase === 'GAME_COMPLETE') && (
          <div className="w-full max-w-5xl text-center flex flex-col items-center animate-fade-in">
            {/* Step 1: Suspense Opening */}
            {revealStep === 1 && (
              <div className="glass-panel p-16 rounded-3xl w-full max-w-3xl animate-pulse">
                <h2 className="text-4xl font-black text-slate-100 tracking-wide mb-4">
                  You think you've caught the Imposter...
                </h2>
                <p className="text-xl text-slate-400">Analyzing all votes across Round 1 & Round 2...</p>
              </div>
            )}

            {/* Step 2: Let's see... */}
            {revealStep === 2 && (
              <div className="glass-panel-glow p-16 rounded-3xl w-full max-w-3xl">
                <h2 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 tracking-wide">
                  Let's see...
                </h2>
              </div>
            )}

            {/* Step 3..5: Countdown 3, 2, 1 */}
            {revealStep >= 3 && revealStep <= 5 && (
              <div className="glass-panel-glow p-16 rounded-3xl w-full max-w-xl flex flex-col items-center">
                <span className="text-2xl font-bold text-slate-400 uppercase tracking-widest mb-4">Final Verdict In</span>
                <span className="text-9xl font-black text-rose-500 font-mono animate-ping">
                  {8 - revealStep}
                </span>
              </div>
            )}

            {/* Step 6: Grand Reveal Result */}
            {revealStep >= 6 && finalResult && (
              <div className="w-full flex flex-col items-center animate-fade-in space-y-8">
                {/* Imposter Outcome Banner */}
                {finalResult.isImposterCaught ? (
                  <div className="glass-panel-glow p-8 rounded-3xl w-full border-emerald-500/50 bg-emerald-950/40 text-center">
                    <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-emerald-500/20 text-emerald-300 font-black text-lg border border-emerald-500/40 mb-4 uppercase tracking-widest">
                      🎭 IMPOSTER CAUGHT!
                    </div>
                    <h2 className="text-4xl font-black text-slate-100 mb-2">
                      The Imposter was{' '}
                      <span className="text-rose-400 underline decoration-rose-500">
                        {finalResult.imposters.map(i => `${i.avatar} ${i.name}`).join(', ')}
                      </span>
                    </h2>
                    <p className="text-slate-300 text-lg">
                      The majority of players successfully identified the hidden Imposter!
                    </p>
                  </div>
                ) : (
                  <div className="glass-panel-imposter p-8 rounded-3xl w-full text-center">
                    <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-rose-500/20 text-rose-300 font-black text-lg border border-rose-500/40 mb-4 uppercase tracking-widest">
                      🎭 THE IMPOSTER ESCAPED!
                    </div>
                    <h2 className="text-4xl font-black text-slate-100 mb-2">
                      The Imposter was{' '}
                      <span className="text-rose-400 font-mono underline decoration-rose-500">
                        {finalResult.imposters.map(i => `${i.avatar} ${i.name}`).join(', ')}
                      </span>
                    </h2>
                    <div className="text-3xl font-black text-rose-500 tracking-wider mt-4">
                      🔴 IMPOSTER WINS!
                    </div>
                  </div>
                )}

                {/* Ultimate Winner Box (if Imposter caught) */}
                {finalResult.isImposterCaught && finalResult.ultimateWinner && (
                  <div className="glass-panel-gold p-8 rounded-3xl w-full flex flex-col items-center text-center animate-bounce">
                    <Award className="w-16 h-16 text-amber-400 mb-3" />
                    <span className="text-xs font-mono text-amber-400 uppercase font-bold tracking-widest mb-1">
                      🏆 ULTIMATE WINNER
                    </span>
                    <h3 className="text-4xl font-black text-amber-300 flex items-center gap-3">
                      <span>{finalResult.ultimateWinner.avatar}</span>
                      <span>{finalResult.ultimateWinner.name}</span>
                    </h3>
                    <p className="text-2xl font-black text-slate-100 mt-2">
                      {finalResult.ultimateWinner.score} POINTS
                    </p>
                  </div>
                )}

                {/* Secret Word Reveal Box */}
                <div className="glass-panel p-6 rounded-2xl w-full text-center border-l-4 border-l-cyan-400">
                  <span className="text-xs text-cyan-400 uppercase font-mono font-bold tracking-widest block mb-1">
                    SECRET WORD WAS
                  </span>
                  <div className="text-3xl font-black text-slate-100 mb-1">{finalResult.secretWord}</div>
                  <p className="text-sm text-slate-400 max-w-2xl mx-auto">{finalResult.secretDescription}</p>
                </div>

                {/* Player Breakdown Score Summary */}
                <div className="w-full glass-panel p-6 rounded-2xl">
                  <h4 className="text-lg font-bold text-slate-200 mb-4 text-left flex items-center gap-2">
                    <Users className="w-5 h-5 text-cyan-400" /> Player Score Matrix
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-300">
                      <thead className="bg-slate-900 text-xs text-slate-400 uppercase font-mono border-b border-slate-800">
                        <tr>
                          <th className="py-3 px-4">Player</th>
                          <th className="py-3 px-4">Role</th>
                          <th className="py-3 px-4 text-center">Round 1</th>
                          <th className="py-3 px-4 text-center">Round 2</th>
                          <th className="py-3 px-4 text-right">Total Score</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {finalResult.playerSummaries.map((p) => (
                          <tr key={p.id} className="hover:bg-slate-900/50">
                            <td className="py-3 px-4 font-bold flex items-center gap-2">
                              <span>{p.avatar}</span> <span>{p.name}</span>
                            </td>
                            <td className="py-3 px-4">
                              {p.isImposter ? (
                                <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-semibold text-xs border border-rose-500/40">
                                  IMPOSTER
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-xs">
                                  PLAYER
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-center font-mono">+{p.round1Score}</td>
                            <td className="py-3 px-4 text-center font-mono">+{p.round2Score}</td>
                            <td className="py-3 px-4 text-right font-mono font-bold text-cyan-400 text-base">
                              {p.totalScore} pts
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer Status Bar */}
      <footer className="flex justify-between items-center z-10 glass-panel px-8 py-3 rounded-xl text-xs text-slate-400 font-mono">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
          <span>SYSTEM ACTIVE • REALTIME WEBSOCKET SYNC</span>
        </div>
        <div>PHASE: <span className="text-cyan-400 font-bold">{phase}</span></div>
      </footer>
    </div>
  );
}
