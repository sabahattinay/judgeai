import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { mockRooms, mockEngagement } from '@/lib/mock-supabase';

const USE_MOCK_DB = !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://placeholder.supabase.co';

export async function POST(request: NextRequest) {
  try {
    const { roomId, interactionType } = await request.json();

    if (!roomId || !interactionType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';

    if (USE_MOCK_DB) {
      // Use in-memory storage
      const room = mockRooms.get(roomId);
      if (!room) {
        return NextResponse.json({ error: 'Room not found' }, { status: 404 });
      }

      let engagementSet = mockEngagement.get(roomId);
      if (!engagementSet) {
        engagementSet = new Set<string>();
        mockEngagement.set(roomId, engagementSet);
      }

      const key = `${ip}-${interactionType}`;
      if (engagementSet.has(key)) {
        return NextResponse.json({ error: 'Already engaged' }, { status: 400 });
      }

      engagementSet.add(key);
      const engagementScore = engagementSet.size;
      room.engagement_score = engagementScore;

      return NextResponse.json({ success: true, engagementScore });
    }

    const { error: insertError } = await supabaseAdmin
      .from('engagement_interactions')
      .insert({
        room_id: roomId,
        ip_address: ip,
        interaction_type: interactionType,
      });

    if (insertError) {
      if (insertError.code === '23505') {
        return NextResponse.json({ error: 'Already engaged' }, { status: 400 });
      }
      console.error('Error inserting engagement:', insertError);
      return NextResponse.json({ error: 'Failed to record engagement' }, { status: 500 });
    }

    const { data: interactions } = await supabaseAdmin
      .from('engagement_interactions')
      .select('id')
      .eq('room_id', roomId);

    const engagementScore = interactions?.length || 0;

    await supabaseAdmin
      .from('dispute_rooms')
      .update({ engagement_score: engagementScore })
      .eq('id', roomId);

    return NextResponse.json({ success: true, engagementScore });
  } catch (error) {
    console.error('Error in engage:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
