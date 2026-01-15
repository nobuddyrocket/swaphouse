// Bot AI - CPU player logic
const CONSTANTS = require('../shared/constants');
const { MAP_DATA } = require('./mapData');

class BotAI {
  constructor(botId, role) {
    this.botId = botId;
    this.role = role;
    this.targetItem = null;
    this.lastActionTime = 0;
    this.actionCooldown = 500; // ms between actions
  }

  updateRole(newRole) {
    this.role = newRole;
  }

  generateInput(gameState) {
    const now = Date.now();
    const input = {
      direction: { x: 0, y: 0 },
      sprint: false,
      interact: false,
      drop: false,
      dash: false
    };

    if (!gameState || gameState.player.isFrozen) {
      return input;
    }

    const player = gameState.player;
    const npc = gameState.npc;

    switch (this.role) {
      case CONSTANTS.ROLES.MOVE:
        input.direction = this.calculateMovement(gameState);
        break;

      case CONSTANTS.ROLES.INTERACT:
        input.interact = this.shouldInteract(gameState);
        break;

      case CONSTANTS.ROLES.SPRINT:
        input.sprint = this.shouldSprint(gameState);
        break;

      case CONSTANTS.ROLES.DASH:
        input.dash = this.shouldDash(gameState);
        break;

      case CONSTANTS.ROLES.DROP:
        input.drop = this.shouldDrop(gameState);
        break;
    }

    return input;
  }

  calculateMovement(gameState) {
    const player = gameState.player;
    const npc = gameState.npc;
    const items = gameState.items.filter(i => !i.isCollected);
    const inventory = gameState.inventory;
    const installed = gameState.installedParts;

    // Priority 1: Run away from NPC if too close
    const npcDist = this.distance(player, npc);
    if (npcDist < 100) {
      // Run away from NPC
      const dx = player.x - npc.x;
      const dy = player.y - npc.y;
      const mag = Math.sqrt(dx * dx + dy * dy) || 1;
      return { x: dx / mag, y: dy / mag };
    }

    // Priority 2: If we have items and all parts found, go to exit
    const neededParts = [];
    if (!installed.battery) neededParts.push('BATTERY');
    if (!installed.bulb) neededParts.push('BULB');
    if (!installed.handle) neededParts.push('SWITCH_HANDLE');

    const hasNeededItem = inventory.some(item => neededParts.includes(item));

    if (hasNeededItem) {
      // Go to exit panel
      const exitPanel = MAP_DATA.exitPanel;
      const targetX = exitPanel.x + exitPanel.width / 2;
      const targetY = exitPanel.y + exitPanel.height / 2;
      return this.moveToward(player, { x: targetX, y: targetY });
    }

    // Priority 3: If inventory not full and items exist, go pick one up
    if (inventory.length < CONSTANTS.INVENTORY_SIZE && items.length > 0) {
      // Find nearest needed item
      let bestItem = null;
      let bestDist = Infinity;

      items.forEach(item => {
        if (neededParts.includes(item.type)) {
          const dist = this.distance(player, item);
          if (dist < bestDist) {
            bestDist = dist;
            bestItem = item;
          }
        }
      });

      // If no needed item, get any item
      if (!bestItem && items.length > 0) {
        items.forEach(item => {
          const dist = this.distance(player, item);
          if (dist < bestDist) {
            bestDist = dist;
            bestItem = item;
          }
        });
      }

      if (bestItem) {
        return this.moveToward(player, bestItem);
      }
    }

    // Priority 4: All items collected, go to exit
    if (installed.battery && installed.bulb && installed.handle) {
      const exitZone = MAP_DATA.exitZone;
      const targetX = exitZone.x + exitZone.width / 2;
      const targetY = exitZone.y + exitZone.height / 2;
      return this.moveToward(player, { x: targetX, y: targetY });
    }

    // Default: wander randomly
    return { x: 0, y: 0 };
  }

  moveToward(from, to) {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const mag = Math.sqrt(dx * dx + dy * dy) || 1;

    // Normalize
    let x = dx / mag;
    let y = dy / mag;

    // Snap to cardinal directions for cleaner movement
    if (Math.abs(x) > Math.abs(y)) {
      x = x > 0 ? 1 : -1;
      y = 0;
    } else if (Math.abs(y) > Math.abs(x)) {
      y = y > 0 ? 1 : -1;
      x = 0;
    }

    return { x, y };
  }

  shouldInteract(gameState) {
    const player = gameState.player;
    const items = gameState.items.filter(i => !i.isCollected);
    const inventory = gameState.inventory;
    const installed = gameState.installedParts;

    // Check if near exit panel and have item to install
    const exitPanel = MAP_DATA.exitPanel;
    const nearPanel = player.x >= exitPanel.x - 40 &&
      player.x <= exitPanel.x + exitPanel.width + 40 &&
      player.y >= exitPanel.y - 40 &&
      player.y <= exitPanel.y + exitPanel.height + 40;

    if (nearPanel && inventory.length > 0) {
      const neededParts = [];
      if (!installed.battery) neededParts.push('BATTERY');
      if (!installed.bulb) neededParts.push('BULB');
      if (!installed.handle) neededParts.push('SWITCH_HANDLE');

      if (inventory.some(item => neededParts.includes(item))) {
        return true;
      }
    }

    // Check if near item to pick up
    if (inventory.length < CONSTANTS.INVENTORY_SIZE) {
      for (const item of items) {
        const dist = this.distance(player, item);
        if (dist < CONSTANTS.PICKUP_RADIUS + 10) {
          return true;
        }
      }
    }

    // Check if in exit zone and all parts installed
    const exitZone = MAP_DATA.exitZone;
    const inExit = player.x >= exitZone.x &&
      player.x <= exitZone.x + exitZone.width &&
      player.y >= exitZone.y &&
      player.y <= exitZone.y + exitZone.height;

    if (inExit && installed.battery && installed.bulb && installed.handle) {
      return true;
    }

    return false;
  }

  shouldSprint(gameState) {
    const player = gameState.player;
    const npc = gameState.npc;

    // Sprint when NPC is nearby
    const npcDist = this.distance(player, npc);
    return npcDist < 150;
  }

  shouldDash(gameState) {
    const player = gameState.player;
    const npc = gameState.npc;

    // Dash when NPC is very close
    const npcDist = this.distance(player, npc);
    return npcDist < 80 && !player.isDashing;
  }

  shouldDrop(gameState) {
    // Rarely drop items - only if we have duplicates or wrong items
    return false;
  }

  distance(a, b) {
    return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
  }
}

module.exports = BotAI;
