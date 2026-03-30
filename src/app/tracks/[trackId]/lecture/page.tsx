"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Brain,
  Factory,
  Database,
  Cpu,
  ArrowLeft,
  BookOpen,
  ScrollText,
} from "lucide-react";
import { tracks } from "@/lib/course-data";

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

  if (!track || !track.lecture) {
    notFound();
  }

  const Icon = iconMap[track.icon];

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

      {/* Rendered markdown content */}
      <article className="prose prose-invert prose-sm max-w-none">
        <MarkdownContent content={track.lecture} />
      </article>

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
