"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Brain, Factory, Database, Cpu,
  Flame, Target, Zap, Star, Medal, Trophy, BookOpen, Code,
  CheckCircle2, Lock, ArrowRight, PlayCircle,
  StickyNote, FlaskConical, CalendarDays, TrendingUp, ChevronRight,
  NotebookPen,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useProgress } from "@/lib/progress-context";
import { tracks, getTotalLessons } from "@/lib/course-data";

/* ── meta ── */
type TrackMeta = { icon: React.ComponentType<{ className?: string }>; gradient: string; bar: string; text: string; dot: string };
const trackMeta: Record<string, TrackMeta> = {
  "ai-engineer":    { icon: Brain,    gradient: "from-violet-600 to-purple-600", bar: "bg-violet-500",  text: "text-violet-400",  dot: "bg-violet-500" },
  "mlops-engineer": { icon: Factory,  gradient: "from-orange-500 to-amber-500",  bar: "bg-orange-500",  text: "text-orange-400",  dot: "bg-orange-500" },
  "data-engineer":  { icon: Database, gradient: "from-cyan-500 to-blue-600",     bar: "bg-cyan-500",    text: "text-cyan-400",    dot: "bg-cyan-500" },
  "edge-ai":        { icon: Cpu,      gradient: "from-emerald-500 to-teal-600",  bar: "bg-emerald-500", text: "text-emerald-400", dot: "bg-emerald-500" },
};

