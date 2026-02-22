'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Clock } from 'lucide-react';
import { Submission, Document } from '@/types/verdict';

interface LiveSubmissionViewProps {
  submission: Submission | null;
  documents: Document[];
  userType: 'user_a' | 'user_b';
  isOpponent?: boolean;
}

export function LiveSubmissionView({ submission, documents, userType, isOpponent }: LiveSubmissionViewProps) {
  if (!submission) {
    return (
      <Card className="opacity-60">
        <CardHeader>
          <CardTitle className={userType === 'user_a' ? 'text-blue-600' : 'text-purple-600'}>
            {isOpponent ? 'Opponent' : 'Your'} Argument ({userType === 'user_a' ? 'User A' : 'User B'})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-gray-500">
            <Clock className="w-5 h-5" />
            <p>Waiting for submission...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className={userType === 'user_a' ? 'text-blue-600' : 'text-purple-600'}>
            {isOpponent ? 'Opponent' : 'Your'} Argument ({userType === 'user_a' ? 'User A' : 'User B'})
          </CardTitle>
          <Badge variant="outline" className="bg-green-50 text-green-700">
            Submitted
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="font-semibold mb-2 text-sm">Story:</h4>
          <p className="text-gray-700 whitespace-pre-wrap">{submission.story}</p>
        </div>

        {documents.length > 0 && (
          <div>
            <h4 className="font-semibold mb-2 text-sm">Supporting Documents:</h4>
            <div className="space-y-2">
              {documents.map((doc) => (
                <div key={doc.id} className="flex items-center gap-2 bg-gray-50 p-2 rounded">
                  <FileText className="w-4 h-4 text-gray-600" />
                  <span className="text-sm">{doc.file_name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="text-xs text-gray-500">
          Submitted {new Date(submission.created_at).toLocaleString()}
        </p>
      </CardContent>
    </Card>
  );
}
