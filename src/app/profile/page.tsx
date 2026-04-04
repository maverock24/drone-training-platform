"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CircularProgress } from "@/components/circular-progress";
import {
  User, Brain, Factory, Database, Cpu,
  BookOpen, Code, HelpCircle, CheckCircle2,
  ArrowRight, Sparkles, LogOut, PlayCircle, Trophy,
  Flame, Target, Zap, Star, Medal,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useProgress } from "@/lib/progress-context";
import { tracks, getTotalLessons, getTotalSteps, getTotalQuizQuestions } from "@/lib/course-data";
import { domainTrainings } from "@/lib/domain-data";

const trackIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  "ai-engineer": Brain, "mlops-engineer": Factory, "data-engineer": Database, "edge-ai": Cpu,
};
const trackColorMap: Record<string, { gradient: string; ring: string; text: string }> = {
  "ai-engineer":    { gradient: "from-violet-600 to-purple-600", ring: "stroke-violet-500",  text: "text-violet-400"  },
  "mlops-engineer": { gradient: "from-orange-600 to-amber-600",  ring: "stroke-orange-500",  text: "text-orange-400"  },
  "data-engineer":  { gradient: "from-cyan-600 to-blue-600",     ring: "stroke-cyan-500",    text: "text-cyan-400"    },
  "edge-ai":        { gradient: "from-emerald-600 to-teal-600",  ring: "stroke-emerald-500", text: "text-emerald-400" },
};

