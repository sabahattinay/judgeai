# JudgeAI Setup Guide

## Quick Start

### 1. Supabase Setup

#### Create Project
1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to be ready

#### Run Database Schema
1. Go to **SQL Editor** in your Supabase dashboard
2. Click **New Query**
3. Copy the entire contents of `supabase-schema.sql`
4. Paste and click **Run**
5. Verify all tables were created successfully

#### Create Storage Bucket
1. Go to **Storage** in the sidebar
2. Click **New bucket**
3. Name it `dispute-documents`
4. Make it **Public**
5. Click **Create bucket**

#### Get API Credentials
1. Go to **Settings > API**
2. Copy the following:
   - **Project URL** (NEXT_PUBLIC_SUPABASE_URL)
   - **anon/public key** (NEXT_PUBLIC_SUPABASE_ANON_KEY)
   - **service_role key** (SUPABASE_SERVICE_ROLE_KEY) - Keep this secret!

### 2. OpenAI Setup

1. Go to [platform.openai.com](https://platform.openai.com)
2. Create an API key
3. Copy the key (starts with `sk-`)

### 3. Environment Variables

Create `.env.local` in the project root:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# AI Configuration
AI_BASE_URL=https://api.openai.com/v1
AI_API_KEY=sk-your-openai-api-key
AI_MODEL=gpt-4o

# Vision/OCR Configuration
USE_VISION_API=true
VISION_MODEL=gpt-4o
```

### 4. Install and Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Alternative: Self-Hosted LLM Setup

### Using Ollama

1. Install Ollama from [ollama.ai](https://ollama.ai)
2. Pull a model: `ollama pull llama3`
3. Update `.env.local`:

```env
AI_BASE_URL=http://localhost:11434/v1
AI_API_KEY=ollama
AI_MODEL=llama3

USE_VISION_API=false
```

### Using vLLM

1. Set up vLLM server
2. Update `.env.local`:

```env
AI_BASE_URL=http://your-vllm-server:8000/v1
AI_API_KEY=your-api-key
AI_MODEL=your-model-name

USE_VISION_API=false
```

## Testing the Application

### 1. Create a Dispute Room
1. Go to homepage
2. Click **Create New Dispute**
3. Enter a title (optional)
4. Click **Create Dispute Room**
5. Copy both User A and User B links

### 2. Test as User A
1. Open User A link in a browser/incognito window
2. Enter your argument
3. Upload supporting documents (optional)
4. Click **Submit Final Argument**

### 3. Test as User B
1. Open User B link in another browser/incognito window
2. You should see User A's submission in real-time
3. Enter your argument
4. Upload supporting documents (optional)
5. Click **Submit Final Argument**

### 4. Request AI Judgment
1. In either window, click **Request AI Judgment**
2. Wait for the AI to analyze (may take 10-30 seconds)
3. View the verdict with winner badge and analysis

### 5. Test Engagement
1. Click the **Like** button
2. Click **Share** to copy the verdict link
3. Go to homepage to see the dispute in the public feed

## Troubleshooting

### "Room not found" error
- Check that your Supabase URL and keys are correct
- Verify the database schema was created successfully

### "Failed to create room" error
- Check rate limiting (max 3 rooms per hour per IP)
- Verify Supabase service role key is set

### "Failed to generate judgment" error
- Check your OpenAI API key is valid
- Verify you have credits in your OpenAI account
- Check the AI_BASE_URL is correct

### Files not uploading
- Verify the `dispute-documents` bucket exists in Supabase Storage
- Check the bucket is set to **Public**
- Ensure file size is under 10MB total

### Real-time updates not working
- Verify real-time is enabled in Supabase (it's on by default)
- Check browser console for WebSocket errors
- Ensure RLS policies are correctly set

## Production Deployment

### Environment Variables for Production

Add these to your deployment platform (Vercel, Netlify, etc.):

```env
NEXT_PUBLIC_SUPABASE_URL=your-production-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-production-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-production-service-role-key
AI_BASE_URL=https://api.openai.com/v1
AI_API_KEY=your-production-openai-key
AI_MODEL=gpt-4o
USE_VISION_API=true
VISION_MODEL=gpt-4o
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### Build Command

```bash
npm run build
```

### Start Command

```bash
npm start
```

## Rate Limiting

The application implements IP-based rate limiting:
- **3 dispute rooms per hour** per IP address
- Limit resets after 1 hour
- Returns 429 status when exceeded

To modify limits, edit `lib/rate-limiter.ts`:
```typescript
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour
const MAX_REQUESTS = 3; // Max rooms per window
```

## Security Notes

- **Never commit `.env.local`** to version control
- Keep your `SUPABASE_SERVICE_ROLE_KEY` secret
- Keep your `AI_API_KEY` secret
- UUID tokens provide security - don't expose them publicly
- RLS policies protect data access

## Support

For issues or questions:
1. Check this guide
2. Review the main README.md
3. Check Supabase logs in the dashboard
4. Check browser console for errors
