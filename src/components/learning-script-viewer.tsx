"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  Lightbulb,
} from "lucide-react";
import { GlossaryText } from "@/components/glossary-text";
import type { LearningScriptPage } from "@/lib/course-data";

interface LearningScriptViewerProps {
  pages: LearningScriptPage[];
  lessonKey: string;
}

export function LearningScriptViewer({ pages, lessonKey }: LearningScriptViewerProps) {
  const [currentPage, setCurrentPage] = useState(0);

  if (!pages || pages.length === 0) {
    return (
      <Card className="border-border/50 bg-gradient-to-br from-muted/40 to-background">
        <CardContent className="py-16 flex flex-col items-center gap-4 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/50">
            <Lightbulb className="h-7 w-7 text-muted-foreground/50" />
          </div>
          <div>
            <h3 className="text-lg font-bold">Learning Script Coming Soon</h3>
            <p className="mt-1 text-sm text-muted-foreground max-w-md">
              A comprehensive 10-page learning script for this lesson is being prepared. Check back soon for in-depth coverage of all concepts and quiz explanations.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const page = pages[currentPage];
  const totalPages = pages.length;
  const isFirst = currentPage === 0;
  const isLast = currentPage === totalPages - 1;

  const contentParagraphs = page.content
    .split("\n\n")
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <div className="space-y-6" key={`${lessonKey}-page-${currentPage}`}>
      {/* Page navigation header */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          disabled={isFirst}
          aria-label="Previous page"
          onClick={() => setCurrentPage((p) => p - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>

        <div className="flex items-center gap-1.5">
          {pages.map((_, idx) => (
            <button
              key={idx}
              aria-label={`Go to page ${idx + 1}`}
              className={`h-2 w-2 rounded-full transition-colors ${
                idx === currentPage
                  ? "bg-primary"
                  : "bg-muted-foreground/25 hover:bg-muted-foreground/40"
              }`}
              onClick={() => setCurrentPage(idx)}
            />
          ))}
        </div>

        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          disabled={isLast}
          aria-label="Next page"
          onClick={() => setCurrentPage((p) => p + 1)}
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Page content card */}
      <Card className="border-border/50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="text-xs shrink-0">
              Page {page.page} of {totalPages}
            </Badge>
            <CardTitle className="text-lg leading-snug">{page.title}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {contentParagraphs.map((para, i) => {
            if (para.startsWith("###")) {
              return (
                <h3
                  key={i}
                  className="text-sm font-bold text-foreground mt-6 mb-2 flex items-center gap-2"
                >
                  <span className="inline-block h-4 w-1 rounded-full bg-primary" />
                  {para.replace(/^#+\s*/, "")}
                </h3>
              );
            }
            if (para.startsWith("- ") || para.includes("\n- ")) {
              const items = para
                .split("\n")
                .map((line) => line.replace(/^-\s*/, "").trim())
                .filter(Boolean);
              return (
                <ul key={i} className="space-y-1.5 ml-2">
                  {items.map((item, j) => (
                    <li key={j} className="flex gap-2 text-sm leading-relaxed text-muted-foreground">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/40" />
                      <GlossaryText text={item} />
                    </li>
                  ))}
                </ul>
              );
            }
            return (
              <p key={i} className="text-sm leading-relaxed text-muted-foreground">
                <GlossaryText text={para} />
              </p>
            );
          })}
        </CardContent>
      </Card>

      {/* Key takeaways */}
      {page.key_takeaways && page.key_takeaways.length > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Lightbulb className="h-4 w-4 text-primary" />
              Key Takeaways
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {page.key_takeaways.map((takeaway, i) => (
                <li key={i} className="flex gap-2 text-sm leading-relaxed text-muted-foreground">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
                  {takeaway}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Bottom navigation */}
      <div className="flex items-center justify-between pt-2">
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          disabled={isFirst}
          aria-label="Previous page"
          onClick={() => setCurrentPage((p) => p - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>

        <span className="text-xs text-muted-foreground">
          Page {page.page} of {totalPages}
        </span>

        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          disabled={isLast}
          aria-label="Next page"
          onClick={() => setCurrentPage((p) => p + 1)}
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
