const CONSTANTS = require('../shared/constants');
const { MAP_DATA, getRandomSpawnPoints, getRandomSpawnPoint } = require('./mapData');
const Physics = require('./physics');
const NPC = require('./npc');
const RoleManager = require('./roleManager');
const BotAI = require('./botAI');

function createInitialGameState() {
  return {
    player: {
      x: MAP_DATA.playerStart.x,
      y: MAP_DATA.playerStart.y,
      velX: 0,
      velY: 0,
      isFrozen: false,
      isDashing: false,
      dashEndTime: 0
    },
    inventory: [],
    installedParts: {
      battery: false,
      bulb: false,
      handle: false
    },
    items: getRandomSpawnPoints(),
    npc: {
      x: MAP_DATA.npcStart.x,
      y: MAP_DATA.npcStart.y,
      currentPathIndex: MAP_DATA.npcStart.pathIndex
    },
    timeRemaining: CONSTANTS.MATCH_DURATION,
    swapTimer: CONSTANTS.SWAP_INTERVAL,
    phase: CONSTANTS.PHASES.PLAYING,
    votes: {},
    demand: null,
    voteTimer: 0
  };
}

class GameLoop {
  constructor(room, io, roomManager, onEnd) {
    this.room = room;
    this.io = io;
    this.roomManager = roomManager;
    this.onEnd = onEnd;
    this.interval = null;
    this.lastTick = Date.now();
    this.inputs = new Map(); // playerId -> current input state
    this.bots = new Map(); // botId -> BotAI instance
  }

