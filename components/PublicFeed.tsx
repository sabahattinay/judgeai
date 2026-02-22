'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WinnerBadge } from './WinnerBadge';
import { Heart, Eye } from 'lucide-react';
import { DisputeRoom } from '@/types/verdict';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export function PublicFeed() {
  const [rooms, setRooms] = useState<DisputeRoom[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRooms();

    // Poll for updates every 5 seconds in mock mode
    const interval = setInterval(() => {
      fetchRooms();
    }, 5000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  const fetchRooms = async () => {
    try {
      const response = await fetch('/api/feed?limit=20');
      const data = await response.json();
      setRooms(data.rooms || []);
    } catch (error) {
      console.error('Error fetching feed:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (rooms.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-gray-500">
          <p>No resolved disputes yet. Be the first to create one!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {rooms.map((room) => (
        <Link key={room.id} href={`/verdict/${room.id}`}>
          <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
            <CardHeader>
              <CardTitle className="text-lg line-clamp-2">
                {room.title || 'Untitled Dispute'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <WinnerBadge winner={room.verdict_json?.winner || 'Tie'} size="sm" />
              
              {/* Show submission previews */}
              {(room as any).submissions && (
                <div className="space-y-2">
                  {(room as any).submissions.user_a && (
                    <div className="text-xs bg-blue-50 p-2 rounded">
                      <span className="font-medium text-blue-600">User A:</span>
                      <p className="text-gray-600 line-clamp-2 mt-1">
                        {(room as any).submissions.user_a.story.substring(0, 100)}...
                      </p>
                      {(room as any).submissions.user_a.documents.length > 0 && (
                        <p className="text-xs text-gray-500 mt-1">
                          📄 {(room as any).submissions.user_a.documents.length} document(s)
                        </p>
                      )}
                    </div>
                  )}
                  
                  {(room as any).submissions.user_b && (
                    <div className="text-xs bg-purple-50 p-2 rounded">
                      <span className="font-medium text-purple-600">User B:</span>
                      <p className="text-gray-600 line-clamp-2 mt-1">
                        {(room as any).submissions.user_b.story.substring(0, 100)}...
                      </p>
                      {(room as any).submissions.user_b.documents.length > 0 && (
                        <p className="text-xs text-gray-500 mt-1">
                          📄 {(room as any).submissions.user_b.documents.length} document(s)
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
              
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Heart className="w-4 h-4" />
                  <span>{room.engagement_score}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  <span>View</span>
                </div>
              </div>
              
              <p className="text-xs text-gray-500">
                {new Date(room.created_at).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
