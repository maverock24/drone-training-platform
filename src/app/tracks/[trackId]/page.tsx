"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Brain,
  Factory,
  Database,
  Cpu,
  ArrowLeft,
  BookOpen,
  Clock,
  CheckCircle2,
  Circle,
  ChevronRight,
  Code,
  HelpCircle,
  Info,
  ScrollText,
  Lock,
  LogIn,
  UserPlus,
} from "lucide-react";
import { tracks } from "@/lib/course-data";
import { useProgress } from "@/lib/progress-context";
import { useAuth } from "@/lib/auth-context";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Brain,
  Factory,
  Database,
  Cpu,
};

export default function TrackPage({
  params,
}: {
  params: Promise<{ trackId: string }>;
}) {
  const { trackId } = use(params);
  const track = tracks.find((t) => t.id === trackId);
  const { isCompleted, toggleLesson, getTrackProgress, getQuizScore } = useProgress();
  const { user, loading: authLoading } = useAuth();

  if (!track) {
    notFound();
  }

  const Icon = iconMap[track.icon];
  const progress = getTrackProgress(track.id);
  const totalLessons = track.modules.reduce(
    (acc, m) => acc + m.lessons.length,
    0
  );
  const totalSteps = track.modules.reduce(
    (acc, m) =>
      acc +
      m.lessons.reduce((a, l) => a + l.step_by_step_guide.length, 0),
    0
  );
  const totalQuiz = track.modules.reduce(
    (acc, m) =>
      acc +
      m.lessons.reduce((a, l) => a + l.quiz.length, 0),
    0
  );
  const completedCount = track.modules.reduce(
    (acc, m) =>
      acc +
      m.lessons.filter((l) => isCompleted(`${track.id}-${l.id}`)).length,
    0
  );

  // Find adjacent tracks for navigation
  const currentIdx = tracks.findIndex((t) => t.id === trackId);
  const prevTrack = currentIdx > 0 ? tracks[currentIdx - 1] : null;
  const nextTrack =
    currentIdx < tracks.length - 1 ? tracks[currentIdx + 1] : null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      {/* Back link */}
      <Link href="/">
        <Button variant="ghost" size="sm" className="gap-2 mb-6 -ml-2">
          <ArrowLeft className="h-4 w-4" />
          All Tracks
        </Button>
      </Link>

      {/* Track header */}
      <div className="flex items-start gap-5 mb-8">
        <div
          className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${track.gradient}`}
        >
          {Icon && <Icon className="h-8 w-8 text-white" />}
        </div>
        <div className="min-w-0">
          <h1 className="text-3xl font-bold tracking-tight">{track.title}</h1>
          <p className="mt-1 text-muted-foreground">{track.description}</p>
          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <BookOpen className="h-4 w-4" />
              {totalLessons} lessons
            </span>
            <span className="flex items-center gap-1.5">
              <Code className="h-4 w-4" />
              {totalSteps} hands-on steps
            </span>
            <span className="flex items-center gap-1.5">
              <HelpCircle className="h-4 w-4" />
              {totalQuiz} quiz questions
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              {completedCount} completed
            </span>
          </div>
        </div>
      </div>

      {/* Prerequisites */}
      {track.prerequisites && (
        <Card className="mb-6 border-border/50 bg-muted/20">
          <CardContent className="py-3 flex items-start gap-3">
            <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <span className="text-sm font-medium">Prerequisites: </span>
              <span className="text-sm text-muted-foreground">{track.prerequisites}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Login CTA for unauthenticated users */}
      {!user && !authLoading && (
        <Card className="mb-8 border-primary/30 bg-gradient-to-r from-primary/5 to-primary/10">
          <CardContent className="py-8 flex flex-col items-center text-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
              <Lock className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Login Required</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-md">
                Create a free account or sign in to access lessons, quizzes, and track your progress.
              </p>
            </div>
            <div className="flex gap-3">
              <Link href="/register">
                <Button className="gap-2">
                  <UserPlus className="h-4 w-4" />
                  Create Account
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" className="gap-2">
                  <LogIn className="h-4 w-4" />
                  Sign In
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lecture link */}
      {user && track.lecture && (
        <Link href={`/tracks/${trackId}/lecture`}>
          <Card className="mb-6 border-border/50 bg-gradient-to-r from-muted/40 to-muted/20 hover:border-border hover:shadow-md transition-all cursor-pointer">
            <CardContent className="py-4 flex items-center gap-4">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${track.gradient}`}
              >
                <ScrollText className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">Read the Lecture</p>
                <p className="text-xs text-muted-foreground">
                  In-depth reading material covering all topics in this track
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
            </CardContent>
          </Card>
        </Link>
      )}

      {/* Progress bar */}
      {user && (
        <Card className="mb-8 border-border/50">
          <CardContent className="py-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="font-medium">Track Progress</span>
              <span className="text-muted-foreground">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </CardContent>
        </Card>
      )}

      {/* Modules with lessons */}
      <div className="space-y-4">
        {track.modules.map((module, moduleIdx) => {
          const lesson = module.lessons[0];
          const lessonKey = `${track.id}-${lesson.id}`;
          const completed = isCompleted(lessonKey);
          const quizScore = getQuizScore(lessonKey);
          const quizPassed = quizScore !== undefined && quizScore >= 70;

          return (
            <Card
              key={module.id}
              className="border-border/50 overflow-hidden transition-all hover:border-border hover:shadow-md"
            >
              <div className={`h-1 bg-gradient-to-r ${track.gradient} ${user && completed ? "opacity-100" : "opacity-30"}`} />
              <CardHeader className="pb-3">
                <div className="flex items-start gap-4">
                  <div className="mt-1 shrink-0">
                    {user && completed ? (
                      <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                    ) : user && quizPassed ? (
                      <button onClick={() => toggleLesson(lessonKey)}>
                        <Circle className="h-6 w-6 text-muted-foreground/40 hover:text-primary transition-colors" />
                      </button>
                    ) : (
                      <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-muted-foreground/30 text-xs font-bold text-muted-foreground">
                        {moduleIdx + 1}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg">{module.title}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {module.description}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <Badge variant="secondary" className="text-xs gap-1">
                        <Code className="h-3 w-3" />
                        {lesson.step_by_step_guide.length} steps
                      </Badge>
                      <Badge variant="secondary" className="text-xs gap-1">
                        <HelpCircle className="h-3 w-3" />
                        {lesson.quiz.length} quiz questions
                      </Badge>
                      {user && quizScore !== undefined && (
                        <Badge
                          variant="outline"
                          className={`text-xs gap-1 ${quizPassed ? "border-emerald-500/50 text-emerald-500" : "border-amber-500/50 text-amber-500"}`}
                        >
                          Quiz: {quizScore}%
                        </Badge>
                      )}
                      {user && !quizPassed && !completed && (
                        <Badge variant="outline" className="text-xs gap-1 text-muted-foreground">
                          <Lock className="h-3 w-3" />
                          Pass quiz to unlock
                        </Badge>
                      )}
                    </div>
                  </div>
                  {user ? (
                    <Link
                      href={`/tracks/${track.id}/${module.id}/${lesson.id}`}
                      className="shrink-0"
                    >
                      <Button size="sm" variant="outline" className="gap-1.5">
                        {completed ? "Review" : "Start"}
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  ) : (
                    <div className="shrink-0">
                      <Badge variant="outline" className="text-xs gap-1 text-muted-foreground">
                        <Lock className="h-3 w-3" />
                        Locked
                      </Badge>
                    </div>
                  )}
                </div>
              </CardHeader>
            </Card>
          );
        })}
      </div>

      {/* Navigation between tracks */}
      <Separator className="my-10" />
      <div className="flex items-center justify-between">
        {prevTrack ? (
          <Link href={`/tracks/${prevTrack.id}`}>
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              {prevTrack.shortTitle}
            </Button>
          </Link>
        ) : (
          <div />
        )}
        {nextTrack ? (
          <Link href={`/tracks/${nextTrack.id}`}>
            <Button variant="ghost" className="gap-2">
              {nextTrack.shortTitle}
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        ) : (
          <Link href="/grand-project">
            <Button variant="outline" className="gap-2 border-orange-500/30">
              Grand Project
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}
