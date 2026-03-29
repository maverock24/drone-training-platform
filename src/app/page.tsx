"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Brain,
  Factory,
  Database,
  Cpu,
  Flame,
  ArrowRight,
  BookOpen,
  Clock,
  Target,
  Zap,
  Shield,
  Layers,
} from "lucide-react";
import { tracks, getTotalLessons, getTotalDuration } from "@/lib/course-data";
import { useProgress } from "@/lib/progress-context";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Brain,
  Factory,
  Database,
  Cpu,
};

const features = [
  {
    icon: Target,
    title: "Role-Based Learning",
    description: "Four specialized tracks aligned to real 2026 job roles in autonomous drone systems.",
  },
  {
    icon: Zap,
    title: "Hands-On Labs",
    description: "Every lesson includes practical exercises with real tools, SDKs, and frameworks.",
  },
  {
    icon: Shield,
    title: "Production-Ready Skills",
    description: "Go beyond theory — learn deployment, optimization, and monitoring for real systems.",
  },
  {
    icon: Layers,
    title: "Grand Project",
    description: "Tie all four tracks together by building an Autonomous Forest Fire Detection System.",
  },
];

export default function HomePage() {
  const { getTrackProgress, totalCompleted } = useProgress();
  const totalLessons = getTotalLessons();
  const totalDuration = getTotalDuration();

  return (
    <div className="relative">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/40">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-950/20 via-background to-cyan-950/20" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-600/10 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:py-40">
          <div className="text-center">
            <Badge variant="secondary" className="mb-6 px-4 py-1.5 text-sm">
              <Flame className="mr-2 h-3.5 w-3.5 text-orange-500" />
              2026 Curriculum
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
              Master{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-500 via-cyan-500 to-emerald-500">
                Drone AI
              </span>
              <br />
              Engineering
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">
              Go beyond knowing the tools to{" "}
              <span className="text-foreground font-medium">engineering the systems</span>.
              Four specialized tracks covering AI, MLOps, Data Engineering, and Edge AI for autonomous drones.
            </p>
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link href="/tracks/ai-engineer">
                <Button size="lg" className="gap-2 text-base px-8">
                  Start Learning
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/grand-project">
                <Button variant="outline" size="lg" className="gap-2 text-base px-8">
                  <Flame className="h-4 w-4 text-orange-500" />
                  View Grand Project
                </Button>
              </Link>
            </div>
            <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                <span>{totalLessons} Lessons</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>{totalDuration} Content</span>
              </div>
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                <span>4 Career Tracks</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      {totalCompleted > 0 && (
        <section className="border-b border-border/40 bg-muted/30">
          <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm font-medium">
                Your Progress: {totalCompleted} / {totalLessons} lessons completed
              </p>
              <Progress
                value={(totalCompleted / totalLessons) * 100}
                className="max-w-xs"
              />
            </div>
          </div>
        </section>
      )}

      {/* Features */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight">
            Why This Platform?
          </h2>
          <p className="mt-3 text-muted-foreground">
            Structured, practical training designed for 2026 drone industry demands.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <Card key={f.title} className="border-border/50 bg-card/50">
                <CardHeader className="pb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 mb-2">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-base">{f.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{f.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Tracks */}
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight">
            Learning Tracks
          </h2>
          <p className="mt-3 text-muted-foreground">
            Choose your specialization path or complete all four to master the full stack.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          {tracks.map((track) => {
            const Icon = iconMap[track.icon];
            const progress = getTrackProgress(track.id);
            const lessonCount = track.modules.reduce(
              (acc, m) => acc + m.lessons.length,
              0
            );
            const duration = track.modules.reduce(
              (acc, m) =>
                acc + m.lessons.reduce((a, l) => a + parseInt(l.duration), 0),
              0
            );

            return (
              <Link key={track.id} href={`/tracks/${track.id}`}>
                <Card className="group relative overflow-hidden border-border/50 bg-card/50 transition-all hover:border-border hover:shadow-lg hover:shadow-primary/5 h-full">
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${track.gradient} opacity-0 group-hover:opacity-5 transition-opacity`}
                  />
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div
                        className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${track.gradient}`}
                      >
                        {Icon && <Icon className="h-6 w-6 text-white" />}
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {track.modules.length} Modules
                      </Badge>
                    </div>
                    <CardTitle className="mt-4 text-xl">{track.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      {track.description}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                      <span className="flex items-center gap-1">
                        <BookOpen className="h-3.5 w-3.5" />
                        {lessonCount} lessons
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {duration}h
                      </span>
                    </div>
                    {progress > 0 && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span>Progress</span>
                          <span>{progress}%</span>
                        </div>
                        <Progress value={progress} className="h-1.5" />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Grand Project CTA */}
        <div className="mt-12">
          <Link href="/grand-project">
            <Card className="group relative overflow-hidden border-orange-500/20 bg-gradient-to-br from-orange-950/20 to-red-950/20 transition-all hover:border-orange-500/40 hover:shadow-lg hover:shadow-orange-500/5">
              <CardContent className="flex flex-col items-center py-10 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-600 to-red-600 mb-4">
                  <Flame className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-2">
                  The 2026 Grand Project
                </h3>
                <p className="text-muted-foreground max-w-lg mb-6">
                  Autonomous Forest Fire Detection System — tie all four tracks together in one massive capstone project.
                </p>
                <Button variant="outline" className="gap-2 border-orange-500/30 hover:bg-orange-500/10">
                  Explore the Grand Project
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </Link>
        </div>
      </section>
    </div>
  );
}