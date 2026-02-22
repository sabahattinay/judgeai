'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Upload, X } from 'lucide-react';
import { toast } from 'sonner';

interface SubmissionFormProps {
  roomId: string;
  token: string;
  userType: 'user_a' | 'user_b';
  onSubmitSuccess: () => void;
}

export function SubmissionForm({ roomId, token, userType, onSubmitSuccess }: SubmissionFormProps) {
  const [story, setStory] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    
    if (files.length + selectedFiles.length > 5) {
      toast.error('Maximum 5 files allowed');
      return;
    }

    const totalSize = [...files, ...selectedFiles].reduce((sum, f) => sum + f.size, 0);
    if (totalSize > 10 * 1024 * 1024) {
      toast.error('Total file size must be under 10MB');
      return;
    }

    setFiles([...files, ...selectedFiles]);
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!story.trim()) {
      toast.error('Please enter your argument');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('roomId', roomId);
      formData.append('token', token);
      formData.append('story', story);

      files.forEach(file => {
        formData.append('files', file);
      });

      const response = await fetch('/api/submit', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit');
      }

      toast.success('Argument submitted successfully!');
      onSubmitSuccess();
    } catch (error) {
      console.error('Submit error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to submit');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className={userType === 'user_a' ? 'text-blue-600' : 'text-purple-600'}>
          Your Argument ({userType === 'user_a' ? 'User A' : 'User B'})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Your Side of the Story</label>
          <Textarea
            placeholder="Explain your perspective and provide your arguments..."
            value={story}
            onChange={(e) => setStory(e.target.value)}
            maxLength={2000}
            rows={8}
            className="resize-none"
          />
          <p className="text-xs text-gray-500 text-right">
            {story.length}/2000 characters
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Supporting Documents (Optional)</label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <Input
              type="file"
              multiple
              accept="image/*,.pdf,.txt"
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
              disabled={files.length >= 5}
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm text-gray-600">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-gray-500 mt-1">
                PDF, Images, or Text files (Max 5 files, 10MB total)
              </p>
            </label>
          </div>

          {files.length > 0 && (
            <div className="space-y-2">
              {files.map((file, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                  <span className="text-sm truncate flex-1">{file.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {uploading && (
          <Progress value={uploadProgress} className="w-full" />
        )}

        <Button
          onClick={handleSubmit}
          disabled={!story.trim() || uploading}
          className="w-full"
          size="lg"
        >
          {uploading ? 'Submitting...' : 'Submit Final Argument'}
        </Button>
      </CardContent>
    </Card>
  );
}
