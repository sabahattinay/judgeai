import { NextRequest, NextResponse } from 'next/server';
import { mockRooms, mockSubmissions, mockDocuments } from '@/lib/mock-supabase';

const USE_MOCK_DB = !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://placeholder.supabase.co';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Missing token' }, { status: 400 });
    }

    if (USE_MOCK_DB) {
      const room = mockRooms.get(roomId);
      if (!room) {
        return NextResponse.json({ error: 'Room not found' }, { status: 404 });
      }

      // Validate token
      let userType: 'user_a' | 'user_b' | null = null;
      if (token === room.user_a_token) {
        userType = 'user_a';
      } else if (token === room.user_b_token) {
        userType = 'user_b';
      } else {
        return NextResponse.json({ error: 'Invalid token' }, { status: 403 });
      }

      // Get submissions
      const submissions = Array.from(mockSubmissions.values()).filter(s => s.room_id === roomId);
      const userASubmission = submissions.find(s => s.user_type === 'user_a') || null;
      const userBSubmission = submissions.find(s => s.user_type === 'user_b') || null;

      // Get documents
      const allDocs = Array.from(mockDocuments.values());
      const userADocs = userASubmission ? allDocs.filter(d => d.submission_id === userASubmission.id) : [];
      const userBDocs = userBSubmission ? allDocs.filter(d => d.submission_id === userBSubmission.id) : [];

      return NextResponse.json({
        room,
        userType,
        submissions: {
          user_a: userASubmission,
          user_b: userBSubmission,
        },
        documents: {
          user_a: userADocs,
          user_b: userBDocs,
        },
      });
    }

    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  } catch (error) {
    console.error('Error in room GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
