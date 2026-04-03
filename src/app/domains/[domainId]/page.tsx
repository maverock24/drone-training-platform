"use client";

import { use, useState } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  BookOpen,
  Code,
  ChevronDown,
  ChevronUp,
  Target,
  Rocket,
  ExternalLink,
  Copy,
  Check,
  Lock,
  LogIn,
  UserPlus,
  Flame,
  Bird,
  Building2,
  Factory,
  Sprout,
  LifeBuoy,
  Ship,
  Zap,
  Mountain,
  Waves,
  Snowflake,
  Landmark,
  Clapperboard,
  Package,
  Shield,
  Users,
  TreePine,
  Grape,
  HardHat,
  Pipette,
  Sparkles,
} from "lucide-react";
import { getDomainBySlug } from "@/lib/domain-data";
import { useAuth } from "@/lib/auth-context";
import { GlossaryText } from "@/components/glossary-text";

const slugMeta: Record<
  string,
  {
    icon: React.ComponentType<{ className?: string }>;
    gradient: string;
    color: string;
  }
> = {
  fire: { icon: Flame, gradient: "from-orange-600 to-red-600", color: "text-orange-500" },
  bird: { icon: Bird, gradient: "from-sky-600 to-blue-600", color: "text-sky-500" },
  city: { icon: Building2, gradient: "from-slate-600 to-zinc-600", color: "text-slate-400" },
  "facility-inspection": { icon: Factory, gradient: "from-amber-600 to-orange-600", color: "text-amber-500" },
  agriculture: { icon: Sprout, gradient: "from-green-600 to-emerald-600", color: "text-green-500" },
  emergency: { icon: LifeBuoy, gradient: "from-red-600 to-rose-600", color: "text-red-500" },
  maritime: { icon: Ship, gradient: "from-blue-600 to-indigo-600", color: "text-blue-500" },
  power: { icon: Zap, gradient: "from-yellow-600 to-amber-600", color: "text-yellow-500" },
  mining: { icon: Mountain, gradient: "from-stone-600 to-zinc-600", color: "text-stone-400" },
  coastal: { icon: Waves, gradient: "from-cyan-600 to-teal-600", color: "text-cyan-500" },
  polar: { icon: Snowflake, gradient: "from-blue-400 to-cyan-500", color: "text-blue-400" },
  culture: { icon: Landmark, gradient: "from-amber-500 to-yellow-600", color: "text-amber-400" },
  film: { icon: Clapperboard, gradient: "from-pink-600 to-rose-600", color: "text-pink-500" },
  "package-delivery": { icon: Package, gradient: "from-violet-600 to-purple-600", color: "text-violet-500" },
  security: { icon: Shield, gradient: "from-red-700 to-red-600", color: "text-red-400" },
  "public-safety": { icon: Users, gradient: "from-indigo-600 to-violet-600", color: "text-indigo-500" },
  forestry: { icon: TreePine, gradient: "from-emerald-600 to-green-600", color: "text-emerald-500" },
  viticulture: { icon: Grape, gradient: "from-purple-600 to-fuchsia-600", color: "text-purple-500" },
  construction: { icon: HardHat, gradient: "from-yellow-500 to-orange-500", color: "text-yellow-400" },
  "oil-gas": { icon: Pipette, gradient: "from-teal-600 to-cyan-600", color: "text-teal-500" },
};

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative mt-3 rounded-lg border border-border/50 bg-muted/30">
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 p-1.5 rounded-md bg-background/80 hover:bg-background border border-border/50 transition-colors"
      >
        {copied ? (
          <Check className="h-3.5 w-3.5 text-green-500" />
        ) : (
          <Copy className="h-3.5 w-3.5 text-muted-foreground" />
        )}
      </button>
      <pre className="p-4 pr-12 overflow-x-auto text-xs leading-relaxed font-mono">
        <code>{code}</code>
      </pre>
    </div>
  );
}

