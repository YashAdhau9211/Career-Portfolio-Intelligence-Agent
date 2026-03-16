# Career Portfolio Intelligence Agent

AI-powered career improvement tool for the JSO platform. Analyzes CV scores and GitHub profiles to generate personalized 30-day improvement plans.

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Google Gemini API key
- Supabase account (optional for demo)

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
cp .env.local.template .env.local
```

Then edit `.env.local` and fill in your API keys. See [Environment Setup Guide](docs/ENVIRONMENT_SETUP.md) for detailed instructions.

4. Verify your environment configuration:

```bash
npm run check-env
```

5. Run the development server:

```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

### Environment Variables

Required environment variables:
- `GEMINI_API_KEY` - Google Gemini API key for AI generation
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_KEY` - Supabase service role key

See [docs/ENVIRONMENT_SETUP.md](docs/ENVIRONMENT_SETUP.md) for complete setup instructions.

## Technology Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS
- **Deployment**: Vercel (free tier)
- **AI**: Google Gemini API (free tier)
- **Data**: Supabase (free tier)
- **APIs**: GitHub REST API (public)

## Project Structure

```
├── app/                  # Next.js App Router pages
├── components/           # React components
├── lib/
│   ├── services/        # Business logic services
│   ├── types/           # TypeScript type definitions
│   └── utils/           # Utility functions
├── tests/               # Test files
└── public/              # Static assets
```

## Features

- CV score and GitHub profile analysis
- AI-generated 30-day improvement plans
- Reasoning trace for transparency
- Bias detection and ethical oversight
- Free resource recommendations only
- JSO pillar alignment

## License

MIT
