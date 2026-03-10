"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";

import { getFirebaseAuth } from "@/lib/firebase/client";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function getFriendlyError(error: unknown) {
  if (!(error instanceof Error)) {
    return "Unable to continue. Please try again.";
  }

  const message = error.message.toLowerCase();

  if (message.includes("invalid-credential") || message.includes("wrong-password")) {
    return "Incorrect email or password.";
  }

  if (message.includes("user-not-found")) {
    return "No account found for this email.";
  }

  if (message.includes("email-already-in-use")) {
    return "That email is already registered. Please sign in instead.";
  }

  if (message.includes("weak-password")) {
    return "Password must be at least 6 characters.";
  }

  return error.message;
}

export default function LoginPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [mode, setMode] = React.useState<"signin" | "signup">("signin");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!authLoading && user) {
      router.replace("/dashboard");
    }
  }, [authLoading, router, user]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const firebaseAuth = getFirebaseAuth();
      if (mode === "signin") {
        await signInWithEmailAndPassword(firebaseAuth, email.trim(), password);
      } else {
        await createUserWithEmailAndPassword(firebaseAuth, email.trim(), password);
      }

      router.replace("/dashboard");
      router.refresh();
    } catch (err) {
      setError(getFriendlyError(err));
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#faf8f5]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <Link href="/" className="inline-block mb-4">
            <Image src="/logo.png" alt="ARTHA" width={60} height={60} className="h-15 w-15 mx-auto" />
          </Link>
          <h1 className="text-3xl font-semibold">Secure Account Access</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in to access your private financial workspace.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{mode === "signin" ? "Sign In" : "Create Account"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete={mode === "signin" ? "current-password" : "new-password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  minLength={6}
                  required
                />
                {mode === "signup" ? (
                  <p className="text-xs text-muted-foreground">Use at least 6 characters.</p>
                ) : null}
              </div>

              {error ? <p className="text-sm text-negative">{error}</p> : null}

              <Button className="w-full" disabled={loading}>
                {loading ? "Please wait..." : mode === "signin" ? "Sign In" : "Create Account"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="text-center text-sm text-mutedForeground">
          {mode === "signin" ? "Need an account?" : "Already have an account?"}{" "}
          <button
            type="button"
            className="font-semibold text-accent"
            onClick={() => {
              setMode(mode === "signin" ? "signup" : "signin");
              setError(null);
            }}
          >
            {mode === "signin" ? "Create one" : "Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}
