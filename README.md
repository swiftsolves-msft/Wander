# Wander

A mobile-friendly desert survival web game. Explore tile by tile, manage your hydration, and survive all 9 levels.

**Live site:** [https://polite-water-0e6f1240f.7.azurestaticapps.net](https://polite-water-0e6f1240f.7.azurestaticapps.net)

Deployed to Azure Static Web Apps via GitHub Actions.

## Level 1 — The Dunes

A minesweeper-inspired desert expedition:

- Tap tiles to explore an 8×8 grid of hidden dunes
- **Hydration** starts at 10 — each move costs 1. If it hits 0, you perish
- **Snakes** and **scorpions** end your run instantly
- Numbers on revealed tiles warn how many dangers lurk nearby
- Find **gold** 🪙, **cactus** 🌵, and hidden **oasis** 💧 tiles for hydration
- A **wandering trader** 🧳 roams near unrevealed tiles — trade gold for water
- Discover the **cave entrance** 🕳️ to advance (currently ends the run for testing)
- Score points for every safe tile revealed

Levels 2–9 are planned with unique mechanics.

## Play Locally

No build step required — pure HTML/CSS/JS.

```bash
git clone https://github.com/swiftsolves-msft/Wander.git
cd Wander
```

Open `index.html` in a browser, or serve locally:

```bash
npx serve .
```

Then visit `http://localhost:3000` on your phone or desktop browser.

## Deploy to Azure

This repo uses **Azure Static Web Apps** with GitHub Actions.

### One-time setup

1. In the [Azure Portal](https://portal.azure.com), create a **Static Web App**
2. Link it to `swiftsolves-msft/Wander` on the `main` branch
3. Set build settings:
   - App location: `/`
   - Api location: *(leave empty)*
   - Output location: *(leave empty)*
4. Azure adds the `AZURE_STATIC_WEB_APPS_API_TOKEN` secret to your GitHub repo automatically

### Continuous deployment

The workflow `.github/workflows/azure-static-web-apps.yml` deploys automatically:

| Trigger | What happens |
|---|---|
| **PR merged to `main`** | Validates game files, then deploys to **production** |
| **Push directly to `main`** | Same production deploy |
| **Open PR** | Deploys a temporary **preview** environment |
| **Manual** | Run **Deploy Wander to Azure** from the Actions tab |

**Required secret:** `AZURE_STATIC_WEB_APPS_API_TOKEN_POLITE_WATER_0E6F1240F` (added automatically when the Static Web App is linked to GitHub).

**Azure resource:** `wander-game` in resource group `rg-swiftsolves` (East US 2).

## Project Structure

```
Wander/
├── index.html              # Game shell (mobile-first)
├── css/style.css           # Desert theme & touch UI
├── js/
│   ├── game.js             # Level routing & UI controller
│   └── levels/
│       └── level1.js       # Level 1 minesweeper logic
├── staticwebapp.config.json
└── .github/workflows/
    └── azure-static-web-apps.yml
```

## License

MIT