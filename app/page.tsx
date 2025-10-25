import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Sparkles, Users, TrendingUp, MessageSquare } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">SplitSphere</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" asChild>
              <Link href="/auth/login">Sign In</Link>
            </Button>
            <Button asChild>
              <Link href="/auth/signup">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="container px-4 py-16 md:py-24">
          <div className="mx-auto flex max-w-[980px] flex-col items-center gap-6 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border bg-background px-4 py-1.5 text-sm">
              <Sparkles className="h-4 w-4" />
              <span>AI-Powered Expense Sharing</span>
            </div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
              Split expenses with
              <span className="text-primary"> natural language</span>
            </h1>
            <p className="max-w-[700px] text-lg text-muted-foreground sm:text-xl">
              Just say "I paid $45 for dinner" and let AI handle the rest. No spreadsheets, no math, just vibes.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button size="lg" asChild>
                <Link href="/auth/signup">
                  Get Started Free
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/auth/login">
                  Sign In
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="container px-4 py-16">
          <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-2 lg:grid-cols-3">
            <div className="flex flex-col gap-3 rounded-lg border bg-card p-6">
              <MessageSquare className="h-10 w-10 text-primary" />
              <h3 className="text-xl font-semibold">Natural Language</h3>
              <p className="text-muted-foreground">
                Type or speak expenses naturally. "Dani paid $60 for gas for everyone" - done!
              </p>
            </div>
            <div className="flex flex-col gap-3 rounded-lg border bg-card p-6">
              <TrendingUp className="h-10 w-10 text-primary" />
              <h3 className="text-xl font-semibold">Smart Settlements</h3>
              <p className="text-muted-foreground">
                Optimized payment plans that minimize transactions. Know exactly who pays whom.
              </p>
            </div>
            <div className="flex flex-col gap-3 rounded-lg border bg-card p-6">
              <Users className="h-10 w-10 text-primary" />
              <h3 className="text-xl font-semibold">Group Management</h3>
              <p className="text-muted-foreground">
                Perfect for trips, roommates, or any shared expenses. Everyone stays in sync.
              </p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="container px-4 py-16">
          <div className="mx-auto max-w-[800px] rounded-lg border bg-card p-8 text-center md:p-12">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Ready to simplify your group expenses?
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Join thousands of users who've made expense sharing effortless.
            </p>
            <Button size="lg" className="mt-6" asChild>
              <Link href="/auth/signup">
                Start Free Today
              </Link>
            </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-6 md:py-8">
        <div className="container flex flex-col items-center justify-between gap-4 px-4 md:flex-row">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="font-semibold">SplitSphere</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2025 SplitSphere. Built for hackathon.
          </p>
        </div>
      </footer>
    </div>
  );
}