function getAchievements(total: number, steps: number, quizzes: number, avgScore: number | null, pct: number) {
  const badges = [];
  if (total >= 1)    badges.push({ icon: Star,    label: "First Lesson",         color: "text-amber-400",   bg: "bg-amber-500/10 border-amber-500/30" });
  if (total >= 5)    badges.push({ icon: BookOpen, label: "On a Roll",            color: "text-sky-400",     bg: "bg-sky-500/10 border-sky-500/30" });
  if (total >= 10)   badges.push({ icon: Target,   label: "Getting Serious",      color: "text-violet-400",  bg: "bg-violet-500/10 border-violet-500/30" });
  if (steps >= 10)   badges.push({ icon: Code,     label: "Code Warrior",         color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/30" });
  if (steps >= 25)   badges.push({ icon: Zap,      label: "Speed Coder",          color: "text-cyan-400",    bg: "bg-cyan-500/10 border-cyan-500/30" });
  if (avgScore !== null && avgScore >= 90) badges.push({ icon: Trophy, label: "Quiz Master", color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/30" });
  if (pct >= 25)     badges.push({ icon: Flame,    label: "Quarter Done",         color: "text-rose-400",    bg: "bg-rose-500/10 border-rose-500/30" });
  if (pct >= 50)     badges.push({ icon: Medal,    label: "Halfway Hero",         color: "text-purple-400",  bg: "bg-purple-500/10 border-purple-500/30" });
  if (pct >= 100)    badges.push({ icon: Trophy,   label: "Curriculum Complete",  color: "text-amber-400",   bg: "bg-amber-500/10 border-amber-500/30" });
  return badges;
}

export default function ProfilePage() {
  const { user, loading, logout } = useAuth();
  const { getTrackProgress, totalCompleted, completedSteps, quizScores, lastVisited, getFlightHours, getGlobalRank } = useProgress();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  const handleLogout = async () => { await logout(); router.push("/"); router.refresh(); };

  if (loading || !user) {
    return <div className="flex min-h-[60vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;
  }

  const totalLessons = getTotalLessons();
  const totalSteps = getTotalSteps();
  const totalQuizQuestions = getTotalQuizQuestions();
  const completedQuizzes = Object.keys(quizScores).length;
  const completedStepsCount = completedSteps.size;
  const avgQuizScore = completedQuizzes > 0
    ? Math.round(Object.values(quizScores).reduce((a, b) => a + b, 0) / completedQuizzes)
    : null;
  const overallProgress = totalLessons > 0 ? Math.round((totalCompleted / totalLessons) * 100) : 0;
  const achievements = getAchievements(totalCompleted, completedStepsCount, completedQuizzes, avgQuizScore, overallProgress);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-cyan-600 shadow-lg shadow-violet-600/20">
            <User className="h-7 w-7 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-bold tracking-tight truncate">{user.username}</h1>
            <p className="text-sm text-muted-foreground">DroneAI Academy Student</p>
            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
              <Badge variant="secondary" className="text-xs gap-1">
                <CheckCircle2 className="h-3 w-3 text-emerald-500" />Active
              </Badge>
              <Badge variant="outline" className="text-xs font-mono bg-cyan-950/30 text-cyan-400 border-cyan-800">
                {getFlightHours().toFixed(1)} Hrs · {getGlobalRank().split(" ")[0]}
              </Badge>
            </div>
          </div>
        </div>
        <Button variant="outline" size="sm" className="gap-2 shrink-0" onClick={handleLogout}>
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Log out</span>
        </Button>
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
                  <p className="text-sm font-semibold truncate">{lastVisited.trackTitle} — {lastVisited.lessonTitle}</p>
                </div>
              </div>
              <Link href={`/tracks/${lastVisited.trackId}/${lastVisited.moduleId}/${lastVisited.lessonId}`} className="shrink-0">
                <Button size="sm" className="gap-2">Resume <ArrowRight className="h-3.5 w-3.5" /></Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Overall Progress + Stats */}
      <Card className="border-border/50 mb-6">
        <CardContent className="py-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="flex flex-col items-center gap-2 shrink-0">
              <CircularProgress value={overallProgress} size={120} strokeWidth={10} color="stroke-primary">
                <span className="text-2xl font-bold">{overallProgress}%</span>
                <span className="text-xs text-muted-foreground">overall</span>
              </CircularProgress>
              <p className="text-xs text-muted-foreground">Curriculum Progress</p>
            </div>
            <div className="flex-1 w-full grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-border/40 bg-muted/20 p-3 text-center">
                <BookOpen className="h-4 w-4 mx-auto mb-1 text-violet-500" />
                <p className="text-xl font-bold">{totalCompleted}</p>
                <p className="text-xs text-muted-foreground">of {totalLessons} lessons</p>
              </div>
              <div className="rounded-xl border border-border/40 bg-muted/20 p-3 text-center">
                <Code className="h-4 w-4 mx-auto mb-1 text-cyan-500" />
                <p className="text-xl font-bold">{completedStepsCount}</p>
                <p className="text-xs text-muted-foreground">of {totalSteps} steps</p>
              </div>
              <div className="rounded-xl border border-border/40 bg-muted/20 p-3 text-center">
                <HelpCircle className="h-4 w-4 mx-auto mb-1 text-amber-500" />
                <p className="text-xl font-bold">{completedQuizzes}</p>
                <p className="text-xs text-muted-foreground">of {totalQuizQuestions} quizzes</p>
              </div>
              <div className="rounded-xl border border-border/40 bg-muted/20 p-3 text-center">
                <Trophy className="h-4 w-4 mx-auto mb-1 text-orange-500" />
                <p className="text-xl font-bold">{avgQuizScore !== null ? `${avgQuizScore}%` : "—"}</p>
                <p className="text-xs text-muted-foreground">avg quiz score</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Track Rings */}
      <Card className="border-border/50 mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Career Track Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {tracks.map((track) => {
              const Icon = trackIconMap[track.id] ?? Brain;
              const colors = trackColorMap[track.id] ?? { gradient: "from-violet-600 to-purple-600", ring: "stroke-violet-500", text: "text-violet-400" };
              const progress = getTrackProgress(track.id);
              const trackLessons = track.modules.reduce((a, m) => a + m.lessons.length, 0);
              const trackCompleted = Math.round((progress / 100) * trackLessons);
              return (
                <Link key={track.id} href={`/tracks/${track.id}`} className="flex flex-col items-center gap-2 group">
                  <CircularProgress value={progress} size={88} strokeWidth={8} color={colors.ring}>
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br ${colors.gradient} group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                  </CircularProgress>
                  <div className="text-center">
                    <p className="text-xs font-semibold leading-tight">{track.shortTitle}</p>
                    <p className={`text-xs ${colors.text} font-mono`}>{progress}% · {trackCompleted}/{trackLessons}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Achievements */}
      <Card className={`border-border/50 mb-6 ${achievements.length === 0 ? "border-dashed" : ""}`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Medal className="h-4 w-4 text-amber-400" />
            Achievements ({achievements.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {achievements.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {achievements.map((badge) => {
                const Icon = badge.icon;
                return (
                  <div key={badge.label} className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium ${badge.bg} ${badge.color}`}>
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    {badge.label}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Complete your first lesson to unlock achievement badges.</p>
          )}
        </CardContent>
      </Card>

      <Separator className="mb-6" />

      {/* Domain Training */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold">Specialized Domains</h2>
          <Link href="/domains"><Button variant="outline" size="sm" className="gap-2">Browse All <ArrowRight className="h-3.5 w-3.5" /></Button></Link>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {domainTrainings.slice(0, 4).map((d) => (
            <Link key={d.slug} href={`/domains/${d.slug}`}>
              <div className="rounded-lg border border-border/50 px-3 py-3 text-xs font-medium hover:border-primary/50 hover:bg-primary/5 transition-all text-center truncate">
                {d.domain}
              </div>
            </Link>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-3 text-center">
          {domainTrainings.length} specialized domains · Apply your skills to real industries
        </p>
      </section>
    </div>
  );
}
