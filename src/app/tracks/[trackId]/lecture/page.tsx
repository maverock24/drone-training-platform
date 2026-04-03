"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Brain,
  Factory,
  Database,
  Cpu,
  ArrowLeft,
  BookOpen,
  ScrollText,
  HelpCircle,
  Lock,
} from "lucide-react";
import { tracks } from "@/lib/course-data";
import { useProgress } from "@/lib/progress-context";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Brain,
  Factory,
  Database,
  Cpu,
};

export default function LecturePage({
  params,
}: {
  params: Promise<{ trackId: string }>;
}) {
  const { trackId } = use(params);
  const track = tracks.find((t) => t.id === trackId);
  const { isTrackUnlocked } = useProgress();

  if (!track || !track.lecture) {
    notFound();
  }

  const Icon = iconMap[track.icon];
  const trackIndex = tracks.findIndex((entry) => entry.id === trackId);
  const previousTrack = trackIndex > 0 ? tracks[trackIndex - 1] : null;
  const trackUnlocked = isTrackUnlocked(track.id);
  const beginnerGuide = track.modules.map((module) => {
    const lesson = module.lessons[0];
    const practiceSteps = lesson.step_by_step_guide
      .slice(0, 3)
      .map((step) => step.title);

    return {
      id: module.id,
      title: module.title,
      description: module.description,
      practiceSteps,
    };
  });
  const quizQuestions = track.modules.flatMap((module) =>
    module.lessons.flatMap((lesson) =>
      lesson.quiz.map((question, index) => ({
        id: `${module.id}-${lesson.id}-${index + 1}`,
        moduleTitle: module.title,
        lessonTitle: lesson.title,
        question: question.question,
        options: question.options,
      }))
    )
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      {/* Back nav */}
      <Link href={`/tracks/${trackId}`}>
        <Button variant="ghost" size="sm" className="gap-2 mb-6 -ml-2">
          <ArrowLeft className="h-4 w-4" />
          {track.shortTitle}
        </Button>
      </Link>

      {/* Header */}
      <div className="flex items-start gap-4 mb-8">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${track.gradient}`}
        >
          {Icon && <Icon className="h-6 w-6 text-white" />}
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="text-xs gap-1">
              <ScrollText className="h-3 w-3" />
              Lecture
            </Badge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {track.shortTitle} Lecture
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            In-depth reading material for the {track.title} track
          </p>
        </div>
      </div>

      <Separator className="mb-8" />

      {!trackUnlocked && previousTrack ? (
        <Card className="border-amber-500/30 bg-gradient-to-r from-amber-500/10 to-background">
          <CardContent className="py-8 flex flex-col items-center gap-4 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10">
              <Lock className="h-7 w-7 text-amber-500" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Lecture Locked</h2>
              <p className="mt-1 text-sm text-muted-foreground max-w-md">
                Finish {previousTrack.title} before opening this lecture.
              </p>
            </div>
            <Link href={`/tracks/${previousTrack.id}`}>
              <Button className="gap-2">
                Continue Previous Track
                <BookOpen className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>

      <Card className="mb-8 border-border/50 bg-gradient-to-br from-muted/40 to-background">
        <CardHeader>
          <CardTitle className="text-lg">Beginner Study Guide</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p className="leading-relaxed">
            This lecture keeps the exact technical terms used in the curriculum, but it is organized so a beginner can follow the big picture first. Read the roadmap below, then go through the lecture, and finally use the quiz questions at the end as your self-check.
          </p>
          <p className="leading-relaxed">
            Focus on three things while reading: what each term means, why it matters for drones, and what practical step helps you use that idea in real work.
          </p>
        </CardContent>
      </Card>

      <div className="space-y-4 mb-8">
        {beginnerGuide.map((module, index) => (
          <Card key={module.id} className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                {index + 1}. {module.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm leading-relaxed text-muted-foreground">
                {module.description}
              </p>
              {module.practiceSteps.length > 0 && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-foreground/80 mb-2">
                    Practice path
                  </p>
                  <ul className="ml-4 list-disc space-y-2 text-sm text-muted-foreground">
                    {module.practiceSteps.map((stepTitle) => (
                      <li key={stepTitle}>{stepTitle}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Rendered markdown content */}
      <div className="mb-3 flex items-center gap-2">
        <ScrollText className="h-4 w-4 text-muted-foreground" />
        <p className="text-sm font-medium">Lecture Notes</p>
      </div>
      <article className="prose prose-invert prose-sm max-w-none">
        <MarkdownContent content={track.lecture} />
      </article>

      <Separator className="my-8" />

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <HelpCircle className="h-5 w-5" />
            Quiz Questions for This Lecture
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-sm leading-relaxed text-muted-foreground">
            Use these questions after reading to check whether the main ideas are clear. The questions below are gathered from every lesson in this track.
          </p>
          {quizQuestions.map((item, index) => (
            <div key={item.id} className="rounded-lg border border-border/50 bg-muted/20 p-4">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  Question {index + 1}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {item.moduleTitle}
                </Badge>
              </div>
              <p className="text-sm font-medium leading-relaxed text-foreground">
                {item.question}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Source lesson: {item.lessonTitle}
              </p>
              <ul className="mt-3 ml-4 list-disc space-y-2 text-sm text-muted-foreground">
                {item.options.map((option) => (
                  <li key={option}>{option}</li>
                ))}
              </ul>
            </div>
          ))}
        </CardContent>
      </Card>
        </>
      )}

      {/* Bottom nav */}
      <Separator className="my-10" />
      <div className="flex items-center justify-between">
        <Link href={`/tracks/${trackId}`}>
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Track
          </Button>
        </Link>
        {track.modules.length > 0 && (
          <Link
            href={`/tracks/${trackId}/${track.modules[0].id}/${track.modules[0].lessons[0].id}`}
          >
            <Button className="gap-2">
              <BookOpen className="h-4 w-4" />
              Start Lessons
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}

// --- Simple markdown renderer for lecture essays ---

function MarkdownContent({ content }: { content: string }) {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Horizontal rule
    if (/^---+$/.test(line.trim())) {
      elements.push(
        <Separator key={`hr-${i}`} className="my-8" />
      );
      i++;
      continue;
    }

    // Headers
    if (line.startsWith("# ")) {
      elements.push(
        <h1 key={`h1-${i}`} className="text-3xl font-bold tracking-tight mt-10 mb-4">
          {line.slice(2)}
        </h1>
      );
      i++;
      continue;
    }
    if (line.startsWith("## ")) {
      elements.push(
        <h2 key={`h2-${i}`} className="text-2xl font-bold tracking-tight mt-10 mb-3">
          {line.slice(3)}
        </h2>
      );
      i++;
      continue;
    }
    if (line.startsWith("### ")) {
      elements.push(
        <h3 key={`h3-${i}`} className="text-xl font-semibold mt-8 mb-2">
          {line.slice(4)}
        </h3>
      );
      i++;
      continue;
    }

    // Unordered list items
    if (line.startsWith("- ")) {
      const items: { key: number; text: string }[] = [];
      while (i < lines.length && lines[i].startsWith("- ")) {
        items.push({ key: i, text: lines[i].slice(2) });
        i++;
      }
      elements.push(
        <ul key={`ul-${items[0].key}`} className="my-4 ml-4 space-y-2 list-disc list-outside">
          {items.map((item) => (
            <li key={item.key} className="text-sm text-muted-foreground leading-relaxed pl-1">
              <InlineMarkdown text={item.text} />
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // Empty line
    if (line.trim() === "") {
      i++;
      continue;
    }

    // Regular paragraph
    elements.push(
      <p key={`p-${i}`} className="text-sm text-muted-foreground leading-relaxed mb-4">
        <InlineMarkdown text={line} />
      </p>
    );
    i++;
  }

  return <>{elements}</>;
}

// --- Inline markdown: bold and italic ---

function InlineMarkdown({ text }: { text: string }) {
  // Process **bold** and *italic* patterns
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*(.+?)\*\*)|(\*(.+?)\*)/g;
  let lastIdx = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    // Text before match
    if (match.index > lastIdx) {
      parts.push(text.slice(lastIdx, match.index));
    }
    if (match[2]) {
      // Bold
      parts.push(
        <strong key={match.index} className="font-semibold text-foreground">
          {match[2]}
        </strong>
      );
    } else if (match[4]) {
      // Italic
      parts.push(
        <em key={match.index}>{match[4]}</em>
      );
    }
    lastIdx = match.index + match[0].length;
  }

  // Remaining text
  if (lastIdx < text.length) {
    parts.push(text.slice(lastIdx));
  }

  return <>{parts}</>;
}
