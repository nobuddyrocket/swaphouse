const CONSTANTS = require('../shared/constants');

class RoleManager {
  static assignRoles(players) {
    const playerCount = players.length;
    const roles = CONSTANTS.ROLE_ASSIGNMENTS[playerCount];

    if (!roles) {
      console.error(`Invalid player count: ${playerCount}`);
      return;
    }

    // Shuffle players
    const shuffledPlayers = [...players].sort(() => Math.random() - 0.5);

    // Assign roles
    shuffledPlayers.forEach((player, index) => {
      player.role = roles[index];
    });
  }

  static swapRoles(players) {
    const playerCount = players.length;
    const roles = CONSTANTS.ROLE_ASSIGNMENTS[playerCount];

    if (!roles) return;

    // Collect current roles
    const currentRoles = players.map(p => p.role);

    // Shuffle roles
    const shuffledRoles = [...currentRoles].sort(() => Math.random() - 0.5);

    // Make sure at least one role changed
    let allSame = shuffledRoles.every((role, i) => role === currentRoles[i]);
    while (allSame && players.length > 1) {
      shuffledRoles.sort(() => Math.random() - 0.5);
      allSame = shuffledRoles.every((role, i) => role === currentRoles[i]);
    }

    // Assign new roles
    players.forEach((player, index) => {
      player.role = shuffledRoles[index];
    });

    return players.map(p => ({ id: p.id, role: p.role }));
  }

  static getRoleForPlayer(players, playerId) {
    const player = players.find(p => p.id === playerId);
    return player ? player.role : null;
  }

  static validateInput(players, playerId, inputType) {
    const role = this.getRoleForPlayer(players, playerId);
    if (!role) return false;

    switch (inputType) {
      case 'move':
        return role === CONSTANTS.ROLES.MOVE;
      case 'interact':
        return role === CONSTANTS.ROLES.INTERACT;
      case 'dash':
        return role === CONSTANTS.ROLES.DASH;
      case 'sprint':
        return role === CONSTANTS.ROLES.SPRINT;
      case 'drop':
        return role === CONSTANTS.ROLES.DROP;
      default:
        return false;
    }
  }
}

module.exports = RoleManager;
