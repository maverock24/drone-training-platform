"use client";

import Link from "next/link";
import Image from "next/image";
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

const trackDescMap: Record<string, string> = {
  "Data Engineer": "Build the ingestion & processing pipeline for live drone sensor streams.",
  "AI Engineer": "Train & fine-tune the fire detection and severity classification models.",
  "Edge AI Engineer": "Deploy optimized inference models directly onto the drone's onboard compute.",
  "ML Platform Engineer": "Orchestrate model CI/CD, monitoring, and production serving infrastructure.",
};

export default function GrandProjectPage() {
  return (
    <div className="relative">
      {/* ─── Hero with forest fire image ─── */}
      <section className="relative overflow-hidden border-b border-border/40 min-h-[520px] flex items-end">
        {/* Background image */}
        <div className="absolute inset-0">
          <Image
            src="/grand-project-fire.png"
            alt="Autonomous drone surveying forest fire with thermal detection overlay"
            fill
            className="object-cover object-center"
            priority
            quality={90}
          />
          {/* Dark gradient overlay - heavier at bottom for readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/30" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/60 via-transparent to-background/60" />
          {/* Orange accent glow matching the fire theme */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-orange-900/20 via-transparent to-transparent" />
        </div>

        <div className="relative mx-auto max-w-4xl px-4 pb-16 pt-24 sm:px-6 sm:pb-20 w-full">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2 mb-8 -ml-2 backdrop-blur-sm">
              <ArrowLeft className="h-4 w-4" />
              All Tracks
            </Button>
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-end gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-600 to-red-600 shadow-lg shadow-orange-600/40">
                  <Flame className="h-7 w-7 text-white" />
                </div>
                <Badge variant="secondary" className="px-4 py-1 text-sm bg-orange-500/20 text-orange-300 border border-orange-500/30">
                  Capstone Project
                </Badge>
              </div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-5xl drop-shadow-lg">
                {grandProject.name}
              </h1>
              <p className="mt-4 max-w-2xl text-muted-foreground text-lg leading-relaxed">
                {grandProject.description}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Track contributions ─── */}
      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold">Track Contributions</h2>
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
            const desc = trackDescMap[comp.track];

            return (
              <Card key={idx} className="border-border/50 overflow-hidden group hover:border-border/80 transition-all hover:shadow-lg">
                <div className={`h-1 bg-gradient-to-r ${color}`} />
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${color} shadow-md`}
                    >
                      {TrackIcon && (
                        <TrackIcon className="h-6 w-6 text-white" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-xs">
                          Phase {idx + 1}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {comp.track}
                        </Badge>
                      </div>
                      <CardTitle className="text-base mb-1"><GlossaryText text=<GlossaryText text={comp.contribution} /> /></CardTitle>
                      {desc && (
                        <p className="text-sm text-muted-foreground">{desc}</p>
                      )}
                    </div>
                  </div>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </section>

      {/* ─── System architecture visual callout ─── */}
      <section className="mx-auto max-w-4xl px-4 pb-8 sm:px-6">
        <Card className="relative overflow-hidden border-border/40">
          <div className="absolute inset-0 opacity-20">
            <Image
              src="/grand-project-fire.png"
              alt=""
              fill
              className="object-cover object-top"
              aria-hidden="true"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-background via-background/60 to-background" />
          </div>
          <CardContent className="relative py-8 px-6">
            <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
              <Flame className="h-5 w-5 text-orange-500" />
              What You'll Build
            </h3>
            <div className="grid sm:grid-cols-2 gap-4 text-sm text-muted-foreground">
              <div className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span>Real-time drone telemetry & sensor data pipelines using Kafka and Spark</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-violet-500 shrink-0" />
                <span>Custom fire detection & severity classification models with PyTorch</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-orange-500 shrink-0" />
                <span>TensorRT-optimized edge inference on Jetson-class hardware</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-cyan-500 shrink-0" />
                <span>MLflow + Kubernetes ML platform for CI/CD and production monitoring</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* ─── Learning materials ─── */}
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
                  <Card className="border-border/50 transition-all hover:border-border hover:shadow-md h-full group">
                    <CardContent className="py-4 flex items-center justify-between gap-3">
                      <span className="text-sm font-medium group-hover:text-primary transition-colors">{mat.title}</span>
                      <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0 group-hover:text-primary transition-colors" />
                    </CardContent>
                  </Card>
                </a>
              ))}
            </div>
          </section>
        </>
      )}

      {/* ─── CTA ─── */}
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
              <Link href="/tracks/edge-ai">
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
