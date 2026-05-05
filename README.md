# Theatro — Living Narrative Engine

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)

A browser-based, backend-free narrative engine where AI characters with distinct souls, voices, and emotional memories interact in evolving stories. Three core principles guide every interaction:

1. **Characters are people, not bots** — They remember, hold grudges, fall in love, misunderstand each other. They don't know they're AI.
2. **Stories drift naturally** — No rigid scripts. Controllers drop surprises, overhear private conversations, push characters into unexpected places.
3. **The user is the director** — Every behavior, threshold, model, color, voice, frequency is tunable.

## Architecture (Client-Only, Zero Backend)

- **Stack**: Vite + Vanilla TypeScript
- **Storage**: IndexedDB (swappable adapter pattern for future cloud migration)
- **Deployment**: Static site (Netlify/Vercel)
- **API Flow**: Browser → LLM Provider → Browser (no server we control)

## Four Controllers

| Controller | Purpose | Trigger |
|------------|---------|---------|
| **Main Controller** | Analyzes chat, updates moods, relationship matrix, long-term summary | Every N messages (default 10, configurable) |
| **Scenario Controller** | Scene changes, surprises, eavesdropping, location shifts | Scenario creation + Main Controller requests |
| **Creative Controller** | Auto-generates complete characters from brief descriptions | On demand |
| **Media Controller** | Image & voice generation with emotional tone | Manual click OR auto-mode |

## Memory System (3 Layers)

1. **Short-term**: Last N messages raw (default 30, configurable)
2. **Long-term summary**: Maintained by Main Controller, injected into prompts
3. **Relationship matrix**: N² JSON tracking each character's feelings toward every other

## Quick Start

```bash
npm install
npm run dev
```

App works instantly with Pollinations defaults (publishable key included). Add your Aqua API key in settings for premium models.

## Provider Strategy

- **Provider P (Pollinations)**: Default, ships with app, OpenAI-compatible
- **Provider A (Aqua)**: User-supplied key for heavy controller models
- **Custom Slots**: Any OpenAI-compatible endpoint

## Documentation

See `docs/` for:
- Architecture decisions
- Data models
- Controller prompt engineering
- Icon system guidelines

## License

MIT — Open source, launch your own instance.