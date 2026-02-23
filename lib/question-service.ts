import { GoogleGenerativeAI } from '@google/generative-ai';
import { AIQuestion, QuestionGenerationRequest, QuestionGenerationResponse } from '@/types/questions';

const genAI = new GoogleGenerativeAI(process.env.AI_API_KEY || 'placeholder-key');
const AI_MODEL = process.env.AI_MODEL || 'gemini-flash-latest';

const MAX_QUESTIONS_PER_PARTY = parseInt(process.env.QUESTIONS_PER_PARTY || '3');
const MAX_QUESTIONING_ROUNDS = parseInt(process.env.MAX_QUESTIONING_ROUNDS || '2');

export async function generateQuestions(request: QuestionGenerationRequest): Promise<QuestionGenerationResponse> {
  const { userAEvidence, userBEvidence, roomId, round } = request;
  
  // Truncate evidence for question generation
  const maxEvidenceLength = 3000;
  const truncatedUserA = userAEvidence.length > maxEvidenceLength 
    ? userAEvidence.substring(0, maxEvidenceLength) + '...' 
    : userAEvidence;
  const truncatedUserB = userBEvidence.length > maxEvidenceLength 
    ? userBEvidence.substring(0, maxEvidenceLength) + '...' 
    : userBEvidence;

  const prompt = `Analyze dispute and generate follow-up questions.

User A: ${truncatedUserA}

User B: ${truncatedUserB}

Generate ${MAX_QUESTIONS_PER_PARTY} questions for each user. Questions must be:
- Specific and actionable
- Type: clarification, evidence_request, timeline, or impact
- Target: user_a or user_b

Return JSON:
{
  "questions": [{"target_user": "user_a|user_b", "question_text": "question", "question_type": "type"}],
  "needsMoreInfo": true,
  "reasoning": "why questions needed"
}`;

  try {
    const model = genAI.getGenerativeModel({ model: AI_MODEL });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('=== QUESTION GENERATION RAW RESPONSE ===');
    console.log(text);
    console.log('=== END QUESTION RESPONSE ===');
    
    // Extract JSON from response
    let jsonText = text.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '');
    }
    
    const rawResponse = JSON.parse(jsonText);
    
    // Convert to AIQuestion objects with IDs and metadata
    const questions: AIQuestion[] = rawResponse.questions.map((q: any, index: number) => ({
      id: `q_${roomId}_${round}_${index}`,
      room_id: roomId,
      target_user: q.target_user,
      question_text: q.question_text,
      question_type: q.question_type,
      answered: false,
      created_at: new Date().toISOString(),
    }));
    
    return {
      questions,
      needsMoreInfo: rawResponse.needsMoreInfo,
      reasoning: rawResponse.reasoning,
    };
  } catch (error) {
    console.error('Error generating questions:', error);
    throw error;
  }
}

export function shouldGenerateQuestions(
  userAEvidence: string, 
  userBEvidence: string,
  currentRound: number
): boolean {
  const ENABLE_AI_QUESTIONING = process.env.ENABLE_AI_QUESTIONING === 'true';
  
  if (!ENABLE_AI_QUESTIONING) return false;
  if (currentRound >= MAX_QUESTIONING_ROUNDS) return false;
  
  // Simple heuristic: if evidence is very short, we probably need questions
  const totalLength = userAEvidence.length + userBEvidence.length;
  if (totalLength < 500) return true;
  
  // If evidence mentions vague terms, we need clarification
  const vagueTerms = ['etc', 'etc.', 'various', 'multiple', 'several', 'some', 'many', 'significant', 'substantial'];
  const hasVagueTerms = vagueTerms.some(term => 
    userAEvidence.toLowerCase().includes(term) || userBEvidence.toLowerCase().includes(term)
  );
  
  return hasVagueTerms;
}

export default { generateQuestions, shouldGenerateQuestions };
