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
  ExternalLink,
} from "lucide-react";
import { grandProject } from "@/lib/course-data";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Brain,
  Factory,
  Database,
  Cpu,
};

const trackColorMap: Record<string, string> = {
  "Data Engineer": "from-emerald-600 to-teal-600",
  "AI Engineer": "from-violet-600 to-purple-600",
  "Edge AI Engineer": "from-orange-600 to-red-600",
  "ML Platform Engineer": "from-cyan-600 to-blue-600",
};

const trackIconMap: Record<string, string> = {
  "Data Engineer": "Database",
  "AI Engineer": "Brain",
  "Edge AI Engineer": "Cpu",
  "ML Platform Engineer": "Factory",
};

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
              {grandProject.name}
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
              {grandProject.description}
            </p>
          </div>
        </div>
      </section>

      {/* Track contributions */}
      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
        <div className="text-center mb-12">
          <h3 className="text-2xl font-bold">Track Contributions</h3>
          <p className="mt-2 text-muted-foreground">
            Each track builds a critical piece of the system
          </p>
        </div>

        <div className="space-y-6">
          {grandProject.components.map((comp, idx) => {
            const color =
              trackColorMap[comp.track] || "from-gray-600 to-gray-600";
            const iconKey = trackIconMap[comp.track] || "Brain";
            const TrackIcon = iconMap[iconKey];

            return (
              <Card key={idx} className="border-border/50 overflow-hidden">
                <div className={`h-1 bg-gradient-to-r ${color}`} />
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${color}`}
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
                          {comp.track}
                        </Badge>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {comp.contribution}
                      </p>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Learning materials */}
      {grandProject.learning_materials.length > 0 && (
        <>
          <Separator className="mx-auto max-w-4xl" />
          <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
            <h3 className="text-2xl font-bold mb-6 text-center">
              Reference Materials
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {grandProject.learning_materials.map((mat, idx) => (
                <a
                  key={idx}
                  href={mat.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Card className="border-border/50 transition-all hover:border-border hover:shadow-md h-full">
                    <CardContent className="py-4 flex items-center justify-between gap-3">
                      <span className="text-sm font-medium">{mat.title}</span>
                      <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0" />
                    </CardContent>
                  </Card>
                </a>
              ))}
            </div>
          </section>
        </>
      )}

      {/* CTA */}
      <section className="mx-auto max-w-4xl px-4 pb-16 sm:px-6">
        <Card className="border-border/50 bg-gradient-to-br from-background to-muted/50">
          <CardContent className="flex flex-col items-center py-10 text-center">
            <h3 className="text-xl font-bold mb-2">Ready to Build This?</h3>
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
