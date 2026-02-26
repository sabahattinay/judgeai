'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Copy, Check, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { JuryModeToggle } from '@/components/JuryModeToggle';

interface RoomData {
  userALink: string;
  userBLink: string;
  isJuryMode?: boolean;
  juryMembers?: { index: number; token: string; link: string }[];
}

export default function CreatePage() {
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [juryMode, setJuryMode] = useState(false);
  const [jurySettings, setJurySettings] = useState({
    consensusRequired: true,
    consensusThreshold: 12,
    allowRevote: true,
    anonymousVoting: true,
  });
  const [roomData, setRoomData] = useState<RoomData | null>(null);
  const [copiedA, setCopiedA] = useState(false);
  const [copiedB, setCopiedB] = useState(false);
  const [copiedJury, setCopiedJury] = useState<number | null>(null);

  const createRoom = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/create-room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title: title.trim() || null,
          isJuryMode: juryMode,
          jurySettings: juryMode ? jurySettings : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          setError(`Rate limit exceeded. Please try again in ${Math.ceil((data.retryAfter || 3600) / 60)} minutes.`);
        } else {
          setError(data.error || 'Failed to create room');
        }
        return;
      }

      setRoomData({
        userALink: data.userALink,
        userBLink: data.userBLink,
        isJuryMode: data.isJuryMode,
        juryMembers: data.juryMembers,
      });
      toast.success('Dispute room created successfully!');
    } catch (err) {
      setError('Network error. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, user: 'A' | 'B' | number) => {
    try {
      await navigator.clipboard.writeText(text);
      if (typeof user === 'number') {
        setCopiedJury(user);
        setTimeout(() => setCopiedJury(null), 2000);
        toast.success(`Jury member #${user + 1} link copied!`);
      } else if (user === 'A') {
        setCopiedA(true);
        setTimeout(() => setCopiedA(false), 2000);
        toast.success(`User ${user} link copied!`);
      } else {
        setCopiedB(true);
        setTimeout(() => setCopiedB(false), 2000);
        toast.success(`User ${user} link copied!`);
      }
    } catch (err) {
      toast.error('Failed to copy link');
    }
  };

  if (roomData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-12">
        <div className="container mx-auto px-4 max-w-3xl">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">
                {roomData.isJuryMode ? 'Juri Dispute Room Created!' : 'Dispute Room Created!'}
              </CardTitle>
              <CardDescription>
                {roomData.isJuryMode 
                  ? 'Share the user links with both parties and the jury links with 12 jury members.'
                  : 'Share these unique links with each party. Each link is secure and can only be used by one person.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* User Links */}
              <div className="space-y-3">
                <label className="text-sm font-semibold text-blue-600">User A Link</label>
                <div className="flex gap-2">
                  <Input
                    value={roomData.userALink}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(roomData.userALink, 'A')}
                  >
                    {copiedA ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
                <Button
                  variant="default"
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  onClick={() => window.open(roomData.userALink, '_blank')}
                >
                  Open User A Room
                </Button>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-semibold text-purple-600">User B Link</label>
                <div className="flex gap-2">
                  <Input
                    value={roomData.userBLink}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(roomData.userBLink, 'B')}
                  >
                    {copiedB ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
                <Button
                  variant="default"
                  className="w-full bg-purple-600 hover:bg-purple-700"
                  onClick={() => window.open(roomData.userBLink, '_blank')}
                >
                  Open User B Room
                </Button>
              </div>

              {/* Jury Links */}
              {roomData.isJuryMode && roomData.juryMembers && (
                <div className="space-y-3 pt-4 border-t">
                  <label className="text-sm font-semibold text-amber-600">
                    Jury Member Links (12 members)
                  </label>
                  <p className="text-xs text-gray-500">
                    Share these links with 12 jury members who will vote on the dispute.
                  </p>
                  
                  <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
                    {roomData.juryMembers.map((member) => (
                      <div key={member.index} className="flex gap-2">
                        <Input
                          value={member.link}
                          readOnly
                          className="font-mono text-xs"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => copyToClipboard(member.link, member.index)}
                        >
                          {copiedJury === member.index ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Alert>
                <AlertDescription>
                  <strong>Important:</strong> Use the buttons above to open rooms, or copy the COMPLETE link including the token. Anyone with a link can submit arguments for that user.
                </AlertDescription>
              </Alert>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setRoomData(null);
                  setTitle('');
                }}
              >
                Create Another Dispute
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Create Dispute Room</CardTitle>
            <CardDescription>
              Set up a new dispute resolution session. You'll receive two unique links to share with each party.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium">
                Dispute Title (Optional)
              </label>
              <Input
                id="title"
                placeholder="e.g., Who should pay for the broken window?"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={100}
              />
              <p className="text-xs text-gray-500">
                This will be visible on the public feed after resolution
              </p>
            </div>

            {/* Jury Mode Toggle */}
            <JuryModeToggle
              enabled={juryMode}
              onEnabledChange={setJuryMode}
              settings={jurySettings}
              onSettingsChange={setJurySettings}
            />

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="bg-blue-50 p-4 rounded-lg space-y-2">
              <h3 className="font-semibold text-sm">How it works:</h3>
              <ol className="text-sm space-y-1 list-decimal list-inside text-gray-700">
                <li>Create a dispute room and get two unique links</li>
                <li>Share User A link with the first party, User B link with the second</li>
                <li>Both parties submit their arguments and evidence</li>
                <li>They can see each other's submissions in real-time</li>
                <li>When ready, either party can request AI judgment</li>
                <li>AI analyzes both sides and declares a winner</li>
              </ol>
            </div>

            <Button
              onClick={createRoom}
              disabled={loading}
              className="w-full"
              size="lg"
            >
              {loading ? 'Creating Room...' : 'Create Dispute Room'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
