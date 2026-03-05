# Ekko - Language Learning Through YouTube Shadowing

> **Built for the [World's Largest Hackathon](https://devpost.com/software/ekko-x3n24l) presented by Bolt**

Ekko is a web app and Chrome extension that helps you learn languages through YouTube video shadowing, AI-powered practice, and spaced repetition. Paste any YouTube video or browse the curated library, shadow native speakers sentence by sentence, and let the AI quiz you on what you retained.

**[Try it out → learnwithekko.com](https://www.learnwithekko.com)**

## Why Ekko?

I've been learning Korean for a couple of years and every language learning app I tried either felt too gamified (Duolingo) or wasn't personalized enough (Speak). I just wanted to learn from native speakers without paying for a pricey tutor. I realized that learning by repetition was the fastest way to fluency, but YouTube alone wasn't cutting it — so I built Ekko.

## Features

- **YouTube Shadowing** — Shadow native speakers sentence by sentence with adjustable playback speed, auto-repeat, and segment navigation
- **AI Practice** — An AI assistant quizzes you using the video transcript to test vocabulary retention and speaking ability
- **Speech-to-Speech** — Speak your answers instead of typing in a new language; ElevenLabs voices respond like a native speaker
- **Learning Notebook** — Save phrases and vocabulary from videos for later review
- **Repetition Tracking** — Track how many times you've practiced each sentence
- **Chrome Extension** — Practice directly on YouTube with theater mode overlay
- **Curated Video Library** — Browse videos from native speakers, or paste your own YouTube URL

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React, TypeScript, Vite, Tailwind CSS |
| Backend | Supabase (Auth, Database, Edge Functions) |
| AI | OpenAI (comprehension quizzes), ElevenLabs (voice synthesis) |
| Transcripts | Poix (YouTube transcript extraction) |
| Deployment | Netlify |
| Extension | Chrome Extension (Manifest V3) |

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project
- API keys for [ElevenLabs](https://elevenlabs.io) and [OpenAI](https://openai.com)

### Setup

1. **Clone and install**
   ```bash
   git clone https://github.com/ashley-ha/ekko.git
   cd ekko
   npm install
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   ```
   Fill in your Supabase URL, anon key, and Stripe publishable key in `.env`.

3. **Run the dev server**
   ```bash
   npm run dev
   ```

### Chrome Extension

1. Copy `extension/src/config.example.js` to `extension/src/config.js`
2. Fill in your Supabase project URL and anon key
3. Go to `chrome://extensions`, enable Developer Mode
4. Click "Load unpacked" and select the `extension/` directory

### Deploy Supabase Edge Functions

Set your environment variables, then run:
```bash
export SUPABASE_PROJECT_ID=your_project_ref
export SUPABASE_ANON_KEY=your_anon_key
./scripts/deploy-functions.sh your_elevenlabs_api_key
```

## Project Structure

```
ekko/
├── src/                    # React web app
│   ├── components/         # UI components
│   ├── contexts/           # Auth context
│   ├── hooks/              # Custom hooks (AI practice, player control)
│   ├── lib/                # Service clients (Supabase, Stripe, ElevenLabs)
│   └── store/              # Zustand app store
├── extension/              # Chrome extension (Manifest V3)
│   └── src/
│       ├── background/     # Service worker
│       ├── content/        # YouTube content scripts
│       └── player/         # Theater mode player
├── supabase/
│   ├── functions/          # Edge functions (voice, AI, transcripts)
│   └── migrations/         # Database schema
└── scripts/                # Deployment and testing scripts
```

## What I Learned

Vibe coding is still very difficult — I'm grateful to know what I'm doing, because I don't think the average person could actually deploy something useful yet without knowing the ins and outs of all the different platforms you need to launch a product from 0 to 1.

## What's Next

- Gathering feedback from early users
- Adding more languages beyond Korean
- Enhanced AI voice models with lower latency
- Improved spaced repetition algorithms

## Built With

ElevenLabs · Netlify · OpenAI · Supabase · TypeScript · Bolt · Claude Code
