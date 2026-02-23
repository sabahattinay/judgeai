'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MessageCircle, ChevronDown, ChevronUp, Clock } from 'lucide-react';

interface QASectionProps {
  questions: {
    id: string;
    target_user: 'user_a' | 'user_b';
    question_text: string;
    question_type: 'clarification' | 'evidence_request' | 'timeline' | 'impact';
    answer_text: string;
    created_at: string;
    answered_at: string;
  }[];
}

export function QASection({ questions }: QASectionProps) {
  const [showAll, setShowAll] = useState(false);
  
  if (!questions || questions.length === 0) {
    return null;
  }

  // Group questions by target user
  const userAQuestions = questions.filter(q => q.target_user === 'user_a');
  const userBQuestions = questions.filter(q => q.target_user === 'user_b');

  // Show first 2 questions for each user initially (total 4 questions)
  const initialDisplayCountPerUser = 2;
  const userADisplayQuestions = showAll ? userAQuestions : userAQuestions.slice(0, initialDisplayCountPerUser);
  const userBDisplayQuestions = showAll ? userBQuestions : userBQuestions.slice(0, initialDisplayCountPerUser);
  
  // Calculate total shown questions for "show more" functionality
  const totalShownQuestions = userADisplayQuestions.length + userBDisplayQuestions.length;
  const hasMore = questions.length > totalShownQuestions;

  const getQuestionTypeColor = (type: string) => {
    switch (type) {
      case 'clarification': return 'bg-blue-100 text-blue-800';
      case 'evidence_request': return 'bg-orange-100 text-orange-800';
      case 'timeline': return 'bg-green-100 text-green-800';
      case 'impact': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatQuestionType = (type: string) => {
    return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Questions & Answers ({questions.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* User A Questions */}
        {userAQuestions.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-blue-600 flex items-center gap-2">
              Questions for User A ({userAQuestions.length})
            </h3>
            <div className="space-y-3">
              {userADisplayQuestions.map((question) => (
                  <div key={question.id} className="border rounded-lg p-4 bg-blue-50/30">
                    <div className="flex items-start justify-between mb-2">
                      <Badge className={getQuestionTypeColor(question.question_type)}>
                        {formatQuestionType(question.question_type)}
                      </Badge>
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(question.answered_at)}
                      </span>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium text-blue-700 mb-1">Q:</p>
                        <p className="text-sm text-gray-700">{question.question_text}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-green-700 mb-1">A:</p>
                        <p className="text-sm text-gray-700 bg-white p-2 rounded border">
                          {question.answer_text}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* User B Questions */}
        {userBQuestions.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-purple-600 flex items-center gap-2">
              Questions for User B ({userBQuestions.length})
            </h3>
            <div className="space-y-3">
              {userBDisplayQuestions.map((question) => (
                  <div key={question.id} className="border rounded-lg p-4 bg-purple-50/30">
                    <div className="flex items-start justify-between mb-2">
                      <Badge className={getQuestionTypeColor(question.question_type)}>
                        {formatQuestionType(question.question_type)}
                      </Badge>
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(question.answered_at)}
                      </span>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium text-purple-700 mb-1">Q:</p>
                        <p className="text-sm text-gray-700">{question.question_text}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-green-700 mb-1">A:</p>
                        <p className="text-sm text-gray-700 bg-white p-2 rounded border">
                          {question.answer_text}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Show More/Less Button */}
        {hasMore && (
          <div className="text-center pt-4">
            <Button
              variant="outline"
              onClick={() => setShowAll(!showAll)}
              className="gap-2"
            >
              {showAll ? (
                <>
                  <ChevronUp className="h-4 w-4" />
                  Show Less
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" />
                  Show {questions.length - totalShownQuestions} More Questions
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
