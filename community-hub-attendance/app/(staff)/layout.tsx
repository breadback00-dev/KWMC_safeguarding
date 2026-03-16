import { redirect } from 'next/navigation';
import { getAuthUser } from '@/lib/supabase/auth-server';
import { NavBar } from '@/components/layout/NavBar';

export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  const user = await getAuthUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar userEmail={user.email ?? ''} />
      <main className="max-w-4xl mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
}
