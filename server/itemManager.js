// Item Manager - Helper functions for item handling
const CONSTANTS = require('../shared/constants');
const { getRandomSpawnPoint } = require('./mapData');

const ItemManager = {
  // Check if player can pick up an item
  canPickup(state) {
    return state.inventory.length < CONSTANTS.INVENTORY_SIZE;
  },

  // Find nearest item within pickup radius
  findNearestItem(state) {
    const player = state.player;
    let nearestItem = null;
    let nearestDist = Infinity;

    state.items.forEach(item => {
      if (item.isCollected) return;

      const dist = Math.sqrt(
        Math.pow(player.x - item.x, 2) +
        Math.pow(player.y - item.y, 2)
      );

      if (dist < CONSTANTS.PICKUP_RADIUS && dist < nearestDist) {
        nearestItem = item;
        nearestDist = dist;
      }
    });

    return nearestItem;
  },

  // Pick up an item
  pickup(state, item) {
    if (!this.canPickup(state)) return false;

    item.isCollected = true;
    state.inventory.push(item.type);
    return true;
  },

  // Drop an item
  drop(state) {
    if (state.inventory.length === 0) return null;

    const droppedType = state.inventory.pop();
    const newItem = {
      type: droppedType,
      x: state.player.x + (Math.random() * 30 - 15),
      y: state.player.y + (Math.random() * 30 - 15),
      isCollected: false
    };

    state.items.push(newItem);
    return newItem;
  },

  // Respawn an item at random location
  respawnItem(state, itemType) {
    const pos = getRandomSpawnPoint();
    const newItem = {
      type: itemType,
      x: pos.x,
      y: pos.y,
      isCollected: false
    };

    state.items.push(newItem);
    return newItem;
  },

  // Check which parts are still needed
  getNeededParts(state) {
    const needed = [];
    if (!state.installedParts.battery) needed.push('BATTERY');
    if (!state.installedParts.bulb) needed.push('BULB');
    if (!state.installedParts.handle) needed.push('SWITCH_HANDLE');
    return needed;
  },

  // Check if player has a specific item
  hasItem(state, itemType) {
    return state.inventory.includes(itemType);
  },

  // Remove item from inventory
  removeFromInventory(state, itemType) {
    const idx = state.inventory.indexOf(itemType);
    if (idx !== -1) {
      state.inventory.splice(idx, 1);
      return true;
    }
    return false;
  }
};

module.exports = ItemManager;
