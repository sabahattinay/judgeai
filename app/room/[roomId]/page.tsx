'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { DisputeRoom, Submission, Document } from '@/types/verdict';
import { SubmissionForm } from '@/components/SubmissionForm';
import { LiveSubmissionView } from '@/components/LiveSubmissionView';
import { Verdict } from '@/components/Verdict';
import { QuestionPanel } from '@/components/QuestionPanel';
import { JuryVotingPanel } from '@/components/JuryVotingPanel';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, Gavel, Users } from 'lucide-react';
import { toast } from 'sonner';

export default function RoomPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const roomId = params.roomId as string;
  const token = searchParams.get('token');
  const juryToken = searchParams.get('juryToken');

  const [room, setRoom] = useState<DisputeRoom | null>(null);
  const [userType, setUserType] = useState<'user_a' | 'user_b' | 'jury' | null>(null);
  const [juryTokenLocal, setJuryTokenLocal] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<{
    user_a: Submission | null;
    user_b: Submission | null;
  }>({ user_a: null, user_b: null });
  const [documents, setDocuments] = useState<{
    user_a: Document[];
    user_b: Document[];
  }>({ user_a: [], user_b: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [judging, setJudging] = useState(false);
  const [showQuestions, setShowQuestions] = useState(false);

  useEffect(() => {
    if (!roomId) {
      setError('Missing room ID');
      setLoading(false);
      return;
    }

    // Check if this is a jury member
    if (juryToken) {
      setJuryTokenLocal(juryToken);
      loadRoomData();
      return;
    }

    if (!token) {
      setError('Missing access token. Please use the complete link provided when creating the room.');
      setLoading(false);
      return;
    }

    loadRoomData();
    const cleanup = subscribeToUpdates();
    
    return cleanup;
  }, [roomId, token, juryToken]);

  const loadRoomData = async () => {
    try {
      const response = await fetch(`/api/room/${roomId}?token=${token}`);
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to load room');
        setLoading(false);
        return;
      }

      setRoom(data.room);
      setUserType(data.userType);
      setSubmissions(data.submissions);
      setDocuments(data.documents);
      setLoading(false);
    } catch (err) {
      console.error('Error loading room:', err);
      setError('Failed to load room');
      setLoading(false);
    }
  };

  const subscribeToUpdates = () => {
    // Poll for updates every 2 seconds in mock mode
    const interval = setInterval(() => {
      loadRoomData();
    }, 2000);

    return () => {
      clearInterval(interval);
    };
  };

  const requestJudgment = async () => {
    if (!room?.user_a_submitted || !room?.user_b_submitted) {
      toast.error('Both users must submit before requesting judgment');
      return;
    }

    setJudging(true);

    try {
      const response = await fetch('/api/judge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, token }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get judgment');
      }

      toast.success('AI judgment complete!');
    } catch (error) {
      console.error('Judgment error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to get judgment');
      setJudging(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!room || !userType) {
    return null;
  }

  if (room.status === 'completed' && room.verdict_json) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-12">
        <div className="container mx-auto px-4 max-w-6xl">
          <h1 className="text-4xl font-bold text-center mb-8">
            {room.title || 'Dispute Resolution'}
          </h1>
          <Verdict
            verdict={room.verdict_json}
            roomId={roomId}
            engagementScore={room.engagement_score}
            submissions={{
              user_a: submissions.user_a ? {
                story: submissions.user_a.story,
                documents: documents.user_a
              } : null,
              user_b: submissions.user_b ? {
                story: submissions.user_b.story,
                documents: documents.user_b
              } : null
            }}
          />
        </div>
      </div>
    );
  }

  const currentUserSubmitted = userType === 'user_a' ? room.user_a_submitted : room.user_b_submitted;
  const bothSubmitted = room.user_a_submitted && room.user_b_submitted;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        <h1 className="text-4xl font-bold text-center mb-2">
          {room.title || 'Dispute Resolution'}
        </h1>
        <p className="text-center text-gray-600 mb-8">
          You are <span className={userType === 'user_a' ? 'text-blue-600 font-semibold' : 'text-purple-600 font-semibold'}>
            {userType === 'user_a' ? 'User A' : 'User B'}
          </span>
        </p>

        {room.status === 'judging' && (
          <Card className="mb-6 bg-blue-50 border-blue-200">
            <CardContent className="py-6 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
              <p className="text-lg font-semibold">AI is analyzing the arguments...</p>
              <p className="text-sm text-gray-600">This may take a moment</p>
            </CardContent>
          </Card>
        )}

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {!currentUserSubmitted ? (
            <SubmissionForm
              roomId={roomId}
              token={token!}
              userType={userType}
              onSubmitSuccess={loadRoomData}
            />
          ) : (
            <LiveSubmissionView
              submission={submissions[userType]}
              documents={documents[userType]}
              userType={userType}
              isOpponent={false}
            />
          )}

          <LiveSubmissionView
            submission={submissions[userType === 'user_a' ? 'user_b' : 'user_a']}
            documents={documents[userType === 'user_a' ? 'user_b' : 'user_a']}
            userType={userType === 'user_a' ? 'user_b' : 'user_a'}
            isOpponent={true}
          />
        </div>

        {bothSubmitted && room.status !== 'judging' && (
          <>
            {/* Question Panel */}
            <QuestionPanel
              roomId={roomId}
              token={token!}
              userType={userType as 'user_a' | 'user_b'}
              onAllQuestionsAnswered={() => {
                // Questions answered, ready for judgment
                loadRoomData();
              }}
            />

            {/* Judgment Request - only for regular users, not jury */}
            {userType !== 'jury' && (
              <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200">
                <CardContent className="py-8 text-center">
                  <Gavel className="w-12 h-12 mx-auto mb-4 text-blue-600" />
                  <h3 className="text-2xl font-bold mb-2">Ready for Judgment</h3>
                  <p className="text-gray-600 mb-6">
                    Both parties have submitted their arguments. Click below to request AI judgment.
                  </p>
                  <div className="flex gap-4 justify-center">
                    <Button
                      variant="outline"
                      onClick={() => setShowQuestions(!showQuestions)}
                      className="gap-2"
                    >
                      <Gavel className="w-5 h-5" />
                      {showQuestions ? 'Hide' : 'Show'} Questions
                    </Button>
                    <Button
                      size="lg"
                      onClick={requestJudgment}
                      disabled={judging}
                      className="gap-2"
                    >
                      {judging ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Requesting Judgment...
                        </>
                      ) : (
                        <>
                          <Gavel className="w-5 h-5" />
                          Request AI Judgment
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Jury Voting Panel - show when jury mode is active */}
        {room.is_jury_mode && bothSubmitted && (
          <Card className="bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-200 mt-6">
            <CardContent className="py-6">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-6 h-6 text-amber-600" />
                <h3 className="text-xl font-bold">Juri Oylamasi</h3>
              </div>
              <p className="text-gray-600 mb-4">
                Her iki taraf da argumanlarini sundu. Simdi sira sizde - oy kullanin.
              </p>
              {juryTokenLocal && (
                <JuryVotingPanel
                  roomId={roomId}
                  token={juryTokenLocal}
                  settings={null}
                  onVoteSubmitted={() => {
                    toast.success('Oy tamamlandi!');
                  }}
                />
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
