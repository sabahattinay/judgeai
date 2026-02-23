import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { generateQuestions, shouldGenerateQuestions } from '@/lib/question-service';
import { mockRooms, mockQuestions, mockSubmissions } from '@/lib/mock-supabase';
import { AIQuestion } from '@/types/questions';

const USE_MOCK_DB = !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://placeholder.supabase.co';

// GET /api/questions/[roomId] - Retrieve questions for a room
export async function GET(request: NextRequest, { params }: { params: { roomId: string } }) {
  const { roomId } = await params;
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');
  const userType = searchParams.get('userType') as 'user_a' | 'user_b';

  if (!roomId || !token || !userType) {
    return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
  }

  try {
    if (USE_MOCK_DB) {
      const room = mockRooms.get(roomId);
      if (!room) {
        return NextResponse.json({ error: 'Room not found' }, { status: 404 });
      }

      if (token !== room.user_a_token && token !== room.user_b_token) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 403 });
      }

      const questions = Array.from(mockQuestions.values())
        .filter(q => q.room_id === roomId)
        .filter(q => q.target_user === userType || q.target_user === 'both');

      return NextResponse.json({ questions });
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

    const { data: questions, error } = await supabaseAdmin
      .from('ai_questions')
      .select('*')
      .eq('room_id', roomId)
      .or(`target_user.eq.${userType},target_user.eq.both`)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching questions:', error);
      return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 });
    }

    return NextResponse.json({ questions });
  } catch (error) {
    console.error('Error in GET questions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/questions/[roomId] - Generate new questions or submit answers
export async function POST(request: NextRequest, { params }: { params: { roomId: string } }) {
  const { roomId } = await params;
  const body = await request.json();
  const { token, action, userType, questionId, answerText } = body;

  console.log('POST Questions Debug:');
  console.log('- roomId:', roomId);
  console.log('- token:', token ? 'present' : 'missing');
  console.log('- action:', action);
  console.log('- userType:', userType);
  console.log('- questionId:', questionId || 'not provided');
  console.log('- answerText length:', answerText ? answerText.length : 'not provided');

  if (!roomId || !token || !action) {
    console.log('Missing fields check failed - roomId:', !!roomId, 'token:', !!token, 'action:', !!action);
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  try {
    if (USE_MOCK_DB) {
      const room = mockRooms.get(roomId);
      if (!room) {
        console.log(`Room not found: ${roomId}`);
        return NextResponse.json({ error: 'Room not found' }, { status: 404 });
      }

      console.log(`Room found: ${roomId}, status: ${room.status}`);

      if (token !== room.user_a_token && token !== room.user_b_token) {
        console.log(`Invalid token for room ${roomId}`);
        return NextResponse.json({ error: 'Invalid token' }, { status: 403 });
      }

      // Ensure room has required Q&A fields
      if (room.questioning_round === undefined) {
        room.questioning_round = 0;
        console.log(`Added questioning_round to room ${roomId}`);
      }
      if (room.max_questioning_rounds === undefined) {
        room.max_questioning_rounds = 2;
        console.log(`Added max_questioning_rounds to room ${roomId}`);
      }

      if (action === 'generate') {
        // Get submissions for evidence
        const submissions = Array.from(mockSubmissions.values())
          .filter(s => s.room_id === roomId);

        const userASubmission = submissions.find(s => s.user_type === 'user_a');
        const userBSubmission = submissions.find(s => s.user_type === 'user_b');

        if (!userASubmission || !userBSubmission) {
          return NextResponse.json({ error: 'Missing submissions' }, { status: 400 });
        }

        const questionRequest = {
          userAEvidence: userASubmission.story,
          userBEvidence: userBSubmission.story,
          roomId,
          round: room.questioning_round || 1,
        };

        const response = await generateQuestions(questionRequest);
        
        // Store questions in mock storage
        response.questions.forEach(question => {
          mockQuestions.set(question.id, question);
        });

        // Update room status
        room.status = 'answering';
        if (!room.questioning_round) room.questioning_round = 1;
        if (!room.max_questioning_rounds) room.max_questioning_rounds = 2;

        return NextResponse.json(response);
      }

      if (action === 'answer' && questionId && answerText) {
        console.log(`Processing answer for question ${questionId} from ${userType}`);
        
        const question = mockQuestions.get(questionId);
        if (!question) {
          console.log(`Question not found: ${questionId}`);
          return NextResponse.json({ error: 'Question not found' }, { status: 404 });
        }

        console.log(`Question found: target_user=${question.target_user}, answered=${question.answered}`);

        // Allow users to answer questions targeted to them or to 'both'
        if (question.target_user !== userType && question.target_user !== 'both') {
          console.log(`Question target validation failed: question.target_user=${question.target_user}, userType=${userType}`);
          return NextResponse.json({ error: 'Cannot answer this question' }, { status: 403 });
        }

        if (question.answered) {
          console.log(`Question already answered: ${questionId}`);
          return NextResponse.json({ error: 'Question already answered' }, { status: 400 });
        }

        // Update question
        question.answered = true;
        question.answer_text = answerText.trim();
        question.answered_at = new Date().toISOString();

        mockQuestions.set(questionId, question);
        console.log(`Question ${questionId} answered successfully`);

        // Check if all questions are answered
        const allQuestions = Array.from(mockQuestions.values())
          .filter(q => q.room_id === roomId);
        
        const allAnswered = allQuestions.every(q => q.answered);
        console.log(`All questions answered: ${allAnswered} (${allQuestions.length} total)`);
        
        if (allAnswered) {
          room.status = 'ready'; // Ready for next round or judgment
          console.log(`Room ${roomId} status updated to 'ready'`);
        }

        return NextResponse.json({ 
          success: true, 
          question: {
            ...question,
            answer_text: question.answer_text // Don't send the full answer in response for security
          }
        });
      }

      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Real database implementation
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

    if (action === 'generate') {
      // Get submissions for evidence
      const { data: submissions } = await supabaseAdmin
        .from('submissions')
        .select('*')
        .eq('room_id', roomId);

      if (!submissions || submissions.length !== 2) {
        return NextResponse.json({ error: 'Missing submissions' }, { status: 400 });
      }

      const userASubmission = submissions.find(s => s.user_type === 'user_a');
      const userBSubmission = submissions.find(s => s.user_type === 'user_b');

      const questionRequest = {
        userAEvidence: userASubmission?.story || '',
        userBEvidence: userBSubmission?.story || '',
        roomId,
        round: room.questioning_round || 1,
      };

      const response = await generateQuestions(questionRequest);
      
      // Store questions in database
      const { error: insertError } = await supabaseAdmin
        .from('ai_questions')
        .insert(response.questions);

      if (insertError) {
        console.error('Error inserting questions:', insertError);
        return NextResponse.json({ error: 'Failed to save questions' }, { status: 500 });
      }

      // Update room status
      await supabaseAdmin
        .from('dispute_rooms')
        .update({ 
          status: 'answering',
          questioning_round: room.questioning_round || 1,
          max_questioning_rounds: room.max_questioning_rounds || 2,
        })
        .eq('id', roomId);

      return NextResponse.json(response);
    }

    if (action === 'answer' && questionId && answerText) {
      const { error: updateError } = await supabaseAdmin
        .from('ai_questions')
        .update({
          answered: true,
          answer_text: answerText,
          answered_at: new Date().toISOString(),
        })
        .eq('id', questionId)
        .eq('room_id', roomId);

      if (updateError) {
        console.error('Error updating question:', updateError);
        return NextResponse.json({ error: 'Failed to save answer' }, { status: 500 });
      }

      // Check if all questions are answered
      const { data: allQuestions } = await supabaseAdmin
        .from('ai_questions')
        .select('answered')
        .eq('room_id', roomId);

      const allAnswered = allQuestions?.every(q => q.answered) || false;

      if (allAnswered) {
        await supabaseAdmin
          .from('dispute_rooms')
          .update({ status: 'ready' })
          .eq('id', roomId);
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error in POST questions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
