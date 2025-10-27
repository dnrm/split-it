import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Sparkles, Users, TrendingUp, MessageSquare, CheckCircle, ArrowRight, Star, Zap, Shield } from "lucide-react";
import TextType from "@/components/TextType";
import { ThemeToggle } from "@/components/theme-toggle";
import { AnimatedCurrencyBackground } from "@/components/animated-currency-background";
import { ThemeAwareDashboardImage } from "@/components/dashboard/theme-aware-dashboard-image";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4 max-w-5xl mx-auto">
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">SplitIt</span>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                className="rounded-xl"
                asChild
              >
                <Link href="/auth/login">Sign In</Link>
              </Button>
              <Button
                className="rounded-xl bg-linear-to-b from-primary to-blue-600 text-white hover:from-primary/80 hover:to-primary/50 border border-primary"
                asChild
              >
                <Link href="/dashboard">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col justify-center bg-linear-to-br from-primary/0 to-primary/15 dark:to-primary/20 relative overflow-hidden">
        {/* Currency Symbol Background Texture */}
        <AnimatedCurrencyBackground />
        
        <section className="container mx-auto px-4 py-16 md:py-24 relative z-10">
          <div className="mx-auto flex max-w-[1200px] flex-col items-center gap-8 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border bg-background px-4 py-1.5 text-sm animate-fade-in-up">
              <Sparkles className="h-4 w-4 animate-pulse" />
              <span>AI-Powered Expense Sharing</span>
            </div>
            <div className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <TextType
                text={[
                  "Split expenses with natural language",
                  "Just say 'I paid $45 for dinner'.",
                  "No spreadsheets, just vibes",
                  "Perfect for trips and roommates",
                  "SplitIt is a free and easy to use expense sharing app",
                ]}
                typingSpeed={80}
                deletingSpeed={50}
                pauseDuration={2000}
                loop={true}
                showCursor={true}
                cursorCharacter="|"
                className="text-foreground"
                as="span"
              />
            </div>
            <p className="max-w-[700px] text-lg text-muted-foreground sm:text-xl animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
              Just say "I paid $45 for dinner" and let AI handle the rest. No
              spreadsheets, no math, just vibes.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
              <Button
                size="lg"
                className="rounded-xl bg-linear-to-b from-primary to-blue-600 text-white hover:from-primary/80 hover:to-primary/50 border border-primary"
                asChild
              >
                <Link href="/dashboard">Get Started Free</Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="rounded-xl"
                asChild
              >
                <Link href="/auth/login">Sign In</Link>
              </Button>
            </div>
            
            {/* App Screenshots */}
            <div className="mt-12 grid grid-cols-1 gap-8 max-w-5xl animate-fade-in-up" style={{ animationDelay: '0.8s' }}>
              <div className="hover:scale-105 transition-transform duration-500">
                <ThemeAwareDashboardImage />
              </div>
              {/* <div className="relative rounded-xl overflow-hidden shadow-2xl border">
                <Image
                  src="/screenshots/Screenshot 2025-10-26 at 6.02.49 a.m..png"
                  alt="SplitIt Groups - Smart Settlements"
                  width={600}
                  height={400}
                  className="w-full h-auto"
                  priority
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/20 to-transparent" />
              </div> */}
            </div>
          </div>
        </section>
      </main>
      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
            Why SplitIt is Different
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Experience the future of expense sharing with AI-powered intelligence and seamless group management.
          </p>
        </div>
        
        <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-2 lg:grid-cols-3">
          <div className="flex flex-col gap-4 rounded-none border bg-card p-8 hover:shadow-lg transition-all duration-300 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-3">
                <MessageSquare className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Natural Language</h3>
            </div>
            <p className="text-muted-foreground">
              Type or speak expenses naturally. "Dani paid $60 for gas for everyone" - our AI understands context and splits automatically.
            </p>
            <div className="flex items-center gap-2 text-sm text-primary font-medium">
              <CheckCircle className="h-4 w-4" />
              <span>Voice & text input</span>
            </div>
          </div>
          
          <div className="flex flex-col gap-4 rounded-none border bg-card p-8 hover:shadow-lg transition-all duration-300 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-3">
                <TrendingUp className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Smart Settlements</h3>
            </div>
            <p className="text-muted-foreground">
              Optimized payment plans that minimize transactions. Know exactly who pays whom with our intelligent settlement algorithm.
            </p>
            <div className="flex items-center gap-2 text-sm text-primary font-medium">
              <CheckCircle className="h-4 w-4" />
              <span>Minimal transactions</span>
            </div>
          </div>
          
          <div className="flex flex-col gap-4 rounded-none border bg-card p-8 hover:shadow-lg transition-all duration-300 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-3">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Group Management</h3>
            </div>
            <p className="text-muted-foreground">
              Perfect for trips, roommates, or any shared expenses. Everyone stays in sync with real-time updates and notifications.
            </p>
            <div className="flex items-center gap-2 text-sm text-primary font-medium">
              <CheckCircle className="h-4 w-4" />
              <span>Real-time sync</span>
            </div>
          </div>
          
          <div className="flex flex-col gap-4 rounded-none border bg-card p-8">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-3">
                <Zap className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Instant Processing</h3>
            </div>
            <p className="text-muted-foreground">
              Add expenses in seconds, not minutes. Our AI processes natural language instantly and updates balances immediately.
            </p>
            <div className="flex items-center gap-2 text-sm text-primary font-medium">
              <CheckCircle className="h-4 w-4" />
              <span>Real-time updates</span>
            </div>
          </div>
          
          <div className="flex flex-col gap-4 rounded-none border bg-card p-8">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-3">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Secure & Private</h3>
            </div>
            <p className="text-muted-foreground">
              Bank-level security with Capital One integration. Your financial data is encrypted and protected at all times.
            </p>
            <div className="flex items-center gap-2 text-sm text-primary font-medium">
              <CheckCircle className="h-4 w-4" />
              <span>Bank-level security</span>
            </div>
          </div>
          
          <div className="flex flex-col gap-4 rounded-none border bg-card p-8">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-3">
                <Star className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Beautiful Interface</h3>
            </div>
            <p className="text-muted-foreground">
              Clean, intuitive design that makes expense tracking enjoyable. Dark mode support and responsive design for any device.
            </p>
            <div className="flex items-center gap-2 text-sm text-primary font-medium">
              <CheckCircle className="h-4 w-4" />
              <span>Dark mode support</span>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="bg-muted/50 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
              Loved by Users Everywhere
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              See what people are saying about SplitIt's AI-powered expense sharing.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="bg-background rounded-none border p-6 shadow-sm hover:shadow-md transition-shadow duration-300 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-muted-foreground mb-4">
                "Finally, an app that understands natural language! I can just say 'I paid for dinner' and it figures out the split. Game changer for group trips."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-semibold text-primary">AV</span>
                </div>
                <div>
                  <p className="font-semibold">Andrea Valdez</p>
                  <p className="text-sm text-muted-foreground">Travel Blogger</p>
                </div>
              </div>
            </div>
            
            <div className="bg-background rounded-none border p-6 shadow-sm hover:shadow-md transition-shadow duration-300 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-muted-foreground mb-4">
                "The settlement optimization is incredible. Instead of 10+ transactions, it figures out the minimum needed. Saves so much time and confusion."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-semibold text-primary">DM</span>
                </div>
                <div>
                  <p className="font-semibold">Daniel Medina</p>
                  <p className="text-sm text-muted-foreground">Software Engineer</p>
                </div>
              </div>
            </div>
            
            <div className="bg-background rounded-none border p-6 shadow-sm hover:shadow-md transition-shadow duration-300 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-muted-foreground mb-4">
                "Perfect for roommates! No more awkward conversations about who owes what. The AI handles everything and everyone stays happy."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-semibold text-primary">RG</span>
                </div>
                <div>
                  <p className="font-semibold">Ricardo Guerrero</p>
                  <p className="text-sm text-muted-foreground">College Student</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="mx-auto max-w-4xl">
          <div className="relative rounded-none border bg-linear-to-br from-primary/5 to-primary/10 p-8 md:p-12 text-center overflow-hidden">
            <div className="absolute inset-0 bg-linear-to-r from-primary/10 to-transparent opacity-50" />
            <div className="relative z-10">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
                Ready to revolutionize your expense sharing?
              </h2>
              <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                Join thousands of users who've made expense sharing effortless with AI-powered intelligence.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  className="rounded-xl bg-linear-to-b from-primary to-blue-600 text-white hover:from-primary/80 hover:to-primary/50 border border-primary"
                  asChild
                >
                  <Link href="/dashboard">
                    Start Free Today
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-xl"
                  asChild
                >
                  <Link href="/auth/login">Sign In</Link>
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-6">
                No credit card required • Free forever • Setup in 2 minutes
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-6 md:py-8">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 md:flex-row">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="font-semibold">SplitIt</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2025 SplitIt. Built for hackathon.
          </p>
        </div>
      </footer>
    </div>
  );
}
