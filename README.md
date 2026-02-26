# JudgeAI - AI-Powered Dispute Resolution

A Next.js web application where two users can resolve disputes using an AI arbiter that evaluates both sides and provides an impartial judgment.

## Features

✅ **UUID token-based access** - Prevents URL manipulation and ensures security  
✅ **Public dispute feed** - Homepage showing all resolved disputes ranked by engagement  
✅ **Real-time collaboration** - Both users see each other's submissions instantly  
✅ **Manual AI trigger** - "Request Judgment" button for user control  
✅ **Structured AI verdict** - JSON format with clear winner declaration  
✅ **Configurable AI backend** - Supports OpenAI or self-hosted LLMs (Ollama/vLLM)  
✅ **Flexible image processing** - Toggle between Vision API and local OCR  
✅ **Engagement system** - Likes, votes, and view tracking  
✅ **IP-based rate limiting** - Prevents abuse (3 rooms/hour max)  
✅ **Permanent storage** - All disputes saved forever  

## Tech Stack

- **Frontend:** Next.js 16.1+, React 19, TypeScript, Tailwind CSS, shadcn/ui
- **Backend & Database:** Supabase (PostgreSQL + Real-time + Storage)
- **AI:** OpenAI API (configurable for self-hosted LLMs)
- **State Management:** React hooks + Supabase real-time subscriptions

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the schema from `supabase-schema.sql`
3. Go to **Storage** and create a bucket named `dispute-documents` with public access
4. Get your credentials from **Settings > API**

### 3. Configure Environment Variables

Copy `env.example` to `.env.local`:

```bash
cp env.example .env.local
```

Edit `.env.local` with your credentials:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# AI Configuration
AI_BASE_URL=https://api.openai.com/v1
AI_API_KEY=your_openai_api_key
AI_MODEL=gpt-4o

# Vision/OCR Configuration
USE_VISION_API=true
VISION_MODEL=gpt-4o
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## How It Works

1. **Create a dispute room** and get two unique links
2. **Share User A link** with the first party, **User B link** with the second
3. **Both parties submit** their arguments and evidence
4. **Real-time visibility** - They can see each other's submissions as they're made
5. **Request AI judgment** - When ready, either party can trigger the AI
6. **AI analyzes** both sides and declares a winner with detailed analysis
7. **Public feed** - Resolved disputes appear on the homepage ranked by engagement

## Using Self-Hosted LLMs

To use Ollama or other self-hosted LLMs:

```env
AI_BASE_URL=http://localhost:11434/v1
AI_API_KEY=ollama
AI_MODEL=llama3

USE_VISION_API=false  # Use local OCR instead
```

## Project Structure

```
/app
  /page.tsx                    # Public feed homepage
  /create/page.tsx             # Room creation
  /room/[roomId]/page.tsx      # Dispute room
  /api
    /create-room/route.ts      # Create room with rate limiting
    /submit/route.ts           # Submit arguments
    /judge/route.ts            # AI judgment
    /engage/route.ts           # Likes/votes
    /feed/route.ts             # Fetch disputes
/components
  /ui                          # shadcn components
  /PublicFeed.tsx
  /SubmissionForm.tsx
  /LiveSubmissionView.tsx
  /Verdict.tsx
  /WinnerBadge.tsx
/lib
  /supabase.ts                 # Supabase client
  /ai-service.ts               # Configurable AI
  /vision-service.ts           # Vision API or OCR
  /rate-limiter.ts             # IP-based rate limiting
/types
  /verdict.ts                  # TypeScript interfaces
```

## Database Schema

See `supabase-schema.sql` for the complete schema including:
- `dispute_rooms` - Room data with UUID tokens and engagement scores
- `submissions` - User arguments
- `documents` - Uploaded files
- `engagement_interactions` - Likes and views

## License

MIT
