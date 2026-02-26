import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

const USE_MOCK_DB = !process.env.NEXT_PUBLIC_SUPABASE_URL || 
  process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://placeholder.supabase.co';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { roomId, token, vote, reason } = body;

    if (!roomId || !token || !vote) {
      return NextResponse.json(
        { error: 'Missing required fields: roomId, token, and vote are required' },
        { status: 400 }
      );
    }

    const validVotes = ['user_a', 'user_b', 'abstain'];
    if (!validVotes.includes(vote)) {
      return NextResponse.json(
        { error: 'Invalid vote type. Must be user_a, user_b, or abstain' },
        { status: 400 }
      );
    }

    if (USE_MOCK_DB) {
      return NextResponse.json({
        success: true,
        has_voted: true,
      });
    }

    const { data: member, error: memberError } = await supabaseAdmin
      .from('jury_members')
      .select('*')
      .eq('token', token)
      .eq('room_id', roomId)
      .single();

    if (memberError || !member) {
      return NextResponse.json(
        { error: 'Invalid token or room' },
        { status: 403 }
      );
    }

    if (member.has_voted) {
      const { data: settings } = await supabaseAdmin
        .from('jury_settings')
        .select('allow_revote')
        .eq('room_id', roomId)
        .single();

      if (!settings?.allow_revote) {
        return NextResponse.json(
          { error: 'You have already voted and revoting is not allowed' },
          { status: 400 }
        );
      }
    }

    const { error: updateError } = await supabaseAdmin
      .from('jury_members')
      .update({
        vote,
        vote_reason: reason || null,
        has_voted: true,
      })
      .eq('token', token)
      .eq('room_id', roomId);

    if (updateError) {
      console.error('Error updating vote:', updateError);
      return NextResponse.json(
        { error: 'Failed to record vote' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      has_voted: true,
    });
  } catch (error) {
    console.error('Error in jury vote:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
