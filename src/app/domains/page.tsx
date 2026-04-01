"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Flame,
  Bird,
  Building2,
  Factory,
  Sprout,
  LifeBuoy,
  Ship,
  Zap,
  Mountain,
  Package,
  Waves,
  Snowflake,
  Landmark,
  Clapperboard,
  Shield,
  Users,
  TreePine,
  Grape,
  HardHat,
  Pipette,
  ChevronDown,
  ChevronUp,
  Crosshair,
  Cpu,
  BookOpen,
  ArrowLeft,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import domainData from "../../../courses/key_domain_trainings.json";
import { domainNameToSlug } from "@/lib/domain-data";

// Icon + color mapping for each domain (by index)
const domainMeta: {
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  color: string;
  category: string;
}[] = [
  { icon: Flame, gradient: "from-orange-600 to-red-600", color: "text-orange-500", category: "Emergency & Safety" },
  { icon: Bird, gradient: "from-sky-600 to-blue-600", color: "text-sky-500", category: "Environment & Conservation" },
  { icon: Building2, gradient: "from-slate-600 to-zinc-600", color: "text-slate-400", category: "Infrastructure" },
  { icon: Factory, gradient: "from-amber-600 to-orange-600", color: "text-amber-500", category: "Infrastructure" },
  { icon: Sprout, gradient: "from-green-600 to-emerald-600", color: "text-green-500", category: "Agriculture" },
  { icon: LifeBuoy, gradient: "from-red-600 to-rose-600", color: "text-red-500", category: "Emergency & Safety" },
  { icon: Ship, gradient: "from-blue-600 to-indigo-600", color: "text-blue-500", category: "Infrastructure" },
  { icon: Zap, gradient: "from-yellow-600 to-amber-600", color: "text-yellow-500", category: "Infrastructure" },
  { icon: Mountain, gradient: "from-stone-600 to-zinc-600", color: "text-stone-400", category: "Infrastructure" },
  { icon: Package, gradient: "from-violet-600 to-purple-600", color: "text-violet-500", category: "Logistics" },
  { icon: Waves, gradient: "from-cyan-600 to-teal-600", color: "text-cyan-500", category: "Environment & Conservation" },
  { icon: Snowflake, gradient: "from-blue-400 to-cyan-500", color: "text-blue-400", category: "Environment & Conservation" },
  { icon: Landmark, gradient: "from-amber-500 to-yellow-600", color: "text-amber-400", category: "Specialized" },
  { icon: Clapperboard, gradient: "from-pink-600 to-rose-600", color: "text-pink-500", category: "Specialized" },
  { icon: Shield, gradient: "from-red-700 to-red-600", color: "text-red-400", category: "Emergency & Safety" },
  { icon: Users, gradient: "from-indigo-600 to-violet-600", color: "text-indigo-500", category: "Emergency & Safety" },
  { icon: TreePine, gradient: "from-emerald-600 to-green-600", color: "text-emerald-500", category: "Environment & Conservation" },
  { icon: Grape, gradient: "from-purple-600 to-fuchsia-600", color: "text-purple-500", category: "Agriculture" },
  { icon: HardHat, gradient: "from-yellow-500 to-orange-500", color: "text-yellow-400", category: "Infrastructure" },
  { icon: Pipette, gradient: "from-teal-600 to-cyan-600", color: "text-teal-500", category: "Infrastructure" },
];

const categories = [
  "All",
  "Infrastructure",
  "Emergency & Safety",
  "Environment & Conservation",
  "Agriculture",
  "Logistics",
  "Specialized",
];

