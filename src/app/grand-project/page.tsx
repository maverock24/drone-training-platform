"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Brain,
  Factory,
  Database,
  Cpu,
  Flame,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  TreePine,
  Thermometer,
  Radar,
  RotateCcw,
} from "lucide-react";
import { grandProject } from "@/lib/course-data";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Brain,
  Factory,
  Database,
  Cpu,
};

const phaseIcons = [Thermometer, Radar, TreePine, RotateCcw];

export default function GrandProjectPage() {
  return (
    <div className="relative">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/40">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-950/20 via-background to-red-950/20" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-orange-600/10 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-24">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2 mb-8 -ml-2">
              <ArrowLeft className="h-4 w-4" />
              All Tracks
            </Button>
          </Link>
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-600 to-red-600">
                <Flame className="h-8 w-8 text-white" />
              </div>
            </div>
            <Badge variant="secondary" className="mb-4 px-4 py-1 text-sm">
              Capstone Project
            </Badge>
            <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
              {grandProject.title}
            </h1>
            <h2 className="mt-3 text-xl text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-500 font-semibold sm:text-2xl">
              {grandProject.subtitle}
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
              {grandProject.description}
            </p>
          </div>
        </div>
      </section>

      {/* Workflow diagram */}
      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
        <div className="text-center mb-12">
          <h3 className="text-2xl font-bold">System Architecture</h3>
          <p className="mt-2 text-muted-foreground">
            Four tracks converge into a single autonomous system
          </p>
        </div>

        {/* Flow visualization */}
        <div className="relative">
          {/* Connection lines - visible on md+ */}
          <div className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-600 via-violet-600 via-orange-600 to-cyan-600 opacity-20 -translate-y-1/2" />

          <div className="grid gap-6 md:grid-cols-4">
            {grandProject.phases.map((phase, idx) => {
              const TrackIcon = iconMap[phase.icon];
              const PhaseIcon = phaseIcons[idx];

              return (
                <div key={idx} className="relative">
                  <Card className="border-border/50 bg-card/80 h-full">
                    <CardHeader className="pb-3 text-center">
                      <div className="flex justify-center mb-2">
                        <div className="relative">
                          <div
                            className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${phase.color}`}
                          >
                            {PhaseIcon && (
                              <PhaseIcon className="h-7 w-7 text-white" />
                            )}
                          </div>
                          <div className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-background border-2 border-border text-xs font-bold">
                            {idx + 1}
                          </div>
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className="mx-auto w-fit text-xs mb-1"
                      >
                        {phase.track}
                      </Badge>
                      <CardTitle className="text-base">{phase.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center">
                      <p className="text-xs text-muted-foreground mb-4">
                        {phase.description}
                      </p>
                    </CardContent>
                  </Card>
                  {idx < grandProject.phases.length - 1 && (
                    <div className="hidden md:flex absolute top-1/2 -right-3 -translate-y-1/2 z-10">
                      <ArrowRight className="h-5 w-5 text-muted-foreground/30" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <Separator className="mx-auto max-w-5xl" />

      {/* Detailed phases */}
      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
        <div className="text-center mb-12">
          <h3 className="text-2xl font-bold">Phase Breakdown</h3>
          <p className="mt-2 text-muted-foreground">
            Detailed tasks for each phase of the grand project
          </p>
        </div>

        <div className="space-y-8">
          {grandProject.phases.map((phase, idx) => {
            const TrackIcon = iconMap[phase.icon];

            return (
              <Card key={idx} className="border-border/50 overflow-hidden">
                <div className={`h-1 bg-gradient-to-r ${phase.color}`} />
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${phase.color}`}
                    >
                      {TrackIcon && (
                        <TrackIcon className="h-6 w-6 text-white" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">
                          Phase {idx + 1}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {phase.track}
                        </Badge>
                      </div>
                      <CardTitle className="text-xl">{phase.title}</CardTitle>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {phase.description}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {phase.tasks.map((task, taskIdx) => (
                      <div
                        key={taskIdx}
                        className="flex items-start gap-3 rounded-lg border border-border/30 bg-muted/20 p-3"
                      >
                        <CheckCircle2 className="h-5 w-5 shrink-0 text-muted-foreground/30 mt-0.5" />
                        <p className="text-sm">{task}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-4xl px-4 pb-16 sm:px-6">
        <Card className="border-border/50 bg-gradient-to-br from-background to-muted/50">
          <CardContent className="flex flex-col items-center py-10 text-center">
            <h3 className="text-xl font-bold mb-2">
              Ready to Build This?
            </h3>
            <p className="text-muted-foreground max-w-md mb-6">
              Start with any track to begin building the skills needed for the
              Grand Project.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link href="/tracks/ai-engineer">
                <Button variant="outline" size="sm" className="gap-2">
                  <Brain className="h-4 w-4" />
                  AI Engineer
                </Button>
              </Link>
              <Link href="/tracks/mlops-engineer">
                <Button variant="outline" size="sm" className="gap-2">
                  <Factory className="h-4 w-4" />
                  MLOps
                </Button>
              </Link>
              <Link href="/tracks/data-engineer">
                <Button variant="outline" size="sm" className="gap-2">
                  <Database className="h-4 w-4" />
                  Data
                </Button>
              </Link>
              <Link href="/tracks/edge-ai-engineer">
                <Button variant="outline" size="sm" className="gap-2">
                  <Cpu className="h-4 w-4" />
                  Edge AI
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