  start() {
    this.lastTick = Date.now();

    // Initialize bot AI for each bot player
    this.room.players.forEach(player => {
      if (player.isBot) {
        const bot = new BotAI(player.id, player.role);
        this.bots.set(player.id, bot);
      }
    });

    this.interval = setInterval(() => this.tick(), CONSTANTS.TICK_INTERVAL);
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  tick() {
    const now = Date.now();
    const delta = now - this.lastTick;
    this.lastTick = now;

    const state = this.room.gameState;
    if (!state) return;

    // Don't process during voting
    if (state.phase === CONSTANTS.PHASES.VOTING) {
      this.processVoting(delta);
      this.broadcast();
      return;
    }

    if (state.phase !== CONSTANTS.PHASES.PLAYING) {
      return;
    }

    // Generate bot inputs
    this.updateBotInputs(state);

    // Process player inputs
    this.processInputs(state, delta);

    // Update dash state
    if (state.player.isDashing && now > state.player.dashEndTime) {
      state.player.isDashing = false;
    }

    // Update player position with physics
    if (!state.player.isFrozen) {
      Physics.updatePlayer(state.player, delta);
      Physics.checkWallCollisions(state.player, MAP_DATA.walls);
    }

    // Update NPC
    NPC.update(state.npc, delta);

    // Check NPC catch
    if (!state.player.isFrozen) {
      const caught = NPC.checkCatch(state.npc, state.player);
      if (caught) {
        this.onPlayerCaught();
      }
    }

    // Check item pickup/drop based on inputs
    this.checkItemInteractions(state);

    // Check exit interactions
    this.checkExitInteractions(state);

    // Update timers
    state.timeRemaining -= delta;
    state.swapTimer -= delta;

    // Check for role swap
    if (state.swapTimer <= 0) {
      this.performRoleSwap();
      state.swapTimer = CONSTANTS.SWAP_INTERVAL;
    }

    // Check win/lose conditions
    if (state.timeRemaining <= 0) {
      this.endGame('timeout');
      return;
    }

    // Broadcast state
    this.broadcast();
  }

  processInputs(state, delta) {
    // Collect inputs from all players
    let moveX = 0;
    let moveY = 0;
    let isSprinting = false;

    this.inputs.forEach((input, playerId) => {
      const role = RoleManager.getRoleForPlayer(this.room.players, playerId);

      // Movement (MOVE role)
      if (role === CONSTANTS.ROLES.MOVE && input.direction) {
        moveX = input.direction.x;
        moveY = input.direction.y;
      }

      // Sprint (SPRINT role)
      if (role === CONSTANTS.ROLES.SPRINT && input.sprint) {
        isSprinting = true;
      }

      // Dash (DASH role)
      if (role === CONSTANTS.ROLES.DASH && input.dash && !state.player.isDashing) {
        state.player.isDashing = true;
        state.player.dashEndTime = Date.now() + CONSTANTS.PLAYER_DASH_DURATION;
      }
    });

    // Calculate speed
    let speed = CONSTANTS.PLAYER_SPEED;
    if (state.player.isDashing) {
      speed = CONSTANTS.PLAYER_DASH_SPEED;
    } else if (isSprinting) {
      speed = CONSTANTS.PLAYER_SPRINT_SPEED;
    }

    // Normalize diagonal movement
    if (moveX !== 0 && moveY !== 0) {
      const mag = Math.sqrt(moveX * moveX + moveY * moveY);
      moveX /= mag;
      moveY /= mag;
    }

    state.player.velX = moveX * speed;
    state.player.velY = moveY * speed;
  }

  checkItemInteractions(state) {
    this.inputs.forEach((input, playerId) => {
      const role = RoleManager.getRoleForPlayer(this.room.players, playerId);

      // Pickup (INTERACT role)
      if (role === CONSTANTS.ROLES.INTERACT && input.interact) {
        this.tryPickupItem(state);
        input.interact = false; // Consume the input
      }

      // Drop (DROP role)
      if (role === CONSTANTS.ROLES.DROP && input.drop) {
        this.tryDropItem(state);
        input.drop = false; // Consume the input
      }
    });
  }

  tryPickupItem(state) {
    if (state.inventory.length >= CONSTANTS.INVENTORY_SIZE) return;

    const player = state.player;

    for (let i = 0; i < state.items.length; i++) {
      const item = state.items[i];
      if (item.isCollected) continue;

      const dist = Math.sqrt(
        Math.pow(player.x - item.x, 2) +
        Math.pow(player.y - item.y, 2)
      );

      if (dist < CONSTANTS.PICKUP_RADIUS) {
        item.isCollected = true;
        state.inventory.push(item.type);
        break;
      }
    }
  }

  tryDropItem(state) {
    if (state.inventory.length === 0) return;

    const droppedItem = state.inventory.pop();
    state.items.push({
      type: droppedItem,
      x: state.player.x + (Math.random() * 20 - 10),
      y: state.player.y + (Math.random() * 20 - 10),
      isCollected: false
    });
  }

  checkExitInteractions(state) {
    this.inputs.forEach((input, playerId) => {
      const role = RoleManager.getRoleForPlayer(this.room.players, playerId);

      if (role === CONSTANTS.ROLES.INTERACT && input.interact) {
        const player = state.player;
        const panel = MAP_DATA.exitPanel;

        // Check if near exit panel
        const nearPanel = player.x >= panel.x - 30 &&
          player.x <= panel.x + panel.width + 30 &&
          player.y >= panel.y - 30 &&
          player.y <= panel.y + panel.height + 30;

        if (nearPanel) {
          this.tryInstallPart(state);
          input.interact = false;
        }

        // Check if in exit zone and all parts installed
        const exit = MAP_DATA.exitZone;
        const inExit = player.x >= exit.x &&
          player.x <= exit.x + exit.width &&
          player.y >= exit.y &&
          player.y <= exit.y + exit.height;

        if (inExit &&
          state.installedParts.battery &&
          state.installedParts.bulb &&
          state.installedParts.handle) {
          this.endGame('escaped');
        }
      }
    });
  }

  tryInstallPart(state) {
    const needed = [];
    if (!state.installedParts.battery) needed.push('BATTERY');
    if (!state.installedParts.bulb) needed.push('BULB');
    if (!state.installedParts.handle) needed.push('SWITCH_HANDLE');

    for (let i = 0; i < state.inventory.length; i++) {
      const item = state.inventory[i];
      if (needed.includes(item)) {
        // Install the part
        if (item === 'BATTERY') state.installedParts.battery = true;
        if (item === 'BULB') state.installedParts.bulb = true;
        if (item === 'SWITCH_HANDLE') state.installedParts.handle = true;

        state.inventory.splice(i, 1);
        break;
      }
    }
  }

  onPlayerCaught() {
    const state = this.room.gameState;
    state.player.isFrozen = true;
    state.phase = CONSTANTS.PHASES.VOTING;
    state.votes = {};
    state.voteTimer = CONSTANTS.VOTE_DURATION;
    this.room.stats.timesCaught++;

    // Determine demand
    const needed = [];
    if (!state.installedParts.battery) needed.push('BATTERY');
    if (!state.installedParts.bulb) needed.push('BULB');
    if (!state.installedParts.handle) needed.push('SWITCH_HANDLE');

    // Check if player has a needed item
    const hasNeeded = state.inventory.find(item => needed.includes(item));
    if (hasNeeded) {
      state.demand = hasNeeded;
    } else if (state.inventory.length > 0) {
      state.demand = 'ANY';
    } else {
      state.demand = 'IMPOSSIBLE';
    }

    // Broadcast catch event
    this.io.to(this.room.roomId).emit('npc-caught', {
      demand: state.demand,
      hasItem: state.inventory.length > 0
    });
  }

  processVoting(delta) {
    const state = this.room.gameState;
    state.voteTimer -= delta;

    // Add bot votes automatically
    this.addBotVotes();

    // Broadcast vote status
    let giveVotes = 0;
    let refuseVotes = 0;
    Object.values(state.votes).forEach(vote => {
      if (vote === 'give') giveVotes++;
      else refuseVotes++;
    });

    this.io.to(this.room.roomId).emit('vote-update', {
      giveVotes,
      refuseVotes,
      timeLeft: state.voteTimer
    });

    // Check if vote is complete
    if (state.voteTimer <= 0 || Object.keys(state.votes).length >= this.room.players.length) {
      this.resolveVote(giveVotes >= refuseVotes);
    }
  }

  handleVote(playerId, vote) {
    const state = this.room.gameState;
    if (state.phase !== CONSTANTS.PHASES.VOTING) return;

    state.votes[playerId] = vote;
  }

  resolveVote(giveItem) {
    const state = this.room.gameState;

    if (giveItem && state.demand !== 'IMPOSSIBLE' && state.inventory.length > 0) {
      // Give item
      let itemToRemove;
      if (state.demand === 'ANY') {
        itemToRemove = state.inventory[0];
      } else {
        itemToRemove = state.demand;
      }

      const idx = state.inventory.indexOf(itemToRemove);
      if (idx !== -1) {
        state.inventory.splice(idx, 1);
        this.room.stats.itemsSacrificed++;

        // Respawn item at random location
        const spawnPos = getRandomSpawnPoint();
        state.items.push({
          type: itemToRemove,
          x: spawnPos.x,
          y: spawnPos.y,
          isCollected: false
        });
      }
    } else {
      // Apply penalty
      state.timeRemaining -= CONSTANTS.NPC_PENALTY_TIME;
    }

    // Unfreeze and resume
    state.player.isFrozen = false;
    state.phase = CONSTANTS.PHASES.PLAYING;
    state.votes = {};
    state.demand = null;

    this.io.to(this.room.roomId).emit('vote-resolved', {
      gaveItem: giveItem && state.demand !== 'IMPOSSIBLE',
      timeRemaining: state.timeRemaining
    });
  }

  performRoleSwap() {
    const newRoles = RoleManager.swapRoles(this.room.players);

    this.io.to(this.room.roomId).emit('role-swap', {
      roles: newRoles
    });
  }

  recalculateRoles() {
    RoleManager.assignRoles(this.room.players);
    const roles = this.room.players.map(p => ({ id: p.id, role: p.role }));

    this.io.to(this.room.roomId).emit('role-swap', {
      roles: roles
    });
  }

  endGame(reason) {
    this.stop();
    const state = this.room.gameState;

    const won = reason === 'escaped';
    const stats = {
      timeTaken: CONSTANTS.MATCH_DURATION - state.timeRemaining,
      timesCaught: this.room.stats.timesCaught,
      itemsSacrificed: this.room.stats.itemsSacrificed
    };

    this.room.phase = CONSTANTS.PHASES.ENDED;
    state.phase = won ? CONSTANTS.PHASES.WON : CONSTANTS.PHASES.LOST;

    this.io.to(this.room.roomId).emit('game-ended', {
      won: won,
      reason: reason,
      stats: stats
    });

    if (this.onEnd) {
      this.onEnd();
    }
  }

  handleInput(playerId, input) {
    this.inputs.set(playerId, input);
  }

  updateBotInputs(state) {
    this.bots.forEach((bot, botId) => {
      const player = this.room.players.find(p => p.id === botId);
      if (player) {
        bot.updateRole(player.role);
        const input = bot.generateInput(state);
        this.inputs.set(botId, input);
      }
    });
  }

  addBotVotes() {
    const state = this.room.gameState;
    // Bots vote to give if they have items, refuse if not
    this.bots.forEach((bot, botId) => {
      if (!state.votes[botId]) {
        const vote = state.inventory.length > 0 ? 'give' : 'refuse';
        state.votes[botId] = vote;
      }
    });
  }

  broadcast() {
    const state = this.room.gameState;
    if (!state) return;

    this.io.to(this.room.roomId).emit('game-state', {
      player: state.player,
      inventory: state.inventory,
      installedParts: state.installedParts,
      items: state.items,
      npc: state.npc,
      timeRemaining: state.timeRemaining,
      swapTimer: state.swapTimer,
      phase: state.phase
    });
  }
}

module.exports = GameLoop;
module.exports.createInitialGameState = createInitialGameState;
