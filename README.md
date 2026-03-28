# MoodMap 🗺️

Anonymous community emotional pulse for college campuses. Students drop mood pins on an interactive map and receive AI-powered support, insights, and connection.

## Features

- **Anonymous mood pins** — Drop your mood anywhere on the campus map
- **AI companion** — Get personalized comfort messages, music suggestions, and check-ins
- **Live chat** — Talk to an AI that responds with empathy (with 3-level emergency safety detection)
- **Campus insights** — AI analyzes mood patterns and alerts counselors to hotspots
- **Crisis mode** — Counselor dashboard for monitoring and responding to stress clusters
- **Recovery stories** — Share what helped you bounce back (anonymous)
- **Happy Places** — Mark positive spots for others to find
- **Mood journal** — Track your emotional journey throughout the day

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure your LLM provider
cp .env.example .env
# Edit .env with your API key (Groq, OpenAI, Anthropic Claude, or Google Gemini)

# 3. Start the dev server (frontend)
npm run dev

# 4. Start the API server (in another terminal)
npm run server
```

## LLM Provider Support

MoodMap works with multiple LLM providers. Set `LLM_PROVIDER` in `.env`:

| Provider | `LLM_PROVIDER` | Default Model | API Key Env |
|----------|----------------|---------------|-------------|
| Groq | `groq` | llama-3.3-70b-versatile | `LLM_API_KEY` or `GROQ_KEY` |
| OpenAI | `openai` | gpt-4o-mini | `LLM_API_KEY` |
| Anthropic | `anthropic` | claude-sonnet-4-20250514 | `LLM_API_KEY` |
| Google Gemini | `gemini` | gemini-2.0-flash | `LLM_API_KEY` |
| Custom (OpenAI-compatible) | `custom` | (set `LLM_MODEL`) | `LLM_API_KEY` |

For OpenAI-compatible providers (Together, Fireworks, Mistral, etc.), use `LLM_PROVIDER=custom` and set `LLM_BASE_URL`.

## Tech Stack

- **Frontend**: React 18 + Vite + Leaflet (react-leaflet)
- **Backend**: Express.js (dev) / Vercel Serverless Functions (prod)
- **AI**: Multi-provider LLM support via shared `lib/groq.js`
- **Deployment**: Vercel

## Project Structure

```
├── api/              # Vercel serverless functions
│   ├── chat.js       # AI chat endpoint
│   ├── comfort.js    # Comfort message endpoint
│   ├── insights.js   # Campus insights endpoint
│   └── journal.js    # Journal summary endpoint
├── lib/
│   └── groq.js       # Shared LLM client, validation, CORS, rate limiting
├── src/
│   ├── components/   # React components
│   ├── App.jsx       # Main app component
│   ├── api.js        # Frontend API client
│   ├── constants.js  # Shared constants
│   ├── storage.js    # localStorage with obfuscation
│   └── utils.js      # Utility functions + emergency detection
├── server.js         # Express dev server
└── vercel.json       # Vercel deployment config
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run server` | Start Express API server |
| `npm run build` | Build for production |
| `npm test` | Run tests |
| `npm run lint` | Run ESLint |

## Safety

MoodMap includes a 3-level emergency detection system:
- **L1**: Emotional distress keywords → warm support
- **L2**: External threat signals → safety check + Campus Police number
- **L3**: Explicit emergency → full-screen emergency UI with 911/Campus Police buttons

## License

MIT
