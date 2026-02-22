import { Badge } from '@/components/ui/badge';
import { Trophy, Medal, Handshake } from 'lucide-react';

interface WinnerBadgeProps {
  winner: 'User A' | 'User B' | 'Tie';
  size?: 'sm' | 'md' | 'lg';
}

export function WinnerBadge({ winner, size = 'md' }: WinnerBadgeProps) {
  const getStyles = () => {
    switch (winner) {
      case 'User A':
        return {
          color: 'bg-blue-500 hover:bg-blue-600 text-white',
          icon: Trophy,
        };
      case 'User B':
        return {
          color: 'bg-purple-500 hover:bg-purple-600 text-white',
          icon: Medal,
        };
      case 'Tie':
        return {
          color: 'bg-gray-500 hover:bg-gray-600 text-white',
          icon: Handshake,
        };
    }
  };

  const { color, icon: Icon } = getStyles();
  const sizeClasses = {
    sm: 'text-sm px-2 py-1',
    md: 'text-lg px-4 py-2',
    lg: 'text-2xl px-6 py-3',
  };

  return (
    <Badge className={`${color} ${sizeClasses[size]} flex items-center gap-2`}>
      <Icon className={size === 'lg' ? 'w-6 h-6' : size === 'md' ? 'w-5 h-5' : 'w-4 h-4'} />
      <span className="font-bold">{winner === 'Tie' ? 'Tie' : `${winner} Wins`}</span>
    </Badge>
  );
}
