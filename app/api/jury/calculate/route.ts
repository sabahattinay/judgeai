import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { VoteCounts, JuryVerdict } from '@/types/jury';

const USE_MOCK_DB = !process.env.NEXT_PUBLIC_SUPABASE_URL || 
  process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://placeholder.supabase.co';

function calculateVoteCounts(votes: any[]): VoteCounts {
  return {
    user_a: votes.filter(v => v.vote === 'user_a').length,
    user_b: votes.filter(v => v.vote === 'user_b').length,
    abstain: votes.filter(v => v.vote === 'abstain').length,
  };
}

function calculateJuryVerdict(
  voteCounts: VoteCounts, 
  juryVotes: any[],
  threshold: number
): JuryVerdict {
  const { user_a, user_b, abstain } = voteCounts;
  
  const consensusPercentage = threshold > 0 ? (Math.max(user_a, user_b) / threshold) * 100 : 0;
  
  let consensus_reached = false;
  let winner: 'User A' | 'User B' | 'Tie' | 'No Consensus' = 'No Consensus';

  if (user_a >= threshold) {
    consensus_reached = true;
    winner = 'User A';
  } else if (user_b >= threshold) {
    consensus_reached = true;
    winner = 'User B';
  } else if (user_a + user_b + abstain === 0) {
    winner = 'No Consensus';
  } else if (user_a > user_b) {
    winner = 'User A';
  } else if (user_b > user_a) {
    winner = 'User B';
  } else {
    winner = 'Tie';
  }

  return {
    consensus_reached,
    winner,
    vote_counts: voteCounts,
    jury_votes: juryVotes.map(v => ({
      member_index: v.member_index,
      display_name: v.display_name,
      vote: v.vote,
      reason: v.vote_reason,
    })),
    consensus_percentage: Math.round(consensusPercentage),
    total_members: 12,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { roomId, token } = body;

    if (!roomId || !token) {
      return NextResponse.json(
        { error: 'Missing required fields: roomId and token are required' },
        { status: 400 }
      );
    }

    if (USE_MOCK_DB) {
      return NextResponse.json({
        consensus_reached: false,
        winner: 'No Consensus',
        vote_counts: { user_a: 0, user_b: 0, abstain: 0 },
        jury_votes: [],
        consensus_percentage: 0,
        total_members: 12,
      });
    }

    const { data: room } = await supabaseAdmin
      .from('dispute_rooms')
      .select('*')
      .eq('id', roomId)
      .single();

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    if (token !== room.user_a_token && token !== room.user_b_token) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 403 });
    }

    const { data: settings } = await supabaseAdmin
      .from('jury_settings')
      .select('consensus_threshold')
      .eq('room_id', roomId)
      .single();

    const threshold = settings?.consensus_threshold || 12;

    const { data: members } = await supabaseAdmin
      .from('jury_members')
      .select('*')
      .eq('room_id', roomId)
      .order('member_index');

    const votes = members || [];
    const voteCounts = calculateVoteCounts(votes);
    
    const verdict = calculateJuryVerdict(voteCounts, votes, threshold);

    const verdictJson = {
      winner: verdict.winner,
      analysis_user_a: verdict.consensus_reached 
        ? `Juri oylamasinda ${voteCounts.user_a} oy alarak kazanan taraf oldu.`
        : `Juri oylamasinda oybirligi saglanamadi. Oylama: User A ${voteCounts.user_a} - User B ${voteCounts.user_b}`,
      analysis_user_b: verdict.consensus_reached
        ? `Juri oylamasinda ${voteCounts.user_b} oy alarak kazanan taraf oldu.`
        : `Juri oylamasinda oybirligi saglanamadi. Oylama: User A ${voteCounts.user_a} - User B ${voteCounts.user_b}`,
      is_jury_verdict: true,
      jury_votes: verdict.jury_votes,
      consensus_reached: verdict.consensus_reached,
      vote_counts: verdict.vote_counts,
    };

    await supabaseAdmin
      .from('dispute_rooms')
      .update({
        verdict_json: verdictJson,
        status: 'completed',
      })
      .eq('id', roomId);

    return NextResponse.json(verdict);
  } catch (error) {
    console.error('Error calculating jury verdict:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
