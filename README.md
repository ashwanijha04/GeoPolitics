# Global Sovereign

A turn-based geopolitical strategy game built with React, Vite, and Tailwind. Pick a superpower, juggle GDP, stability, military, influence and science, run a tech tree, and use diplomacy or force to reshape the world.

## Features

- 5 distinct world powers with unique starting positions
- Turn-based simulation with passive economy, military maintenance, and dynamic events
- Diplomacy: trade, aid, alliances, propaganda, sanctions, intel ops, total war
- Tech tree across Military / Economy / Diplomacy
- Three AI advisors (Military / Economic / Intelligence)
- Win/loss conditions: dominance, prosperity, peace, or collapse
- Auto-save to localStorage so you can pick up where you left off
- History charts powered by Recharts

## Run locally

Prerequisites: Node.js 18+

```bash
npm install
npm run dev
```

Open http://localhost:3000.

The app currently runs entirely on curated fallback content — **no Gemini API key is required**. To re-enable live AI events, flip `USE_GEMINI` to `true` in `src/services/geminiService.ts` and put `GEMINI_API_KEY` in `.env.local`.

## Scripts

- `npm run dev` — start the Vite dev server on port 3000
- `npm run build` — production build
- `npm run preview` — preview the production build
- `npm run lint` — TypeScript check (`tsc --noEmit`)
