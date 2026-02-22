import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { checkRateLimit } from '@/lib/rate-limiter';
import { mockRooms, generateId, generateToken } from '@/lib/mock-supabase';

const USE_MOCK_DB = !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://placeholder.supabase.co';

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';

    const rateLimit = checkRateLimit(ip);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.', retryAfter: rateLimit.retryAfter },
        { 
          status: 429,
          headers: {
            'Retry-After': rateLimit.retryAfter?.toString() || '3600',
          }
        }
      );
    }

    const body = await request.json();
    const { title } = body;

    if (USE_MOCK_DB) {
      // Use in-memory storage
      const roomId = generateId();
      const userAToken = generateToken();
      const userBToken = generateToken();

      const room = {
        id: roomId,
        created_at: new Date().toISOString(),
        status: 'waiting' as const,
        user_a_token: userAToken,
        user_b_token: userBToken,
        user_a_submitted: false,
        user_b_submitted: false,
        verdict_json: null,
        engagement_score: 0,
        title: title || null,
      };

      mockRooms.set(roomId, room);

      return NextResponse.json({
        roomId: room.id,
        userAToken: room.user_a_token,
        userBToken: room.user_b_token,
        userALink: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/room/${room.id}?token=${room.user_a_token}`,
        userBLink: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/room/${room.id}?token=${room.user_b_token}`,
      });
    }

    const { data: room, error } = await supabaseAdmin
      .from('dispute_rooms')
      .insert({
        title: title || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating room:', error);
      return NextResponse.json({ error: 'Failed to create room' }, { status: 500 });
    }

    return NextResponse.json({
      roomId: room.id,
      userAToken: room.user_a_token,
      userBToken: room.user_b_token,
      userALink: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/room/${room.id}?token=${room.user_a_token}`,
      userBLink: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/room/${room.id}?token=${room.user_b_token}`,
    });
  } catch (error) {
    console.error('Error in create-room:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
