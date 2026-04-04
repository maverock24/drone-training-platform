"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CircularProgress } from "@/components/circular-progress";
import {
  Brain, Factory, Database, Cpu,
  Flame, Target, Zap, Star, Medal, Trophy, BookOpen, Code,
  CheckCircle2, HelpCircle, Lock, ArrowRight, PlayCircle,
  StickyNote, FlaskConical, CalendarDays, TrendingUp, ChevronRight,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useProgress } from "@/lib/progress-context";
import { tracks, getTotalLessons } from "@/lib/course-data";

/* ──────────────── helpers ──────────────── */

const trackMeta: Record<string, { icon: React.ComponentType<{ className?: string }>; gradient: string; ring: string; text: string; bg: string }> = {
  "ai-engineer":    { icon: Brain,   gradient: "from-violet-600 to-purple-600", ring: "stroke-violet-500",  text: "text-violet-400",  bg: "bg-violet-500/10 border-violet-500/30" },
  "mlops-engineer": { icon: Factory, gradient: "from-orange-600 to-amber-600",  ring: "stroke-orange-500",  text: "text-orange-400",  bg: "bg-orange-500/10 border-orange-500/30" },
  "data-engineer":  { icon: Database,gradient: "from-cyan-600 to-blue-600",     ring: "stroke-cyan-500",    text: "text-cyan-400",    bg: "bg-cyan-500/10 border-cyan-500/30" },
  "edge-ai":        { icon: Cpu,     gradient: "from-emerald-600 to-teal-600",  ring: "stroke-emerald-500", text: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/30" },
};

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

function isSameDay(ts: number, ref: number) {
  return new Date(ts).toDateString() === new Date(ref).toDateString();
}

function getAchievements(total: number, steps: number, avgScore: number | null, pct: number) {
  const badges = [];
  if (total >= 1)  badges.push({ icon: Star,     label: "First Lesson",        color: "text-amber-400",   bg: "bg-amber-500/10 border-amber-500/30" });
  if (total >= 5)  badges.push({ icon: BookOpen,  label: "On a Roll",           color: "text-sky-400",     bg: "bg-sky-500/10 border-sky-500/30" });
  if (total >= 10) badges.push({ icon: Target,    label: "Getting Serious",     color: "text-violet-400",  bg: "bg-violet-500/10 border-violet-500/30" });
  if (steps >= 10) badges.push({ icon: Code,      label: "Code Warrior",        color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/30" });
  if (steps >= 25) badges.push({ icon: Zap,       label: "Speed Coder",         color: "text-cyan-400",    bg: "bg-cyan-500/10 border-cyan-500/30" });
  if (avgScore !== null && avgScore >= 90)
                   badges.push({ icon: Trophy,    label: "Quiz Master",         color: "text-orange-400",  bg: "bg-orange-500/10 border-orange-500/30" });
  if (pct >= 25)   badges.push({ icon: Flame,     label: "Quarter Done",        color: "text-rose-400",    bg: "bg-rose-500/10 border-rose-500/30" });
  if (pct >= 50)   badges.push({ icon: Medal,     label: "Halfway Hero",        color: "text-purple-400",  bg: "bg-purple-500/10 border-purple-500/30" });
  if (pct >= 100)  badges.push({ icon: Trophy,    label: "Curriculum Complete", color: "text-amber-400",   bg: "bg-amber-500/10 border-amber-500/30" });
  return badges;
}

/* ──────────────── main page ──────────────── */

export default function DiaryPage() {
  const { user, loading } = useAuth();
  const {
    totalCompleted, completedSteps, quizScores, lastVisited,
    getFlightHours, getGlobalRank, getTrackProgress,
    getStudyStreak, getLessonsThisWeek, getDailyActivity, getActivityLog,
    isTrackUnlocked,
  } = useProgress();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  const totalLessons = getTotalLessons();
  const completedStepsCount = completedSteps.size;
  const completedQuizzes = Object.keys(quizScores).length;
  const avgQuizScore = completedQuizzes > 0
    ? Math.round(Object.values(quizScores).reduce((a, b) => a + b, 0) / completedQuizzes)
    : null;
  const overallProgress = totalLessons > 0 ? Math.round((totalCompleted / totalLessons) * 100) : 0;
  const streak = getStudyStreak();
  const lessonsThisWeek = getLessonsThisWeek();
  const flightHours = getFlightHours();
  const rank = getGlobalRank();
  const dailyActivity = getDailyActivity(14);
  const activityLog = getActivityLog();
  const achievements = getAchievements(totalCompleted, completedStepsCount, avgQuizScore, overallProgress);

  // Today's lessons completed
  const today = Date.now();
  const todayCount = dailyActivity[dailyActivity.length - 1]?.count ?? 0;

  // Next recommended lesson
  const nextLesson = useMemo(() => {
    for (const track of tracks) {
      if (!isTrackUnlocked(track.id)) continue;
      for (const mod of track.modules) {
        const lesson = mod.lessons[0];
        const key = `${track.id}-${lesson.id}`;
        if (!quizScores[key] || quizScores[key] < 70) {
          return { track, mod, lesson, key };
        }
      }
    }
    return null;
  }, [quizScores, isTrackUnlocked]);

  // Pace estimate
  const weeklyPace = lessonsThisWeek > 0 ? lessonsThisWeek : 0;
  const remaining = totalLessons - totalCompleted;
  const weeksLeft = weeklyPace > 0 ? Math.ceil(remaining / weeklyPace) : null;

  // Bar chart
  const maxBarCount = Math.max(...dailyActivity.map((d) => d.count), 1);

  // Group log by date label
  const groupedLog = useMemo(() => {
    const groups: { label: string; entries: typeof activityLog }[] = [];
    activityLog.forEach((entry) => {
      const label = isSameDay(entry.timestamp, today)
        ? "Today"
        : isSameDay(entry.timestamp, today - 86400000)
        ? "Yesterday"
        : formatDate(entry.timestamp);
      const existing = groups.find((g) => g.label === label);
      if (existing) existing.entries.push(entry);
      else groups.push({ label, entries: [entry] });
    });
    return groups;
  }, [activityLog, today]);

  if (loading || !user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const todayStr = new Date().toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 space-y-6">

      {/* ── Header ── */}
      <div className="rounded-2xl border border-border/50 bg-gradient-to-br from-violet-950/40 via-background to-cyan-950/20 px-6 py-6">
        <p className="text-xs text-muted-foreground font-mono mb-1">{todayStr}</p>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          {user.username}&apos;s <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-400">Learning Diary</span>
        </h1>
        <div className="flex flex-wrap items-center gap-2 mt-3">
          <Badge variant="outline" className="text-xs font-mono bg-violet-950/30 text-violet-300 border-violet-800">
            {rank}
          </Badge>
          <Badge variant="outline" className="text-xs font-mono bg-cyan-950/30 text-cyan-400 border-cyan-800">
            {flightHours.toFixed(1)} flight hrs
          </Badge>
          <Badge variant="outline" className="text-xs font-mono bg-emerald-950/30 text-emerald-400 border-emerald-800">
            {overallProgress}% curriculum complete
          </Badge>
        </div>
      </div>

      {/* ── Pulse stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: Flame,        value: streak,            unit: streak === 1 ? "day" : "days",   label: "Study Streak",    color: "text-rose-400",    iconBg: "bg-rose-500/10" },
          { icon: CalendarDays, value: todayCount,        unit: "lessons",                        label: "Completed Today", color: "text-sky-400",     iconBg: "bg-sky-500/10" },
          { icon: TrendingUp,   value: lessonsThisWeek,   unit: "lessons",                        label: "This Week",       color: "text-violet-400",  iconBg: "bg-violet-500/10" },
          { icon: CheckCircle2, value: totalCompleted,    unit: `/ ${totalLessons}`,              label: "Total Lessons",   color: "text-emerald-400", iconBg: "bg-emerald-500/10" },
        ].map(({ icon: Icon, value, unit, label, color, iconBg }) => (
          <Card key={label} className="border-border/50">
            <CardContent className="py-4 flex flex-col items-center text-center gap-1">
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${iconBg} mb-1`}>
                <Icon className={`h-4 w-4 ${color}`} />
              </div>
              <p className="text-xl font-bold">{value} <span className="text-xs font-normal text-muted-foreground">{unit}</span></p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Today's Mission ── */}
      <Card className="border-primary/30 bg-gradient-to-r from-primary/5 to-primary/10">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" /> Today&apos;s Mission
          </CardTitle>
        </CardHeader>
        <CardContent>
          {lastVisited ? (
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Resume where you left off</p>
                <p className="font-semibold">{lastVisited.lessonTitle}</p>
                <p className="text-xs text-muted-foreground">{lastVisited.trackTitle}</p>
              </div>
              <Link href={`/tracks/${lastVisited.trackId}/${lastVisited.moduleId}/${lastVisited.lessonId}`} className="shrink-0">
                <Button size="sm" className="gap-2"><PlayCircle className="h-4 w-4" /> Resume</Button>
              </Link>
            </div>
          ) : nextLesson ? (
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Recommended next</p>
                <p className="font-semibold">{nextLesson.lesson.title}</p>
                <p className="text-xs text-muted-foreground">{nextLesson.track.shortTitle} · {nextLesson.mod.title}</p>
              </div>
              <Link href={`/tracks/${nextLesson.track.id}/${nextLesson.mod.id}/${nextLesson.lesson.id}`} className="shrink-0">
                <Button size="sm" className="gap-2">Start <ArrowRight className="h-4 w-4" /></Button>
              </Link>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">🎉 You&apos;ve completed all available lessons!</p>
          )}
        </CardContent>
      </Card>

      {/* ── Learning Path ── */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Learning Path</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {tracks.map((track) => {
            const meta = trackMeta[track.id];
            const Icon = meta?.icon ?? Brain;
            const progress = getTrackProgress(track.id);
            const unlocked = isTrackUnlocked(track.id);
            const lessonCount = track.modules.reduce((a, m) => a + m.lessons.length, 0);
            const done = Math.round((progress / 100) * lessonCount);
            return (
              <div key={track.id} className={`flex items-center gap-4 ${!unlocked ? "opacity-50" : ""}`}>
                <CircularProgress value={progress} size={52} strokeWidth={6} color={meta?.ring ?? "stroke-primary"}>
                  <Icon className={`h-5 w-5 ${meta?.text ?? "text-primary"}`} />
                </CircularProgress>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-sm font-medium">{track.shortTitle}</p>
                    <div className="flex items-center gap-2 shrink-0">
                      {!unlocked && <Lock className="h-3.5 w-3.5 text-muted-foreground" />}
                      <span className={`text-xs font-mono ${meta?.text ?? "text-primary"}`}>{progress}%</span>
                      <span className="text-xs text-muted-foreground">{done}/{lessonCount}</span>
                    </div>
                  </div>
                  <div className="h-2 rounded-full bg-muted/50 overflow-hidden">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${meta?.gradient ?? "from-primary to-primary"} transition-all duration-700`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
                {unlocked && (
                  <Link href={`/tracks/${track.id}`} className="shrink-0">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </Link>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* ── Activity Pace ── */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">14-Day Activity</CardTitle>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">
                {weeklyPace} lesson{weeklyPace !== 1 ? "s" : ""}/week this week
              </p>
              {weeksLeft !== null ? (
                <p className="text-xs text-muted-foreground">~{weeksLeft} week{weeksLeft !== 1 ? "s" : ""} to complete</p>
              ) : remaining > 0 ? (
                <p className="text-xs text-muted-foreground">Start studying to get an estimate</p>
              ) : (
                <p className="text-xs text-emerald-400">Curriculum complete! 🎉</p>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-1 h-16">
            {dailyActivity.map((day) => {
              const heightPct = day.count === 0 ? 4 : Math.max(12, Math.round((day.count / maxBarCount) * 100));
              const isToday = isSameDay(Date.parse(day.date), today);
              return (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-1 group" title={`${day.date}: ${day.count} lesson${day.count !== 1 ? "s" : ""}`}>
                  <div className="w-full flex items-end justify-center h-12">
                    <div
                      className={`w-full rounded-t-sm transition-all ${
                        day.count === 0
                          ? "bg-muted/30"
                          : isToday
                          ? "bg-primary"
                          : "bg-primary/50 group-hover:bg-primary/70"
                      }`}
                      style={{ height: `${heightPct}%` }}
                    />
                  </div>
                  <span className={`text-[9px] font-mono ${isToday ? "text-primary font-bold" : "text-muted-foreground"}`}>
                    {day.label}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* ── Achievements ── */}
      <Card className={`border-border/50 ${achievements.length === 0 ? "border-dashed" : ""}`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Medal className="h-4 w-4 text-amber-400" /> Achievements ({achievements.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {achievements.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {achievements.map((badge) => {
                const Icon = badge.icon;
                return (
                  <div key={badge.label} className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium ${badge.bg} ${badge.color}`}>
                    <Icon className="h-3.5 w-3.5 shrink-0" />{badge.label}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Complete your first lesson to unlock achievement badges.</p>
          )}
        </CardContent>
      </Card>

      {/* ── Lesson Log ── */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <BookOpen className="h-4 w-4" /> Lesson Log
          </CardTitle>
        </CardHeader>
        <CardContent>
          {groupedLog.length === 0 ? (
            <p className="text-sm text-muted-foreground">No lessons completed yet. Start your first lesson to see your diary log here.</p>
          ) : (
            <div className="space-y-5">
              {groupedLog.map(({ label, entries }) => (
                <div key={label}>
                  <div className="flex items-center gap-2 mb-2">
                    <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</span>
                    <Separator className="flex-1" />
                  </div>
                  <div className="space-y-2">
                    {entries.map((entry) => {
                      const meta = trackMeta[entry.trackId];
                      return (
                        <div key={entry.lessonKey} className="flex items-center gap-3 rounded-lg border border-border/40 bg-muted/10 px-3 py-2.5">
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{entry.lessonTitle}</p>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                              <Badge variant="outline" className={`text-xs ${meta?.bg ?? ""} ${meta?.text ?? ""}`}>
                                {entry.trackTitle}
                              </Badge>
                              {entry.quizScore !== undefined && (
                                <span className={`text-xs font-mono ${entry.quizScore >= 70 ? "text-emerald-400" : "text-amber-400"}`}>
                                  Quiz {entry.quizScore}%
                                </span>
                              )}
                              {entry.hasProof && <FlaskConical className="h-3.5 w-3.5 text-sky-400" />}
                              {entry.hasNotes && <StickyNote className="h-3.5 w-3.5 text-amber-400" />}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-xs text-muted-foreground font-mono">{formatTime(entry.timestamp)}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />

      <div className="flex flex-wrap gap-3 justify-center pb-4">
        <Link href="/profile"><Button variant="outline" size="sm" className="gap-2">Full Profile <ChevronRight className="h-3.5 w-3.5" /></Button></Link>
        <Link href="/tracks/ai-engineer"><Button variant="outline" size="sm" className="gap-2">Browse Track <ChevronRight className="h-3.5 w-3.5" /></Button></Link>
      </div>
    </div>
  );
}
