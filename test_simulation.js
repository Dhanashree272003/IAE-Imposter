import { io } from 'socket.io-client';

const SERVER_URL = 'http://localhost:3000';

async function runSimulation() {
  console.log('=== STARTING AUTOMATED GAME ENGINE TEST SIMULATION ===\n');

  // 1. Host socket connects and creates room
  const hostSocket = io(SERVER_URL);

  await new Promise(resolve => hostSocket.on('connect', resolve));
  console.log('✔ Host connected to server');

  let finalResultReceived = null;
  let currentServerPhase = 'LOBBY';

  hostSocket.on('room_state', (state) => {
    currentServerPhase = state.phase;
    if (state.phase === 'FINAL_REVEAL' || state.phase === 'GAME_COMPLETE') {
      finalResultReceived = state.finalResult;
    }
  });

  let roomId = '';
  await new Promise(resolve => {
    hostSocket.emit('create_room', { imposterCount: 1 }, (res) => {
      console.log('✔ Room created successfully:', res);
      roomId = res.roomId;
      resolve();
    });
  });

  // 2. Connect 4 players
  const playerNames = ['Alice', 'Bob', 'Charlie', 'David'];
  const playerAvatars = ['🤖', '👾', '🕵️', '⚡'];
  const playerSockets = [];
  const playerIds = [];
  const privateRoles = {};

  for (let i = 0; i < playerNames.length; i++) {
    const s = io(SERVER_URL);
    await new Promise(res => s.on('connect', res));

    s.on('private_role', (role) => {
      privateRoles[playerNames[i]] = role;
      console.log(`🔒 Private Role for ${playerNames[i]}:`, role.isImposter ? `IMPOSTER (Hint: ${role.hint})` : `NORMAL (Word: ${role.secretWord})`);
    });

    await new Promise(resolve => {
      s.emit('join_room', { roomId, name: playerNames[i], avatar: playerAvatars[i] }, (res) => {
        console.log(`👤 ${playerNames[i]} joined with ID: ${res.playerId}`);
        playerIds.push(res.playerId);
        playerSockets.push(s);
        resolve();
      });
    });
  }

  // 3. Test illegal configuration (2 imposters with 4 players -> should fail validation)
  await new Promise(resolve => {
    hostSocket.emit('set_imposter_count', { roomId, imposterCount: 2 }, () => {});
    hostSocket.emit('start_game', { roomId }, (res) => {
      console.log('✔ Validation check for 2 imposters with 4 players:', res.success === false ? `PASS (${res.error})` : 'FAIL');
      resolve();
    });
  });

  // 4. Set valid imposter count (1) and start game
  await new Promise(resolve => {
    hostSocket.emit('set_imposter_count', { roomId, imposterCount: 1 }, () => {
      hostSocket.emit('start_game', { roomId }, (res) => {
        console.log('✔ Game Start triggered:', res);
        resolve();
      });
    });
  });

  // Wait for role assignment phase (5s) to transition to Round 1 Question
  console.log('\n--- Waiting for Round 1 Question ---');
  await new Promise(resolve => setTimeout(resolve, 6000));

  // 5. Submit Answers for Round 1
  console.log('\n--- Submitting Answers for Round 1 ---');
  for (let i = 0; i < playerSockets.length; i++) {
    const s = playerSockets[i];
    const pid = playerIds[i];
    const isImp = privateRoles[playerNames[i]]?.isImposter;
    const ans = isImp ? 'It is widely used in tech' : 'Has continuous integration and delivery';

    await new Promise(resolve => {
      s.emit('submit_answer', { roomId, playerId: pid, answer: ans }, (res) => {
        console.log(`✓ ${playerNames[i]} submitted answer: "${ans}"`);
        resolve();
      });
    });
  }

  // Waiting for analysis timer (30s) to transition to voting phase
  console.log('\n--- Waiting for Round 1 Analysis to complete ---');
  while (currentServerPhase !== 'ROUND_1_VOTING') {
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // 6. Submit Private Votes for Round 1
  console.log('\n--- Submitting Private Votes for Round 1 ---');
  const imposterIndex = playerNames.findIndex(name => privateRoles[name]?.isImposter);
  const imposterId = playerIds[imposterIndex];

  for (let i = 0; i < playerSockets.length; i++) {
    const s = playerSockets[i];
    const pid = playerIds[i];
    const target = i === imposterIndex ? playerIds[(i + 1) % playerIds.length] : imposterId;

    await new Promise(resolve => {
      s.emit('submit_vote', { roomId, playerId: pid, suspectId: target }, (res) => {
        console.log(`✓ ${playerNames[i]} cast confidential vote`);
        resolve();
      });
    });
  }

  // Waiting for Round 2 Question
  console.log('\n--- Transitioning to Round 2 Question ---');
  while (currentServerPhase !== 'ROUND_2_ANSWER') {
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // 7. Round 2 Answers
  console.log('\n--- Submitting Answers for Round 2 ---');
  for (let i = 0; i < playerSockets.length; i++) {
    const s = playerSockets[i];
    const pid = playerIds[i];
    const ans = 'Used daily by engineering teams';

    await new Promise(resolve => {
      s.emit('submit_answer', { roomId, playerId: pid, answer: ans }, (res) => {
        console.log(`✓ ${playerNames[i]} submitted Round 2 answer`);
        resolve();
      });
    });
  }

  // Waiting for Round 2 Analysis to complete
  console.log('\n--- Waiting for Round 2 Analysis to complete ---');
  while (currentServerPhase !== 'ROUND_2_VOTING') {
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // 8. Round 2 Voting
  console.log('\n--- Submitting Private Votes for Round 2 ---');
  for (let i = 0; i < playerSockets.length; i++) {
    const s = playerSockets[i];
    const pid = playerIds[i];
    const target = i === imposterIndex ? playerIds[(i + 1) % playerIds.length] : imposterId;

    await new Promise(resolve => {
      s.emit('submit_vote', { roomId, playerId: pid, suspectId: target }, (res) => {
        console.log(`✓ ${playerNames[i]} cast Round 2 vote`);
        resolve();
      });
    });
  }

  console.log('\n--- Waiting for Final Reveal Phase ---');
  while (!finalResultReceived) {
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n=======================================================');
  console.log('🎉 AUTOMATED GAME SIMULATION TEST PASSED!');
  console.log(`Imposter Caught: ${finalResultReceived.isImposterCaught}`);
  console.log(`Imposter(s):`, finalResultReceived.imposters);
  console.log(`Ultimate Winner:`, finalResultReceived.ultimateWinner);
  console.log(`Secret Word: ${finalResultReceived.secretWord}`);
  console.log('=======================================================\n');

  hostSocket.disconnect();
  playerSockets.forEach(s => s.disconnect());
  process.exit(0);
}

runSimulation().catch(err => {
  console.error('Simulation error:', err);
  process.exit(1);
});
