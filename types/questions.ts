export interface AIQuestion {
  id: string;
  room_id: string;
  target_user: 'user_a' | 'user_b' | 'both';
  question_text: string;
  question_type: 'clarification' | 'evidence_request' | 'timeline' | 'impact';
  answered: boolean;
  answer_text?: string;
  created_at: string;
  answered_at?: string;
}

export interface QuestionGenerationRequest {
  userAEvidence: string;
  userBEvidence: string;
  roomId: string;
  round: number;
}

export interface QuestionGenerationResponse {
  questions: AIQuestion[];
  needsMoreInfo: boolean;
  reasoning: string;
}
