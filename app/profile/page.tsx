import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { User, Trophy, XCircle } from 'lucide-react'

export default async function ProfilePage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="w-10 h-10 text-blue-600" />
              </div>
            </div>
            <CardTitle className="text-2xl">{profile?.username || 'User'}</CardTitle>
            <p className="text-gray-500 text-sm">
              Member since {new Date(profile?.created_at || user.created_at).toLocaleDateString()}
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-green-50 border-green-200">
                <CardContent className="pt-6 text-center">
                  <Trophy className="w-8 h-8 mx-auto text-green-600 mb-2" />
                  <p className="text-3xl font-bold text-green-600">{profile?.wins || 0}</p>
                  <p className="text-sm text-green-700">Wins</p>
                </CardContent>
              </Card>
              <Card className="bg-red-50 border-red-200">
                <CardContent className="pt-6 text-center">
                  <XCircle className="w-8 h-8 mx-auto text-red-600 mb-2" />
                  <p className="text-3xl font-bold text-red-600">{profile?.losses || 0}</p>
                  <p className="text-sm text-red-700">Losses</p>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
