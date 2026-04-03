"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, Loader2, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const response = await fetch("/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Unable to send reset email");
        return;
      }

      setMessage(data.message || "Check your email for reset instructions.");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md border-border/60 shadow-xl shadow-black/20">
        <CardHeader className="space-y-4 pb-6 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-rose-500 shadow-lg shadow-amber-900/30">
            <KeyRound className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl">Reset your password</CardTitle>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Enter your account email and we&apos;ll send a temporary password you can use to choose a new one.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium leading-none">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                autoComplete="email"
                className="flex h-11 w-full rounded-lg border border-border/60 bg-muted/20 px-3 py-2 text-sm transition-colors placeholder:text-muted-foreground/60 focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="pilot@example.com"
              />
            </div>

            {message && (
              <p className="rounded-md bg-emerald-500/10 px-3 py-2 text-sm text-emerald-500">
                {message}
              </p>
            )}

            {error && (
              <p className="rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-500">
                {error}
              </p>
            )}

            <Button type="submit" className="h-11 w-full gap-2 text-sm font-semibold" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
              Email temporary password
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Already have your temporary password?{" "}
            <Link href="/reset-password" className="font-medium text-primary hover:underline">
              Set a new password
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
