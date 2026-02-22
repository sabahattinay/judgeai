import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { mockRooms, initializeMockData } from '@/lib/mock-supabase';

const USE_MOCK_DB = !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://placeholder.supabase.co';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (USE_MOCK_DB) {
      // Use mock data for local development
      initializeMockData();
      const rooms = Array.from(mockRooms.values())
        .filter(room => room.status === 'completed')
        .sort((a, b) => b.engagement_score - a.engagement_score)
        .slice(offset, offset + limit);

      // Add submission data to each room
      const roomsWithSubmissions = rooms.map(room => {
        const submissions = mockSubmissions ? Array.from(mockSubmissions.values()).filter(s => s.room_id === room.id) : [];
        const userASubmission = submissions.find(s => s.user_type === 'user_a');
        const userBSubmission = submissions.find(s => s.user_type === 'user_b');
        
        return {
          ...room,
          submissions: {
            user_a: userASubmission ? {
              story: userASubmission.story,
              documents: mockDocuments ? Array.from(mockDocuments.values()).filter(d => d.submission_id === userASubmission.id) : []
            } : null,
            user_b: userBSubmission ? {
              story: userBSubmission.story,
              documents: mockDocuments ? Array.from(mockDocuments.values()).filter(d => d.submission_id === userBSubmission.id) : []
            } : null
          }
        };
      });
      
      return NextResponse.json({ rooms: roomsWithSubmissions });
    }

    const { data: rooms, error } = await supabase
      .from('dispute_rooms')
      .select('*')
      .eq('status', 'completed')
      .order('engagement_score', { ascending: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching feed:', error);
      return NextResponse.json({ error: 'Failed to fetch feed' }, { status: 500 });
    }

    return NextResponse.json({ rooms });
  } catch (error) {
    console.error('Error in feed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
