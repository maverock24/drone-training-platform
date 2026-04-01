"use client";

import { use, useState, useEffect } from "react";
import Image from "next/image";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Brain,
  Factory,
  Database,
  Cpu,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Code,
  HelpCircle,
  CheckCircle2,
  Circle,
  XCircle,
  Copy,
  Check,
} from "lucide-react";
import { tracks } from "@/lib/course-data";
import { useProgress } from "@/lib/progress-context";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Brain,
  Factory,
  Database,
  Cpu,
};

export default function LessonPage({
  params,
}: {
  params: Promise<{ trackId: string; moduleId: string; lessonId: string }>;
}) {
  const { trackId, moduleId, lessonId } = use(params);
  const {
    isCompleted,
    toggleLesson,
    isStepCompleted,
    toggleStep,
    getQuizScore,
    setQuizScore,
    setLastVisited,
  } = useProgress();

  const track = tracks.find((t) => t.id === trackId);
  if (!track) notFound();

  const mod = track.modules.find((m) => m.id === moduleId);
  if (!mod) notFound();

  const lesson = mod.lessons.find((l) => l.id === lessonId);
  if (!lesson) notFound();

  // Record last-visited lesson
  useEffect(() => {
    setLastVisited({
      trackId,
      moduleId,
      lessonId,
      trackTitle: track.shortTitle,
      lessonTitle: lesson.title,
      timestamp: Date.now(),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trackId, moduleId, lessonId]);

  const lessonKey = `${trackId}-${lessonId}`;
  const completed = isCompleted(lessonKey);
  const quizScore = getQuizScore(lessonKey);
  const quizPassed = quizScore !== undefined && quizScore >= 70;
  const Icon = iconMap[track.icon];

  // Find previous/next module for navigation
  const moduleIdx = track.modules.findIndex((m) => m.id === moduleId);
  const prevModule = moduleIdx > 0 ? track.modules[moduleIdx - 1] : null;
  const nextModule =
    moduleIdx < track.modules.length - 1
      ? track.modules[moduleIdx + 1]
      : null;

  // Step completion tracking
  const completedStepCount = lesson.step_by_step_guide.filter((s) =>
    isStepCompleted(`${lessonKey}-step-${s.step}`)
  ).length;
  const stepProgress = Math.round(
    (completedStepCount / lesson.step_by_step_guide.length) * 100
  );

  // Per-track thumbnail images
  const trackImageMap: Record<string, string> = {
    "ai-engineer": "/track-ai-engineer.png",
    "mlops-engineer": "/track-mlops.png",
    "data-engineer": "/track-data-engineer.png",
    "edge-ai": "/track-edge-ai.png",
  };
  const trackImg = trackImageMap[trackId];

  return (
    <div className="relative">
      {/* Subtle track image strip */}
      {trackImg && (
        <div className="relative h-16 overflow-hidden border-b border-border/30">
          <Image
            src={trackImg}
            alt=""
            fill
            className="object-cover object-center"
            aria-hidden="true"
            quality={60}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/40 to-background" />
          <div className={`absolute inset-0 bg-gradient-to-r ${track.gradient} opacity-10`} />
        </div>
      )}

    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      {/* Back nav */}
      <Link href={`/tracks/${trackId}`}>
        <Button variant="ghost" size="sm" className="gap-2 mb-6 -ml-2">
          <ArrowLeft className="h-4 w-4" />
          {track.shortTitle}
        </Button>
      </Link>

      {/* Lesson header */}
      <div className="flex items-start gap-4 mb-6">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${track.gradient}`}
        >
          {Icon && <Icon className="h-6 w-6 text-white" />}
        </div>
        <div className="min-w-0 flex-1">
          <Badge variant="outline" className="text-xs mb-2">
            Module {moduleIdx + 1}
          </Badge>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {lesson.title}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Badge variant="secondary" className="text-xs">
              {lesson.step_by_step_guide.length} Steps
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {lesson.quiz.length} Quiz Questions
            </Badge>
            {completed ? (
              <Badge variant="outline" className="ml-auto gap-1.5 text-xs h-7 border-emerald-500/50 text-emerald-500">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Completed
              </Badge>
            ) : quizPassed ? (
              <Button
                size="sm"
                variant="default"
                className="ml-auto gap-1.5 text-xs h-7"
                onClick={() => toggleLesson(lessonKey)}
              >
                Mark Complete
                <CheckCircle2 className="h-3.5 w-3.5" />
              </Button>
            ) : (
              <Badge variant="outline" className="ml-auto gap-1.5 text-xs h-7 text-muted-foreground">
                <HelpCircle className="h-3.5 w-3.5" />
                Pass the quiz to complete
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Content tabs */}
      <Tabs defaultValue="learn" className="mt-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="learn" className="gap-2">
            <BookOpen className="h-4 w-4" />
            Learn
          </TabsTrigger>
          <TabsTrigger value="practice" className="gap-2">
            <Code className="h-4 w-4" />
            Practice
          </TabsTrigger>
          <TabsTrigger value="quiz" className="gap-2">
            <HelpCircle className="h-4 w-4" />
            Quiz
          </TabsTrigger>
        </TabsList>

        {/* Learn tab */}
        <TabsContent value="learn" className="mt-6">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Detailed Explanation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-invert prose-sm max-w-none">
                {lesson.detailed_explanation.split("\n\n").map((para, i) => (
                  <p key={i} className="text-sm text-muted-foreground leading-relaxed mb-4">
                    {para}
                  </p>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Practice tab */}
        <TabsContent value="practice" className="mt-6">
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="font-medium">
                Step Progress: {completedStepCount} / {lesson.step_by_step_guide.length}
              </span>
              <span className="text-muted-foreground">{stepProgress}%</span>
            </div>
            <Progress value={stepProgress} className="h-2" />
          </div>

          <div className="space-y-4">
            {lesson.step_by_step_guide.map((step) => {
              const stepKey = `${lessonKey}-step-${step.step}`;
              const stepDone = isStepCompleted(stepKey);

              return (
                <Card key={step.step} className="border-border/50">
                  <CardHeader className="pb-3">
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => toggleStep(stepKey)}
                        className="mt-0.5 shrink-0"
                      >
                        {stepDone ? (
                          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                        ) : (
                          <Circle className="h-5 w-5 text-muted-foreground/40" />
                        )}
                      </button>
                      <div>
                        <CardTitle className="text-base">
                          Step {step.step}: {step.title}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  {step.code && (
                    <CardContent className="pt-0">
                      <CodeBlock code={step.code} />
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Quiz tab */}
        <TabsContent value="quiz" className="mt-6">
          <QuizSection
            questions={lesson.quiz}
            lessonKey={lessonKey}
            savedScore={getQuizScore(lessonKey)}
            onComplete={(score, passed) => {
              setQuizScore(lessonKey, score);
              if (passed && !completed) {
                toggleLesson(lessonKey);
              }
            }}
          />
        </TabsContent>
      </Tabs>

      {/* Navigation */}
      <Separator className="my-10" />
      <div className="flex items-center justify-between">
        {prevModule ? (
          <Link
            href={`/tracks/${trackId}/${prevModule.id}/${prevModule.lessons[0].id}`}
          >
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Previous Lesson
            </Button>
          </Link>
        ) : (
          <div />
        )}
        {nextModule ? (
          <Link
            href={`/tracks/${trackId}/${nextModule.id}/${nextModule.lessons[0].id}`}
          >
            <Button variant="ghost" className="gap-2">
              Next Lesson
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        ) : (
          <Link href={`/tracks/${trackId}`}>
            <Button variant="outline" className="gap-2">
              Back to Track
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        )}
      </div>
    </div>
    </div>
  );
}

// --- Code Block with copy button ---

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group">
      <button
        onClick={handleCopy}
        className="absolute top-3 right-3 p-1.5 rounded-md bg-muted/80 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        {copied ? (
          <Check className="h-4 w-4 text-emerald-500" />
        ) : (
          <Copy className="h-4 w-4 text-muted-foreground" />
        )}
      </button>
      <pre className="overflow-x-auto rounded-lg bg-muted/50 border border-border/30 p-4 text-xs leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}

// --- Quiz Section ---

function QuizSection({
  questions,
  lessonKey,
  savedScore,
  onComplete,
}: {
  questions: { question: string; options: string[]; answer: string }[];
  lessonKey: string;
  savedScore: number | undefined;
  onComplete: (score: number, passed: boolean) => void;
}) {
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(savedScore !== undefined);
  const [score, setScore] = useState(savedScore ?? 0);

  const handleSelect = (questionIdx: number, option: string) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [questionIdx]: option }));
  };

  const handleSubmit = () => {
    let correct = 0;
    questions.forEach((q, idx) => {
      if (answers[idx] === q.answer) correct++;
    });
    const finalScore = Math.round((correct / questions.length) * 100);
    setScore(finalScore);
    setSubmitted(true);
    onComplete(finalScore, finalScore >= 70);
  };

  const handleRetry = () => {
    setAnswers({});
    setSubmitted(false);
    setScore(0);
  };

  const answeredCount = Object.keys(answers).length;

  return (
    <div>
      {submitted && (
        <Card className="mb-6 border-border/50">
          <CardContent className="py-6 text-center">
            <div
              className={`text-4xl font-bold mb-2 ${
                score >= 70 ? "text-emerald-500" : "text-amber-500"
              }`}
            >
              {score}%
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              {score >= 70
                ? "Great job! You passed this quiz."
                : "Keep studying and try again!"}
            </p>
            <Button variant="outline" size="sm" onClick={handleRetry}>
              Retry Quiz
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {questions.map((q, idx) => {
          const selected = answers[idx];
          const isCorrect = submitted && selected === q.answer;
          const isWrong = submitted && selected !== q.answer && selected !== undefined;

          return (
            <Card key={idx} className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">
                  <span className="text-muted-foreground mr-2">Q{idx + 1}.</span>
                  {q.question}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {q.options.map((option) => {
                    const isSelected = selected === option;
                    const isAnswer = option === q.answer;

                    let borderClass = "border-border/30 hover:border-border";
                    if (submitted) {
                      if (isAnswer) borderClass = "border-emerald-500/50 bg-emerald-500/5";
                      else if (isSelected && !isAnswer)
                        borderClass = "border-red-500/50 bg-red-500/5";
                      else borderClass = "border-border/20 opacity-50";
                    } else if (isSelected) {
                      borderClass = "border-primary bg-primary/5";
                    }

                    return (
                      <button
                        key={option}
                        onClick={() => handleSelect(idx, option)}
                        disabled={submitted}
                        className={`w-full text-left rounded-lg border p-3 text-sm transition-colors ${borderClass}`}
                      >
                        <div className="flex items-center gap-2">
                          {submitted && isAnswer && (
                            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                          )}
                          {submitted && isSelected && !isAnswer && (
                            <XCircle className="h-4 w-4 shrink-0 text-red-500" />
                          )}
                          {!submitted && isSelected && (
                            <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                          )}
                          {!submitted && !isSelected && (
                            <Circle className="h-4 w-4 shrink-0 text-muted-foreground/30" />
                          )}
                          <span>{option}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {!submitted && (
        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {answeredCount} / {questions.length} answered
          </p>
          <Button
            onClick={handleSubmit}
            disabled={answeredCount < questions.length}
          >
            Submit Quiz
          </Button>
        </div>
      )}
    </div>
  );
}
