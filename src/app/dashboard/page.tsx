"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Brain, Factory, Database, Cpu,
  PlayCircle, ArrowRight, BookOpen, Flame, Trophy,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useProgress } from "@/lib/progress-context";
import { tracks } from "@/lib/course-data";
import { DashboardCard } from "@/components/dashboard-card";

const trackIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  "ai-engineer": Brain,
  "mlops-engineer": Factory,
  "data-engineer": Database,
  "edge-ai": Cpu,
};

const trackColorMap: Record<string, { gradient: string; ring: string }> = {
  "ai-engineer":    { gradient: "from-violet-600 to-purple-600", ring: "stroke-violet-500" },
  "mlops-engineer": { gradient: "from-cyan-600 to-blue-600", ring: "stroke-cyan-500" },
  "data-engineer":  { gradient: "from-emerald-600 to-teal-600", ring: "stroke-emerald-500" },
  "edge-ai":        { gradient: "from-orange-600 to-red-600", ring: "stroke-orange-500" },
};

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const { getTrackProgress, lastVisited, getStudyStreak, getLessonsThisWeek, totalCompleted, getFlightHours } = useProgress();
  const [enrolledTracks, setEnrolledTracks] = useState<string[]>([]);

  useEffect(() => {
    if (!user) return;
    fetch("/api/enrollments", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.enrollments) {
          setEnrolledTracks(data.enrollments.map((e: { trackId: string }) => e.trackId));
        }
      })
      .catch(() => {});
  }, [user]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const streak = getStudyStreak();
  const weeklyLessons = getLessonsThisWeek();
  const flightHours = getFlightHours();

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">
          Welcome back, {user?.username}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Continue your drone engineering journey
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <Card className="border-border/50">
          <CardContent className="py-3 px-4 text-center">
            <Flame className="h-5 w-5 mx-auto mb-1 text-orange-500" />
            <p className="text-xl font-bold">{streak}</p>
            <p className="text-xs text-muted-foreground">Day Streak</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="py-3 px-4 text-center">
            <BookOpen className="h-5 w-5 mx-auto mb-1 text-violet-500" />
            <p className="text-xl font-bold">{weeklyLessons}</p>
            <p className="text-xs text-muted-foreground">This Week</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="py-3 px-4 text-center">
            <Trophy className="h-5 w-5 mx-auto mb-1 text-amber-500" />
            <p className="text-xl font-bold">{totalCompleted}</p>
            <p className="text-xs text-muted-foreground">Completed</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="py-3 px-4 text-center">
            <Cpu className="h-5 w-5 mx-auto mb-1 text-cyan-500" />
            <p className="text-xl font-bold">{flightHours.toFixed(0)}</p>
            <p className="text-xs text-muted-foreground">Flight Hours</p>
          </CardContent>
        </Card>
      </div>

      {/* Resume Learning */}
      {lastVisited && (
        <Card className="border-primary/30 bg-gradient-to-r from-primary/5 to-primary/10 mb-6">
          <CardContent className="py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15">
                  <PlayCircle className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Continue where you left off</p>
                  <p className="text-sm font-semibold truncate">
                    {lastVisited.trackTitle} — {lastVisited.lessonTitle}
                  </p>
                </div>
              </div>
              <Link
                href={`/tracks/${lastVisited.trackId}/${lastVisited.moduleId}/${lastVisited.lessonId}`}
                className="shrink-0"
              >
                <Button size="sm" className="gap-2">
                  Resume <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Enrolled Tracks */}
      <Card className="border-border/50 mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Your Tracks</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {tracks.map((track) => {
            const Icon = trackIconMap[track.id] ?? Brain;
            const colors = trackColorMap[track.id] ?? {
              gradient: "from-gray-600 to-gray-600",
              ring: "stroke-gray-500",
            };
            const progress = getTrackProgress(track.id);
            const totalLessons = track.modules.reduce((a, m) => a + m.lessons.length, 0);
            const completedLessons = Math.round((progress / 100) * totalLessons);

            return (
              <DashboardCard
                key={track.id}
                trackId={track.id}
                trackTitle={track.title}
                shortTitle={track.shortTitle}
                icon={<Icon className="h-4 w-4 text-white" />}
                gradient={colors.gradient}
                ringColor={colors.ring}
                progress={progress}
                totalLessons={totalLessons}
                completedLessons={completedLessons}
              />
            );
          })}
        </CardContent>
      </Card>

      {/* Quick Links */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/tracks">
          <Card className="border-border/50 hover:border-primary/30 transition-all cursor-pointer">
            <CardContent className="py-4 px-4 text-center">
              <BookOpen className="h-5 w-5 mx-auto mb-2 text-primary" />
              <p className="text-sm font-medium">Browse Tracks</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/domains">
          <Card className="border-border/50 hover:border-primary/30 transition-all cursor-pointer">
            <CardContent className="py-4 px-4 text-center">
              <Brain className="h-5 w-5 mx-auto mb-2 text-primary" />
              <p className="text-sm font-medium">Domain Training</p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