export default function DomainDetailPage({
  params,
}: {
  params: Promise<{ domainId: string }>;
}) {
  const { domainId } = use(params);
  const domain = getDomainBySlug(domainId);
  const { user, loading: authLoading } = useAuth();
  const [expandedModules, setExpandedModules] = useState<Set<number>>(
    new Set([0])
  );

  if (!domain) notFound();

  const meta = slugMeta[domainId] || {
    icon: Sparkles,
    gradient: "from-violet-600 to-cyan-600",
    color: "text-violet-500",
  };
  const Icon = meta.icon;

  const totalLessons = domain.modules.reduce(
    (acc, m) => acc + m.lessons.length,
    0
  );
  const lessonsWithCode = domain.modules.reduce(
    (acc, m) => acc + m.lessons.filter((l) => l.code_example).length,
    0
  );

  const toggleModule = (idx: number) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  // Auth gate: show teaser for unauthenticated users
  if (!authLoading && !user) {
    return (
      <div className="relative">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border/40">
          <div className="absolute inset-0 bg-gradient-to-b from-violet-950/20 via-background to-background" />
          <div className="relative mx-auto max-w-4xl px-4 pt-10 pb-12 sm:px-6">
            <Link href="/domains">
              <Button variant="ghost" size="sm" className="gap-2 mb-6 -ml-2">
                <ArrowLeft className="h-4 w-4" />
                All Domains
              </Button>
            </Link>
            <div className="flex items-start gap-4">
              <div
                className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${meta.gradient} shadow-lg`}
              >
                <Icon className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  {domain.domain}
                </h1>
                <p className="mt-2 text-muted-foreground text-sm max-w-2xl">
                  {domain.description}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Login prompt */}
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
          <Card className="border-border/50">
            <CardContent className="flex flex-col items-center gap-6 py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted/40 border border-border/50">
                <Lock className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <h2 className="text-xl font-bold mb-2">
                  Full Training Material
                </h2>
                <p className="text-muted-foreground text-sm max-w-md">
                  Sign in to access {domain.modules.length} modules,{" "}
                  {totalLessons} lessons, and hands-on code examples for this
                  domain.
                </p>
              </div>
              <div className="flex gap-3">
                <Link href="/login">
                  <Button size="sm" className="gap-2">
                    <LogIn className="h-4 w-4" />
                    Sign In
                  </Button>
                </Link>
                <Link href="/register">
                  <Button variant="outline" size="sm" className="gap-2">
                    <UserPlus className="h-4 w-4" />
                    Create Account
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/40">
        <div className="absolute inset-0 bg-gradient-to-b from-violet-950/20 via-background to-background" />
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-600/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-600/5 rounded-full blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-4xl px-4 pt-10 pb-12 sm:px-6">
          <Link href="/domains">
            <Button variant="ghost" size="sm" className="gap-2 mb-6 -ml-2">
              <ArrowLeft className="h-4 w-4" />
              All Domains
            </Button>
          </Link>

          <div className="flex items-start gap-4">
            <div
              className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${meta.gradient} shadow-lg`}
            >
              <Icon className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                {domain.domain}
              </h1>
              <p className="mt-2 text-muted-foreground text-sm max-w-2xl">
                {domain.description}
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5 bg-background/60 backdrop-blur-sm rounded-full px-3 py-1 border border-border/30">
                  <BookOpen className="h-4 w-4" />
                  {domain.modules.length} modules
                </span>
                <span className="flex items-center gap-1.5 bg-background/60 backdrop-blur-sm rounded-full px-3 py-1 border border-border/30">
                  <Target className="h-4 w-4" />
                  {totalLessons} lessons
                </span>
                {lessonsWithCode > 0 && (
                  <span className="flex items-center gap-1.5 bg-background/60 backdrop-blur-sm rounded-full px-3 py-1 border border-border/30">
                    <Code className="h-4 w-4" />
                    {lessonsWithCode} code examples
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 space-y-10">
        {/* Learning Objectives */}
        <section>
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Target className={`h-5 w-5 ${meta.color}`} />
            Learning Objectives
          </h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {domain.learning_objectives.map((obj, i) => (
              <div
                key={i}
                className="flex items-start gap-3 rounded-lg border border-border/40 bg-muted/20 p-3"
              >
                <span
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${meta.gradient} text-[10px] font-bold text-white`}
                >
                  {i + 1}
                </span>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {obj}
                </p>
              </div>
            ))}
          </div>
        </section>

        <Separator className="opacity-50" />

        {/* Modules & Lessons */}
        <section>
          <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
            <BookOpen className={`h-5 w-5 ${meta.color}`} />
            Curriculum
          </h2>

          <div className="space-y-4">
            {domain.modules.map((mod, mIdx) => {
              const isExpanded = expandedModules.has(mIdx);

              return (
                <Card
                  key={mIdx}
                  className="border-border/50 overflow-hidden"
                >
                  <button
                    onClick={() => toggleModule(mIdx)}
                    className="w-full text-left"
                  >
                    <div className="flex items-center justify-between px-5 py-4 hover:bg-muted/20 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${meta.gradient} text-xs font-bold text-white`}
                        >
                          {mIdx + 1}
                        </span>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-sm truncate">
                            {mod.title}
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            {mod.lessons.length} lesson
                            {mod.lessons.length !== 1 ? "s" : ""}
                            {mod.lessons.filter((l) => l.code_example).length >
                              0 &&
                              ` · ${
                                mod.lessons.filter((l) => l.code_example).length
                              } code example${
                                mod.lessons.filter((l) => l.code_example)
                                  .length !== 1
                                  ? "s"
                                  : ""
                              }`}
                          </p>
                        </div>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                      )}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-border/40 animate-in fade-in-0 slide-in-from-top-1 duration-200">
                      {mod.lessons.map((lesson, lIdx) => (
                        <div
                          key={lIdx}
                          className="px-5 py-5 border-b last:border-b-0 border-border/30"
                        >
                          <div className="flex items-start gap-3 mb-3">
                            <Badge
                              variant="outline"
                              className="shrink-0 text-[10px] px-1.5 py-0 mt-0.5"
                            >
                              {mIdx + 1}.{lIdx + 1}
                            </Badge>
                            <h4 className="font-semibold text-sm">
                              {lesson.title}
                            </h4>
                          </div>

                          {lesson.content && (
                            <p className="text-sm text-muted-foreground leading-relaxed ml-10">
                              <GlossaryText text={lesson.content} />
                            </p>
                          )}

                          {lesson.code_example && (
                            <div className="ml-10">
                              <CodeBlock code={lesson.code_example} />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </section>

        {/* Capstone Project */}
        {domain.capstone_project && (
          <>
            <Separator className="opacity-50" />
            <section>
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Rocket className={`h-5 w-5 ${meta.color}`} />
                Capstone Project
              </h2>
              <Card className="border-border/50">
                <CardContent className="pt-5 pb-5">
                  <h3 className="font-bold text-base mb-2">
                    {domain.capstone_project.name}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                    {domain.capstone_project.description}
                  </p>
                  {domain.capstone_project.deliverables &&
                    domain.capstone_project.deliverables.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                          Deliverables
                        </h4>
                        <ul className="space-y-1.5">
                          {domain.capstone_project.deliverables.map((d, i) => (
                            <li
                              key={i}
                              className="flex items-start gap-2 text-sm"
                            >
                              <span
                                className={`mt-1.5 h-1.5 w-1.5 rounded-full shrink-0 bg-gradient-to-br ${meta.gradient}`}
                              />
                              <span className="text-muted-foreground">
                                {d}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                </CardContent>
              </Card>
            </section>
          </>
        )}

        {/* Resources */}
        {domain.resources && domain.resources.length > 0 && (
          <>
            <Separator className="opacity-50" />
            <section>
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <ExternalLink className={`h-5 w-5 ${meta.color}`} />
                Resources
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {domain.resources.map((res, i) => (
                  <a
                    key={i}
                    href={res.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group"
                  >
                    <Card className="border-border/50 h-full transition-all duration-200 hover:border-border hover:shadow-md">
                      <CardContent className="pt-4 pb-4">
                        <h4 className="font-semibold text-sm group-hover:text-foreground transition-colors flex items-center gap-1.5">
                          {res.name}
                          <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </h4>
                        {res.description && (
                          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                            {res.description}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </a>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