/* ── utils ── */
function fmt(ts: number) {
  return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
function fmtTime(ts: number) {
  return new Date(ts).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}
function sameDay(a: number, b: number) {
  return new Date(a).toDateString() === new Date(b).toDateString();
}

function getAchievements(total: number, steps: number, avgScore: number | null, pct: number) {
  const r = [];
  if (total >= 1)  r.push({ icon: Star,    label: "First Lesson",     color: "text-amber-400" });
  if (total >= 5)  r.push({ icon: BookOpen, label: "On a Roll",        color: "text-sky-400" });
  if (total >= 10) r.push({ icon: Target,   label: "Getting Serious",  color: "text-violet-400" });
  if (steps >= 10) r.push({ icon: Code,     label: "Code Warrior",     color: "text-emerald-400" });
  if (steps >= 25) r.push({ icon: Zap,      label: "Speed Coder",      color: "text-cyan-400" });
  if (avgScore !== null && avgScore >= 90) r.push({ icon: Trophy, label: "Quiz Master", color: "text-orange-400" });
  if (pct >= 25)   r.push({ icon: Flame,    label: "Quarter Done",     color: "text-rose-400" });
  if (pct >= 50)   r.push({ icon: Medal,    label: "Halfway Hero",     color: "text-purple-400" });
  if (pct >= 100)  r.push({ icon: Trophy,   label: "Complete",         color: "text-amber-400" });
  return r;
}

/* ── page ── */
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
  const stepsCount = completedSteps.size;
  const quizKeys = Object.keys(quizScores);
  const avgQuiz = quizKeys.length > 0
    ? Math.round(quizKeys.reduce((a, k) => a + quizScores[k], 0) / quizKeys.length)
    : null;
  const pct = totalLessons > 0 ? Math.round((totalCompleted / totalLessons) * 100) : 0;
  const streak = getStudyStreak();
  const weekCount = getLessonsThisWeek();
  const hours = getFlightHours();
  const rank = getGlobalRank();
  const activity = getDailyActivity(14);
  const log = getActivityLog();
  const achievements = getAchievements(totalCompleted, stepsCount, avgQuiz, pct);
  const today = Date.now();
  const todayCount = activity[activity.length - 1]?.count ?? 0;
  const maxBar = Math.max(...activity.map((d) => d.count), 1);
  const remaining = totalLessons - totalCompleted;
  const weeksLeft = weekCount > 0 ? Math.ceil(remaining / weekCount) : null;

  const nextLesson = useMemo(() => {
    for (const track of tracks) {
      if (!isTrackUnlocked(track.id)) continue;
      for (const mod of track.modules) {
        const lesson = mod.lessons[0];
        const key = `${track.id}-${lesson.id}`;
        if (!quizScores[key] || quizScores[key] < 70) return { track, mod, lesson, key };
      }
    }
    return null;
  }, [quizScores, isTrackUnlocked]);

  const groupedLog = useMemo(() => {
    const groups: { label: string; entries: typeof log }[] = [];
    log.forEach((entry) => {
      const label = sameDay(entry.timestamp, today) ? "Today"
        : sameDay(entry.timestamp, today - 86400000) ? "Yesterday"
        : fmt(entry.timestamp);
      const g = groups.find((g) => g.label === label);
      if (g) g.entries.push(entry); else groups.push({ label, entries: [entry] });
    });
    return groups;
  }, [log, today]);

  if (loading || !user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const dateStr = new Date().toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric",
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">

      {/* ── Header ── */}
      <div className="mb-8">
        <p className="text-xs text-muted-foreground font-mono tracking-wide mb-1">{dateStr}</p>
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2.5">
            <NotebookPen className="h-6 w-6 text-primary shrink-0" />
            Learning Diary
          </h1>
          <div className="text-right shrink-0">
            <p className="text-sm font-semibold">{user.username}</p>
            <p className="text-xs text-muted-foreground">{rank}</p>
          </div>
        </div>
      </div>

      {/* ── 4-stat row ── */}
      <div className="grid grid-cols-4 gap-px rounded-xl border border-border/50 bg-border/30 overflow-hidden mb-6">
        {[
          { icon: Flame,        value: streak,      unit: "day streak",  color: "text-rose-400" },
          { icon: CalendarDays, value: todayCount,  unit: "today",       color: "text-sky-400" },
          { icon: TrendingUp,   value: weekCount,   unit: "this week",   color: "text-violet-400" },
          { icon: CheckCircle2, value: `${pct}%`,   unit: "complete",    color: "text-emerald-400" },
        ].map(({ icon: Icon, value, unit, color }) => (
          <div key={unit} className="bg-background flex flex-col items-center justify-center py-4 px-1 gap-1">
            <Icon className={`h-4 w-4 ${color}`} />
            <p className="text-lg font-bold leading-none">{value}</p>
            <p className="text-[10px] text-muted-foreground text-center">{unit}</p>
          </div>
        ))}
      </div>

      {/* ── Today's Mission ── */}
      {(lastVisited || nextLesson) && (
        <div className="rounded-xl border border-primary/25 bg-primary/5 px-4 py-4 flex items-center justify-between gap-4 mb-6">
          <div className="min-w-0">
            <p className="text-xs text-primary/70 font-medium mb-0.5">
              {lastVisited ? "Resume" : "Up next"}
            </p>
            <p className="font-semibold leading-snug truncate">
              {lastVisited ? lastVisited.lessonTitle : nextLesson!.lesson.title}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {lastVisited ? lastVisited.trackTitle : `${nextLesson!.track.shortTitle} · ${nextLesson!.mod.title}`}
            </p>
          </div>
          <Link
            href={lastVisited
              ? `/tracks/${lastVisited.trackId}/${lastVisited.moduleId}/${lastVisited.lessonId}`
              : `/tracks/${nextLesson!.track.id}/${nextLesson!.mod.id}/${nextLesson!.lesson.id}`}
            className="shrink-0"
          >
            <Button size="sm" className="gap-2">
              {lastVisited ? <><PlayCircle className="h-4 w-4" />Resume</> : <>Start <ArrowRight className="h-4 w-4" /></>}
            </Button>
          </Link>
        </div>
      )}

      {/* ── Learning Path ── */}
      <section className="mb-7">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Learning Path</h2>
        <div className="space-y-3.5">
          {tracks.map((track) => {
            const meta = trackMeta[track.id];
            const Icon = meta?.icon ?? Brain;
            const progress = getTrackProgress(track.id);
            const unlocked = isTrackUnlocked(track.id);
            const total = track.modules.reduce((a, m) => a + m.lessons.length, 0);
            const done = Math.round((progress / 100) * total);
            return (
              <div key={track.id} className={`flex items-center gap-3 ${!unlocked ? "opacity-40" : ""}`}>
                <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${meta?.gradient}`}>
                  <Icon className="h-3.5 w-3.5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{track.shortTitle}</span>
                    <span className="text-xs text-muted-foreground font-mono shrink-0 ml-2">{done}/{total}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted/40 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${meta?.bar ?? "bg-primary"} transition-all duration-700`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
                <div className="shrink-0 w-10 text-right">
                  {unlocked ? (
                    <Link href={`/tracks/${track.id}`}>
                      <ChevronRight className={`h-4 w-4 ${meta?.text ?? "text-primary"} ml-auto`} />
                    </Link>
                  ) : (
                    <Lock className="h-3.5 w-3.5 text-muted-foreground ml-auto" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <Separator className="mb-7" />

      {/* ── Activity + Achievements row ── */}
      <div className="grid sm:grid-cols-2 gap-6 mb-7">

        {/* Bar chart */}
        <div>
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">14-Day Activity</h2>
            <span className="text-xs text-muted-foreground">
              {weeksLeft !== null
                ? `~${weeksLeft}w to finish`
                : remaining === 0 ? "Done! 🎉" : "—"}
            </span>
          </div>
          <div className="flex items-end gap-0.5 h-20">
            {activity.map((day) => {
              const isToday = sameDay(Date.parse(day.date), today);
              const barH = day.count === 0 ? 3 : Math.max(10, Math.round((day.count / maxBar) * 100));
              return (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex items-end h-16">
                    <div
                      className={`w-full rounded-sm transition-all ${
                        day.count === 0 ? "bg-muted/25" : isToday ? "bg-primary" : "bg-primary/45 hover:bg-primary/65"
                      }`}
                      style={{ height: `${barH}%` }}
                    />
                  </div>
                  {(isToday || day.date === activity[0].date) && (
                    <span className={`text-[8px] font-mono ${isToday ? "text-primary" : "text-muted-foreground"}`}>
                      {isToday ? "today" : day.label}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[9px] text-muted-foreground font-mono">{activity[0]?.label}</span>
            <span className="text-[9px] text-muted-foreground font-mono">{hours.toFixed(1)} flight hrs</span>
          </div>
        </div>

        {/* Achievements */}
        <div>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
            Achievements <span className="text-foreground/60">({achievements.length})</span>
          </h2>
          {achievements.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {achievements.map((b) => {
                const Icon = b.icon;
                return (
                  <span key={b.label} className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-muted/30 border border-border/50 ${b.color}`}>
                    <Icon className="h-3 w-3 shrink-0" />{b.label}
                  </span>
                );
              })}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border/40 px-4 py-6 text-center">
              <Medal className="h-6 w-6 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">Complete a lesson to earn your first badge</p>
            </div>
          )}
          {avgQuiz !== null && (
            <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground border-t border-border/30 pt-3">
              <span>Avg quiz score</span>
              <span className={`font-mono font-semibold ${avgQuiz >= 70 ? "text-emerald-400" : "text-amber-400"}`}>{avgQuiz}%</span>
            </div>
          )}
        </div>
      </div>

      <Separator className="mb-7" />

      {/* ── Lesson Log ── */}
      <section className="pb-4">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4">Lesson Log</h2>
        {groupedLog.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/40 px-4 py-8 text-center">
            <BookOpen className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Your completed lessons will appear here</p>
          </div>
        ) : (
          <div className="space-y-5">
            {groupedLog.map(({ label, entries }) => (
              <div key={label}>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">{label}</p>
                <div className="space-y-1.5">
                  {entries.map((entry) => {
                    const meta = trackMeta[entry.trackId];
                    return (
                      <div key={entry.lessonKey} className="flex items-center gap-3 py-2 border-b border-border/20 last:border-0">
                        <div className={`h-2 w-2 rounded-full shrink-0 ${meta?.dot ?? "bg-primary"}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm leading-snug truncate">{entry.lessonTitle}</p>
                          <p className={`text-xs ${meta?.text ?? "text-primary"}`}>{entry.trackTitle}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {entry.quizScore !== undefined && (
                            <span className={`text-xs font-mono ${entry.quizScore >= 70 ? "text-emerald-400" : "text-amber-400"}`}>
                              {entry.quizScore}%
                            </span>
                          )}
                          {entry.hasProof && <FlaskConical className="h-3 w-3 text-sky-400" />}
                          {entry.hasNotes && <StickyNote className="h-3 w-3 text-amber-400" />}
                          <span className="text-[10px] text-muted-foreground font-mono w-12 text-right">{fmtTime(entry.timestamp)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
