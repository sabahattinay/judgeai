import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

const USE_MOCK_DB = !process.env.NEXT_PUBLIC_SUPABASE_URL || 
  process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://placeholder.supabase.co';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { roomId, memberIndex, displayName } = body;

    if (!roomId || memberIndex === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: roomId and memberIndex are required' },
        { status: 400 }
      );
    }

    if (memberIndex < 0 || memberIndex > 11) {
      return NextResponse.json(
        { error: 'Invalid member index. Must be between 0 and 11' },
        { status: 400 }
      );
    }

    if (USE_MOCK_DB) {
      const token = crypto.randomUUID();
      return NextResponse.json({
        success: true,
        token,
        displayName: displayName || `Juri Uyesi #${memberIndex + 1}`,
        room: {
          id: roomId,
          title: 'Mock Room',
          status: 'waiting',
          is_jury_mode: true,
        },
      });
    }

    const { data: room, error: roomError } = await supabaseAdmin
      .from('dispute_rooms')
      .select('id, title, status, is_jury_mode')
      .eq('id', roomId)
      .single();

    if (roomError || !room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    if (!room.is_jury_mode) {
      return NextResponse.json(
        { error: 'This room is not in jury mode' },
        { status: 400 }
      );
    }

    const { data: existingMember } = await supabaseAdmin
      .from('jury_members')
      .select('id')
      .eq('room_id', roomId)
      .eq('member_index', memberIndex)
      .single();

    if (existingMember) {
      return NextResponse.json(
        { error: 'This jury member position is already taken' },
        { status: 409 }
      );
    }

    const { data: member, error: memberError } = await supabaseAdmin
      .from('jury_members')
      .insert({
        room_id: roomId,
        member_index: memberIndex,
        display_name: displayName || `Juri Uyesi #${memberIndex + 1}`,
      })
      .select()
      .single();

    if (memberError) {
      console.error('Error creating jury member:', memberError);
      return NextResponse.json(
        { error: 'Failed to join as jury member' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      token: member.token,
      displayName: member.display_name,
      room: {
        id: room.id,
        title: room.title,
        status: room.status,
        is_jury_mode: room.is_jury_mode,
      },
    });
  } catch (error) {
    console.error('Error in jury join:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
