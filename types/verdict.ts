export interface VerdictJson {
  analysis_user_a: string;
  analysis_user_b: string;
  winner: 'User A' | 'User B' | 'Tie';
  // Jury system fields
  is_jury_verdict?: boolean;
  jury_votes?: JuryVote[];
  consensus_reached?: boolean;
  vote_counts?: {
    user_a: number;
    user_b: number;
    abstain: number;
  };
}

export interface JuryVote {
  member_index: number;
  display_name: string;
  vote: 'user_a' | 'user_b' | 'abstain';
  reason?: string;
}

export interface JuryVerdict {
  consensus_reached: boolean;
  winner: 'User A' | 'User B' | 'Tie' | 'No Consensus';
  vote_counts: {
    user_a: number;
    user_b: number;
    abstain: number;
  };
  jury_votes: JuryVote[];
  consensus_percentage: number;
  total_members: number;
}

export interface DisputeRoom {
  id: string;
  created_at: string;
  status: 'waiting' | 'ready' | 'questioning' | 'answering' | 'judging' | 'completed';
  user_a_token: string;
  user_b_token: string;
  user_a_submitted: boolean;
  user_b_submitted: boolean;
  verdict_json: VerdictJson | null;
  engagement_score: number;
  title: string | null;
  questioning_round: number;
  max_questioning_rounds: number;
  // Jury system fields
  is_jury_mode: boolean;
}

export interface Submission {
  id: string;
  room_id: string;
  user_type: 'user_a' | 'user_b';
  story: string;
  created_at: string;
}

export interface Document {
  id: string;
  submission_id: string;
  file_name: string;
  file_path: string;
  file_type: string;
  created_at: string;
}

export interface EngagementInteraction {
  id: string;
  room_id: string;
  ip_address: string;
  interaction_type: 'like' | 'view';
  created_at: string;
}
