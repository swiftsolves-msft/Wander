/**
 * Level 1 — The Dunes
 * Minesweeper-style desert exploration.
 */
const Level1 = {
  id: 1,
  name: 'The Dunes',
  label: 'Level 1 — The Dunes',
  size: 8,

  config: {
    snakes: 6,
    scorpions: 4,
    cactusChance: 0.12,
    goldChance: 0.08,
    oasisCount: { min: 1, max: 2 },
    hydrationStart: 10,
    hydrationMax: 10,
    hydrationPerMove: 1,
    oasisHydration: 2,
    traderHydration: 3,
    traderGoldCost: 1,
    scorePerTile: 10,
    scoreGoldBonus: 25,
    scoreOasisBonus: 15,
  },

  createState() {
    const { size, config } = this;
    const cells = Array.from({ length: size * size }, (_, i) => ({
      index: i,
      row: Math.floor(i / size),
      col: i % size,
      terrain: 'sand',
      traderHere: false,
      revealed: false,
      adjacentDangers: 0,
    }));

    return {
      cells,
      traderIndex: -1,
      hydration: config.hydrationStart,
      gold: 0,
      score: 0,
      tilesRevealed: 0,
      gameOver: false,
      won: false,
      firstClick: true,
      traderOverlayOpen: false,
    };
  },

  getNeighbors(index, size) {
    const row = Math.floor(index / size);
    const col = index % size;
    const neighbors = [];
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = row + dr;
        const nc = col + dc;
        if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
          neighbors.push(nr * size + nc);
        }
      }
    }
    return neighbors;
  },

  placeDangers(cells, size, excludeIndex) {
    const { snakes, scorpions } = this.config;
    const available = cells
      .map((c, i) => i)
      .filter((i) => i !== excludeIndex);

    const shuffle = (arr) => {
      const a = [...arr];
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    };

    const shuffled = shuffle(available);
    for (let i = 0; i < snakes; i++) {
      cells[shuffled[i]].terrain = 'snake';
    }
    for (let i = snakes; i < snakes + scorpions; i++) {
      cells[shuffled[i]].terrain = 'scorpion';
    }
  },

  placeSpecialTiles(cells, size, excludeIndices) {
    const { oasisCount } = this.config;
    const exclude = new Set(excludeIndices);
    const available = cells
      .map((c, i) => i)
      .filter((i) => !exclude.has(i) && cells[i].terrain === 'sand');

    const pick = (pool) => {
      if (!pool.length) return -1;
      const idx = Math.floor(Math.random() * pool.length);
      const chosen = pool[idx];
      pool.splice(idx, 1);
      return chosen;
    };

    const pool = [...available];

    const oasisTotal =
      oasisCount.min +
      Math.floor(Math.random() * (oasisCount.max - oasisCount.min + 1));
    for (let i = 0; i < oasisTotal; i++) {
      const idx = pick(pool);
      if (idx >= 0) cells[idx].terrain = 'oasis';
    }

    const caveIdx = pick(pool);
    if (caveIdx >= 0) cells[caveIdx].terrain = 'cave';

    const traderIdx = pick(pool);
    if (traderIdx >= 0) {
      cells[traderIdx].traderHere = true;
    }

    return { caveIndex: caveIdx, traderIndex: traderIdx };
  },

  computeAdjacentDangers(cells, size) {
    cells.forEach((cell, i) => {
      if (cell.terrain === 'snake' || cell.terrain === 'scorpion') {
        cell.adjacentDangers = 0;
        return;
      }
      const dangers = this.getNeighbors(i, size).filter((ni) => {
        const t = cells[ni].terrain;
        return t === 'snake' || t === 'scorpion';
      });
      cell.adjacentDangers = dangers.length;
    });
  },

  scatterFeatures(cells, size) {
    const { cactusChance, goldChance } = this.config;
    cells.forEach((cell) => {
      if (cell.terrain !== 'sand') return;
      const roll = Math.random();
      if (roll < goldChance) {
        cell.terrain = 'gold';
      } else if (roll < goldChance + cactusChance) {
        cell.terrain = 'cactus';
      }
    });
  },

  initBoard(state, firstClickIndex) {
    const { size } = this;
    state.cells.forEach((c) => {
      c.terrain = 'sand';
      c.traderHere = false;
      c.revealed = false;
      c.adjacentDangers = 0;
    });

    this.placeDangers(state.cells, size, firstClickIndex);
    const specials = this.placeSpecialTiles(state.cells, size, [firstClickIndex]);
    this.scatterFeatures(state.cells, size);
    this.computeAdjacentDangers(state.cells, size);

    state.caveIndex = specials.caveIndex;
    state.traderIndex = specials.traderIndex;
    state.firstClick = false;
  },

  getHiddenIndices(state) {
    return state.cells
      .map((c, i) => (!c.revealed ? i : -1))
      .filter((i) => i >= 0);
  },

  moveTrader(state) {
    const { size } = this;
    const hidden = this.getHiddenIndices(state);
    if (hidden.length === 0) return;

    const traderCell = state.cells[state.traderIndex];
    if (!traderCell || traderCell.revealed) {
      if (traderCell) traderCell.traderHere = false;
      const fallback = hidden[Math.floor(Math.random() * hidden.length)];
      state.cells[fallback].traderHere = true;
      state.traderIndex = fallback;
      return;
    }

    const adjacentHidden = this.getNeighbors(state.traderIndex, size).filter(
      (i) => !state.cells[i].revealed
    );

    let candidates = adjacentHidden.length > 0 ? adjacentHidden : hidden;

    const nearHidden = candidates.filter((idx) => {
      const nearbyHidden = this.getNeighbors(idx, size).filter(
        (ni) => !state.cells[ni].revealed
      ).length;
      return nearbyHidden >= 2 && nearbyHidden <= 3;
    });

    if (nearHidden.length > 0) {
      candidates = nearHidden;
    } else {
      candidates = candidates.filter((idx) => {
        const count = this.getNeighbors(idx, size).filter(
          (ni) => !state.cells[ni].revealed
        ).length;
        return count >= 2;
      });
      if (candidates.length === 0) candidates = hidden;
    }

    const newIndex = candidates[Math.floor(Math.random() * candidates.length)];
    if (newIndex === state.traderIndex) return;

    state.cells[state.traderIndex].traderHere = false;
    state.cells[newIndex].traderHere = true;
    state.traderIndex = newIndex;
  },

  floodReveal(state, index) {
    const { size } = this;
    const queue = [index];
    const visited = new Set();

    while (queue.length > 0) {
      const current = queue.shift();
      if (visited.has(current)) continue;
      visited.add(current);

      const cell = state.cells[current];
      if (cell.revealed) continue;

      cell.revealed = true;
      state.tilesRevealed++;
      state.score += this.config.scorePerTile;

      if (
        cell.adjacentDangers === 0 &&
        cell.terrain === 'sand' &&
        !cell.traderHere
      ) {
        this.getNeighbors(current, size).forEach((ni) => {
          if (!state.cells[ni].revealed) queue.push(ni);
        });
      }
    }
  },

  revealTile(state, index) {
    const cell = state.cells[index];
    if (cell.revealed || state.gameOver) return null;

    if (state.firstClick) {
      this.initBoard(state, index);
    }

    const result = { type: 'reveal', message: '', died: false, won: false };

    state.hydration -= this.config.hydrationPerMove;

    if (cell.terrain === 'snake') {
      cell.revealed = true;
      result.died = true;
      result.message = 'A viper strikes from the sand!';
      return result;
    }

    if (cell.terrain === 'scorpion') {
      cell.revealed = true;
      result.died = true;
      result.message = 'A scorpion stings your heel!';
      return result;
    }

    if (cell.terrain === 'sand' && cell.adjacentDangers === 0 && !cell.traderHere) {
      this.floodReveal(state, index);
      result.message = 'Open dunes stretch ahead.';
    } else {
      cell.revealed = true;
      state.tilesRevealed++;
      state.score += this.config.scorePerTile;

      if (cell.traderHere) {
        result.openTrader = true;
        result.message = 'A wandering trader hails you from the dunes.';
      } else {
        switch (cell.terrain) {
          case 'cactus':
            result.message = 'A lone cactus punctuates the emptiness.';
            break;
          case 'gold':
            state.gold++;
            state.score += this.config.scoreGoldBonus;
            result.message = 'You pocket a glint of desert gold!';
            break;
          case 'oasis':
            state.hydration = Math.min(
              this.config.hydrationMax,
              state.hydration + this.config.oasisHydration
            );
            state.score += this.config.scoreOasisBonus;
            result.message = 'A hidden oasis quenches your thirst.';
            break;
          case 'cave':
            result.won = true;
            result.message = 'You found the cave entrance! (Level 2 coming soon)';
            break;
          case 'sand':
            result.message =
              cell.adjacentDangers > 0
                ? 'The sand feels uneasy nearby...'
                : 'Nothing but sun-bleached sand.';
            break;
        }
      }
    }

    if (state.hydration <= 0 && !result.died) {
      result.died = true;
      result.message = 'Your canteen runs dry. The desert claims you.';
    }

    if (!result.died && !result.won && !result.openTrader) {
      this.moveTrader(state);
    }

    return result;
  },

  tradeWater(state) {
    if (state.gold < this.config.traderGoldCost) return false;
    if (state.hydration >= this.config.hydrationMax) return false;
    state.gold -= this.config.traderGoldCost;
    state.hydration = Math.min(
      this.config.hydrationMax,
      state.hydration + this.config.traderHydration
    );
    return true;
  },

  getTileDisplay(cell) {
    if (!cell.revealed) return { emoji: '', className: 'hidden' };

    if (cell.traderHere) {
      return { emoji: '🧳', className: 'revealed trader' };
    }

    switch (cell.terrain) {
      case 'snake':
        return { emoji: '🐍', className: 'revealed snake' };
      case 'scorpion':
        return { emoji: '🦂', className: 'revealed scorpion' };
      case 'cactus':
        return { emoji: '🌵', className: 'revealed cactus' };
      case 'gold':
        return { emoji: '🪙', className: 'revealed gold' };
      case 'oasis':
        return { emoji: '💧', className: 'revealed oasis' };
      case 'cave':
        return { emoji: '🕳️', className: 'revealed cave' };
      default:
        if (cell.adjacentDangers > 0) {
          return {
            emoji: String(cell.adjacentDangers),
            className: `revealed sand danger-num n${cell.adjacentDangers}`,
          };
        }
        return { emoji: '', className: 'revealed sand' };
    }
  },
};