export default function DomainsPage() {
  const [expanded, setExpanded] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState("All");

  const domains = domainData.specialized_domain_training;

  const filteredDomains = domains
    .map((d, i) => ({ ...d, originalIndex: i }))
    .filter((_, i) =>
      activeCategory === "All"
        ? true
        : domainMeta[domains.indexOf(domains[i])]?.category === activeCategory
    );

  const filteredWithMeta = domains
    .map((d, i) => ({ domain: d, meta: domainMeta[i], index: i }))
    .filter(
      ({ meta }) => activeCategory === "All" || meta?.category === activeCategory
    );

  return (
    <div className="relative">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/40">
        <div className="absolute inset-0 bg-gradient-to-b from-violet-950/20 via-background to-background" />
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-600/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-600/5 rounded-full blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-6xl px-4 pt-10 pb-12 sm:px-6">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2 mb-6 -ml-2">
              <ArrowLeft className="h-4 w-4" />
              Home
            </Button>
          </Link>

          <div className="flex items-start gap-5">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-cyan-600 shadow-lg">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Specialized Domain Trainings
              </h1>
              <p className="mt-2 max-w-2xl text-muted-foreground">
                Explore <span className="text-foreground font-medium">{domains.length} industry-specific applications</span> of autonomous drone AI.
                Each domain extends the core curriculum with specialized use cases, AI challenges, and real-world deployment scenarios.
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5 bg-background/60 backdrop-blur-sm rounded-full px-3 py-1 border border-border/30">
                  <Crosshair className="h-4 w-4" />
                  {domains.length} domains
                </span>
                <span className="flex items-center gap-1.5 bg-background/60 backdrop-blur-sm rounded-full px-3 py-1 border border-border/30">
                  <Cpu className="h-4 w-4" />
                  {domains.reduce((a, d) => a + d.key_ai_challenges.length, 0)} AI challenges
                </span>
                <span className="flex items-center gap-1.5 bg-background/60 backdrop-blur-sm rounded-full px-3 py-1 border border-border/30">
                  <BookOpen className="h-4 w-4" />
                  {domains.reduce((a, d) => a + d.use_cases.length, 0)} use cases
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        {/* Category filter */}
        <div className="flex flex-wrap gap-2 mb-8">
          {categories.map((cat) => (
            <Button
              key={cat}
              variant={activeCategory === cat ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveCategory(cat)}
              className="rounded-full text-xs"
            >
              {cat}
              {cat !== "All" && (
                <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5 py-0">
                  {domains.filter((_, i) => domainMeta[i]?.category === cat).length}
                </Badge>
              )}
            </Button>
          ))}
        </div>

        {/* Domain cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredWithMeta.map(({ domain, meta, index }) => {
            const Icon = meta?.icon || Sparkles;
            const isExpanded = expanded === index;

            return (
              <Card
                key={index}
                className={`group border-border/50 overflow-hidden transition-all duration-300 hover:border-border hover:shadow-lg ${
                  isExpanded ? "sm:col-span-2 lg:col-span-3 border-border shadow-lg" : ""
                }`}
              >
                <div className={`h-1 bg-gradient-to-r ${meta?.gradient || "from-gray-600 to-gray-600"}`} />
                <CardContent className="pt-5 pb-4">
                  {/* Header */}
                  <div className="flex items-start gap-3 mb-3">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${
                        meta?.gradient || "from-gray-600 to-gray-600"
                      } shadow-md`}
                    >
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-sm leading-tight">{domain.domain}</h3>
                      <Badge variant="outline" className="mt-1 text-[10px] px-1.5 py-0">
                        {meta?.category || "General"}
                      </Badge>
                    </div>
                  </div>

                  {/* Description */}
                  <p className={`text-xs text-muted-foreground leading-relaxed ${isExpanded ? "" : "line-clamp-3"}`}>
                    {domain.description}
                  </p>

                  {/* Expanded content */}
                  {isExpanded && (
                    <div className="mt-5 space-y-5 animate-in fade-in-0 slide-in-from-top-2 duration-300">
                      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

                        {/* Use Cases */}
                        <div className="rounded-lg border border-border/50 bg-muted/20 p-4">
                          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                            <Crosshair className="h-3.5 w-3.5" />
                            Use Cases
                          </h4>
                          <ul className="space-y-2">
                            {domain.use_cases.map((uc, i) => (
                              <li key={i} className="flex items-start gap-2 text-xs">
                                <span className={`mt-0.5 h-1.5 w-1.5 rounded-full shrink-0 bg-gradient-to-br ${meta?.gradient || "from-gray-500 to-gray-500"}`} />
                                {uc}
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* AI Challenges */}
                        <div className="rounded-lg border border-border/50 bg-muted/20 p-4">
                          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                            <Cpu className="h-3.5 w-3.5" />
                            Key AI Challenges
                          </h4>
                          <ul className="space-y-2">
                            {domain.key_ai_challenges.map((ch, i) => (
                              <li key={i} className="flex items-start gap-2 text-xs">
                                <span className="mt-0.5 h-1.5 w-1.5 rounded-full shrink-0 bg-gradient-to-br from-red-500 to-orange-500" />
                                {ch}
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Training Focus */}
                        <div className="rounded-lg border border-border/50 bg-muted/20 p-4 sm:col-span-2 lg:col-span-1">
                          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                            <BookOpen className="h-3.5 w-3.5" />
                            Training Focus
                          </h4>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {domain.training_focus}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Toggle button & training link */}
                  <div className="mt-3 flex items-center gap-3">
                    <button
                      onClick={() => setExpanded(isExpanded ? null : index)}
                      className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp className="h-3.5 w-3.5" />
                          Collapse
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-3.5 w-3.5" />
                          View details
                        </>
                      )}
                    </button>
                    {domainNameToSlug[domain.domain] && (
                      <Link href={`/domains/${domainNameToSlug[domain.domain]}`}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs gap-1.5 rounded-full"
                        >
                          Full Training
                          <ArrowRight className="h-3 w-3" />
                        </Button>
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <div className="inline-flex flex-col items-center gap-4 rounded-2xl border border-border/50 bg-muted/20 px-8 py-8">
            <h2 className="text-xl font-bold">Ready to specialize?</h2>
            <p className="text-sm text-muted-foreground max-w-md">
              Master the core curriculum first, then apply your skills to any of these {domains.length} industry domains.
            </p>
            <div className="flex gap-3">
              <Link href="/">
                <Button size="sm" className="gap-2">
                  <BookOpen className="h-4 w-4" />
                  Start Learning
                </Button>
              </Link>
              <Link href="/grand-project">
                <Button variant="outline" size="sm" className="gap-2">
                  <Flame className="h-4 w-4" />
                  Grand Project
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
