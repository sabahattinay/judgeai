'use client';

import { VoteCounts } from '@/types/jury';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ConsensusVisualizerProps {
  voteCounts: VoteCounts;
  consensusReached: boolean;
  winner: 'User A' | 'User B' | 'Tie' | 'No Consensus';
  showBoxView?: boolean;
}

export function ConsensusVisualizer({
  voteCounts,
  consensusReached,
  winner,
  showBoxView = false,
}: ConsensusVisualizerProps) {
  const { user_a, user_b, abstain } = voteCounts;
  const total = user_a + user_b + abstain;

  const userAPercentage = total > 0 ? Math.round((user_a / 12) * 100) : 0;
  const userBPercentage = total > 0 ? Math.round((user_b / 12) * 100) : 0;
  const abstainPercentage = total > 0 ? Math.round((abstain / 12) * 100) : 0;

  if (showBoxView) {
    const boxes = [];
    for (let i = 0; i < 12; i++) {
      if (i < user_a) {
        boxes.push({ index: i, type: 'user_a' });
      } else if (i < user_a + user_b) {
        boxes.push({ index: i, type: 'user_b' });
      } else {
        boxes.push({ index: i, type: 'abstain' });
      }
    }

    return (
      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Juri Oylama Dagilimi</span>
            {consensusReached && (
              <Badge className="bg-amber-500 text-white">Oybirligi Saglandi</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
            {boxes.map((box) => (
              <div
                key={box.index}
                className={`aspect-square rounded-lg flex items-center justify-center text-white font-bold text-sm ${
                  box.type === 'user_a' ? 'bg-blue-500' : 
                  box.type === 'user_b' ? 'bg-purple-500' : 'bg-gray-400'
                }`}
              >
                {box.index + 1}
              </div>
            ))}
          </div>

          <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500 rounded" />
              <span className="text-sm">User A: {user_a}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-purple-500 rounded" />
              <span className="text-sm">User B: {user_b}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-400 rounded" />
              <span className="text-sm">Cekimser: {abstain}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const pieData = [
    { label: 'User A', value: user_a, percentage: userAPercentage, color: '#3b82f6' },
    { label: 'User B', value: user_b, percentage: userBPercentage, color: '#a855f7' },
    { label: 'Cekimser', value: abstain, percentage: abstainPercentage, color: '#9ca3af' },
  ].filter(d => d.value > 0);

  let cumulativePercentage = 0;
  const conicGradient = pieData
    .map((d) => {
      const start = cumulativePercentage;
      cumulativePercentage += d.percentage;
      return `${d.color} ${start}% ${cumulativePercentage}%`;
    })
    .join(', ');

  return (
    <Card className="bg-white">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Juri Oylama Sonucu</span>
          {consensusReached ? (
            <Badge className="bg-amber-500 text-white">Oybirligi Saglandi</Badge>
          ) : (
            <Badge variant="outline" className="text-gray-600">Oybirligi Yok</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="relative">
            <div
              className="w-40 h-40 rounded-full"
              style={{
                background: `conic-gradient(${conicGradient || '#e5e7eb 0% 100%'})`,
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-gray-800">
                  {user_a + user_b + abstain}/12
                </span>
              </div>
            </div>
          </div>

          <div className="flex-1 space-y-4">
            {pieData.map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <div
                  className="w-4 h-4 rounded-full flex-shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{item.label}</span>
                    <span className="text-gray-600">
                      {item.value} oy ({item.percentage}%)
                    </span>
                  </div>
                  <div className="mt-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${item.percentage}%`,
                        backgroundColor: item.color,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {winner && winner !== 'No Consensus' && (
          <div className="mt-6 pt-4 border-t text-center">
            <p className="text-sm text-gray-500 mb-1">Kazanan</p>
            <p className={`text-2xl font-bold ${
              winner === 'User A' ? 'text-blue-600' : 'text-purple-600'
            }`}>
              {winner}
            </p>
          </div>
        )}

        {winner === 'No Consensus' && (
          <div className="mt-6 pt-4 border-t text-center">
            <p className="text-lg font-semibold text-amber-600">
              Oybirligi Saglanamadi
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Juri uyeleri arasinda anlasmaya varilamadi
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
