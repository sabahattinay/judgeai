import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { mockRooms, mockSubmissions, mockDocuments, mockFiles, generateId } from '@/lib/mock-supabase';

const USE_MOCK_DB = !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://placeholder.supabase.co';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const roomId = formData.get('roomId') as string;
    const token = formData.get('token') as string;
    const story = formData.get('story') as string;
    const files = formData.getAll('files') as File[];

    if (!roomId || !token || !story) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (USE_MOCK_DB) {
      // Use in-memory storage
      const room = mockRooms.get(roomId);
      if (!room) {
        return NextResponse.json({ error: 'Room not found' }, { status: 404 });
      }

      let userType: 'user_a' | 'user_b';
      if (token === room.user_a_token) {
        userType = 'user_a';
      } else if (token === room.user_b_token) {
        userType = 'user_b';
      } else {
        return NextResponse.json({ error: 'Invalid token' }, { status: 403 });
      }

      // Find or create submission
      let submission = Array.from(mockSubmissions.values()).find(
        s => s.room_id === roomId && s.user_type === userType
      );

      if (submission) {
        submission.story = story;
      } else {
        const submissionId = generateId();
        submission = {
          id: submissionId,
          room_id: roomId,
          user_type: userType,
          story,
          created_at: new Date().toISOString(),
        };
        mockSubmissions.set(submissionId, submission);
      }

      // Handle file uploads
      if (files && files.length > 0) {
        for (const file of files) {
          const docId = generateId();
          const filePath = `${submission.id}/${file.name}`;
          
          const arrayBuffer = await file.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          mockFiles.set(filePath, buffer);

          const document = {
            id: docId,
            submission_id: submission.id,
            file_name: file.name,
            file_path: filePath,
            file_type: file.type,
            created_at: new Date().toISOString(),
          };
          mockDocuments.set(docId, document);
        }
      }

      // Update room submission status
      if (userType === 'user_a') {
        room.user_a_submitted = true;
      } else {
        room.user_b_submitted = true;
      }

      return NextResponse.json({ success: true, submissionId: submission.id });
    }

    const { data: room, error: roomError } = await supabaseAdmin
      .from('dispute_rooms')
      .select('*')
      .eq('id', roomId)
      .single();

    if (roomError || !room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    let userType: 'user_a' | 'user_b';
    if (token === room.user_a_token) {
      userType = 'user_a';
    } else if (token === room.user_b_token) {
      userType = 'user_b';
    } else {
      return NextResponse.json({ error: 'Invalid token' }, { status: 403 });
    }

    const { data: existingSubmission } = await supabaseAdmin
      .from('submissions')
      .select('id')
      .eq('room_id', roomId)
      .eq('user_type', userType)
      .single();

    let submissionId: string;

    if (existingSubmission) {
      const { data: updatedSubmission, error: updateError } = await supabaseAdmin
        .from('submissions')
        .update({ story })
        .eq('id', existingSubmission.id)
        .select()
        .single();

      if (updateError) {
        return NextResponse.json({ error: 'Failed to update submission' }, { status: 500 });
      }
      submissionId = updatedSubmission.id;
    } else {
      const { data: newSubmission, error: insertError } = await supabaseAdmin
        .from('submissions')
        .insert({
          room_id: roomId,
          user_type: userType,
          story,
        })
        .select()
        .single();

      if (insertError) {
        return NextResponse.json({ error: 'Failed to create submission' }, { status: 500 });
      }
      submissionId = newSubmission.id;
    }

    if (files && files.length > 0) {
      for (const file of files) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${submissionId}/${Date.now()}.${fileExt}`;
        
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const { error: uploadError } = await supabaseAdmin.storage
          .from('dispute-documents')
          .upload(fileName, buffer, {
            contentType: file.type,
            upsert: false,
          });

        if (uploadError) {
          console.error('File upload error:', uploadError);
          continue;
        }

        await supabaseAdmin.from('documents').insert({
          submission_id: submissionId,
          file_name: file.name,
          file_path: fileName,
          file_type: file.type,
        });
      }
    }

    const updateField = userType === 'user_a' ? 'user_a_submitted' : 'user_b_submitted';
    await supabaseAdmin
      .from('dispute_rooms')
      .update({ [updateField]: true })
      .eq('id', roomId);

    return NextResponse.json({ success: true, submissionId });
  } catch (error) {
    console.error('Error in submit:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
