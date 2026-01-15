// Canvas 2D Renderer
const Renderer = {
  canvas: null,
  ctx: null,
  mapData: null,

  init() {
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.resize();

    window.addEventListener('resize', () => this.resize());
  },

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  },

  setMapData(mapData) {
    this.mapData = mapData;
  },

  clear() {
    this.ctx.fillStyle = '#0a0a0a';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  },

  // Calculate offset to center the map
  getOffset() {
    if (!this.mapData) return { x: 0, y: 0 };
    const offsetX = (this.canvas.width - this.mapData.width) / 2;
    const offsetY = (this.canvas.height - this.mapData.height) / 2;
    return { x: offsetX, y: offsetY };
  },

  render(gameState) {
    this.clear();

    if (!this.mapData || !gameState) return;

    const offset = this.getOffset();
    this.ctx.save();
    this.ctx.translate(offset.x, offset.y);

    // Draw rooms
    this.drawRooms();

    // Draw walls
    this.drawWalls();

    // Draw exit zone
    this.drawExitZone(gameState.installedParts);

    // Draw items
    this.drawItems(gameState.items);

    // Draw NPC
    this.drawNPC(gameState.npc);

    // Draw player
    this.drawPlayer(gameState.player);

    // Draw room labels
    this.drawRoomLabels();

    this.ctx.restore();
  },

  drawRooms() {
    this.mapData.rooms.forEach(room => {
      this.ctx.fillStyle = room.color;
      this.ctx.fillRect(room.x, room.y, room.width, room.height);

      // Room border
      this.ctx.strokeStyle = '#444';
      this.ctx.lineWidth = 1;
      this.ctx.strokeRect(room.x, room.y, room.width, room.height);
    });
  },

  drawWalls() {
    this.ctx.fillStyle = '#1a1a2e';
    this.mapData.walls.forEach(wall => {
      this.ctx.fillRect(wall.x, wall.y, wall.width, wall.height);
    });

    // Wall border effect
    this.ctx.strokeStyle = '#0f3460';
    this.ctx.lineWidth = 2;
    this.mapData.walls.forEach(wall => {
      this.ctx.strokeRect(wall.x, wall.y, wall.width, wall.height);
    });
  },

  drawExitZone(installedParts) {
    const exit = this.mapData.exitZone;
    const panel = this.mapData.exitPanel;

    // Exit zone glow
    const allInstalled = installedParts.battery && installedParts.bulb && installedParts.handle;

    if (allInstalled) {
      this.ctx.fillStyle = 'rgba(0, 255, 100, 0.3)';
      this.ctx.fillRect(exit.x, exit.y, exit.width, exit.height);
      this.ctx.strokeStyle = '#00ff66';
    } else {
      this.ctx.fillStyle = 'rgba(100, 100, 100, 0.3)';
      this.ctx.fillRect(exit.x, exit.y, exit.width, exit.height);
      this.ctx.strokeStyle = '#666';
    }

    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([5, 5]);
    this.ctx.strokeRect(exit.x, exit.y, exit.width, exit.height);
    this.ctx.setLineDash([]);

    // Exit panel
    this.ctx.fillStyle = '#333';
    this.ctx.fillRect(panel.x, panel.y, panel.width, panel.height);
    this.ctx.strokeStyle = '#666';
    this.ctx.strokeRect(panel.x, panel.y, panel.width, panel.height);

    // Panel slots
    const slotY = panel.y + 10;
    const items = [
      { key: 'battery', icon: '\u{1F50B}', color: installedParts.battery ? '#00ff66' : '#333' },
      { key: 'bulb', icon: '\u{1F4A1}', color: installedParts.bulb ? '#00ff66' : '#333' },
      { key: 'handle', icon: '\u{1F527}', color: installedParts.handle ? '#00ff66' : '#333' }
    ];

    items.forEach((item, i) => {
      const y = slotY + i * 22;
      this.ctx.fillStyle = item.color;
      this.ctx.fillRect(panel.x + 5, y, 30, 18);
      this.ctx.strokeStyle = '#888';
      this.ctx.strokeRect(panel.x + 5, y, 30, 18);

      if (installedParts[item.key]) {
        this.ctx.font = '12px Arial';
        this.ctx.fillStyle = '#000';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(item.icon, panel.x + 20, y + 14);
      }
    });

    // EXIT label
    this.ctx.font = 'bold 14px Arial';
    this.ctx.fillStyle = allInstalled ? '#00ff66' : '#888';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('EXIT', exit.x + exit.width / 2, exit.y + exit.height / 2 + 5);
  },

  drawItems(items) {
    items.forEach(item => {
      if (item.isCollected) return;

      // Item glow
      this.ctx.beginPath();
      this.ctx.arc(item.x, item.y, 20, 0, Math.PI * 2);
      this.ctx.fillStyle = 'rgba(255, 255, 100, 0.2)';
      this.ctx.fill();

      // Item background
      this.ctx.beginPath();
      this.ctx.arc(item.x, item.y, 15, 0, Math.PI * 2);
      this.ctx.fillStyle = this.getItemColor(item.type);
      this.ctx.fill();
      this.ctx.strokeStyle = '#fff';
      this.ctx.lineWidth = 2;
      this.ctx.stroke();

      // Item icon
      this.ctx.font = '16px Arial';
      this.ctx.fillStyle = '#fff';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(this.getItemIcon(item.type), item.x, item.y);
    });
  },

  getItemColor(type) {
    switch (type) {
      case 'BATTERY': return '#4a9c4a';
      case 'BULB': return '#c9a227';
      case 'SWITCH_HANDLE': return '#7a7a9c';
      default: return '#666';
    }
  },

  getItemIcon(type) {
    switch (type) {
      case 'BATTERY': return '\u{1F50B}';
      case 'BULB': return '\u{1F4A1}';
      case 'SWITCH_HANDLE': return '\u{1F527}';
      default: return '?';
    }
  },

  drawNPC(npc) {
    if (!npc) return;

    // NPC shadow/detection radius (visual hint)
    this.ctx.beginPath();
    this.ctx.arc(npc.x, npc.y, 40, 0, Math.PI * 2);
    this.ctx.fillStyle = 'rgba(255, 0, 0, 0.1)';
    this.ctx.fill();

    // NPC body
    this.ctx.beginPath();
    this.ctx.arc(npc.x, npc.y, 18, 0, Math.PI * 2);
    this.ctx.fillStyle = '#8b0000';
    this.ctx.fill();
    this.ctx.strokeStyle = '#ff0000';
    this.ctx.lineWidth = 3;
    this.ctx.stroke();

    // NPC face (menacing eyes)
    this.ctx.fillStyle = '#fff';
    this.ctx.beginPath();
    this.ctx.arc(npc.x - 6, npc.y - 3, 4, 0, Math.PI * 2);
    this.ctx.arc(npc.x + 6, npc.y - 3, 4, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = '#000';
    this.ctx.beginPath();
    this.ctx.arc(npc.x - 6, npc.y - 3, 2, 0, Math.PI * 2);
    this.ctx.arc(npc.x + 6, npc.y - 3, 2, 0, Math.PI * 2);
    this.ctx.fill();

    // Label
    this.ctx.font = 'bold 10px Arial';
    this.ctx.fillStyle = '#ff4444';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('COLLECTOR', npc.x, npc.y + 30);
  },

  drawPlayer(player) {
    if (!player) return;

    // Frozen effect
    if (player.isFrozen) {
      this.ctx.beginPath();
      this.ctx.arc(player.x, player.y, 25, 0, Math.PI * 2);
      this.ctx.fillStyle = 'rgba(100, 100, 255, 0.3)';
      this.ctx.fill();
    }

    // Dash trail
    if (player.isDashing) {
      this.ctx.beginPath();
      this.ctx.arc(player.x, player.y, 20, 0, Math.PI * 2);
      this.ctx.fillStyle = 'rgba(255, 200, 100, 0.5)';
      this.ctx.fill();
    }

    // Player body
    this.ctx.beginPath();
    this.ctx.arc(player.x, player.y, 15, 0, Math.PI * 2);
    this.ctx.fillStyle = player.isFrozen ? '#6666cc' : '#e94560';
    this.ctx.fill();
    this.ctx.strokeStyle = '#fff';
    this.ctx.lineWidth = 3;
    this.ctx.stroke();

    // Player face
    this.ctx.fillStyle = '#fff';
    this.ctx.beginPath();
    this.ctx.arc(player.x - 4, player.y - 3, 3, 0, Math.PI * 2);
    this.ctx.arc(player.x + 4, player.y - 3, 3, 0, Math.PI * 2);
    this.ctx.fill();

    // Smile or worry
    this.ctx.beginPath();
    if (player.isFrozen) {
      this.ctx.arc(player.x, player.y + 5, 5, Math.PI, 0);
    } else {
      this.ctx.arc(player.x, player.y + 2, 5, 0, Math.PI);
    }
    this.ctx.strokeStyle = '#fff';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();

    // Label
    this.ctx.font = 'bold 10px Arial';
    this.ctx.fillStyle = '#fff';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('TEAM', player.x, player.y - 22);
  },

  drawRoomLabels() {
    this.ctx.font = '11px Arial';
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    this.ctx.textAlign = 'center';

    this.mapData.rooms.forEach(room => {
      this.ctx.fillText(room.name, room.x + room.width / 2, room.y + room.height - 10);
    });
  }
};
