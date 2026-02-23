'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { DisputeRoom, Submission, Document } from '@/types/verdict';
import { Verdict } from '@/components/Verdict';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, Home, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function VerdictPage() {
  const params = useParams();
  const roomId = params.roomId as string;

  const [room, setRoom] = useState<DisputeRoom | null>(null);
  const [submissions, setSubmissions] = useState<{
    user_a: { story: string; documents: Document[] } | null;
    user_b: { story: string; documents: Document[] } | null;
  }>({ user_a: null, user_b: null });
  const [questions, setQuestions] = useState<{
    id: string;
    target_user: 'user_a' | 'user_b';
    question_text: string;
    question_type: 'clarification' | 'evidence_request' | 'timeline' | 'impact';
    answer_text: string;
    created_at: string;
    answered_at: string;
  }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadVerdictData();
  }, [roomId]);

  const loadVerdictData = async () => {
    try {
      const response = await fetch(`/api/verdict/${roomId}`);
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to load verdict');
        setLoading(false);
        return;
      }

      setRoom(data.room);
      setSubmissions(data.submissions);
      setQuestions(data.questions || []);
      setLoading(false);
    } catch (err) {
      console.error('Error loading verdict:', err);
      setError('Failed to load verdict');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="flex justify-center items-center min-h-[400px]">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <Card>
            <CardContent className="py-12 text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Verdict Not Found</h2>
              <p className="text-gray-600 mb-6">{error}</p>
              <div className="flex gap-4 justify-center">
                <Link href="/">
                  <Button variant="outline" className="gap-2">
                    <Home className="w-4 h-4" />
                    View Feed
                  </Button>
                </Link>
                <Link href="/create">
                  <Button>Create New Dispute</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="mb-6">
          <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-800 gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Feed
          </Link>
        </div>
        
        <h1 className="text-4xl font-bold text-center mb-8">
          {room?.title || 'Dispute Resolution'}
        </h1>
        
        <Alert className="mb-8">
          <AlertDescription>
            <strong>Public Verdict:</strong> This is a public view of the completed dispute resolution. 
            The original arguments and AI analysis are shown below.
          </AlertDescription>
        </Alert>

        {room?.verdict_json && (
          <Verdict
            verdict={room.verdict_json}
            roomId={roomId}
            engagementScore={room?.engagement_score || 0}
            submissions={submissions}
            questions={questions}
            showEngagement={false}
          />
        )}
      </div>
    </div>
  );
}
