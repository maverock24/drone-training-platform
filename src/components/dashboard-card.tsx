"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import { CircularProgress } from "@/components/circular-progress";

interface DashboardCardProps {
  trackId: string;
  trackTitle: string;
  shortTitle: string;
  icon: React.ReactNode;
  gradient: string;
  ringColor: string;
  progress: number;
  totalLessons: number;
  completedLessons: number;
  lastLessonPath?: string;
}

export function DashboardCard({
  trackId,
  trackTitle,
  shortTitle,
  icon,
  gradient,
  ringColor,
  progress,
  totalLessons,
  completedLessons,
  lastLessonPath,
}: DashboardCardProps) {
  return (
    <Card className="border-border/50 hover:border-primary/30 transition-all group">
      <CardContent className="py-4 px-4">
        <div className="flex items-center gap-4">
          <CircularProgress value={progress} size={64} strokeWidth={6} color={ringColor}>
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br ${gradient} group-hover:scale-110 transition-transform duration-300`}
            >
              {icon}
            </div>
          </CircularProgress>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{shortTitle}</p>
            <p className="text-xs text-muted-foreground">
              {completedLessons}/{totalLessons} lessons · {progress}%
            </p>
          </div>
          <Link href={lastLessonPath || `/tracks/${trackId}`} className="shrink-0">
            <Button variant="ghost" size="sm" className="gap-1">
              {progress > 0 ? "Continue" : "Start"}
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
