"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  User,
  Brain,
  Factory,
  Database,
  Cpu,
  BookOpen,
  Code,
  HelpCircle,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  LogOut,
  PlayCircle,
  Trophy,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useProgress } from "@/lib/progress-context";
import {
  tracks,
  getTotalLessons,
  getTotalSteps,
  getTotalQuizQuestions,
} from "@/lib/course-data";
import { domainTrainings } from "@/lib/domain-data";

const trackIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  "ai-engineer": Brain,
  "mlops-engineer": Factory,
  "data-engineer": Database,
  "edge-ai": Cpu,
};

const trackColorMap: Record<string, string> = {
  "ai-engineer": "from-violet-600 to-purple-600",
  "mlops-engineer": "from-orange-600 to-amber-600",
  "data-engineer": "from-cyan-600 to-blue-600",
  "edge-ai": "from-emerald-600 to-teal-600",
};

export default function ProfilePage() {
  const { user, loading, logout } = useAuth();
  const {
    getTrackProgress,
    totalCompleted,
    completedSteps,
    quizScores,
    lastVisited,
  } = useProgress();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  const handleLogout = async () => {
    await logout();
    router.push("/");
    router.refresh();
  };

  if (loading || !user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const totalLessons = getTotalLessons();
  const totalSteps = getTotalSteps();
  const totalQuizQuestions = getTotalQuizQuestions();
  const completedQuizzes = Object.keys(quizScores).length;
  const avgQuizScore =
    completedQuizzes > 0
      ? Math.round(
          Object.values(quizScores).reduce((a, b) => a + b, 0) / completedQuizzes
        )
      : null;
  const overallProgress = totalLessons > 0 ? Math.round((totalCompleted / totalLessons) * 100) : 0;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-cyan-600 shadow-lg shadow-violet-600/20">
            <User className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{user.username}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">DroneAI Academy Student</p>
            <Badge variant="secondary" className="mt-1.5 text-xs gap-1">
              <CheckCircle2 className="h-3 w-3 text-emerald-500" />
              Active
            </Badge>
          </div>
        </div>
        <Button variant="outline" size="sm" className="gap-2" onClick={handleLogout}>
          <LogOut className="h-4 w-4" />
          Log out
        </Button>
      </div>

      {/* Continue Learning */}
      {lastVisited && (
        <Card className="border-primary/30 bg-primary/5 mb-6">
          <CardContent className="py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15">
                  <PlayCircle className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Last studied</p>
                  <p className="text-sm font-semibold truncate">
                    {lastVisited.trackTitle} — {lastVisited.lessonTitle}
                  </p>
                </div>
              </div>
              <Link href={`/tracks/${lastVisited.trackId}/${lastVisited.moduleId}/${lastVisited.lessonId}`} className="shrink-0">
                <Button size="sm" className="gap-2">
                  Resume
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Overall Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-8">
        <Card className="border-border/50">
          <CardContent className="pt-5 pb-4 text-center">
            <BookOpen className="h-5 w-5 mx-auto mb-1.5 text-violet-500" />
            <p className="text-2xl font-bold">{totalCompleted}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              of {totalLessons} lessons
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="pt-5 pb-4 text-center">
            <Code className="h-5 w-5 mx-auto mb-1.5 text-cyan-500" />
            <p className="text-2xl font-bold">{completedSteps.size}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              of {totalSteps} coding steps
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="pt-5 pb-4 text-center">
            <HelpCircle className="h-5 w-5 mx-auto mb-1.5 text-amber-500" />
            <p className="text-2xl font-bold">{completedQuizzes}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              of {totalQuizQuestions} quizzes
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="pt-5 pb-4 text-center">
            <Trophy className="h-5 w-5 mx-auto mb-1.5 text-orange-500" />
            <p className="text-2xl font-bold">{avgQuizScore !== null ? `${avgQuizScore}%` : "—"}</p>
            <p className="text-xs text-muted-foreground mt-0.5">avg quiz score</p>
          </CardContent>
        </Card>
      </div>

      {/* Overall Progress Bar */}
      <Card className="border-border/50 mb-8">
        <CardContent className="py-5">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-sm font-medium">Overall Curriculum Progress</span>
            <span className="text-sm font-semibold text-primary">{overallProgress}%</span>
          </div>
          <Progress value={overallProgress} className="h-2.5" />
          <p className="text-xs text-muted-foreground mt-2">
            {totalCompleted} lessons completed across all 4 career tracks
          </p>
        </CardContent>
      </Card>

      <Separator className="mb-8" />

      {/* Career Tracks */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold mb-4">Career Tracks</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {tracks.map((track) => {
            const Icon = trackIconMap[track.id] ?? Brain;
            const gradient = trackColorMap[track.id] ?? "from-violet-600 to-purple-600";
            const progress = getTrackProgress(track.id);
            const trackLessons = track.modules.reduce((a, m) => a + m.lessons.length, 0);
            const trackCompleted = Math.round((progress / 100) * trackLessons);

            return (
              <Link key={track.id} href={`/tracks/${track.id}`}>
                <Card className="group border-border/50 h-full transition-all hover:border-border hover:shadow-md">
                  <CardContent className="py-4 px-4">
                    <div className="flex items-start gap-3 mb-3">
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${gradient}`}
                      >
                        <Icon className="h-4.5 w-4.5 text-white" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-sm leading-tight">{track.shortTitle}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {trackCompleted} / {trackLessons} lessons
                        </p>
                      </div>
                      <span className="ml-auto text-xs font-medium text-primary shrink-0">
                        {progress}%
                      </span>
                    </div>
                    <Progress value={progress} className="h-1.5" />
                    <div className="mt-3 flex items-center gap-1 text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                      {progress > 0 ? "Continue" : "Start learning"}
                      <ArrowRight className="h-3 w-3" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>

      <Separator className="mb-8" />

      {/* Domain Training */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Domain Training</h2>
          <Link href="/domains">
            <Button variant="outline" size="sm" className="gap-2">
              Browse All
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
        <Card className="border-border/50">
          <CardContent className="py-5">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-500/10">
                <Sparkles className="h-6 w-6 text-violet-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">
                  {domainTrainings.length} Specialized Domains Available
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Apply your skills to fire detection, agriculture, maritime, urban operations, and {domainTrainings.length - 5} more industries.
                </p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {domainTrainings.slice(0, 4).map((d) => (
                <Link key={d.slug} href={`/domains/${d.slug}`}>
                  <div className="rounded-lg border border-border/50 px-3 py-2 text-xs font-medium hover:border-border hover:bg-accent transition-all truncate">
                    {d.domain}
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
