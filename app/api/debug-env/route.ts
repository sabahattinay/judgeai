import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    cwd: process.cwd(),
    AI_MODEL: process.env.AI_MODEL,
    AI_API_KEY_set: !!process.env.AI_API_KEY,
    USE_MOCK_AI: process.env.USE_MOCK_AI,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    nodeEnv: process.env.NODE_ENV,
  });
}
