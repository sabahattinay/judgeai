// Jury system types

export type JuryVoteType = 'user_a' | 'user_b' | 'abstain';

export interface JuryMember {
  id: string;
  room_id: string;
  member_index: number;
  display_name: string;
  token: string;
  vote: JuryVoteType | null;
  vote_reason: string | null;
  has_voted: boolean;
  created_at: string;
}

export interface JurySettings {
  id: string;
  room_id: string;
  consensus_required: boolean;
  consensus_threshold: number;
  voting_deadline: string | null;
  allow_revote: boolean;
  voting_visible: boolean;
  anonymous_voting: boolean;
  created_at: string;
}

export interface JuryVote {
  member_index: number;
  display_name: string;
  vote: JuryVoteType;
  reason?: string;
}

export interface VoteCounts {
  user_a: number;
  user_b: number;
  abstain: number;
}

export interface JuryVerdict {
  consensus_reached: boolean;
  winner: 'User A' | 'User B' | 'Tie' | 'No Consensus';
  vote_counts: VoteCounts;
  jury_votes: JuryVote[];
  consensus_percentage: number;
  total_members: number;
}

export interface JoinJuryRequest {
  roomId: string;
  memberIndex: number;
}

export interface JoinJuryResponse {
  success: boolean;
  token?: string;
  displayName?: string;
  room?: {
    id: string;
    title: string | null;
    status: string;
    is_jury_mode: boolean;
  };
  error?: string;
}

export interface VoteRequest {
  roomId: string;
  token: string;
  vote: JuryVoteType;
  reason?: string;
}

export interface VoteResponse {
  success: boolean;
  has_voted: boolean;
  error?: string;
}

export interface JuryResultsResponse {
  roomId: string;
  settings: JurySettings | null;
  votes: JuryMember[];
  vote_counts: VoteCounts;
  voting_open: boolean;
  verdict_reached: boolean;
}
