'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { WinnerBadge } from './WinnerBadge';
import { QASection } from './QASection';
import { Heart, Share2, Home } from 'lucide-react';
import { VerdictJson } from '@/types/verdict';
import { toast } from 'sonner';
import Link from 'next/link';

interface VerdictProps {
  verdict: VerdictJson;
  roomId: string;
  engagementScore: number;
  submissions?: {
    user_a: { story: string; documents: any[] } | null;
    user_b: { story: string; documents: any[] } | null;
  };
  questions?: {
    id: string;
    target_user: 'user_a' | 'user_b';
    question_text: string;
    question_type: 'clarification' | 'evidence_request' | 'timeline' | 'impact';
    answer_text: string;
    created_at: string;
    answered_at: string;
  }[];
  showEngagement?: boolean;
}

export function Verdict({ verdict, roomId, engagementScore, submissions, questions, showEngagement = true }: VerdictProps) {
  const [liked, setLiked] = useState(false);
  const [currentScore, setCurrentScore] = useState(engagementScore);

  const handleLike = async () => {
    if (liked) {
      toast.info('You already liked this verdict');
      return;
    }

    try {
      const response = await fetch('/api/engage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId,
          interactionType: 'like',
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setLiked(true);
        setCurrentScore(data.engagementScore);
        toast.success('Thanks for your feedback!');
      } else {
        if (data.error === 'Already engaged') {
          setLiked(true);
          toast.info('You already liked this verdict');
        } else {
          toast.error('Failed to like');
        }
      }
    } catch (error) {
      toast.error('Failed to like');
    }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-4 border-yellow-400 bg-gradient-to-br from-yellow-50 to-orange-50">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl mb-4">Final Verdict</CardTitle>
          <div className="flex justify-center">
            <WinnerBadge winner={verdict.winner} size="lg" />
          </div>
        </CardHeader>
      </Card>

      {submissions && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl text-center">Original Submissions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-blue-600">User A's Argument</h3>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-gray-700 whitespace-pre-wrap">{submissions.user_a?.story || 'No submission'}</p>
                  </div>
                  {submissions.user_a?.documents && submissions.user_a.documents.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm text-blue-600">Documents:</h4>
                      <div className="space-y-1">
                        {submissions.user_a.documents.map((doc, index) => (
                          <div key={index} className="text-sm bg-gray-100 p-2 rounded flex items-center gap-2">
                            <span className="text-gray-600">📄</span>
                            <span>{doc.file_name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-purple-600">User B's Argument</h3>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <p className="text-gray-700 whitespace-pre-wrap">{submissions.user_b?.story || 'No submission'}</p>
                  </div>
                  {submissions.user_b?.documents && submissions.user_b.documents.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm text-purple-600">Documents:</h4>
                      <div className="space-y-1">
                        {submissions.user_b.documents.map((doc, index) => (
                          <div key={index} className="text-sm bg-gray-100 p-2 rounded flex items-center gap-2">
                            <span className="text-gray-600">📄</span>
                            <span>{doc.file_name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Questions & Answers Section */}
      <QASection questions={questions || []} />

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-blue-600">User A Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 whitespace-pre-wrap">{verdict.analysis_user_a}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-purple-600">User B Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 whitespace-pre-wrap">{verdict.analysis_user_b}</p>
          </CardContent>
        </Card>
      </div>

      {showEngagement && (
        <Card>
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant={liked ? 'default' : 'outline'}
                  onClick={handleLike}
                  className="gap-2"
                >
                  <Heart className={`w-5 h-5 ${liked ? 'fill-current' : ''}`} />
                  {currentScore} {currentScore === 1 ? 'Like' : 'Likes'}
                </Button>

                <Button variant="outline" onClick={handleShare} className="gap-2">
                  <Share2 className="w-5 h-5" />
                  Share
                </Button>
              </div>

              <div className="flex gap-2">
                <Link href="/create">
                  <Button variant="outline">Create New Dispute</Button>
                </Link>
                <Link href="/">
                  <Button variant="outline" className="gap-2">
                    <Home className="w-5 h-5" />
                    View Feed
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {!showEngagement && (
        <Card>
          <CardContent className="py-6">
            <div className="flex items-center justify-center gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Heart className="w-4 h-4" />
                <span>{engagementScore} {engagementScore === 1 ? 'Like' : 'Likes'}</span>
              </div>
              <Button variant="outline" onClick={handleShare} className="gap-2">
                <Share2 className="w-5 h-5" />
                Share
              </Button>
              <Link href="/">
                <Button variant="outline" className="gap-2">
                  <Home className="w-5 h-5" />
                  View Feed
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
