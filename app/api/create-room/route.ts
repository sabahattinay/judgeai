import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { checkRateLimit } from '@/lib/rate-limiter';
import { mockRooms, generateId, generateToken } from '@/lib/mock-supabase';

const USE_MOCK_DB = !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://placeholder.supabase.co';

// Mock jury members store
const mockJuryMembers = new Map<string, {
  room_id: string;
  member_index: number;
  display_name: string;
  token: string;
  vote: string | null;
  vote_reason: string | null;
  has_voted: boolean;
}>();

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
    const { title, isJuryMode, jurySettings } = body;

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
        questioning_round: 0,
        max_questioning_rounds: 2,
        is_jury_mode: isJuryMode || false,
      };

      mockRooms.set(roomId, room);

      // Generate jury member links if in jury mode
      let juryMembers: { index: number; token: string; link: string }[] = [];
      if (isJuryMode) {
        for (let i = 0; i < 12; i++) {
          const token = generateToken();
          const memberKey = `${roomId}-${i}`;
          mockJuryMembers.set(memberKey, {
            room_id: roomId,
            member_index: i,
            display_name: `Juri Uyesi #${i + 1}`,
            token,
            vote: null,
            vote_reason: null,
            has_voted: false,
          });
          juryMembers.push({
            index: i,
            token,
            link: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/room/${roomId}?juryToken=${token}`,
          });
        }
      }

      const response: any = {
        roomId: room.id,
        userAToken: room.user_a_token,
        userBToken: room.user_b_token,
        userALink: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/room/${room.id}?token=${room.user_a_token}`,
        userBLink: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/room/${room.id}?token=${room.user_b_token}`,
        isJuryMode: room.is_jury_mode,
      };

      if (isJuryMode) {
        response.juryMembers = juryMembers;
      }

      return NextResponse.json(response);
    }

    // Create room in Supabase
    const { data: room, error } = await supabaseAdmin
      .from('dispute_rooms')
      .insert({
        title: title || null,
        is_jury_mode: isJuryMode || false,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating room:', error);
      return NextResponse.json({ error: 'Failed to create room' }, { status: 500 });
    }

    // Create jury members if in jury mode
    let juryMembers: { index: number; token: string; link: string }[] = [];
    if (isJuryMode) {
      const jurySettingsData = jurySettings || {
        consensus_required: true,
        consensus_threshold: 12,
        allow_revote: true,
        voting_visible: false,
        anonymous_voting: true,
      };

      // Insert jury settings
      await supabaseAdmin
        .from('jury_settings')
        .insert({
          room_id: room.id,
          ...jurySettingsData,
        });

      // Create 12 jury members
      for (let i = 0; i < 12; i++) {
        const { data: member } = await supabaseAdmin
          .from('jury_members')
          .insert({
            room_id: room.id,
            member_index: i,
            display_name: `Juri Uyesi #${i + 1}`,
          })
          .select()
          .single();

        if (member) {
          juryMembers.push({
            index: i,
            token: member.token,
            link: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/room/${room.id}?juryToken=${member.token}`,
          });
        }
      }
    }

    const response: any = {
      roomId: room.id,
      userAToken: room.user_a_token,
      userBToken: room.user_b_token,
      userALink: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/room/${room.id}?token=${room.user_a_token}`,
      userBLink: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/room/${room.id}?token=${room.user_b_token}`,
      isJuryMode: room.is_jury_mode,
    };

    if (isJuryMode) {
      response.juryMembers = juryMembers;
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in create-room:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
