'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { VoteCounts, JurySettings } from '@/types/jury';
import { Users, RefreshCw, CheckCircle, Clock } from 'lucide-react';

interface JuryLiveResultsProps {
  roomId: string;
  settings: JurySettings | null;
  onVerdictReached?: () => void;
  isJury?: boolean;
}

export function JuryLiveResults({ roomId, settings, onVerdictReached, isJury = false }: JuryLiveResultsProps) {
  const [voteCounts, setVoteCounts] = useState<VoteCounts>({ user_a: 0, user_b: 0, abstain: 0 });
  const [totalVoted, setTotalVoted] = useState(0);
  const [verdictReached, setVerdictReached] = useState(false);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchResults = async () => {
    try {
      const response = await fetch(`/api/jury/results?roomId=${roomId}`);
      const data = await response.json();

      if (data.vote_counts) {
        setVoteCounts(data.vote_counts);
        const voted = data.vote_counts.user_a + data.vote_counts.user_b + data.vote_counts.abstain;
        setTotalVoted(voted);
      }

      if (data.verdict_reached && !verdictReached) {
        setVerdictReached(true);
        onVerdictReached?.();
      }
    } catch (error) {
      console.error('Error fetching jury results:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();

    if (autoRefresh && !verdictReached) {
      const interval = setInterval(fetchResults, 5000);
      return () => clearInterval(interval);
    }
  }, [roomId, autoRefresh, verdictReached]);

  const progressPercentage = (totalVoted / 12) * 100;

  return (
    <Card className="bg-gradient-to-br from-slate-50 to-slate-100">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="w-5 h-5" />
            Juri Oylamasi
          </CardTitle>
          <div className="flex items-center gap-2">
            {verdictReached ? (
              <Badge className="bg-green-500">
                <CheckCircle className="w-3 h-3 mr-1" />
                Sonuc Belirlendi
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-yellow-50">
                <Clock className="w-3 h-3 mr-1" />
                Oylama Devam Ediyor
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div>
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-gray-600">Tamamlanan Oylama</span>
            <span className="font-medium">{totalVoted}/12</span>
          </div>
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Vote Counts */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{voteCounts.user_a}</div>
            <div className="text-xs text-blue-600">User A</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-600">{voteCounts.abstain}</div>
            <div className="text-xs text-gray-500">Cekimser</div>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{voteCounts.user_b}</div>
            <div className="text-xs text-purple-600">User B</div>
          </div>
        </div>

        {/* Refresh Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={fetchResults}
          disabled={loading}
          className="w-full"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Yenile
        </Button>

        {/* Info */}
        {settings?.consensus_required && (
          <p className="text-xs text-center text-gray-500">
            Tam oybirligi gerekiyor ({settings.consensus_threshold}/12)
          </p>
        )}
      </CardContent>
    </Card>
  );
}
