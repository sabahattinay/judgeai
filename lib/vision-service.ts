import { createWorker } from 'tesseract.js';
import aiService, { AI_MODEL } from './ai-service';

const USE_VISION_API = process.env.USE_VISION_API === 'true';
const VISION_MODEL = process.env.VISION_MODEL || 'gpt-4o';

export async function extractTextFromImage(imageBuffer: Buffer): Promise<string> {
  if (USE_VISION_API) {
    return extractWithVisionAPI(imageBuffer);
  } else {
    return extractWithOCR(imageBuffer);
  }
}

async function extractWithVisionAPI(imageBuffer: Buffer): Promise<string> {
  try {
    const base64Image = imageBuffer.toString('base64');
    const response = await aiService.chat.completions.create({
      model: VISION_MODEL,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Extract all text from this image. Return only the extracted text, nothing else.',
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`,
              },
            },
          ],
        },
      ],
      max_tokens: 1000,
    });

    return response.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('Vision API error, falling back to OCR:', error);
    return extractWithOCR(imageBuffer);
  }
}

async function extractWithOCR(imageBuffer: Buffer): Promise<string> {
  const worker = await createWorker('eng');
  try {
    const { data: { text } } = await worker.recognize(imageBuffer);
    return text;
  } finally {
    await worker.terminate();
  }
}
