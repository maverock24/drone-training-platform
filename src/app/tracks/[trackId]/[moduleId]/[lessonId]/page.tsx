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
  ShieldCheck,
  Clock,
  NotebookPen,
  Sparkles,
} from "lucide-react";
import { glossary, tracks } from "@/lib/course-data";
import { useProgress } from "@/lib/progress-context";
import { GlossaryText } from "@/components/glossary-text";
import { TerminalSimulator } from "@/components/terminal-simulator";
import { InteractiveArchitecture } from "@/components/interactive-architecture";
import { LessonVisualizer } from "@/components/lesson-visualizer";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Brain,
  Factory,
  Database,
  Cpu,
};

function findLessonGlossaryTerms(text: string) {
  return glossary.filter((entry) =>
    text.toLowerCase().includes(entry.term.toLowerCase())
  );
}

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
    isTrackUnlocked,
    isModuleUnlocked,
    saveExecutionProof,
    getExecutionProof,
    hasExecutionProof,
    saveLessonNotes,
    getLessonNotes,
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
  const proofSubmitted = hasExecutionProof(lessonKey);
  const Icon = iconMap[track.icon];
  const trackIndex = tracks.findIndex((entry) => entry.id === trackId);
  const previousTrack = trackIndex > 0 ? tracks[trackIndex - 1] : null;
  const trackUnlocked = isTrackUnlocked(trackId);
  const moduleUnlocked = isModuleUnlocked(trackId, moduleId);

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
  const explanationParagraphs = lesson.detailed_explanation
    .split("\n\n")
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
  const studyPath = lesson.step_by_step_guide.slice(0, 4);
  const lessonTerms = findLessonGlossaryTerms(
    [
      lesson.title,
      lesson.detailed_explanation,
      ...lesson.step_by_step_guide.map((step) => `${step.title} ${step.description}`),
      ...lesson.quiz.flatMap((question) => [question.question, ...question.options]),
    ].join(" ")
  ).slice(0, 8);

  // Per-track thumbnail images
  const trackImageMap: Record<string, string> = {
    "ai-engineer": "/track-ai-engineer.png",
    "mlops-engineer": "/track-mlops.png",
    "data-engineer": "/track-data-engineer.png",
    "edge-ai": "/track-edge-ai.png",
  };
  const trackImg = trackImageMap[trackId];
  const [proofDraft, setProofDraft] = useState("");
  const [proofStatus, setProofStatus] = useState("");
  const [notesDraft, setNotesDraft] = useState("");
  const [notesStatus, setNotesStatus] = useState("");
  const [activeTab, setActiveTab] = useState("learn");
  const estimatedMinutes = Math.max(
    12,
    lesson.step_by_step_guide.length * 6 + lesson.quiz.length * 2 + explanationParagraphs.length * 2
  );
  const allStepsCompleted = lesson.step_by_step_guide.length > 0 && completedStepCount === lesson.step_by_step_guide.length;
  const readinessItems = [
    {
      label: "Read the lesson briefing",
      done: true,
      helper: "Use the simplified overview and key terms first.",
    },
    {
      label: "Complete the hands-on steps",
      done: allStepsCompleted,
      helper: `${completedStepCount} of ${lesson.step_by_step_guide.length} steps checked off`,
    },
    {
      label: "Pass the lesson quiz",
      done: quizPassed,
      helper: quizPassed ? `Current score: ${quizScore}%` : `Need at least 70%${quizScore !== undefined ? `, current ${quizScore}%` : ""}`,
    },
    {
      label: "Submit proof of execution",
      done: proofSubmitted,
      helper: proofSubmitted ? "Proof saved for this lesson" : "Add a run summary, output, or artifact link",
    },
  ];
  const readinessPercent = Math.round(
    (readinessItems.filter((item) => item.done).length / readinessItems.length) * 100
  );
  const nextAction = !allStepsCompleted
    ? {
        label: "Continue hands-on practice",
        helper: "Finish the remaining checklist steps before moving to the quiz.",
        tab: "practice",
      }
    : !quizPassed
      ? {
          label: "Take the quiz",
          helper: "You have completed the practice work. Now verify understanding.",
          tab: "quiz",
        }
      : !proofSubmitted
        ? {
            label: "Submit execution proof",
            helper: "Save the evidence that shows you ran the exercise successfully.",
            tab: "practice",
          }
        : !completed
          ? {
              label: "Mark this lesson complete",
              helper: "All requirements are satisfied. You can unlock the next lesson now.",
              tab: "practice",
            }
          : {
              label: nextModule ? "Move to the next lesson" : "Review track progress",
              helper: nextModule ? `Up next: ${nextModule.title}` : "You have completed this lesson.",
              tab: "learn",
            };

  useEffect(() => {
    setProofDraft(getExecutionProof(lessonKey));
    setProofStatus("");
  }, [lessonKey, getExecutionProof]);

  useEffect(() => {
    setNotesDraft(getLessonNotes(lessonKey));
    setNotesStatus("");
  }, [lessonKey, getLessonNotes]);

  if (!trackUnlocked || !moduleUnlocked) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <Link href={`/tracks/${trackId}`}>
          <Button variant="ghost" size="sm" className="gap-2 mb-6 -ml-2">
            <ArrowLeft className="h-4 w-4" />
            Back to {track.shortTitle}
          </Button>
        </Link>

        <Card className="border-amber-500/30 bg-gradient-to-r from-amber-500/10 to-background">
          <CardContent className="py-8 flex flex-col items-center gap-4 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10">
              <HelpCircle className="h-7 w-7 text-amber-500" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Lesson Locked</h2>
              <p className="mt-1 text-sm text-muted-foreground max-w-md">
                {!trackUnlocked && previousTrack
                  ? `Finish ${previousTrack.title} before entering this track.`
                  : prevModule
                    ? `Complete ${prevModule.title} before opening ${lesson.title}.`
                    : "Complete the required earlier content before continuing."}
              </p>
            </div>
            <Link href={!trackUnlocked && previousTrack ? `/tracks/${previousTrack.id}` : `/tracks/${trackId}`}>
              <Button className="gap-2">
                {!trackUnlocked && previousTrack ? "Continue Previous Track" : "Back to Track"}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

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
            <Badge variant="secondary" className="text-xs gap-1">
              <Clock className="h-3 w-3" />
              ~{estimatedMinutes} min
            </Badge>
            {completed ? (
              <Badge variant="outline" className="ml-auto gap-1.5 text-xs h-7 border-emerald-500/50 text-emerald-500">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Completed
              </Badge>
            ) : quizPassed && proofSubmitted ? (
              <Button
                size="sm"
                variant="default"
                className="ml-auto gap-1.5 text-xs h-7"
                onClick={() => toggleLesson(lessonKey)}
              >
                Mark Complete
                <CheckCircle2 className="h-3.5 w-3.5" />
              </Button>
            ) : quizPassed ? (
              <Badge variant="outline" className="ml-auto gap-1.5 text-xs h-7 text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5" />
                Submit proof to complete
              </Badge>
            ) : (
              <Badge variant="outline" className="ml-auto gap-1.5 text-xs h-7 text-muted-foreground">
                <HelpCircle className="h-3.5 w-3.5" />
                Pass the quiz and submit proof
              </Badge>
            )}
          </div>
        </div>
      </div>

      <Card className="mb-6 border-border/50 bg-gradient-to-br from-background to-muted/30">
        <CardHeader className="pb-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Sparkles className="h-5 w-5 text-primary" />
                Lesson Readiness Board
              </CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Keep moving in order: practice, quiz, proof, then completion.
              </p>
            </div>
            <div className="min-w-40">
              <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                <span>Readiness</span>
                <span>{readinessPercent}%</span>
              </div>
              <Progress value={readinessPercent} className="h-2" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-3 md:grid-cols-2">
            {readinessItems.map((item) => (
              <div key={item.label} className="rounded-lg border border-border/40 bg-muted/20 p-4">
                <div className="flex items-start gap-3">
                  {item.done ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                  ) : (
                    <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/40" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-foreground">{item.label}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{item.helper}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border/40 bg-muted/20 p-4">
            <div>
              <p className="text-sm font-medium text-foreground">Next best action</p>
              <p className="mt-1 text-sm text-muted-foreground">{nextAction.helper}</p>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setActiveTab(nextAction.tab)}>
                {nextAction.label}
              </Button>
              {!completed && quizPassed && proofSubmitted && (
                <Button type="button" onClick={() => toggleLesson(lessonKey)}>
                  Complete Lesson
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
        <TabsList className="grid w-full grid-cols-4">
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
          <TabsTrigger value="notes" className="gap-2">
            <NotebookPen className="h-4 w-4" />
            Notes
          </TabsTrigger>
        </TabsList>

        {/* Learn tab */}
        <TabsContent value="learn" className="mt-6">
          <LessonVisualizer lesson={lesson} />
          
          <Card className="mb-6 border-border/50 bg-gradient-to-br from-muted/40 to-background">
            <CardHeader>
              <CardTitle className="text-lg">Beginner Briefing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p className="leading-relaxed">
                This lesson keeps the exact engineering terms, but the goal is simple: understand what the system does, why it matters for drones, and what actions you should practice next.
              </p>
              <p className="leading-relaxed">
                Start with the study path below, then read the explanation in small sections, and finish by reviewing the quiz questions before opening the quiz tab.
              </p>
            </CardContent>
          </Card>

          <Card className="mb-6 border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Study Path</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {studyPath.map((step) => (
                  <div key={step.step} className="rounded-lg border border-border/40 bg-muted/20 p-4">
                    <p className="text-sm font-medium text-foreground">
                      Step {step.step}: {step.title}
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      <GlossaryText text={step.description} />
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {lessonTerms.length > 0 && (
            <Card className="mb-6 border-border/50">
              <CardHeader>
                <CardTitle className="text-lg">Key Terms Used in This Lesson</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {lessonTerms.map((term) => (
                    <div key={term.term} className="rounded-lg border border-border/40 bg-muted/20 p-4">
                      <p className="text-sm font-semibold text-foreground">{term.term}</p>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                        {term.definition}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Detailed Explanation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm leading-relaxed text-muted-foreground">
                Read this section one paragraph at a time. When you see a technical term, connect it back to the key-term definitions above and ask how it affects perception, decision-making, or deployment on a real drone system.
              </p>
              <div className="prose prose-invert prose-sm max-w-none">
                {explanationParagraphs.map((para, i) => (
                  <p key={i} className="text-sm text-muted-foreground leading-relaxed mb-4">
                    <GlossaryText text={para} />
                  </p>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="mt-6 border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Quiz Preview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm leading-relaxed text-muted-foreground">
                Review these questions before you take the quiz. If you can explain why each answer choice is correct or incorrect, you are ready for the assessment.
              </p>
              {lesson.quiz.map((question, index) => (
                <div key={question.question} className="rounded-lg border border-border/40 bg-muted/20 p-4">
                  <p className="text-sm font-medium leading-relaxed text-foreground">
                    {index + 1}. <GlossaryText text={question.question} />
                  </p>
                  <ul className="mt-3 ml-4 list-disc space-y-2 text-sm text-muted-foreground">
                    {question.options.map((option) => (
                      <li key={option}>
                        <GlossaryText text={option} />
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Intelligent Architecture Injection based on lesson ID */}
          {(lesson.id.includes('architecture') || lesson.id.includes('hardware')) && (
             <InteractiveArchitecture />
          )}
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
                          <GlossaryText text={step.description} />
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

          <Card className="mt-6 border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Execution Proof</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm leading-relaxed text-muted-foreground">
                Paste evidence that you completed the practical work for this lesson. Include command output, a short run summary, observed results, or a link to your artifact. This proof is required before the lesson can unlock the next area.
              </p>
              <textarea
                value={proofDraft}
                onChange={(event) => setProofDraft(event.target.value)}
                className="min-h-36 w-full rounded-lg border border-border/60 bg-muted/20 px-3 py-3 text-sm transition-colors placeholder:text-muted-foreground/60 focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="Example: Ran the ViT example with python vit_demo.py, confirmed output tensor shape [1,10], and compared CLIP image-text similarity scores for forest vs power line scenes."
              />
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  type="button"
                  className="gap-2"
                  onClick={() => {
                    const trimmedProof = proofDraft.trim();
                    if (trimmedProof.length < 20) {
                      setProofStatus("Please provide at least a short execution summary or output snippet before saving proof.");
                      return;
                    }

                    saveExecutionProof(lessonKey, trimmedProof);
                    setProofStatus("Proof saved. Once your quiz is passed, you can mark this lesson complete.");
                  }}
                >
                  <ShieldCheck className="h-4 w-4" />
                  Save proof
                </Button>
                {proofSubmitted && (
                  <Badge variant="outline" className="gap-1 border-sky-500/50 text-sky-500">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Proof submitted
                  </Badge>
                )}
              </div>
              {proofStatus && (
                <p className="text-sm text-muted-foreground">{proofStatus}</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Quiz tab */}
        <TabsContent value="quiz" className="mt-6">
          <QuizSection
            questions={lesson.quiz}
            lessonKey={lessonKey}
            savedScore={getQuizScore(lessonKey)}
            onComplete={(score, passed) => {
              setQuizScore(lessonKey, score);
            }}
          />
        </TabsContent>

        <TabsContent value="notes" className="mt-6">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Personal Lesson Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm leading-relaxed text-muted-foreground">
                Keep short notes in your own words: what the concept means, what confused you, and what result proved the exercise worked. These notes are saved locally for this lesson.
              </p>
              <textarea
                value={notesDraft}
                onChange={(event) => setNotesDraft(event.target.value)}
                className="min-h-48 w-full rounded-lg border border-border/60 bg-muted/20 px-3 py-3 text-sm transition-colors placeholder:text-muted-foreground/60 focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="Example: Self-attention lets the model compare image patches with each other. In this lab the proof was the output shape and the similarity ranking from CLIP. I still need to review why positional embeddings are necessary."
              />
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2"
                  onClick={() => {
                    saveLessonNotes(lessonKey, notesDraft);
                    setNotesStatus(notesDraft.trim() ? "Notes saved for this lesson." : "Notes cleared for this lesson.");
                  }}
                >
                  <NotebookPen className="h-4 w-4" />
                  Save notes
                </Button>
                {notesDraft.trim() && (
                  <Badge variant="outline" className="gap-1 border-primary/40 text-primary">
                    <NotebookPen className="h-3.5 w-3.5" />
                    {notesDraft.trim().split(/\s+/).length} words
                  </Badge>
                )}
              </div>
              {notesStatus && (
                <p className="text-sm text-muted-foreground">{notesStatus}</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ─── Next-up card (shown when lesson is completed) ─── */}
      {completed && nextModule && (
        <div className="mt-8">
          <Card className="border-emerald-500/30 bg-gradient-to-r from-emerald-500/5 to-emerald-500/10">
            <CardContent className="py-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Lesson complete! Up next</p>
                  <p className="text-sm font-semibold truncate">{nextModule.title}</p>
                </div>
              </div>
              <Link
                href={`/tracks/${trackId}/${nextModule.id}/${nextModule.lessons[0].id}`}
                className="shrink-0"
              >
                <Button size="sm" className="gap-2 bg-emerald-600 hover:bg-emerald-700">
                  Next Lesson
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Track complete card */}
      {completed && !nextModule && (
        <div className="mt-8">
          <Card className="border-violet-500/30 bg-gradient-to-r from-violet-500/5 to-cyan-500/5">
            <CardContent className="py-6 text-center">
              <div className="text-3xl mb-2">🎉</div>
              <h3 className="font-bold text-lg mb-1">Track Complete!</h3>
              <p className="text-sm text-muted-foreground mb-4">
                You've finished every lesson in <span className="text-foreground font-medium">{track.shortTitle}</span>.
              </p>
              <div className="flex gap-3 justify-center">
                <Link href={`/tracks/${trackId}`}>
                  <Button variant="outline" size="sm">View Track</Button>
                </Link>
                <Link href="/grand-project">
                  <Button size="sm" className="gap-2 border-0 bg-gradient-to-r from-violet-600 to-cyan-600">
                    Grand Project
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

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
  const correctCount = submitted
    ? questions.filter((q, idx) => answers[idx] === q.answer).length
    : 0;

  return (
    <div>
      {submitted && (
        <Card className="mb-6 border-border/50">
          <CardContent className="py-6 text-center">
            <div
              className={`text-4xl font-bold mb-1 ${
                score >= 70 ? "text-emerald-500" : "text-amber-500"
              }`}
            >
              {score}%
            </div>
            <p className="text-sm text-muted-foreground mb-1">
              {correctCount} / {questions.length} correct
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              {score >= 70
                ? "Great job! You passed this quiz."
                : score >= 40
                ? "Almost there — review the lesson and try again."
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
