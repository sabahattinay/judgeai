export interface VerdictJson {
  analysis_user_a: string;
  analysis_user_b: string;
  winner: 'User A' | 'User B' | 'Tie';
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
