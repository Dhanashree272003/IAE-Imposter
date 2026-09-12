import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import BigScreenView from './components/BigScreenView';
import HostView from './components/HostView';
import PlayerView from './components/PlayerView';
import { Monitor, Smartphone, Sliders, Flame, Sparkles } from 'lucide-react';

export default function App() {
  const [socket, setSocket] = useState(null);
  const [roomState, setRoomState] = useState({});
  const [privateRole, setPrivateRole] = useState(null);
  const [viewMode, setViewMode] = useState('landing'); // 'landing' | 'display' | 'host' | 'player'

  // Auto-detect view from URL path or query params
  useEffect(() => {
    const path = window.location.pathname.toLowerCase();
    const searchParams = new URLSearchParams(window.location.search);
    const viewParam = searchParams.get('view') || searchParams.get('mode');

    if (path.includes('/display') || viewParam === 'display') {
      setViewMode('display');
    } else if (path.includes('/host') || viewParam === 'host') {
      setViewMode('host');
    } else if (path.includes('/join') || path.includes('/player') || searchParams.has('room') || viewParam === 'player') {
      setViewMode('player');
    } else {
      setViewMode('landing');
    }
  }, []);

  // Initialize Socket.IO connection
  useEffect(() => {
    const newSocket = io(window.location.origin, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    newSocket.on('connect', () => {
      console.log('Socket.IO Connected to server');
    });

    newSocket.on('room_state', (state) => {
      setRoomState(state);
    });

    newSocket.on('timer_tick', ({ secondsRemaining }) => {
      setRoomState((prev) => ({ ...prev, timer: secondsRemaining }));
    });

    newSocket.on('private_role', (roleData) => {
      setPrivateRole(roleData);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Handlers for Host Actions
  const handleCreateRoom = (imposterCount = 1) => {
    if (!socket) return;
    socket.emit('create_room', { imposterCount }, (res) => {
      if (res.success) {
        console.log('Room Created:', res.roomId);
      }
    });
  };

  const handleSetImposterCount = (imposterCount) => {
    if (!socket || !roomState.roomId) return;
    socket.emit('set_imposter_count', { roomId: roomState.roomId, imposterCount });
  };

  const handleStartGame = () => {
    if (!socket || !roomState.roomId) return;
    socket.emit('start_game', { roomId: roomState.roomId });
  };

  const handlePlayAgain = () => {
    if (!socket || !roomState.roomId) return;
    socket.emit('play_again', { roomId: roomState.roomId });
  };

  // Handlers for Player Actions
  const handleJoinRoom = ({ roomId, name, avatar, playerId }, callback) => {
    if (!socket) return;
    socket.emit('join_room', { roomId, name, avatar, playerId }, callback);
  };

  const handleSubmitAnswer = (answer, callback) => {
    const savedPlayerId = localStorage.getItem('imposter_player_id');
    if (!socket || !roomState.roomId || !savedPlayerId) return;
    socket.emit('submit_answer', { roomId: roomState.roomId, playerId: savedPlayerId, answer }, callback);
  };

  const handleSubmitVote = (suspectId, callback) => {
    const savedPlayerId = localStorage.getItem('imposter_player_id');
    if (!socket || !roomState.roomId || !savedPlayerId) return;
    socket.emit('submit_vote', { roomId: roomState.roomId, playerId: savedPlayerId, suspectId }, callback);
  };

  if (viewMode === 'display') {
    return <BigScreenView roomState={roomState} />;
  }

  if (viewMode === 'host') {
    return (
      <HostView
        socket={socket}
        roomState={roomState}
        onCreateRoom={handleCreateRoom}
        onSetImposterCount={handleSetImposterCount}
        onStartGame={handleStartGame}
        onPlayAgain={handlePlayAgain}
      />
    );
  }

  if (viewMode === 'player') {
    return (
      <PlayerView
        socket={socket}
        roomState={roomState}
        privateRole={privateRole}
        onJoinRoom={handleJoinRoom}
        onSubmitAnswer={handleSubmitAnswer}
        onSubmitVote={handleSubmitVote}
      />
    );
  }

  // DEFAULT LANDING SCREEN TO CHOOSE INTERFACE
  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 p-6 flex flex-col items-center justify-center relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-4xl glass-panel p-10 rounded-3xl text-center shadow-2xl z-10 space-y-8">
        <div className="flex items-center justify-center gap-3">
          <div className="p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-2xl">
            <Flame className="w-12 h-12 text-cyan-400 animate-pulse" />
          </div>
        </div>

        <div>
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-semibold text-xs mb-3 uppercase tracking-widest">
            <Sparkles className="w-4 h-4" /> Office & Exhibition Arena
          </span>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-500 mb-4">
            AI IMPOSTER GAME
          </h1>
          <p className="text-slate-400 text-base max-w-2xl mx-auto leading-relaxed">
            A high-suspense multiplayer social deduction experience. Select your interface to launch into the arena.
          </p>
        </div>

        {/* Interface Switcher Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          {/* Big Screen Exhibition Card */}
          <button
            onClick={() => {
              window.history.pushState({}, '', '/display');
              setViewMode('display');
            }}
            className="p-6 rounded-2xl glass-panel-glow text-left flex flex-col justify-between hover:scale-105 transition-all group"
          >
            <div>
              <Monitor className="w-10 h-10 text-cyan-400 mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="text-xl font-bold text-slate-100 mb-2">Exhibition Display</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Designed for large TVs and exhibition projectors. Displays QR code, round timers, and dramatic final reveal.
              </p>
            </div>
            <div className="mt-6 font-bold text-xs text-cyan-400 flex items-center gap-1">
              OPEN DISPLAY MODE →
            </div>
          </button>

          {/* Host Control Panel Card */}
          <button
            onClick={() => {
              window.history.pushState({}, '', '/host');
              setViewMode('host');
            }}
            className="p-6 rounded-2xl glass-panel text-left flex flex-col justify-between hover:scale-105 hover:border-purple-500/50 transition-all group"
          >
            <div>
              <Sliders className="w-10 h-10 text-purple-400 mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="text-xl font-bold text-slate-100 mb-2">Host Control Panel</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Operator interface for generating room codes, picking imposter count (1 or 2), starting, and managing games.
              </p>
            </div>
            <div className="mt-6 font-bold text-xs text-purple-400 flex items-center gap-1">
              OPEN HOST CONTROLS →
            </div>
          </button>

          {/* Player Phone Mobile Card */}
          <button
            onClick={() => {
              window.history.pushState({}, '', '/join');
              setViewMode('player');
            }}
            className="p-6 rounded-2xl glass-panel text-left flex flex-col justify-between hover:scale-105 hover:border-emerald-500/50 transition-all group"
          >
            <div>
              <Smartphone className="w-10 h-10 text-emerald-400 mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="text-xl font-bold text-slate-100 mb-2">Player Phone UI</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Mobile interface for players to receive private secret terms or hints, type short answers, and cast private votes.
              </p>
            </div>
            <div className="mt-6 font-bold text-xs text-emerald-400 flex items-center gap-1">
              JOIN AS PLAYER →
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
