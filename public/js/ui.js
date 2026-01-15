// UI Manager
const UI = {
  currentScreen: 'home',

  showScreen(screenName) {
    // Hide all screens
    document.querySelectorAll('.screen').forEach(screen => {
      screen.classList.remove('active');
    });

    // Show target screen
    const targetScreen = document.getElementById(`${screenName}-screen`);
    if (targetScreen) {
      targetScreen.classList.add('active');
      this.currentScreen = screenName;
    }
  },

  // HUD Updates
  updateTimer(timeRemaining) {
    const minutes = Math.floor(timeRemaining / 60000);
    const seconds = Math.floor((timeRemaining % 60000) / 1000);
    document.getElementById('timer-display').textContent =
      `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    // Flash red when low time
    const timerEl = document.getElementById('hud-top-center');
    if (timeRemaining < 30000) {
      timerEl.style.animation = 'pulse 0.5s infinite';
    } else {
      timerEl.style.animation = '';
    }
  },

  updateSwapTimer(swapTimer) {
    const minutes = Math.floor(swapTimer / 60000);
    const seconds = Math.floor((swapTimer % 60000) / 1000);
    document.getElementById('swap-countdown').textContent =
      `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  },

  updateRole(role) {
    const roleNameEl = document.getElementById('role-name');
    roleNameEl.textContent = role;
    roleNameEl.className = `role-${role.toLowerCase()}`;
  },

  updateInventory(inventory) {
    const slot0 = document.getElementById('inv-slot-0');
    const slot1 = document.getElementById('inv-slot-1');

    [slot0, slot1].forEach((slot, i) => {
      const item = inventory[i];
      if (item) {
        slot.textContent = this.getItemIcon(item);
        slot.classList.add('has-item');
        slot.title = item;
      } else {
        slot.textContent = '';
        slot.classList.remove('has-item');
        slot.title = 'Empty';
      }
    });
  },

  getItemIcon(itemType) {
    switch (itemType) {
      case 'BATTERY': return '\u{1F50B}';
      case 'BULB': return '\u{1F4A1}';
      case 'SWITCH_HANDLE': return '\u{1F527}';
      default: return '?';
    }
  },

  updateExitChecklist(installedParts) {
    const items = ['battery', 'bulb', 'handle'];
    items.forEach(item => {
      const el = document.getElementById(`check-${item}`);
      const key = item === 'handle' ? 'handle' : item;
      if (installedParts[key]) {
        el.classList.add('completed');
        el.querySelector('.check-icon').textContent = '\u2713';
      } else {
        el.classList.remove('completed');
        el.querySelector('.check-icon').textContent = '\u2717';
      }
    });
  },

  // Overlays
  showRoleSwapOverlay(newRole) {
    const overlay = document.getElementById('role-swap-overlay');
    document.getElementById('new-role-name').textContent = newRole;
    overlay.classList.remove('hidden');

    setTimeout(() => {
      overlay.classList.add('hidden');
    }, 2000);
  },

  showNPCOverlay(demand, hasItem) {
    const overlay = document.getElementById('npc-overlay');
    const demandText = document.getElementById('npc-demand');
    const giveBtn = document.getElementById('vote-give');
    const refuseBtn = document.getElementById('vote-refuse');

    if (demand === 'IMPOSSIBLE') {
      demandText.textContent = 'PAY THE PRICE!';
      giveBtn.classList.add('hidden');
      refuseBtn.textContent = 'ACCEPT PENALTY';
    } else if (demand === 'ANY') {
      demandText.textContent = 'GIVE ME SOMETHING!';
      giveBtn.classList.remove('hidden');
      giveBtn.disabled = !hasItem;
      refuseBtn.textContent = 'REFUSE';
    } else {
      demandText.textContent = `GIVE ME THE ${demand}!`;
      giveBtn.classList.remove('hidden');
      giveBtn.disabled = !hasItem;
      refuseBtn.textContent = 'REFUSE';
    }

    overlay.classList.remove('hidden');
  },

  updateVoteStatus(giveCount, refuseCount, timeLeft) {
    document.getElementById('vote-give-count').textContent = giveCount;
    document.getElementById('vote-refuse-count').textContent = refuseCount;
    document.getElementById('vote-timer').textContent = Math.ceil(timeLeft / 1000);
  },

  hideNPCOverlay() {
    document.getElementById('npc-overlay').classList.add('hidden');
  },

  showResultsOverlay(won, stats, isHost) {
    const overlay = document.getElementById('results-overlay');
    const titleEl = document.getElementById('result-title');
    const playAgainBtn = document.getElementById('play-again-btn');

    if (won) {
      titleEl.textContent = 'ESCAPED!';
      titleEl.className = 'win';
    } else {
      titleEl.textContent = 'TRAPPED!';
      titleEl.className = 'lose';
    }

    // Update stats
    if (stats.timeTaken) {
      const minutes = Math.floor(stats.timeTaken / 60000);
      const seconds = Math.floor((stats.timeTaken % 60000) / 1000);
      document.getElementById('stat-time').textContent =
        `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
      document.getElementById('stat-time').textContent = '--:--';
    }

    document.getElementById('stat-caught').textContent = stats.timesCaught || 0;
    document.getElementById('stat-sacrificed').textContent = stats.itemsSacrificed || 0;

    // Show play again for host
    if (isHost) {
      playAgainBtn.classList.remove('hidden');
    } else {
      playAgainBtn.classList.add('hidden');
    }

    overlay.classList.remove('hidden');
  },

  hideResultsOverlay() {
    document.getElementById('results-overlay').classList.add('hidden');
  }
};
