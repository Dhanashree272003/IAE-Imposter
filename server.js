import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import network from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import { getRandomWord } from './words.js';
import { generateAIQuestion } from './aiService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);

// Allow CORS for local dev / mobile testing
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;

// Find local IPv4 address for QR Code scan on mobile devices
function getLocalIpAddress() {
  const interfaces = network.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

const SERVER_IP = getLocalIpAddress();

// Store active game rooms
// Key: roomId -> Room state object
const rooms = new Map();

// Helper to sanitize player object for public broadcast (never expose roles or internal scores during play)
function sanitizeRoomForClient(room) {
  return {
    roomId: room.roomId,
    hostIp: room.hostIp,
    port: PORT,
    phase: room.phase,
    imposterCountSetting: room.imposterCountSetting,
    players: room.players.map(p => ({
      id: p.id,
      name: p.name,
      avatar: p.avatar,
      isConnected: p.isConnected,
      hasSubmittedAnswer: Boolean(room.answers[room.currentRound]?.[p.id]),
      hasVoted: Boolean(room.votes[room.currentRound]?.[p.id]),
    })),
    currentRound: room.currentRound,
    timer: room.timer,
    timerDuration: room.timerDuration,
    aiQuestion: room.aiQuestion,
    answers: room.phase.includes('ANALYSIS') || room.phase.includes('VOTING') || room.phase === 'FINAL_REVEAL' || room.phase === 'GAME_COMPLETE'
      ? room.answers[room.currentRound] || {}
      : {},
    // Final reveal payload (sent only in FINAL_REVEAL and GAME_COMPLETE)
    finalResult: room.finalResult || null
  };
}

// Master tick interval for all active room timers
setInterval(() => {
  for (const [roomId, room] of rooms.entries()) {
    if (room.timerActive && room.timer > 0) {
      room.timer -= 1;
      io.to(roomId).emit('timer_tick', { secondsRemaining: room.timer, phase: room.phase });

      if (room.timer === 0) {
        handlePhaseTimeout(room);
      }
    }
  }
}, 1000);

async function advanceToNextPhase(room) {
  switch (room.phase) {
    case 'LOBBY':
      // Start Game -> Role Assignment
      room.phase = 'ROLE_ASSIGNMENT';
      room.timer = 5;
      room.timerDuration = 5;
      room.timerActive = true;
      broadcastRoomUpdate(room);
      sendPrivateRoles(room);
      break;

    case 'ROLE_ASSIGNMENT':
      // Role Assignment -> Round 1 Question
      room.currentRound = 1;
      room.phase = 'ROUND_1_QUESTION';
      room.aiQuestion = await generateAIQuestion(room.secretWordItem, 1);
      room.timer = 15;
      room.timerDuration = 15;
      room.timerActive = true;
      broadcastRoomUpdate(room);
      break;

    case 'ROUND_1_QUESTION':
      // Question -> Round 1 Answer
      room.phase = 'ROUND_1_ANSWER';
      room.timer = 30;
      room.timerDuration = 30;
      room.timerActive = true;
      broadcastRoomUpdate(room);
      break;

    case 'ROUND_1_ANSWER':
      // Answer -> Round 1 Analysis
      room.phase = 'ROUND_1_ANALYSIS';
      room.timer = 30;
      room.timerDuration = 30;
      room.timerActive = true;
      broadcastRoomUpdate(room);
      break;

    case 'ROUND_1_ANALYSIS':
      // Analysis -> Round 1 Voting
      room.phase = 'ROUND_1_VOTING';
      room.timer = 15;
      room.timerDuration = 15;
      room.timerActive = true;
      broadcastRoomUpdate(room);
      break;

    case 'ROUND_1_VOTING':
      // End of Round 1 -> Calculate Round 1 backend scores silently -> Start Round 2 Question
      calculateRoundScores(room, 1);
      room.currentRound = 2;
      room.phase = 'ROUND_2_QUESTION';
      room.aiQuestion = await generateAIQuestion(room.secretWordItem, 2);
      room.timer = 15;
      room.timerDuration = 15;
      room.timerActive = true;
      broadcastRoomUpdate(room);
      break;

    case 'ROUND_2_QUESTION':
      // Question -> Round 2 Answer
      room.phase = 'ROUND_2_ANSWER';
      room.timer = 30;
      room.timerDuration = 30;
      room.timerActive = true;
      broadcastRoomUpdate(room);
      break;

    case 'ROUND_2_ANSWER':
      // Answer -> Round 2 Analysis
      room.phase = 'ROUND_2_ANALYSIS';
      room.timer = 30;
      room.timerDuration = 30;
      room.timerActive = true;
      broadcastRoomUpdate(room);
      break;

    case 'ROUND_2_ANALYSIS':
      // Analysis -> Round 2 Voting
      room.phase = 'ROUND_2_VOTING';
      room.timer = 15;
      room.timerDuration = 15;
      room.timerActive = true;
      broadcastRoomUpdate(room);
      break;

    case 'ROUND_2_VOTING':
      // End of Round 2 -> Calculate Round 2 scores -> Final Reveal Calculation
      calculateRoundScores(room, 2);
      calculateFinalResults(room);
      room.phase = 'FINAL_REVEAL';
      room.timer = 0;
      room.timerActive = false;
      broadcastRoomUpdate(room);
      break;

    default:
      break;
  }
}

function handlePhaseTimeout(room) {
  advanceToNextPhase(room);
}

function sendPrivateRoles(room) {
  const secret = room.secretWordItem;
  const imposterIds = new Set(room.imposterIds);

  for (const player of room.players) {
    const isImposter = imposterIds.has(player.id);
    const socket = io.sockets.sockets.get(player.socketId);
    if (socket) {
      if (isImposter) {
        socket.emit('private_role', {
          isImposter: true,
          hint: secret.hint,
          imposterCount: room.imposterCountSetting
        });
      } else {
        socket.emit('private_role', {
          isImposter: false,
          secretWord: secret.word,
          category: secret.category,
          description: secret.description
        });
      }
    }
  }
}

function calculateRoundScores(room, roundNum) {
  const votesThisRound = room.votes[roundNum] || {};
  const imposterSet = new Set(room.imposterIds);

  for (const [voterId, suspectId] of Object.entries(votesThisRound)) {
    const player = room.players.find(p => p.id === voterId);
    if (player && !imposterSet.has(voterId)) {
      // Normal player correctly voted an imposter -> +20 points
      if (imposterSet.has(suspectId)) {
        player.scores[roundNum] = 20;
        player.correctVoteCount += 1;
      } else {
        player.scores[roundNum] = 0;
      }
    }
  }
}

function calculateFinalResults(room) {
  const imposterSet = new Set(room.imposterIds);
  const totalVotesReceived = {};

  for (const player of room.players) {
    totalVotesReceived[player.id] = 0;
  }

  // Aggregate votes from Round 1 and Round 2
  for (const r of [1, 2]) {
    const roundVotes = room.votes[r] || {};
    for (const suspectId of Object.values(roundVotes)) {
      if (totalVotesReceived[suspectId] !== undefined) {
        totalVotesReceived[suspectId] += 1;
      }
    }
  }

  // Find max votes received by any player
  let maxVotes = 0;
  for (const count of Object.values(totalVotesReceived)) {
    if (count > maxVotes) maxVotes = count;
  }

  // Check if any Imposter received the maximum votes
  const caughtImposters = room.imposterIds.filter(id => totalVotesReceived[id] === maxVotes && maxVotes > 0);
  const isImposterCaught = caughtImposters.length > 0;

  // Calculate final total score for each non-imposter player
  for (const player of room.players) {
    player.totalScore = (player.scores[1] || 0) + (player.scores[2] || 0);
  }

  let ultimateWinner = null;
  const impostersInfo = room.players.filter(p => imposterSet.has(p.id)).map(p => ({
    id: p.id,
    name: p.name,
    avatar: p.avatar,
    votesReceived: totalVotesReceived[p.id] || 0
  }));

  if (isImposterCaught) {
    // Imposter caught! Highest scoring non-imposter wins
    const nonImposters = room.players.filter(p => !imposterSet.has(p.id));
    nonImposters.sort((a, b) => {
      if (b.totalScore !== a.totalScore) {
        return b.totalScore - a.totalScore;
      }
      // Tie-breaker 1: Total correct votes
      if (b.correctVoteCount !== a.correctVoteCount) {
        return b.correctVoteCount - a.correctVoteCount;
      }
      // Tie-breaker 2: Alphabetical fallback / join order
      return a.name.localeCompare(b.name);
    });

    if (nonImposters.length > 0) {
      ultimateWinner = {
        id: nonImposters[0].id,
        name: nonImposters[0].name,
        avatar: nonImposters[0].avatar,
        score: nonImposters[0].totalScore,
        correctVotes: nonImposters[0].correctVoteCount
      };
    }
  }

  room.finalResult = {
    isImposterCaught,
    imposters: impostersInfo,
    ultimateWinner,
    secretWord: room.secretWordItem.word,
    secretDescription: room.secretWordItem.description,
    playerSummaries: room.players.map(p => ({
      id: p.id,
      name: p.name,
      avatar: p.avatar,
      isImposter: imposterSet.has(p.id),
      round1Score: p.scores[1] || 0,
      round2Score: p.scores[2] || 0,
      totalScore: p.totalScore || 0,
      votesReceived: totalVotesReceived[p.id] || 0
    }))
  };
}

function broadcastRoomUpdate(room) {
  const payload = sanitizeRoomForClient(room);
  io.to(room.roomId).emit('room_state', payload);
}

// Socket.IO Event Handling
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  // 1. Host creates a new room
  socket.on('create_room', ({ imposterCount = 1 }, callback) => {
    const roomId = Math.random().toString(36).substring(2, 7).toUpperCase();
    const room = {
      roomId,
      hostSocketId: socket.id,
      hostIp: SERVER_IP,
      phase: 'LOBBY',
      imposterCountSetting: imposterCount,
      players: [],
      usedWords: [],
      secretWordItem: null,
      imposterIds: [],
      currentRound: 1,
      timer: 0,
      timerDuration: 0,
      timerActive: false,
      aiQuestion: '',
      answers: { 1: {}, 2: {} },
      votes: { 1: {}, 2: {} },
      finalResult: null
    };

    rooms.set(roomId, room);
    socket.join(roomId);
    console.log(`Room created: ${roomId} with host ${socket.id}`);

    if (typeof callback === 'function') {
      callback({ success: true, roomId, hostIp: SERVER_IP, port: PORT });
    }
    broadcastRoomUpdate(room);
  });

  // 2. Host updates Imposter Count
  socket.on('set_imposter_count', ({ roomId, imposterCount }, callback) => {
    const room = rooms.get(roomId);
    if (!room || room.hostSocketId !== socket.id) return;
    if (room.phase !== 'LOBBY') return;

    if (imposterCount < 1 || imposterCount > 2) {
      if (typeof callback === 'function') callback({ success: false, error: 'Imposter count must be 1 or 2' });
      return;
    }

    room.imposterCountSetting = imposterCount;
    broadcastRoomUpdate(room);
    if (typeof callback === 'function') callback({ success: true });
  });

  // 3. Player joins a room
  socket.on('join_room', ({ roomId, name, avatar, playerId }, callback) => {
    const room = rooms.get(roomId);
    if (!room) {
      if (typeof callback === 'function') callback({ success: false, error: 'Room not found. Please check room code.' });
      return;
    }

    if (room.phase !== 'LOBBY') {
      if (typeof callback === 'function') callback({ success: false, error: 'Game has already started!' });
      return;
    }

    if (room.players.length >= 10) {
      if (typeof callback === 'function') callback({ success: false, error: 'Room is full (Max 10 players).' });
      return;
    }

    // Check if player name already taken
    const existingName = room.players.find(p => p.name.toLowerCase() === name.trim().toLowerCase());
    if (existingName) {
      if (typeof callback === 'function') callback({ success: false, error: 'Name already taken. Choose another name.' });
      return;
    }

    const finalPlayerId = playerId || `player_${Math.random().toString(36).substring(2, 9)}`;
    const newPlayer = {
      id: finalPlayerId,
      name: name.trim(),
      avatar: avatar || '👤',
      socketId: socket.id,
      isConnected: true,
      scores: { 1: 0, 2: 0 },
      totalScore: 0,
      correctVoteCount: 0
    };

    room.players.push(newPlayer);
    socket.join(roomId);
    console.log(`Player ${newPlayer.name} (${finalPlayerId}) joined room ${roomId}`);

    if (typeof callback === 'function') {
      callback({ success: true, playerId: finalPlayerId, roomId });
    }
    broadcastRoomUpdate(room);
  });

  // 4. Reconnect player
  socket.on('reconnect_player', ({ roomId, playerId }, callback) => {
    const room = rooms.get(roomId);
    if (!room) {
      if (typeof callback === 'function') callback({ success: false, error: 'Room expired' });
      return;
    }

    const player = room.players.find(p => p.id === playerId);
    if (player) {
      player.socketId = socket.id;
      player.isConnected = true;
      socket.join(roomId);
      console.log(`Player ${player.name} reconnected to ${roomId}`);

      // Send private role info if roles assigned
      if (room.phase !== 'LOBBY') {
        const isImposter = room.imposterIds.includes(player.id);
        const secret = room.secretWordItem;
        if (isImposter) {
          socket.emit('private_role', {
            isImposter: true,
            hint: secret.hint,
            imposterCount: room.imposterCountSetting
          });
        } else {
          socket.emit('private_role', {
            isImposter: false,
            secretWord: secret.word,
            category: secret.category,
            description: secret.description
          });
        }
      }

      if (typeof callback === 'function') callback({ success: true, room: sanitizeRoomForClient(room) });
      broadcastRoomUpdate(room);
    } else {
      if (typeof callback === 'function') callback({ success: false, error: 'Player session not found' });
    }
  });

  // 5. Host Starts Game
  socket.on('start_game', ({ roomId }, callback) => {
    const room = rooms.get(roomId);
    if (!room || room.hostSocketId !== socket.id) return;
    if (room.phase !== 'LOBBY') return;

    if (room.players.length < 3) {
      if (typeof callback === 'function') callback({ success: false, error: 'At least 3 players are required to start.' });
      return;
    }

    if (room.imposterCountSetting === 2 && room.players.length < 5) {
      if (typeof callback === 'function') callback({ success: false, error: 'At least 5 players required for 2 Imposters.' });
      return;
    }

    // Assign secret word
    const wordItem = getRandomWord(room.usedWords);
    room.secretWordItem = wordItem;
    room.usedWords.push(wordItem.word);

    // Pick Imposters randomly
    const shuffled = [...room.players].sort(() => 0.5 - Math.random());
    room.imposterIds = shuffled.slice(0, room.imposterCountSetting).map(p => p.id);

    console.log(`Starting game in room ${roomId}. Secret word: ${wordItem.word}. Imposters: ${room.imposterIds.join(', ')}`);

    advanceToNextPhase(room);
    if (typeof callback === 'function') callback({ success: true });
  });

  // 6. Player Submits Short Answer
  socket.on('submit_answer', ({ roomId, playerId, answer }, callback) => {
    const room = rooms.get(roomId);
    if (!room) return;
    const currentPhase = room.phase;

    if (currentPhase !== 'ROUND_1_ANSWER' && currentPhase !== 'ROUND_2_ANSWER') {
      if (typeof callback === 'function') callback({ success: false, error: 'Answering phase is not active.' });
      return;
    }

    const roundNum = room.currentRound;
    const sanitizedAnswer = (answer || '').trim().substring(0, 100);

    if (!sanitizedAnswer) {
      if (typeof callback === 'function') callback({ success: false, error: 'Answer cannot be empty.' });
      return;
    }

    room.answers[roundNum][playerId] = sanitizedAnswer;
    broadcastRoomUpdate(room);

    if (typeof callback === 'function') callback({ success: true });

    // Check if ALL active connected players have submitted answers
    const activePlayers = room.players.filter(p => p.isConnected);
    const submittedCount = Object.keys(room.answers[roundNum]).length;

    if (submittedCount >= activePlayers.length) {
      console.log(`All players submitted answers early in ${roomId}. Advancing phase...`);
      advanceToNextPhase(room);
    }
  });

  // 7. Player Submits Private Vote
  socket.on('submit_vote', ({ roomId, playerId, suspectId }, callback) => {
    const room = rooms.get(roomId);
    if (!room) return;
    const currentPhase = room.phase;

    if (currentPhase !== 'ROUND_1_VOTING' && currentPhase !== 'ROUND_2_VOTING') {
      if (typeof callback === 'function') callback({ success: false, error: 'Voting phase is not active.' });
      return;
    }

    if (playerId === suspectId) {
      if (typeof callback === 'function') callback({ success: false, error: 'You cannot vote for yourself.' });
      return;
    }

    const roundNum = room.currentRound;
    room.votes[roundNum][playerId] = suspectId;
    broadcastRoomUpdate(room);

    if (typeof callback === 'function') callback({ success: true });

    // Check if ALL active connected players have voted
    const activePlayers = room.players.filter(p => p.isConnected);
    const votesCount = Object.keys(room.votes[roundNum]).length;

    if (votesCount >= activePlayers.length) {
      console.log(`All players voted early in ${roomId}. Advancing phase...`);
      advanceToNextPhase(room);
    }
  });

  // 8. Host Play Again / Reset Game
  socket.on('play_again', ({ roomId }) => {
    const room = rooms.get(roomId);
    if (!room || room.hostSocketId !== socket.id) return;

    room.phase = 'LOBBY';
    room.currentRound = 1;
    room.timer = 0;
    room.timerActive = false;
    room.aiQuestion = '';
    room.answers = { 1: {}, 2: {} };
    room.votes = { 1: {}, 2: {} };
    room.finalResult = null;
    room.secretWordItem = null;
    room.imposterIds = [];

    for (const player of room.players) {
      player.scores = { 1: 0, 2: 0 };
      player.totalScore = 0;
      player.correctVoteCount = 0;
    }

    broadcastRoomUpdate(room);
  });

  // Handle Disconnect
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
    for (const room of rooms.values()) {
      const player = room.players.find(p => p.socketId === socket.id);
      if (player) {
        player.isConnected = false;
        broadcastRoomUpdate(room);
      }
    }
  });
});

// Integration with Vite middleware (development & production single-port support)
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`=======================================================`);
    console.log(`🚀 AI Imposter Server is running!`);
    console.log(`📡 Local Network Access URL: http://${SERVER_IP}:${PORT}`);
    console.log(`💻 Localhost Access URL:     http://localhost:${PORT}`);
    console.log(`=======================================================`);
  });
}

startServer();
