/**
 * Wander — main game controller
 * Supports 9 levels; Level 1 implemented.
 */
const LEVELS = [Level1];

const Game = {
  currentLevel: 0,
  state: null,

  elements: {},

  init() {
    this.elements = {
      board: document.getElementById('board'),
      levelLabel: document.getElementById('level-label'),
      hydrationFill: document.getElementById('hydration-fill'),
      hydrationValue: document.getElementById('hydration-value'),
      goldValue: document.getElementById('gold-value'),
      scoreValue: document.getElementById('score-value'),
      messageBar: document.getElementById('message-bar'),
      startOverlay: document.getElementById('start-overlay'),
      traderOverlay: document.getElementById('trader-overlay'),
      endOverlay: document.getElementById('end-overlay'),
      endTitle: document.getElementById('end-title'),
      endMessage: document.getElementById('end-message'),
      endScore: document.getElementById('end-score'),
      startBtn: document.getElementById('start-btn'),
      tradeBtn: document.getElementById('trade-btn'),
      tradeCloseBtn: document.getElementById('trade-close-btn'),
      restartBtn: document.getElementById('restart-btn'),
    };

    this.elements.startBtn.addEventListener('click', () => this.startLevel(0));
    this.elements.restartBtn.addEventListener('click', () => this.showStartOverlay());
    this.elements.tradeBtn.addEventListener('click', () => this.handleTrade());
    this.elements.tradeCloseBtn.addEventListener('click', () => this.closeTrader());
  },

  getLevel() {
    return LEVELS[this.currentLevel];
  },

  showStartOverlay() {
    this.elements.endOverlay.classList.add('hidden');
    this.elements.traderOverlay.classList.add('hidden');
    this.elements.startOverlay.classList.remove('hidden');
  },

  startLevel(index) {
    this.currentLevel = index;
    const level = this.getLevel();
    this.state = level.createState();
    this.elements.startOverlay.classList.add('hidden');
    this.elements.endOverlay.classList.add('hidden');
    this.elements.levelLabel.textContent = level.label;
    this.render();
    this.setMessage('Tap a tile to explore. Numbers warn of nearby dangers.');
  },

  setMessage(text) {
    this.elements.messageBar.textContent = text;
  },

  render() {
    const level = this.getLevel();
    const { state } = this;
    const { size, config } = level;

    this.elements.board.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
    this.elements.board.innerHTML = '';

    state.cells.forEach((cell, index) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'tile';
      btn.setAttribute('role', 'gridcell');
      btn.setAttribute('aria-label', cell.revealed ? `Revealed ${cell.terrain}` : 'Hidden tile');

      const display = level.getTileDisplay(cell);
      btn.className = `tile ${display.className}`;
      btn.textContent = display.emoji;
      btn.disabled = state.gameOver || cell.revealed;

      if (!cell.revealed && !state.gameOver) {
        btn.addEventListener('click', () => this.handleTileClick(index));
      }

      this.elements.board.appendChild(btn);
    });

    const hydrationPct = (state.hydration / config.hydrationMax) * 100;
    this.elements.hydrationFill.style.width = `${Math.max(0, hydrationPct)}%`;
    this.elements.hydrationValue.textContent = Math.max(0, state.hydration);
    this.elements.goldValue.textContent = state.gold;
    this.elements.scoreValue.textContent = state.score;

    this.elements.tradeBtn.disabled =
      state.gold < config.traderGoldCost ||
      state.hydration >= config.hydrationMax;
  },

  handleTileClick(index) {
    const level = this.getLevel();
    const result = level.revealTile(this.state, index);
    if (!result) return;

    if (result.openTrader) {
      this.state.traderOverlayOpen = true;
      this.elements.traderOverlay.classList.remove('hidden');
      this.setMessage(result.message);
      this.render();
      return;
    }

    this.setMessage(result.message);
    this.render();

    if (result.died) {
      this.endGame(false, result.message);
    } else if (result.won) {
      this.endGame(true, result.message);
    }
  },

  handleTrade() {
    const level = this.getLevel();
    const success = level.tradeWater(this.state);
    if (success) {
      this.setMessage('The trader hands you a waterskin. Hydration restored.');
    } else {
      this.setMessage('Not enough gold, or your canteen is already full.');
    }
    this.elements.tradeBtn.disabled =
      this.state.gold < level.config.traderGoldCost ||
      this.state.hydration >= level.config.hydrationMax;
    this.elements.goldValue.textContent = this.state.gold;
    this.elements.hydrationValue.textContent = this.state.hydration;
    const hydrationPct =
      (this.state.hydration / level.config.hydrationMax) * 100;
    this.elements.hydrationFill.style.width = `${hydrationPct}%`;
  },

  closeTrader() {
    this.state.traderOverlayOpen = false;
    this.elements.traderOverlay.classList.add('hidden');
    const level = this.getLevel();
    level.moveTrader(this.state);
    this.render();
    this.setMessage('The trader packs up and wanders off into the dunes.');
  },

  endGame(won, message) {
    this.state.gameOver = true;
    this.state.won = won;

    this.elements.endTitle.textContent = won ? 'Cave Found!' : 'Perished';
    this.elements.endMessage.textContent = message;
    this.elements.endScore.textContent = `Final Score: ${this.state.score}`;
    this.elements.endOverlay.classList.remove('hidden');
    this.render();
  },
};

document.addEventListener('DOMContentLoaded', () => Game.init());