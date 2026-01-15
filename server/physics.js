// Physics - Movement and Collision
const CONSTANTS = require('../shared/constants');

const Physics = {
  updatePlayer(player, delta) {
    // Apply velocity to position
    player.x += player.velX;
    player.y += player.velY;
  },

  checkWallCollisions(player, walls) {
    const playerRadius = 15;

    walls.forEach(wall => {
      // Find closest point on wall to player
      const closestX = Math.max(wall.x, Math.min(player.x, wall.x + wall.width));
      const closestY = Math.max(wall.y, Math.min(player.y, wall.y + wall.height));

      // Calculate distance
      const distX = player.x - closestX;
      const distY = player.y - closestY;
      const dist = Math.sqrt(distX * distX + distY * distY);

      // Check collision
      if (dist < playerRadius) {
        // Push player out
        if (dist > 0) {
          const overlap = playerRadius - dist;
          player.x += (distX / dist) * overlap;
          player.y += (distY / dist) * overlap;
        } else {
          // Player is inside wall, push out based on shortest escape
          const pushX = player.x < wall.x + wall.width / 2 ?
            wall.x - playerRadius - player.x :
            wall.x + wall.width + playerRadius - player.x;
          const pushY = player.y < wall.y + wall.height / 2 ?
            wall.y - playerRadius - player.y :
            wall.y + wall.height + playerRadius - player.y;

          if (Math.abs(pushX) < Math.abs(pushY)) {
            player.x += pushX;
          } else {
            player.y += pushY;
          }
        }
      }
    });
  },

  distance(a, b) {
    return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
  },

  isInRect(point, rect) {
    return point.x >= rect.x &&
      point.x <= rect.x + rect.width &&
      point.y >= rect.y &&
      point.y <= rect.y + rect.height;
  }
};

module.exports = Physics;
