import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { VoteCounts } from '@/types/jury';

const USE_MOCK_DB = !process.env.NEXT_PUBLIC_SUPABASE_URL || 
  process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://placeholder.supabase.co';

function calculateVoteCounts(votes: any[]): VoteCounts {
  return {
    user_a: votes.filter(v => v.vote === 'user_a').length,
    user_b: votes.filter(v => v.vote === 'user_b').length,
    abstain: votes.filter(v => v.vote === 'abstain').length,
  };
}

function calculateConsensus(voteCounts: VoteCounts, threshold: number): {
  consensus_reached: boolean;
  winner: 'User A' | 'User B' | 'Tie' | 'No Consensus';
} {
  const { user_a, user_b, abstain } = voteCounts;
  
  if (user_a >= threshold) {
    return { consensus_reached: true, winner: 'User A' };
  }
  if (user_b >= threshold) {
    return { consensus_reached: true, winner: 'User B' };
  }
  
  return { consensus_reached: false, winner: 'No Consensus' };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get('roomId');

    if (!roomId) {
      return NextResponse.json(
        { error: 'Missing roomId parameter' },
        { status: 400 }
      );
    }

    if (USE_MOCK_DB) {
      return NextResponse.json({
        roomId,
        settings: {
          consensus_required: true,
          consensus_threshold: 12,
          voting_visible: false,
          anonymous_voting: true,
        },
        votes: [],
        vote_counts: { user_a: 0, user_b: 0, abstain: 0 },
        voting_open: true,
        verdict_reached: false,
      });
    }

    const { data: settings } = await supabaseAdmin
      .from('jury_settings')
      .select('*')
      .eq('room_id', roomId)
      .single();

    const { data: members } = await supabaseAdmin
      .from('jury_members')
      .select('*')
      .eq('room_id', roomId)
      .order('member_index');

    const votes = members || [];
    const voteCounts = calculateVoteCounts(votes);
    const threshold = settings?.consensus_threshold || 12;
    
    const consensus = calculateConsensus(voteCounts, threshold);
    const totalVoted = votes.filter(v => v.has_voted).length;

    let votingOpen = totalVoted < 12;
    if (settings?.voting_deadline) {
      votingOpen = new Date(settings.voting_deadline) > new Date() && totalVoted < 12;
    }

    const showVotes = settings?.voting_visible || consensus.consensus_reached;

    return NextResponse.json({
      roomId,
      settings: settings ? {
        consensus_required: settings.consensus_required,
        consensus_threshold: settings.consensus_threshold,
        voting_visible: settings.voting_visible,
        anonymous_voting: settings.anonymous_voting,
        voting_deadline: settings.voting_deadline,
      } : {
        consensus_required: true,
        consensus_threshold: 12,
        voting_visible: false,
        anonymous_voting: true,
      },
      votes: showVotes ? votes.map(v => ({
        member_index: v.member_index,
        display_name: settings?.anonymous_voting ? `Juri #${v.member_index + 1}` : v.display_name,
        vote: v.vote,
        reason: v.vote_reason,
        has_voted: v.has_voted,
      })) : votes.map(v => ({
        member_index: v.member_index,
        has_voted: v.has_voted,
      })),
      vote_counts: voteCounts,
      voting_open: votingOpen,
      verdict_reached: consensus.consensus_reached,
      consensus_result: consensus,
    });
  } catch (error) {
    console.error('Error in jury results:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
