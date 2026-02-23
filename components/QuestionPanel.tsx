'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Send, CheckCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { AIQuestion } from '@/types/questions';

interface QuestionPanelProps {
  roomId: string;
  token: string;
  userType: 'user_a' | 'user_b';
  onAllQuestionsAnswered?: () => void;
}

export function QuestionPanel({ roomId, token, userType, onAllQuestionsAnswered }: QuestionPanelProps) {
  const [questions, setQuestions] = useState<AIQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchQuestions();
  }, [roomId, token, userType]);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/questions/${roomId}?token=${token}&userType=${userType}`
      );
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Fetch questions error:', response.status, errorData);
        throw new Error(errorData.error || `Failed to fetch questions (${response.status})`);
      }
      
      const data = await response.json();
      console.log('Questions fetched:', data.questions?.length || 0);
      setQuestions(data.questions || []);
      
      // Pre-fill answers
      const preFilledAnswers: Record<string, string> = {};
      data.questions?.forEach((q: AIQuestion) => {
        if (q.answered && q.answer_text) {
          preFilledAnswers[q.id] = q.answer_text;
        }
      });
      setAnswers(preFilledAnswers);
    } catch (error) {
      console.error('Error fetching questions:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to load questions');
    } finally {
      setLoading(false);
    }
  };

  const generateQuestions = async () => {
    try {
      setGenerating(true);
      console.log('Generating questions for userType:', userType);
      
      const response = await fetch(`/api/questions/${roomId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          action: 'generate',
          userType,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Generate questions error:', response.status, errorData);
        throw new Error(errorData.error || `Failed to generate questions (${response.status})`);
      }

      const data = await response.json();
      console.log('Questions generated:', data.questions?.length || 0);
      
      if (data.questions && data.questions.length > 0) {
        setQuestions(prev => [...prev, ...data.questions]);
        toast.success(`Generated ${data.questions.length} questions`);
        
        // Refresh questions to get the latest state
        setTimeout(() => {
          fetchQuestions();
        }, 500);
      } else {
        toast.info('No new questions generated');
      }
    } catch (error) {
      console.error('Error generating questions:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate questions');
    } finally {
      setGenerating(false);
    }
  };

  const submitAnswer = async (questionId: string) => {
    const answer = answers[questionId];
    if (!answer || !answer.trim()) {
      toast.error('Please provide an answer');
      return;
    }

    try {
      setSubmitting(true);
      console.log('Submitting answer for question:', questionId);
      
      const response = await fetch(`/api/questions/${roomId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          action: 'answer',
          userType,
          questionId,
          answerText: answer.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Submit answer error:', response.status, errorData);
        throw new Error(errorData.error || `Failed to submit answer (${response.status})`);
      }

      const result = await response.json();
      console.log('Answer submitted successfully:', result);

      // Optimistic update - update local state immediately
      const answeredAt = new Date().toISOString();
      setQuestions(prev => 
        prev.map(q => 
          q.id === questionId 
            ? { ...q, answered: true, answer_text: answer.trim(), answered_at: answeredAt }
            : q
        )
      );

      // Clear the answer input
      setAnswers(prev => ({ ...prev, [questionId]: '' }));

      toast.success('Answer submitted successfully');
      
      // Check if all questions are answered
      setTimeout(() => {
        const allAnswered = questions.every(q => q.id === questionId ? true : q.answered);
        if (allAnswered && onAllQuestionsAnswered) {
          console.log('All questions answered, triggering callback');
          onAllQuestionsAnswered();
        }
      }, 100);
    } catch (error) {
      console.error('Error submitting answer:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to submit answer');
    } finally {
      setSubmitting(false);
    }
  };

  const getQuestionTypeColor = (type: string) => {
    switch (type) {
      case 'clarification': return 'bg-blue-100 text-blue-800';
      case 'evidence_request': return 'bg-orange-100 text-orange-800';
      case 'timeline': return 'bg-green-100 text-green-800';
      case 'impact': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const unansweredQuestions = questions.filter(q => !q.answered);
  const answeredQuestions = questions.filter(q => q.answered);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Clock className="h-5 w-5 animate-spin mr-2" />
            Loading questions...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Generate Questions Button */}
      {questions.length === 0 && (
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold mb-2">Need More Information?</h3>
              <p className="text-gray-600 mb-4">
                The AI can ask follow-up questions to help clarify your positions before making a judgment.
              </p>
              <Button 
                onClick={generateQuestions} 
                disabled={generating}
                className="w-full"
              >
                {generating ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Generating Questions...
                  </>
                ) : (
                  <>
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Generate AI Questions
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Unanswered Questions */}
      {unansweredQuestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MessageCircle className="h-5 w-5 mr-2" />
              Questions for You ({unansweredQuestions.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {unansweredQuestions.map((question) => (
              <div key={question.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <Badge className={getQuestionTypeColor(question.question_type)}>
                    {question.question_type.replace('_', ' ')}
                  </Badge>
                  <span className="text-sm text-gray-500">
                    {new Date(question.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="font-medium mb-3">{question.question_text}</p>
                <div className="space-y-2">
                  <Textarea
                    placeholder="Provide your answer..."
                    value={answers[question.id] || ''}
                    onChange={(e) => 
                      setAnswers(prev => ({ ...prev, [question.id]: e.target.value }))
                    }
                    rows={3}
                  />
                  <Button 
                    onClick={() => submitAnswer(question.id)}
                    disabled={submitting || !answers[question.id]?.trim()}
                    size="sm"
                  >
                    {submitting ? (
                      <Clock className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Answered Questions */}
      {answeredQuestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
              Your Answers ({answeredQuestions.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {answeredQuestions.map((question) => (
              <div key={question.id} className="border rounded-lg p-4 bg-gray-50">
                <div className="flex items-start justify-between mb-2">
                  <Badge className={getQuestionTypeColor(question.question_type)}>
                    {question.question_type.replace('_', ' ')}
                  </Badge>
                  <span className="text-sm text-gray-500">
                    Answered {new Date(question.answered_at!).toLocaleDateString()}
                  </span>
                </div>
                <p className="font-medium mb-2">{question.question_text}</p>
                <div className="bg-white p-3 rounded border">
                  <p className="text-sm">{question.answer_text}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* All Questions Answered */}
      {questions.length > 0 && unansweredQuestions.length === 0 && (
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-600" />
              <h3 className="text-lg font-semibold mb-2">All Questions Answered</h3>
              <p className="text-gray-600">
                Thank you for providing additional information. The AI will now consider your answers when making the final judgment.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
