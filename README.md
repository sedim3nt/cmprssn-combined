# CMPRSSN Combined

A combined diagnostic + survey tool measuring AI compression effects on work and workers.

**Live:** [diagnostic.spirittree.dev](https://diagnostic.spirittree.dev)
**Stack:** Next.js, TailwindCSS, Supabase, Recharts
**Status:** Maintained

## What This Is

CMPRSSN Combined merges two assessment instruments into one flow: a 10-question diagnostic measuring an organization's exposure to AI-driven compression (task automation, role consolidation, skill devaluation) and a 12-question survey capturing the human experience of that compression.

Users complete 22 questions total, with a smooth phase transition between the diagnostic and survey sections. Results are analyzed and presented with visualized scores. Data is stored in Supabase for aggregate research.

## Features

- 📋 **22-Question Assessment** — 10 diagnostic + 12 survey questions in one flow
- 🔄 **Phase Transitions** — animated transition between diagnostic and survey sections
- 📊 **Score Visualization** — Recharts-powered results display
- 💾 **Data Collection** — Supabase-backed response storage
- ✨ **Animated Flow** — smooth question-by-question progression
- 📱 **Responsive** — works across all devices

## AI Integration

None — this is a data collection and scoring tool. Analysis is algorithmic.

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Styling:** TailwindCSS
- **Charts:** Recharts
- **Database:** Supabase
- **AI:** None
- **Hosting:** Vercel

## Local Development

```bash
npm install
npm run dev
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous API key |

## Part of SpiritTree

This project is part of the [SpiritTree](https://spirittree.dev) ecosystem — an autonomous AI operation building tools for the agent economy and displaced workers.

## License

MIT
