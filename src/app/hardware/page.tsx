"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Wrench,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
  ShoppingCart,
  FileText,
} from "lucide-react";
import { hardwareSetup } from "@/lib/course-data";

export default function HardwarePage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <Link href="/">
        <Button variant="ghost" size="sm" className="gap-2 mb-6 -ml-2">
          <ArrowLeft className="h-4 w-4" />
          Home
        </Button>
      </Link>

      <div className="flex items-center gap-4 mb-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-orange-600 to-red-600">
          <Wrench className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Hardware Setup</h1>
          <p className="text-muted-foreground mt-1">
            Custom drone build for the training program
          </p>
        </div>
      </div>

      <p className="text-sm text-muted-foreground mb-8 max-w-2xl">
        {hardwareSetup.description}
      </p>

      {/* Safety note */}
      <Card className="mb-8 border-amber-500/30 bg-amber-500/5">
        <CardContent className="py-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-500">Safety First</p>
            <p className="text-sm text-muted-foreground mt-1">
              {hardwareSetup.safety_note}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Components */}
      <h2 className="text-2xl font-bold mb-4">Components</h2>
      <div className="space-y-3 mb-10">
        {hardwareSetup.components.map((comp) => (
          <Card key={comp.name} className="border-border/50">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-4">
                <CardTitle className="text-base">{comp.name}</CardTitle>
                <div className="flex gap-2 shrink-0">
                  {comp.buy_link && (
                    <a
                      href={comp.buy_link}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button size="sm" variant="outline" className="gap-1.5 text-xs h-7">
                        <ShoppingCart className="h-3 w-3" />
                        Buy
                      </Button>
                    </a>
                  )}
                  {comp.documentation && (
                    <a
                      href={comp.documentation}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button size="sm" variant="outline" className="gap-1.5 text-xs h-7">
                        <FileText className="h-3 w-3" />
                        Docs
                      </Button>
                    </a>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-muted-foreground">{comp.role}</p>
              {comp.note && (
                <p className="text-xs text-amber-500/80 mt-2">{comp.note}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Track utilization */}
      <Separator className="my-8" />
      <h2 className="text-2xl font-bold mb-4">Usage by Track</h2>
      <div className="grid gap-3 sm:grid-cols-2 mb-10">
        {Object.entries(hardwareSetup.utilization_by_track).map(
          ([track, usage]) => (
            <Card key={track} className="border-border/50">
              <CardContent className="py-4">
                <Badge variant="secondary" className="text-xs mb-2">
                  {track}
                </Badge>
                <p className="text-sm text-muted-foreground">{usage}</p>
              </CardContent>
            </Card>
          )
        )}
      </div>

      {/* Week 1 setup */}
      <Separator className="my-8" />
      <h2 className="text-2xl font-bold mb-2">
        {hardwareSetup.week1_setup_guide.title}
      </h2>
      <p className="text-muted-foreground text-sm mb-6">
        Follow these steps to get your hardware ready for the course.
      </p>
      <div className="space-y-3">
        {hardwareSetup.week1_setup_guide.steps.map((step, idx) => (
          <div
            key={idx}
            className="flex items-start gap-3 rounded-lg border border-border/30 bg-muted/20 p-4"
          >
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
              {idx + 1}
            </div>
            <p className="text-sm">{step}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
