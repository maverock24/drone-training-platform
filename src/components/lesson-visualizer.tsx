import React, { useState } from "react";
import { Server, Database, BrainCircuit, Cpu, Code2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function LessonVisualizer({ lesson }: { lesson: any }) {
  const [activeStep, setActiveStep] = useState<number | null>(null);

  if (!lesson || !lesson.step_by_step_guide || lesson.step_by_step_guide.length === 0) {
    return null;
  }

  const steps = lesson.step_by_step_guide;

  return (
    <Card className="my-6 border-border/50 bg-muted/10 overflow-hidden">
      <CardHeader className="bg-muted/30 border-b border-border/50">
        <CardTitle className="text-lg flex items-center gap-2">
          <BrainCircuit className="h-5 w-5 text-primary" />
          Lesson Learning Architecture
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          Interactive execution pipeline for <strong>{lesson.title}</strong>
        </p>
      </CardHeader>
      <CardContent className="p-6">
        <div className="relative">
          {/* Connecting Line (Desktop) */}
          <div className="absolute top-1/2 left-0 w-full h-1 bg-gradient-to-r from-primary/10 via-primary/30 to-primary/10 -translate-y-1/2 hidden md:block rounded-full" />
          
          <div className="flex flex-col md:flex-row gap-4 items-stretch justify-between relative z-10 w-full">
            {steps.slice(0, 5).map((step: any, idx: number) => {
              const isActive = activeStep === idx;
              
              // Try to guess icon based on text
              const text = (step.title + " " + step.description).toLowerCase();
              let Icon = Server;
              if (text.includes("data") || text.includes("postgis") || text.includes("database")) Icon = Database;
              if (text.includes("model") || text.includes("train") || text.includes("ai") || text.includes("neural")) Icon = BrainCircuit;
              if (text.includes("edge") || text.includes("deploy") || text.includes("hardware") || text.includes("tensorrt")) Icon = Cpu;
              if (text.includes("code") || text.includes("script") || text.includes("python")) Icon = Code2;

              return (
                <div 
                  key={step.step} 
                  className="flex-1 flex flex-col items-center group relative cursor-pointer"
                  onMouseEnter={() => setActiveStep(idx)}
                  onMouseLeave={() => setActiveStep(null)}
                >
                  {/* Node */}
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 border-2 shadow-lg mb-3 z-10 
                    ${isActive 
                      ? "bg-primary/20 border-primary scale-110 shadow-primary/20" 
                      : "bg-background border-border/60 hover:border-primary/50 group-hover:scale-105"}`}
                  >
                    <Icon className={`h-7 w-7 transition-colors duration-300 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                  </div>
                  
                  {/* Step Label */}
                  <div className="text-center w-full px-2">
                    <Badge variant={isActive ? "default" : "outline"} className="mb-2 transition-all">
                      Step {step.step}
                    </Badge>
                    <h4 className="text-xs font-bold leading-tight line-clamp-2 min-h-8 text-foreground block">
                      {step.title}
                    </h4>
                  </div>

                  {/* Tooltip-like expansion for the active item */}
                  {isActive && (
                    <div className="absolute top-20 mt-6 w-48 z-50 animate-in fade-in zoom-in-95 duration-200 pointer-events-none">
                      <div className="bg-popover border border-border shadow-xl rounded-lg p-3 text-xs text-popover-foreground">
                        <p className="line-clamp-4">{step.description}</p>
                      </div>
                    </div>
                  )}

                  {/* Mobile Connector */}
                  {idx < Math.min(steps.length, 5) - 1 && (
                    <div className="md:hidden w-1 h-8 bg-border/40 my-2 rounded-full" />
                  )}
                </div>
              );
            })}
          </div>
          
          {steps.length > 5 && (
             <div className="mt-8 text-center text-xs text-muted-foreground hidden md:block">
               + {steps.length - 5} more steps in this pipeline...
             </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
