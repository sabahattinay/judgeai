import OpenAI from 'openai';

const aiService = new OpenAI({
  baseURL: process.env.AI_BASE_URL || 'https://api.openai.com/v1',
  apiKey: process.env.AI_API_KEY || 'placeholder-key',
});

export const AI_MODEL = process.env.AI_MODEL || 'gpt-4o';

export default aiService;
