"use client";

import * as React from "react";
<<<<<<< HEAD
import Image from "next/image";
import Link from "next/link";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";

import { getFirebaseAuth } from "@/lib/firebase/client";
import { useAuth } from "@/components/auth-provider";
=======
import { useRouter } from "next/navigation";

>>>>>>> 31dff062059e19b9530ba2cc08afd4c17b9be688
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
<<<<<<< HEAD

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
=======
import Image from "next/image";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = React.useState<"signin" | "signup">("signin");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
>>>>>>> 31dff062059e19b9530ba2cc08afd4c17b9be688

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
<<<<<<< HEAD

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
=======
    setMessage(null);

    try {
      const supabase = createSupabaseBrowserClient();
      if (mode === "signin") {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (signInError) throw signInError;
        router.replace("/dashboard");
        router.refresh();
        return;
      }

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password
      });
      if (signUpError) throw signUpError;

      if (data.session) {
        router.replace("/dashboard");
        router.refresh();
      } else {
        setMessage("Check your email to confirm your account.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
>>>>>>> 31dff062059e19b9530ba2cc08afd4c17b9be688
      setLoading(false);
    }
  };

<<<<<<< HEAD
  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#faf8f5]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
      </div>
    );
  }

=======
>>>>>>> 31dff062059e19b9530ba2cc08afd4c17b9be688
  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <Link href="/" className="inline-block mb-4">
            <Image src="/logo.png" alt="ARTHA" width={60} height={60} className="h-15 w-15 mx-auto" />
          </Link>
<<<<<<< HEAD
          <h1 className="text-3xl font-semibold">Secure Account Access</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in to access your private financial workspace.
=======
          <h1 className="text-3xl font-semibold">Welcome back</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in to manage your finances and track your wealth.
>>>>>>> 31dff062059e19b9530ba2cc08afd4c17b9be688
          </p>
        </div>

        <Card>
          <CardHeader>
<<<<<<< HEAD
            <CardTitle>{mode === "signin" ? "Sign In" : "Create Account"}</CardTitle>
=======
            <CardTitle>{mode === "signin" ? "Sign In" : "Create account"}</CardTitle>
>>>>>>> 31dff062059e19b9530ba2cc08afd4c17b9be688
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
<<<<<<< HEAD

=======
>>>>>>> 31dff062059e19b9530ba2cc08afd4c17b9be688
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete={mode === "signin" ? "current-password" : "new-password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
<<<<<<< HEAD
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
=======
                  required
                />
              </div>

              {error ? <p className="text-sm text-negative">{error}</p> : null}
              {message ? <p className="text-sm text-positive">{message}</p> : null}

              <Button className="w-full" disabled={loading}>
                {loading
                  ? "Working..."
                  : mode === "signin"
                  ? "Sign In"
                  : "Create Account"}
>>>>>>> 31dff062059e19b9530ba2cc08afd4c17b9be688
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="text-center text-sm text-mutedForeground">
<<<<<<< HEAD
          {mode === "signin" ? "Need an account?" : "Already have an account?"}{" "}
          <button
            type="button"
            className="font-semibold text-accent"
            onClick={() => {
              setMode(mode === "signin" ? "signup" : "signin");
              setError(null);
            }}
=======
          {mode === "signin" ? "Need an account?" : "Already have an account?"} {" "}
          <button
            type="button"
            className="font-semibold text-accent"
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
>>>>>>> 31dff062059e19b9530ba2cc08afd4c17b9be688
          >
            {mode === "signin" ? "Create one" : "Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}
