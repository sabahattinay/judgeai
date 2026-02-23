import { NextRequest, NextResponse } from 'next/server';
import { mockRooms, mockSubmissions, mockDocuments, mockQuestions } from '@/lib/mock-supabase';

const USE_MOCK_DB = !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://placeholder.supabase.co';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;

    if (USE_MOCK_DB) {
      const room = mockRooms.get(roomId);
      if (!room) {
        return NextResponse.json({ error: 'Verdict not found' }, { status: 404 });
      }

      if (room.status !== 'completed') {
        return NextResponse.json({ error: 'Verdict not yet available' }, { status: 400 });
      }

      // Get submissions for this room
      const submissions = Array.from(mockSubmissions.values()).filter(s => s.room_id === roomId);
      const userASubmission = submissions.find(s => s.user_type === 'user_a');
      const userBSubmission = submissions.find(s => s.user_type === 'user_b');

      // Get documents for each submission
      const allDocs = Array.from(mockDocuments.values());
      const userADocs = userASubmission ? allDocs.filter(d => d.submission_id === userASubmission.id) : [];
      const userBDocs = userBSubmission ? allDocs.filter(d => d.submission_id === userBSubmission.id) : [];

      // Get answered questions for this room
      const questions = Array.from(mockQuestions.values())
        .filter(q => q.room_id === roomId && q.answered)
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

      return NextResponse.json({
        room,
        submissions: {
          user_a: userASubmission ? {
            story: userASubmission.story,
            documents: userADocs
          } : null,
          user_b: userBSubmission ? {
            story: userBSubmission.story,
            documents: userBDocs
          } : null
        },
        questions,
      });
    }

    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  } catch (error) {
    console.error('Error in verdict GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
