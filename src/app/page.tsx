"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  BarChart3, 
  LineChart, 
  PieChart, 
  Target, 
  Shield, 
  TrendingUp,
  ArrowRight,
  Mail,
  ExternalLink
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

const features = [
  {
    icon: BarChart3,
    title: "Financial Analytics",
    description: "Track income, expenses, and get detailed breakdowns by category and source."
  },
  {
    icon: LineChart,
    title: "Portfolio Tracking",
    description: "Monitor your investments and visualize portfolio growth over time."
  },
  {
    icon: PieChart,
    title: "AI-Powered Insights",
    description: "Get personalized financial analysis and recommendations powered by ChatGPT."
  },
  {
    icon: Target,
    title: "Goal Setting",
    description: "Set financial goals and track your progress with visual indicators."
  },
  {
    icon: TrendingUp,
    title: "P/L Analysis",
    description: "Comprehensive profit and loss tracking with year-over-year comparisons."
  },
  {
    icon: Shield,
    title: "Secure & Private",
    description: "Your data is encrypted and stored securely. Privacy mode hides sensitive values."
  }
];

export default function LandingPage() {
  const router = useRouter();
  const [checking, setChecking] = React.useState(true);

  React.useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.replace("/dashboard");
      } else {
        setChecking(false);
      }
    });
  }, [router]);

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#faf8f5]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf8f5]">
      <header className="sticky top-0 z-50 border-b border-border/50 bg-[#faf8f5]/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/logo.png" alt="ARTHA" width={40} height={40} className="h-10 w-10" />
            <span className="text-xl font-semibold">ARTHA</span>
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition">Features</a>
            <a href="#about" className="text-sm text-muted-foreground hover:text-foreground transition">About</a>
            <a href="#contact" className="text-sm text-muted-foreground hover:text-foreground transition">Contact</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="outline" size="sm">Sign In</Button>
            </Link>
            <Link href="/login">
              <Button size="sm" className="bg-accent hover:bg-accent/90">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="px-6 py-20 md:py-32">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
              Take Control of Your
              <span className="block text-accent">Financial Future</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
              ARTHA is your personal finance command center. Track income, manage expenses, 
              monitor investments, and get AI-powered insights to make smarter financial decisions.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/login">
                <Button size="lg" className="gap-2 bg-accent hover:bg-accent/90">
                  Start Managing Your Finances
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <a href="#features">
                <Button variant="outline" size="lg">
                  Learn More
                </Button>
              </a>
            </div>
          </div>
        </section>

        <section id="features" className="border-t border-border/50 bg-white/50 px-6 py-20">
          <div className="mx-auto max-w-6xl">
            <div className="text-center">
              <h2 className="text-3xl font-bold">Everything You Need</h2>
              <p className="mt-3 text-muted-foreground">
                Powerful tools to manage your personal finances effectively.
              </p>
            </div>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => (
                <Card key={feature.title} className="border-border/40">
                  <CardContent className="pt-6">
                    <div className="mb-4 inline-flex rounded-lg bg-accent/10 p-2.5">
                      <feature.icon className="h-5 w-5 text-accent" />
                    </div>
                    <h3 className="font-semibold">{feature.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section id="about" className="border-t border-border/50 px-6 py-20">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold">About ARTHA</h2>
            <p className="mt-6 text-muted-foreground leading-relaxed">
              ARTHA (meaning "wealth" or "purpose" in Sanskrit) is a comprehensive personal finance 
              management application designed to help you understand and optimize your financial life. 
              Built with modern technology and a focus on user experience, ARTHA provides the tools 
              you need to track every aspect of your finances in one place.
            </p>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              Whether you're tracking daily expenses, monitoring investment portfolios, setting 
              savings goals, or analyzing spending patterns, ARTHA gives you the insights and 
              control you need to achieve financial success.
            </p>
          </div>
        </section>

        <section id="contact" className="border-t border-border/50 bg-white/50 px-6 py-20">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold">Get In Touch</h2>
            <p className="mt-4 text-muted-foreground">
              Have questions or feedback? We'd love to hear from you.
            </p>
            <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <a 
                href="https://x.com/0xR8N" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-white px-6 py-3 text-sm font-medium transition hover:bg-muted"
              >
                <ExternalLink className="h-4 w-4" />
                Follow on X (Twitter)
              </a>
              <a 
                href="mailto:contact@artha.app"
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-white px-6 py-3 text-sm font-medium transition hover:bg-muted"
              >
                <Mail className="h-4 w-4" />
                Send Email
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/50 bg-[#f5f2ed] px-6 py-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-3">
              <Image src="/logo.png" alt="ARTHA" width={32} height={32} className="h-8 w-8" />
              <span className="font-medium">ARTHA</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Made by{" "}
              <a 
                href="https://x.com/0xR8N" 
                target="_blank" 
                rel="noopener noreferrer"
                className="font-medium text-foreground hover:text-accent transition"
              >
                RΛBIN
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
