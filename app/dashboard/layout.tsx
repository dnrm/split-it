import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AnimatedDashboardNav } from '@/components/dashboard/animated-dashboard-nav';
import { PageTransition } from '@/components/ui/page-transition';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  return (
    <div className="flex min-h-screen flex-col">
      <AnimatedDashboardNav user={user} />
      <main className="flex-1 bg-background">
        <PageTransition>
          {children}
        </PageTransition>
      </main>
    </div>
  );
}

