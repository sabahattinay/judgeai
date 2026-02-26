'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { VoteCounts, JurySettings } from '@/types/jury';
import { toast } from 'sonner';
import { CheckCircle, Circle, AlertCircle, User, Scale } from 'lucide-react';

interface JuryVotingPanelProps {
  roomId: string;
  token: string;
  settings: JurySettings | null;
  onVoteSubmitted?: () => void;
}

export function JuryVotingPanel({ roomId, token, settings, onVoteSubmitted }: JuryVotingPanelProps) {
  const [selectedVote, setSelectedVote] = useState<'user_a' | 'user_b' | 'abstain' | null>(null);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);

  const handleSubmitVote = async () => {
    if (!selectedVote) {
      toast.error('Lutfen bir oy seciniz');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/jury/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId,
          token,
          vote: selectedVote,
          reason: reason || undefined,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setHasVoted(true);
        toast.success('Oyunuz basariyla kaydedildi!');
        onVoteSubmitted?.();
      } else {
        toast.error(data.error || 'Oy kaydedilirken bir hata olustu');
      }
    } catch (error) {
      console.error('Error submitting vote:', error);
      toast.error('Bir hata olustu. Lutfen tekrar deneyin.');
    } finally {
      setSubmitting(false);
    }
  };

  if (hasVoted) {
    return (
      <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 text-green-700">
            <CheckCircle className="w-6 h-6" />
            <div>
              <p className="font-semibold">Oyunuz Kaydedildi</p>
              <p className="text-sm text-green-600">Juri sonuclarini bekleyiniz</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white shadow-lg border-0">
      <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
        <CardTitle className="flex items-center gap-2">
          <Scale className="w-5 h-5" />
          Juri Oy Formu
        </CardTitle>
        <p className="text-blue-100 text-sm mt-1">
          Tarafsiz bir sekilde degerlendirme yapin ve gerekce belirtin
        </p>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => setSelectedVote('user_a')}
            className={`p-4 rounded-lg border-2 transition-all duration-200 ${
              selectedVote === 'user_a'
                ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <User className="w-5 h-5 text-blue-600" />
              <span className="font-semibold text-blue-700">User A</span>
            </div>
            <p className="text-xs text-gray-500">Ileri suren taraf</p>
          </button>

          <button
            onClick={() => setSelectedVote('user_b')}
            className={`p-4 rounded-lg border-2 transition-all duration-200 ${
              selectedVote === 'user_b'
                ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-200'
                : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <User className="w-5 h-5 text-purple-600" />
              <span className="font-semibold text-purple-700">User B</span>
            </div>
            <p className="text-xs text-gray-500">Karsi taraf</p>
          </button>

          <button
            onClick={() => setSelectedVote('abstain')}
            className={`p-4 rounded-lg border-2 transition-all duration-200 ${
              selectedVote === 'abstain'
                ? 'border-gray-500 bg-gray-100 ring-2 ring-gray-200'
                : 'border-gray-200 hover:border-gray-400 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <Circle className="w-5 h-5 text-gray-600" />
              <span className="font-semibold text-gray-700">Cekimser</span>
            </div>
            <p className="text-xs text-gray-500">Karar veremiyorum</p>
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Oy Gerekcesi (Opsiyonel)
          </label>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Kararinizin gerekcesini aciklayin..."
            className="min-h-[100px]"
          />
        </div>

        <Button
          onClick={handleSubmitVote}
          disabled={!selectedVote || submitting}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3"
        >
          {submitting ? 'Kaydediliyor...' : 'Oyu Tamamla'}
        </Button>

        <div className="flex items-start gap-2 text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <p>
            Oyunuz gonderildikten sonra degistirilemez. 
            {settings?.consensus_required && ' Tam oybirligi gereklidir.'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
