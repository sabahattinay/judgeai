// Google Gemini AI service
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.AI_API_KEY || 'placeholder-key');

function normalizeGeminiModel(model: string | undefined) {
  let m = (model || '').trim();
  if (!m) return 'gemini-flash-latest';

  // The Models API returns names like "models/gemini-2.0-flash".
  // The SDK expects the id without the "models/" prefix.
  if (m.startsWith('models/')) m = m.slice('models/'.length);

  // Map deprecated / unavailable historical aliases.
  if (m === 'gemini-pro') return 'gemini-pro-latest';
  if (m === 'gemini-pro-vision') return 'gemini-flash-latest';

  // "gemini-1.5-*" names are not present for this API key; use latest aliases instead.
  if (m === 'gemini-1.5-flash' || m === 'gemini-1.5-flash-latest') return 'gemini-flash-latest';
  if (m === 'gemini-1.5-pro' || m === 'gemini-1.5-pro-latest') return 'gemini-pro-latest';

  return m;
}

export const AI_MODEL = normalizeGeminiModel(process.env.AI_MODEL);

export async function generateGeminiVerdict(
  userAEvidence: string, 
  userBEvidence: string,
  qaContext?: { question: string; answer: string; user: 'user_a' | 'user_b' }[]
) {
  async function callModelOnce(modelName: string) {
    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  }

  // Input validation and truncation to prevent 400 errors
  const maxEvidenceLength = 8000; // Leave room for prompt template
  const maxQALength = 2000;
  
  if (userAEvidence.length > maxEvidenceLength) {
    console.warn(`User A evidence truncated from ${userAEvidence.length} to ${maxEvidenceLength} chars`);
    userAEvidence = userAEvidence.substring(0, maxEvidenceLength) + '... [truncated]';
  }
  
  if (userBEvidence.length > maxEvidenceLength) {
    console.warn(`User B evidence truncated from ${userBEvidence.length} to ${maxEvidenceLength} chars`);
    userBEvidence = userBEvidence.substring(0, maxEvidenceLength) + '... [truncated]';
  }

  // Build Q&A context string with length limits
  let qaContextText = '';
  if (qaContext && qaContext.length > 0) {
    qaContextText = '\n\nAdditional Question & Answer Context:\n';
    qaContext.slice(0, 5).forEach((qa, index) => { // Max 5 Q&A pairs
      const question = qa.question.length > 200 ? qa.question.substring(0, 200) + '...' : qa.question;
      const answer = qa.answer.length > 500 ? qa.answer.substring(0, 500) + '...' : qa.answer;
      qaContextText += `\nQ${index + 1} to ${qa.user === 'user_a' ? 'User A' : 'User B'}: ${question}\n`;
      qaContextText += `A${index + 1}: ${answer}\n`;
    });
    
    if (qaContextText.length > maxQALength) {
      qaContextText = qaContextText.substring(0, maxQALength) + '... [truncated]';
    }
    qaContextText += '\n';
  }

  const prompt = `You are an impartial AI arbiter. Two parties have a dispute.

User A's perspective:
${userAEvidence}

User B's perspective:
${userBEvidence}${qaContextText}

Analyze both arguments and any additional Q&A context above. Return ONLY a valid JSON object with this exact structure:
{
  "analysis_user_a": "Detailed analysis of User A's strengths and weaknesses",
  "analysis_user_b": "Detailed analysis of User B's strengths and weaknesses", 
  "winner": "User A" | "User B" | "Tie"
}

Base your analysis on ALL provided information including initial arguments and any Q&A exchanges. You MUST declare a winner. Be thorough in your analysis but concise. Return ONLY the JSON object, no other text.`;

  if (process.env.AI_MODEL && process.env.AI_MODEL !== AI_MODEL) {
    console.warn('Gemini model normalized:', process.env.AI_MODEL, '=>', AI_MODEL);
  }

  console.log('Sending request to Gemini model:', AI_MODEL);

  let text = '';
  try {
    async function tryWithRetry(modelName: string, maxRetries = 3) {
      let lastError: unknown;
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          return await callModelOnce(modelName);
        } catch (err) {
          lastError = err;
          const anyErr = err as any;
          const status = anyErr?.status;

          // 503 = high demand / temporary unavailability; retry with backoff.
          if (status === 503 && attempt < maxRetries) {
            const delayMs = Math.pow(2, attempt) * 2000; // 2s, 4s, 8s
            console.warn(`Gemini 503 (high demand), retrying in ${delayMs}ms... (attempt ${attempt + 1}/${maxRetries})`);
            await new Promise((resolve) => setTimeout(resolve, delayMs));
            continue;
          }

          // 400 = bad request (usually prompt too long); don't retry
          if (status === 400) {
            console.error('Gemini 400 Bad Request - prompt likely too long or malformed');
            console.error('Prompt length:', prompt.length);
            console.error('Prompt preview:', prompt.substring(0, 500) + '...');
          }

          // For other errors or final retry, break out.
          throw err;
        }
      }
      throw lastError;
    }

    try {
      text = await tryWithRetry(AI_MODEL);
    } catch (innerErr) {
      const anyInner = innerErr as any;
      const status = anyInner?.status;

      // If the configured model is not available for this API key/account, retry common aliases.
      if (status === 404) {
        const fallbacks = [
          'gemini-flash-latest',
          'gemini-pro-latest',
          'gemini-2.0-flash',
          'gemini-2.0-flash-001',
          'gemini-2.5-flash',
          'gemini-2.5-pro',
        ].filter((m) => m !== AI_MODEL);

        let lastErr: unknown = innerErr;
        for (const fb of fallbacks) {
          console.warn('Gemini model not found, retrying with:', fb);
          try {
            text = await tryWithRetry(fb);
            // Success; stop retrying.
            lastErr = undefined;
            break;
          } catch (fbErr) {
            lastErr = fbErr;
          }
        }

        if (lastErr) {
          throw lastErr;
        }
      } else {
        throw innerErr;
      }
    }

    if (!text) {
      throw new Error('Empty response text from Gemini');
    }
  } catch (err) {
    console.error('=== GEMINI CALL FAILED ===');
    console.error('Model:', AI_MODEL);

    const anyErr = err as any;
    console.error('name:', anyErr?.name);
    console.error('message:', anyErr?.message);
    console.error('status:', anyErr?.status);
    console.error('statusCode:', anyErr?.statusCode);
    console.error('response?.status:', anyErr?.response?.status);
    console.error('response?.statusText:', anyErr?.response?.statusText);
    console.error('response?.data:', anyErr?.response?.data);

    try {
      console.error('full error dump:', JSON.stringify(anyErr, Object.getOwnPropertyNames(anyErr), 2));
    } catch {
      console.error('full error dump (string):', String(anyErr));
    }

    console.error('=== END GEMINI CALL FAILED ===');
    throw err;
  }
  
  console.log('=== GEMINI RAW RESPONSE ===');
  console.log(text);
  console.log('=== END GEMINI RESPONSE ===');
  
  // Extract JSON from response (Gemini might wrap it in markdown)
  let jsonText = text.trim();
  if (jsonText.startsWith('```json')) {
    jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
  } else if (jsonText.startsWith('```')) {
    jsonText = jsonText.replace(/```\n?/g, '');
  }
  
  console.log('=== PARSED VERDICT ===');
  console.log(jsonText);
  console.log('=== END PARSED VERDICT ===');
  
  // Save Gemini response to file
  const fs = require('fs');
  const path = require('path');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const logFileName = `gemini-response-${timestamp}.json`;
  const logFilePath = path.join(process.cwd(), 'gemini-responses', logFileName);
  
  // Create directory if it doesn't exist
  const logDir = path.join(process.cwd(), 'gemini-responses');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  
  // Save both raw response and parsed verdict
  const logData = {
    timestamp: new Date().toISOString(),
    raw_response: text,
    parsed_verdict: JSON.parse(jsonText),
    user_a_evidence: userAEvidence,
    user_b_evidence: userBEvidence
  };
  
  fs.writeFileSync(logFilePath, JSON.stringify(logData, null, 2));
  console.log(`Gemini response saved to: ${logFilePath}`);
  
  const rawVerdict = JSON.parse(jsonText);
  
  // Normalize verdict format: Gemini sometimes returns analysis as objects with strengths/weaknesses
  function normalizeAnalysis(analysis: any): string {
    if (typeof analysis === 'string') return analysis;
    if (typeof analysis === 'object' && analysis !== null) {
      const parts: string[] = [];
      if (analysis.strengths) parts.push(`Strengths: ${analysis.strengths}`);
      if (analysis.weaknesses) parts.push(`Weaknesses: ${analysis.weaknesses}`);
      return parts.join(' ');
    }
    return String(analysis);
  }
  
  const verdict = {
    analysis_user_a: normalizeAnalysis(rawVerdict.analysis_user_a),
    analysis_user_b: normalizeAnalysis(rawVerdict.analysis_user_b),
    winner: rawVerdict.winner,
  };
  
  return verdict;
}

export default genAI;
