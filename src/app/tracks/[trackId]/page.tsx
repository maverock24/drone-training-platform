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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
} from "lucide-react";
import { tracks } from "@/lib/course-data";
import { useProgress } from "@/lib/progress-context";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Brain,
  Factory,
  Database,
  Cpu,
};

const difficultyColors = {
  beginner: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  intermediate: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  advanced: "bg-red-500/10 text-red-500 border-red-500/20",
};

export default function TrackPage({
  params,
}: {
  params: Promise<{ trackId: string }>;
}) {
  const { trackId } = use(params);
  const track = tracks.find((t) => t.id === trackId);
  const { isCompleted, toggleLesson, getTrackProgress } = useProgress();

  if (!track) {
    notFound();
  }

  const Icon = iconMap[track.icon];
  const progress = getTrackProgress(track.id);
  const totalLessons = track.modules.reduce(
    (acc, m) => acc + m.lessons.length,
    0
  );
  const totalDuration = track.modules.reduce(
    (acc, m) =>
      acc + m.lessons.reduce((a, l) => a + parseInt(l.duration), 0),
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
              <Clock className="h-4 w-4" />
              {totalDuration}h total
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              {completedCount} completed
            </span>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <Card className="mb-8 border-border/50">
        <CardContent className="py-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="font-medium">Track Progress</span>
            <span className="text-muted-foreground">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </CardContent>
      </Card>

      {/* Modules */}
      <div className="space-y-6">
        {track.modules.map((module, moduleIdx) => {
          const moduleCompleted = module.lessons.filter((l) =>
            isCompleted(`${track.id}-${l.id}`)
          ).length;

          return (
            <Card key={module.id} className="border-border/50 overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-sm font-bold">
                      {moduleIdx + 1}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{module.title}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {module.description}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs shrink-0">
                    {moduleCompleted}/{module.lessons.length}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-2">
                <Accordion multiple className="w-full">
                  {module.lessons.map((lesson, lessonIdx) => {
                    const lessonKey = `${track.id}-${lesson.id}`;
                    const completed = isCompleted(lessonKey);

                    return (
                      <AccordionItem
                        key={lesson.id}
                        value={lesson.id}
                        className="border-border/30"
                      >
                        <AccordionTrigger className="hover:no-underline py-3">
                          <div className="flex items-center gap-3 text-left">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleLesson(lessonKey);
                              }}
                              className="shrink-0"
                            >
                              {completed ? (
                                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                              ) : (
                                <Circle className="h-5 w-5 text-muted-foreground/40" />
                              )}
                            </button>
                            <div className="min-w-0">
                              <span
                                className={`text-sm font-medium ${
                                  completed
                                    ? "line-through text-muted-foreground"
                                    : ""
                                }`}
                              >
                                {lesson.title}
                              </span>
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="pl-8 pb-2">
                            <p className="text-sm text-muted-foreground mb-3">
                              {lesson.description}
                            </p>
                            <div className="flex items-center gap-3">
                              <Badge
                                variant="outline"
                                className={`text-xs ${
                                  difficultyColors[lesson.difficulty]
                                }`}
                              >
                                {lesson.difficulty}
                              </Badge>
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                {lesson.duration}
                              </span>
                              <Button
                                size="sm"
                                variant={completed ? "outline" : "default"}
                                className="ml-auto gap-1.5 text-xs h-7"
                                onClick={() => toggleLesson(lessonKey)}
                              >
                                {completed ? (
                                  "Mark Incomplete"
                                ) : (
                                  <>
                                    Mark Complete
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              </CardContent>
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
