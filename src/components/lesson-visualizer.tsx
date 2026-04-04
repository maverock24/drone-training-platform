"use client";

import React, { useState } from "react";
import {
  Server,
  Database,
  BrainCircuit,
  Cpu,
  Code2,
  Layers,
  GitBranch,
  Activity,
  Zap,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type Step = {
  step: number;
  title: string;
  description: string;
  code?: string;
};

function pickIcon(text: string) {
  const t = text.toLowerCase();
  if (t.includes("data") || t.includes("postgis") || t.includes("database") || t.includes("sql")) return Database;
  if (t.includes("model") || t.includes("train") || t.includes("neural") || t.includes("vit") || t.includes("transformer")) return BrainCircuit;
  if (t.includes("edge") || t.includes("deploy") || t.includes("tensorrt") || t.includes("jetson") || t.includes("hardware")) return Cpu;
  if (t.includes("code") || t.includes("script") || t.includes("python") || t.includes("implement")) return Code2;
  if (t.includes("pipeline") || t.includes("stream") || t.includes("kafka") || t.includes("flow")) return GitBranch;
  if (t.includes("monitor") || t.includes("metric") || t.includes("observ") || t.includes("log")) return Activity;
  if (t.includes("layer") || t.includes("architec") || t.includes("stack")) return Layers;
  if (t.includes("optim") || t.includes("speed") || t.includes("latenc") || t.includes("cuda")) return Zap;
  return Server;
}

const GRADIENT_COLORS = [
  { node: "from-sky-500 to-blue-600", ring: "ring-sky-500/50", glow: "shadow-sky-500/20", text: "text-sky-400", badge: "border-sky-500/40 text-sky-400", stem: "bg-sky-500/40" },
  { node: "from-violet-500 to-purple-600", ring: "ring-violet-500/50", glow: "shadow-violet-500/20", text: "text-violet-400", badge: "border-violet-500/40 text-violet-400", stem: "bg-violet-500/40" },
  { node: "from-emerald-500 to-green-600", ring: "ring-emerald-500/50", glow: "shadow-emerald-500/20", text: "text-emerald-400", badge: "border-emerald-500/40 text-emerald-400", stem: "bg-emerald-500/40" },
  { node: "from-amber-500 to-orange-600", ring: "ring-amber-500/50", glow: "shadow-amber-500/20", text: "text-amber-400", badge: "border-amber-500/40 text-amber-400", stem: "bg-amber-500/40" },
  { node: "from-rose-500 to-pink-600", ring: "ring-rose-500/50", glow: "shadow-rose-500/20", text: "text-rose-400", badge: "border-rose-500/40 text-rose-400", stem: "bg-rose-500/40" },
];

function StepNode({
  step,
  index,
  isActive,
  isExpanded,
  onToggle,
  isLast,
}: {
  step: Step;
  index: number;
  isActive: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  isLast: boolean;
}) {
  const color = GRADIENT_COLORS[index % GRADIENT_COLORS.length];
  const Icon = pickIcon(step.title + " " + step.description);

  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center flex-shrink-0">
        <button
          onClick={onToggle}
          className={`relative z-10 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br ${color.node} shadow-lg transition-all duration-300 hover:scale-110 hover:ring-4 ${color.ring} ${isActive ? `ring-4 ${color.ring} shadow-xl ${color.glow} scale-110` : ""}`}
        >
          <Icon className="h-5 w-5 text-white" />
        </button>
        {!isLast && (
          <div className={`mt-1 w-0.5 flex-1 min-h-8 transition-all duration-500 ${isActive ? color.stem : "bg-border/30"}`} />
        )}
      </div>

      <div className="flex-1 pb-6">
        <button onClick={onToggle} className="w-full text-left group">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className={`text-xs font-mono ${color.badge}`}>
                Step {step.step}
              </Badge>
              <span className={`text-sm font-semibold transition-colors ${isActive ? color.text : "text-foreground"}`}>
                {step.title}
              </span>
            </div>
            <span className="text-muted-foreground/40 group-hover:text-muted-foreground transition-colors mt-0.5 flex-shrink-0">
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </span>
          </div>
        </button>

        {isExpanded && (
          <div className="mt-3 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="rounded-xl border border-border/30 bg-muted/20 p-4">
              <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
              {step.code && (
                <div className="mt-3 rounded-lg bg-zinc-900/80 border border-border/30 px-3 py-2 overflow-x-auto">
                  <p className={`text-xs font-mono ${color.text} mb-1 font-semibold`}>▸ Code snippet (see Practice tab for full version)</p>
                  <pre className="text-xs text-muted-foreground/70 line-clamp-3 whitespace-pre-wrap">{step.code.slice(0, 200)}{step.code.length > 200 ? "…" : ""}</pre>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function LessonVisualizer({ lesson }: { lesson: any }) {
  const [expandedStep, setExpandedStep] = useState<number | null>(0);
  const [showAll, setShowAll] = useState(false);

  if (!lesson?.step_by_step_guide?.length) return null;

  const steps: Step[] = lesson.step_by_step_guide;
  const visibleSteps = showAll ? steps : steps.slice(0, 5);

  const toggle = (idx: number) => setExpandedStep(expandedStep === idx ? null : idx);

  return (
    <Card className="my-6 border-border/50 overflow-hidden bg-gradient-to-br from-background to-muted/20">
      <CardHeader className="pb-4 border-b border-border/40 bg-muted/10">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary/80 to-primary shadow-lg shadow-primary/20">
                <BrainCircuit className="h-4 w-4 text-primary-foreground" />
              </div>
              Execution Pipeline
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1.5 ml-10">
              {steps.length} steps &middot; Click each node to expand details
            </p>
          </div>
          <div className="flex gap-2 flex-wrap ml-10">
            {["Understand", "Implement", "Verify"].map((phase, i) => (
              <Badge key={phase} variant="outline" className="text-xs gap-1.5">
                <span className={`inline-block h-1.5 w-1.5 rounded-full ${i === 0 ? "bg-sky-400" : i === 1 ? "bg-violet-400" : "bg-emerald-400"}`} />
                {phase}
              </Badge>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6 px-4 sm:px-6">
        <div className="space-y-0">
          {visibleSteps.map((step, idx) => (
            <StepNode
              key={step.step}
              step={step}
              index={idx}
              isActive={expandedStep === idx}
              isExpanded={expandedStep === idx}
              onToggle={() => toggle(idx)}
              isLast={idx === visibleSteps.length - 1}
            />
          ))}
        </div>

        {steps.length > 5 && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full mt-2 text-muted-foreground hover:text-foreground gap-2"
            onClick={() => setShowAll(!showAll)}
          >
            {showAll ? (
              <>Show less <ChevronUp className="h-4 w-4" /></>
            ) : (
              <>Show {steps.length - 5} more steps <ChevronDown className="h-4 w-4" /></>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
