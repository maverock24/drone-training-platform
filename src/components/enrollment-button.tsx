"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { BookPlus, Loader2 } from "lucide-react";

interface EnrollmentButtonProps {
  trackId: string;
  isEnrolled?: boolean;
  className?: string;
}

export function EnrollmentButton({ trackId, isEnrolled = false, className }: EnrollmentButtonProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [enrolling, setEnrolling] = useState(false);
  const [enrolled, setEnrolled] = useState(isEnrolled);

  const handleEnroll = async () => {
    if (!user) {
      router.push(`/login?returnTo=/tracks/${trackId}`);
      return;
    }

    setEnrolling(true);
    try {
      const res = await fetch("/api/enrollments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ track_id: trackId }),
      });
      if (res.ok) {
        setEnrolled(true);
      }
    } catch {
      // silently fail
    } finally {
      setEnrolling(false);
    }
  };

  if (enrolled) {
    return (
      <Button variant="outline" size="sm" disabled className={className}>
        Enrolled
      </Button>
    );
  }

  return (
    <Button
      variant="default"
      size="sm"
      className={className}
      onClick={handleEnroll}
      disabled={enrolling}
    >
      {enrolling ? (
        <Loader2 className="h-4 w-4 animate-spin mr-1" />
      ) : (
        <BookPlus className="h-4 w-4 mr-1" />
      )}
      {enrolling ? "Enrolling..." : "Enroll"}
    </Button>
  );
}
