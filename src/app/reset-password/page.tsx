"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, KeyRound, Loader2, ShieldCheck } from "lucide-react";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [temporaryPassword, setTemporaryPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const emailFromQuery = searchParams.get("email");
    if (emailFromQuery) {
      setEmail(emailFromQuery);
    }
  }, [searchParams]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (newPassword !== confirmPassword) {
      setError("New password and confirmation do not match");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, temporaryPassword, newPassword }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Unable to reset password");
        return;
      }

      setMessage(data.message || "Password updated successfully");
      setTemporaryPassword("");
      setNewPassword("");
      setConfirmPassword("");
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
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-600 to-emerald-600 shadow-lg shadow-cyan-900/30">
            <ShieldCheck className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl">Choose a new password</CardTitle>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Use the temporary password from your email, then set a new permanent password for your account.
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

            <div className="space-y-2">
              <label htmlFor="temporaryPassword" className="text-sm font-medium leading-none">
                Temporary password
              </label>
              <input
                id="temporaryPassword"
                type="text"
                value={temporaryPassword}
                onChange={(event) => setTemporaryPassword(event.target.value)}
                required
                autoComplete="one-time-code"
                className="flex h-11 w-full rounded-lg border border-border/60 bg-muted/20 px-3 py-2 text-sm transition-colors placeholder:text-muted-foreground/60 focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="Enter the temporary password from email"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="newPassword" className="text-sm font-medium leading-none">
                New password
              </label>
              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                required
                autoComplete="new-password"
                minLength={6}
                className="flex h-11 w-full rounded-lg border border-border/60 bg-muted/20 px-3 py-2 text-sm transition-colors placeholder:text-muted-foreground/60 focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="Choose a new password"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium leading-none">
                Confirm new password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
                autoComplete="new-password"
                minLength={6}
                className="flex h-11 w-full rounded-lg border border-border/60 bg-muted/20 px-3 py-2 text-sm transition-colors placeholder:text-muted-foreground/60 focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="Re-enter your new password"
              />
            </div>

            {message && (
              <div className="rounded-md border border-emerald-500/20 bg-emerald-500/10 px-3 py-3 text-sm text-emerald-500">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                  <div>
                    <p className="font-medium">Password updated</p>
                    <p className="mt-1 text-emerald-500/80">You can now sign in with your new password.</p>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <p className="rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-500">
                {error}
              </p>
            )}

            <Button type="submit" className="h-11 w-full gap-2 text-sm font-semibold" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
              Save new password
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Need a new temporary password?{" "}
            <Link href="/forgot-password" className="font-medium text-primary hover:underline">
              Request another email
            </Link>
          </div>

          {message && (
            <div className="mt-3 text-center text-sm text-muted-foreground">
              <Link href="/login" className="font-medium text-primary hover:underline">
                Return to login
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
