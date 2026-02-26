'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { WinnerBadge } from './WinnerBadge';
import { ConsensusVisualizer } from './ConsensusVisualizer';
import { JuryVote, VoteCounts } from '@/types/jury';
import { VerdictJson } from '@/types/verdict';
import { Share2, Heart, Scale, Users } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { useState } from 'react';

interface JuryResultDisplayProps {
  verdict: VerdictJson;
  roomId: string;
  engagementScore: number;
  voteCounts: VoteCounts;
  juryVotes?: JuryVote[];
  consensusReached: boolean;
  showVisualization?: boolean;
}

export function JuryResultDisplay({
  verdict,
  roomId,
  engagementScore,
  voteCounts,
  juryVotes = [],
  consensusReached,
  showVisualization = true,
}: JuryResultDisplayProps) {
  const [liked, setLiked] = useState(false);
  const [currentScore, setCurrentScore] = useState(engagementScore);

  const handleLike = async () => {
    if (liked) {
      toast.info('Bu karari zaten begenmissiniz');
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
        toast.success('Tesekkurler!');
      } else {
        if (data.error === 'Already engaged') {
          toast.info('Bu karari zaten begenmissiniz');
        }
      }
    } catch (error) {
      console.error('Error liking verdict:', error);
      toast.error('Bir hata olustu');
    }
  };

  const handleShare = () => {
    const url = window.location.origin + '/verdict/' + roomId;
    navigator.clipboard.writeText(url);
    toast.success('Link kopyalandi!');
  };

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <div
          className={`h-2 ${
            consensusReached
              ? 'bg-gradient-to-r from-amber-400 to-yellow-500'
              : 'bg-gradient-to-r from-gray-400 to-gray-500'
          }`}
        />
        <CardHeader className="text-center pb-2">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Scale className="w-6 h-6 text-gray-700" />
            <span className="text-sm text-gray-500 uppercase tracking-wider">Juri Karari</span>
          </div>
          {consensusReached ? (
            <WinnerBadge winner={verdict.winner} size="lg" />
          ) : (
            <div className="inline-block">
              <Badge variant="outline" className="text-lg px-4 py-2 border-amber-500 text-amber-700 bg-amber-50">
                Oybirligi Saglanamadi
              </Badge>
            </div>
          )}
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center gap-4">
              <Button
                variant={liked ? 'default' : 'outline'}
                size="sm"
                onClick={handleLike}
                className={liked ? 'bg-red-500 hover:bg-red-600' : ''}
              >
                <Heart className={`w-4 h-4 mr-1 ${liked ? 'fill-current' : ''}`} />
                {currentScore}
              </Button>
              <Button variant="outline" size="sm" onClick={handleShare}>
                <Share2 className="w-4 h-4 mr-1" />
                Paylas
              </Button>
            </div>
            <Link href="/">
              <Button variant="ghost" size="sm">
                Ana Sayfa
              </Button>
            </Link>
          </div>

          {verdict.analysis_user_a && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  User A Analizi
                </h4>
                <p className="text-blue-700 text-sm leading-relaxed">
                  {verdict.analysis_user_a}
                </p>
              </div>

              <div className="p-4 bg-purple-50 rounded-lg border-l-4 border-purple-500">
                <h4 className="font-semibold text-purple-800 mb-2 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  User B Analizi
                </h4>
                <p className="text-purple-700 text-sm leading-relaxed">
                  {verdict.analysis_user_b}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {showVisualization && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ConsensusVisualizer
            voteCounts={voteCounts}
            consensusReached={consensusReached}
            winner={verdict.winner}
            showBoxView={false}
          />
          <ConsensusVisualizer
            voteCounts={voteCounts}
            consensusReached={consensusReached}
            winner={verdict.winner}
            showBoxView={true}
          />
        </div>
      )}

      {juryVotes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Juri Uyelerinin Oylari
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {juryVotes.map((juryVote) => (
                <div
                  key={juryVote.member_index}
                  className={`p-3 rounded-lg border ${
                    juryVote.vote === 'user_a'
                      ? 'bg-blue-50 border-blue-200'
                      : juryVote.vote === 'user_b'
                      ? 'bg-purple-50 border-purple-200'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-gray-600">
                      #{juryVote.member_index + 1}
                    </span>
                    {juryVote.vote === 'user_a' && (
                      <Badge className="bg-blue-500 text-xs">User A</Badge>
                    )}
                    {juryVote.vote === 'user_b' && (
                      <Badge className="bg-purple-500 text-xs">User B</Badge>
                    )}
                    {juryVote.vote === 'abstain' && (
                      <Badge variant="outline" className="text-xs">
                        Cekimser
                      </Badge>
                    )}
                  </div>
                  {juryVote.reason && (
                    <p className="text-xs text-gray-500 line-clamp-2 mt-1">
                      {juryVote.reason}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
