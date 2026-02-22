import { PublicFeed } from '@/components/PublicFeed';
import { Button } from '@/components/ui/button';
import { Scale, Plus } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-12 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Scale className="w-12 h-12 text-blue-600" />
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              JudgeAI
            </h1>
          </div>
          <p className="text-xl text-gray-600 mb-6 max-w-2xl mx-auto">
            Resolve disputes with AI-powered impartial judgment. Two sides, one verdict.
          </p>
          <Link href="/create">
            <Button size="lg" className="gap-2">
              <Plus className="w-5 h-5" />
              Create New Dispute
            </Button>
          </Link>
        </header>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">
            Recent Verdicts
          </h2>
          <PublicFeed />
        </section>
      </div>
    </div>
  );
}
