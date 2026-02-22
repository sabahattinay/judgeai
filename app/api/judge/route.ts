import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { generateGeminiVerdict } from '@/lib/gemini-service';
import { extractTextFromImage } from '@/lib/vision-service';
import { generateMockVerdict, extractMockTextFromImage, extractMockTextFromPDF } from '@/lib/mock-ai-service';
import { mockRooms, mockSubmissions, mockDocuments } from '@/lib/mock-supabase';
import { VerdictJson } from '@/types/verdict';

const USE_MOCK_AI = !process.env.AI_API_KEY || process.env.AI_API_KEY === 'placeholder-key' || process.env.USE_MOCK_AI === 'true';
const USE_MOCK_DB = !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://placeholder.supabase.co';

console.log('[judge] USE_MOCK_AI:', USE_MOCK_AI, '| AI_API_KEY set:', !!process.env.AI_API_KEY, '| USE_MOCK_AI env:', process.env.USE_MOCK_AI);

export async function POST(request: NextRequest) {
  let roomId: string;
  try {
    const requestData = await request.json();
    roomId = requestData.roomId;
    const token = requestData.token;

    if (!roomId || !token) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (USE_MOCK_DB) {
      // Use in-memory storage
      const room = mockRooms.get(roomId);
      if (!room) {
        return NextResponse.json({ error: 'Room not found' }, { status: 404 });
      }

      if (token !== room.user_a_token && token !== room.user_b_token) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 403 });
      }

      if (!room.user_a_submitted || !room.user_b_submitted) {
        return NextResponse.json({ error: 'Both users must submit before judgment' }, { status: 400 });
      }

      room.status = 'judging';

      const submissions = Array.from(mockSubmissions.values()).filter(s => s.room_id === roomId);
      if (submissions.length !== 2) {
        return NextResponse.json({ error: 'Missing submissions' }, { status: 400 });
      }

      const userASubmission = submissions.find(s => s.user_type === 'user_a');
      const userBSubmission = submissions.find(s => s.user_type === 'user_b');

      let userAEvidence = userASubmission?.story || '';
      let userBEvidence = userBSubmission?.story || '';

      // Get documents for each submission
      if (userASubmission) {
        const docs = Array.from(mockDocuments.values()).filter(d => d.submission_id === userASubmission.id);
        for (const doc of docs) {
          userAEvidence += `\n\n[Document: ${doc.file_name}]`;
        }
      }

      if (userBSubmission) {
        const docs = Array.from(mockDocuments.values()).filter(d => d.submission_id === userBSubmission.id);
        for (const doc of docs) {
          userBEvidence += `\n\n[Document: ${doc.file_name}]`;
        }
      }

      // Generate verdict using Gemini or Mock AI based on configuration
      let verdict: VerdictJson;
      if (USE_MOCK_AI) {
        console.log('Using mock AI service (no API key configured)');
        verdict = await generateMockVerdict(userAEvidence, userBEvidence);
      } else {
        console.log('Using Google Gemini AI service');
        verdict = await generateGeminiVerdict(userAEvidence, userBEvidence);
      }

      room.verdict_json = verdict;
      room.status = 'completed';

      return NextResponse.json({ success: true, verdict });
    }

    const { data: room, error: roomError } = await supabaseAdmin
      .from('dispute_rooms')
      .select('*')
      .eq('id', roomId)
      .single();

    if (roomError || !room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    if (token !== room.user_a_token && token !== room.user_b_token) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 403 });
    }

    if (!room.user_a_submitted || !room.user_b_submitted) {
      return NextResponse.json({ error: 'Both users must submit before judgment' }, { status: 400 });
    }

    await supabaseAdmin
      .from('dispute_rooms')
      .update({ status: 'judging' })
      .eq('id', roomId);

    const { data: submissions } = await supabaseAdmin
      .from('submissions')
      .select('*, documents(*)')
      .eq('room_id', roomId);

    if (!submissions || submissions.length !== 2) {
      return NextResponse.json({ error: 'Missing submissions' }, { status: 400 });
    }

    const userASubmission = submissions.find(s => s.user_type === 'user_a');
    const userBSubmission = submissions.find(s => s.user_type === 'user_b');

    let userAEvidence = userASubmission?.story || '';
    let userBEvidence = userBSubmission?.story || '';

    if (userASubmission?.documents) {
      for (const doc of userASubmission.documents) {
        const content = await extractDocumentContent(doc);
        if (content) {
          userAEvidence += `\n\n[Document: ${doc.file_name}]\n${content}`;
        }
      }
    }

    if (userBSubmission?.documents) {
      for (const doc of userBSubmission.documents) {
        const content = await extractDocumentContent(doc);
        if (content) {
          userBEvidence += `\n\n[Document: ${doc.file_name}]\n${content}`;
        }
      }
    }

    let verdict: VerdictJson;

    if (USE_MOCK_AI) {
      // Use mock AI for local development
      console.log('Using mock AI service (no API key configured)');
      verdict = await generateMockVerdict(userAEvidence, userBEvidence);
    } else {
      // Use Google Gemini AI
      console.log('Using Google Gemini AI service');
      verdict = await generateGeminiVerdict(userAEvidence, userBEvidence);
    }

    if (!verdict.analysis_user_a || !verdict.analysis_user_b || !verdict.winner) {
      throw new Error('Invalid verdict format');
    }

    await supabaseAdmin
      .from('dispute_rooms')
      .update({
        verdict_json: verdict,
        status: 'completed',
      })
      .eq('id', roomId);

    return NextResponse.json({ success: true, verdict });
  } catch (error) {
    console.error('Error in judge:', error);
    
    await supabaseAdmin
      .from('dispute_rooms')
      .update({ status: 'ready' })
      .eq('id', roomId);

    return NextResponse.json({ error: 'Failed to generate judgment' }, { status: 500 });
  }
}

async function extractDocumentContent(doc: any): Promise<string> {
  try {
    const { data, error } = await supabaseAdmin.storage
      .from('dispute-documents')
      .download(doc.file_path);

    if (error || !data) {
      console.error('Error downloading document:', error);
      // Return mock content if download fails (e.g., no Supabase setup)
      if (USE_MOCK_AI) {
        if (doc.file_type.startsWith('image/')) {
          return await extractMockTextFromImage();
        } else if (doc.file_type === 'application/pdf') {
          return await extractMockTextFromPDF();
        }
      }
      return '';
    }

    const buffer = Buffer.from(await data.arrayBuffer());

    if (doc.file_type.startsWith('image/')) {
      if (USE_MOCK_AI) {
        return await extractMockTextFromImage();
      }
      return await extractTextFromImage(buffer);
    } else if (doc.file_type === 'application/pdf') {
      if (USE_MOCK_AI) {
        return await extractMockTextFromPDF();
      }
      const pdfParse = require('pdf-parse');
      const pdfData = await pdfParse(buffer);
      return pdfData.text;
    } else if (doc.file_type.startsWith('text/')) {
      return buffer.toString('utf-8');
    }

    return '';
  } catch (error) {
    console.error('Error extracting document content:', error);
    return '';
  }
}
