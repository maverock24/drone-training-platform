"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Library,
  ExternalLink,
  Gamepad2,
  Users,
  BookOpen,
} from "lucide-react";
import { resources } from "@/lib/course-data";

const sections = [
  {
    key: "simulators" as const,
    title: "Flight Simulators",
    icon: Gamepad2,
    gradient: "from-violet-600 to-purple-600",
  },
  {
    key: "communities" as const,
    title: "Communities",
    icon: Users,
    gradient: "from-cyan-600 to-blue-600",
  },
  {
    key: "books" as const,
    title: "Recommended Books",
    icon: BookOpen,
    gradient: "from-emerald-600 to-teal-600",
  },
];

export default function ResourcesPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <Link href="/">
        <Button variant="ghost" size="sm" className="gap-2 mb-6 -ml-2">
          <ArrowLeft className="h-4 w-4" />
          Home
        </Button>
      </Link>

      <div className="flex items-center gap-4 mb-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-teal-600">
          <Library className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Resources</h1>
          <p className="text-muted-foreground mt-1">
            Simulators, communities, and books to supplement your learning
          </p>
        </div>
      </div>

      <div className="space-y-10">
        {sections.map((section) => {
          const Icon = section.icon;
          const items = resources[section.key];

          return (
            <div key={section.key}>
              <div className="flex items-center gap-3 mb-4">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ${section.gradient}`}
                >
                  <Icon className="h-4 w-4 text-white" />
                </div>
                <h2 className="text-xl font-bold">{section.title}</h2>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {items.map((item, idx) => (
                  <Card key={idx} className="border-border/50">
                    <CardContent className="py-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="font-semibold text-sm">
                            {item.name || item.title}
                          </h3>
                          {item.author && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              by {item.author}
                            </p>
                          )}
                          {item.note && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {item.note}
                            </p>
                          )}
                        </div>
                        {item.url && (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="shrink-0"
                          >
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1.5 text-xs h-7"
                            >
                              <ExternalLink className="h-3 w-3" />
                              Visit
                            </Button>
                          </a>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
