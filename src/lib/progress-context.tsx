"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { tracks } from "@/lib/course-data";

export interface LastVisited {
  trackId: string;
  moduleId: string;
  lessonId: string;
  trackTitle: string;
  lessonTitle: string;
  timestamp: number;
}

export interface ActivityLogEntry {
  lessonKey: string;
  trackId: string;
  trackTitle: string;
  lessonTitle: string;
  timestamp: number;
  quizScore?: number;
  hasNotes: boolean;
  hasProof: boolean;
}

interface ProgressContextType {
  completedLessons: Set<string>;
  toggleLesson: (lessonId: string) => void;
  isCompleted: (lessonId: string) => boolean;
  isTrackUnlocked: (trackId: string) => boolean;
  isModuleUnlocked: (trackId: string, moduleId: string) => boolean;
  saveExecutionProof: (lessonId: string, proof: string) => void;
  getExecutionProof: (lessonId: string) => string;
  hasExecutionProof: (lessonId: string) => boolean;
  saveLessonNotes: (lessonId: string, notes: string) => void;
  getLessonNotes: (lessonId: string) => string;
  getTrackProgress: (trackId: string) => number;
  getFlightHours: () => number;
  getGlobalRank: () => string;
  totalCompleted: number;
  completedSteps: Set<string>;
  toggleStep: (stepId: string) => void;
  isStepCompleted: (stepId: string) => boolean;
  quizScores: Record<string, number>;
  setQuizScore: (lessonKey: string, score: number) => void;
  getQuizScore: (lessonKey: string) => number | undefined;
  lastVisited: LastVisited | null;
  setLastVisited: (v: LastVisited) => void;
  completionTimestamps: Record<string, number>;
  getStudyStreak: () => number;
  getLessonsThisWeek: () => number;
  getDailyActivity: (days: number) => { date: string; label: string; count: number }[];
  getActivityLog: () => ActivityLogEntry[];
}

const ProgressContext = createContext<ProgressContextType | undefined>(undefined);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [quizScores, setQuizScores] = useState<Record<string, number>>({});
  const [executionProofs, setExecutionProofs] = useState<Record<string, string>>({});
  const [lessonNotes, setLessonNotes] = useState<Record<string, string>>({});
  const [lastVisited, setLastVisitedState] = useState<LastVisited | null>(null);
  const [completionTimestamps, setCompletionTimestamps] = useState<Record<string, number>>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("drone-training-progress");
    if (stored) {
      try {
        setCompletedLessons(new Set(JSON.parse(stored)));
      } catch {
        // ignore invalid stored data
      }
    }
    const storedSteps = localStorage.getItem("drone-training-steps");
    if (storedSteps) {
      try {
        setCompletedSteps(new Set(JSON.parse(storedSteps)));
      } catch {
        // ignore
      }
    }
    const storedQuiz = localStorage.getItem("drone-training-quiz");
    if (storedQuiz) {
      try {
        setQuizScores(JSON.parse(storedQuiz));
      } catch {
        // ignore
      }
    }
    const storedProofs = localStorage.getItem("drone-training-proof");
    if (storedProofs) {
      try {
        setExecutionProofs(JSON.parse(storedProofs));
      } catch {
        // ignore
      }
    }
    const storedNotes = localStorage.getItem("drone-training-notes");
    if (storedNotes) {
      try {
        setLessonNotes(JSON.parse(storedNotes));
      } catch {
        // ignore
      }
    }
    const storedLastVisited = localStorage.getItem("drone-training-last-visited");
    if (storedLastVisited) {
      try {
        setLastVisitedState(JSON.parse(storedLastVisited));
      } catch {
        // ignore
      }
    }
    const storedTimestamps = localStorage.getItem("drone-training-timestamps");
    if (storedTimestamps) {
      try {
        setCompletionTimestamps(JSON.parse(storedTimestamps));
      } catch {
        // ignore
      }
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) {
      localStorage.setItem(
        "drone-training-progress",
        JSON.stringify(Array.from(completedLessons))
      );
    }
  }, [completedLessons, loaded]);

  useEffect(() => {
    if (loaded) {
      localStorage.setItem("drone-training-timestamps", JSON.stringify(completionTimestamps));
    }
  }, [completionTimestamps, loaded]);

  useEffect(() => {
    if (loaded) {
      localStorage.setItem(
        "drone-training-steps",
        JSON.stringify(Array.from(completedSteps))
      );
    }
  }, [completedSteps, loaded]);

  useEffect(() => {
    if (loaded) {
      localStorage.setItem("drone-training-quiz", JSON.stringify(quizScores));
    }
  }, [quizScores, loaded]);

  useEffect(() => {
    if (loaded) {
      localStorage.setItem("drone-training-proof", JSON.stringify(executionProofs));
    }
  }, [executionProofs, loaded]);

  useEffect(() => {
    if (loaded) {
      localStorage.setItem("drone-training-notes", JSON.stringify(lessonNotes));
    }
  }, [lessonNotes, loaded]);

  const toggleLesson = (lessonId: string) => {
    const wasCompleted = completedLessons.has(lessonId);
    setCompletedLessons((prev) => {
      const next = new Set(prev);
      if (next.has(lessonId)) {
        next.delete(lessonId);
      } else {
        next.add(lessonId);
      }
      return next;
    });
    // Record first-completion timestamp (never overwrite)
    if (!wasCompleted) {
      setCompletionTimestamps((prev) => prev[lessonId] ? prev : { ...prev, [lessonId]: Date.now() });
    }
  };

  const toggleStep = (stepId: string) => {
    setCompletedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(stepId)) {
        next.delete(stepId);
      } else {
        next.add(stepId);
      }
      return next;
    });
  };

  const isCompleted = (lessonId: string) => completedLessons.has(lessonId);
  const isStepCompleted = (stepId: string) => completedSteps.has(stepId);

  const isTrackUnlocked = (trackId: string) => {
    const trackIndex = tracks.findIndex((track) => track.id === trackId);

    if (trackIndex <= 0) {
      return true;
    }

    const previousTrack = tracks[trackIndex - 1];
    return previousTrack.modules.every((module) =>
      completedLessons.has(`${previousTrack.id}-${module.lessons[0].id}`)
    );
  };

  const isModuleUnlocked = (trackId: string, moduleId: string) => {
    const track = tracks.find((entry) => entry.id === trackId);
    if (!track || !isTrackUnlocked(trackId)) {
      return false;
    }

    const moduleIndex = track.modules.findIndex((module) => module.id === moduleId);
    if (moduleIndex <= 0) {
      return true;
    }

    const previousModule = track.modules[moduleIndex - 1];
    return completedLessons.has(`${trackId}-${previousModule.lessons[0].id}`);
  };

  const setQuizScore = (lessonKey: string, score: number) => {
    setQuizScores((prev) => ({ ...prev, [lessonKey]: score }));
  };

  const getQuizScore = (lessonKey: string) => quizScores[lessonKey];

  const saveExecutionProof = (lessonId: string, proof: string) => {
    setExecutionProofs((prev) => ({
      ...prev,
      [lessonId]: proof.trim(),
    }));
  };

  const getExecutionProof = (lessonId: string) => executionProofs[lessonId] ?? "";

  const hasExecutionProof = (lessonId: string) => getExecutionProof(lessonId).length >= 20;

  const saveLessonNotes = (lessonId: string, notes: string) => {
    setLessonNotes((prev) => ({
      ...prev,
      [lessonId]: notes,
    }));
  };

  const getLessonNotes = (lessonId: string) => lessonNotes[lessonId] ?? "";

  const setLastVisited = (v: LastVisited) => {
    setLastVisitedState(v);
    localStorage.setItem("drone-training-last-visited", JSON.stringify(v));
  };

  const getFlightHours = () => {
    // 1 completed lesson = 2.5 flight hours. 1 step = 0.2 hours.
    return (completedLessons.size * 2.5) + (completedSteps.size * 0.2);
  };

  const getGlobalRank = () => {
    const hours = getFlightHours();
    if (hours < 10) return "Ground School Cadet";
    if (hours < 50) return "Level 1 Operator";
    if (hours < 150) return "Senior Mission Commander";
    if (hours < 300) return "Edge AI Flight Master";
    return "Chief Systems Architect";
  };

  const getTrackProgress = (trackId: string) => {
    const track = tracks.find((t) => t.id === trackId);
    if (!track) return 0;
    const totalLessons = track.modules.reduce(
      (acc, mod) => acc + mod.lessons.length,
      0
    );
    if (totalLessons === 0) return 0;
    const completed = track.modules.reduce(
      (acc, mod) =>
        acc + mod.lessons.filter((l) => completedLessons.has(`${trackId}-${l.id}`)).length,
      0
    );
    return Math.round((completed / totalLessons) * 100);
  };

  const getStudyStreak = (): number => {
    const timestamps = Object.values(completionTimestamps);
    if (timestamps.length === 0) return 0;
    const toDay = (ts: number) => new Date(ts).toISOString().split("T")[0];
    const days = new Set(timestamps.map(toDay));
    const today = toDay(Date.now());
    const yesterday = toDay(Date.now() - 86400000);
    if (!days.has(today) && !days.has(yesterday)) return 0;
    let streak = 0;
    let cursor = days.has(today) ? Date.now() : Date.now() - 86400000;
    while (days.has(toDay(cursor))) {
      streak++;
      cursor -= 86400000;
    }
    return streak;
  };

  const getLessonsThisWeek = (): number => {
    const cutoff = Date.now() - 7 * 86400000;
    return Object.values(completionTimestamps).filter((ts) => ts >= cutoff).length;
  };

  const getDailyActivity = (days: number): { date: string; label: string; count: number }[] => {
    const result: { date: string; label: string; count: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const dateStr = d.toISOString().split("T")[0];
      const label = d.toLocaleDateString("en-US", { weekday: "short" });
      const count = Object.values(completionTimestamps).filter(
        (ts) => new Date(ts).toISOString().split("T")[0] === dateStr
      ).length;
      result.push({ date: dateStr, label, count });
    }
    return result;
  };

  const getActivityLog = (): ActivityLogEntry[] => {
    return Object.entries(completionTimestamps)
      .map(([lessonKey, timestamp]) => {
        const dashIdx = lessonKey.indexOf("-");
        const trackId = lessonKey.substring(0, dashIdx);
        const lessonId = lessonKey.substring(dashIdx + 1);
        const track = tracks.find((t) => t.id === trackId);
        const lesson = track?.modules.flatMap((m) => m.lessons).find((l) => l.id === lessonId);
        return {
          lessonKey,
          trackId,
          trackTitle: track?.shortTitle ?? trackId,
          lessonTitle: lesson?.title ?? lessonId,
          timestamp,
          quizScore: quizScores[lessonKey],
          hasNotes: !!(lessonNotes[lessonKey]?.trim()),
          hasProof: hasExecutionProof(lessonKey),
        };
      })
      .sort((a, b) => b.timestamp - a.timestamp);
  };

  return (
    <ProgressContext.Provider
      value={{
        completedLessons,
        toggleLesson,
        isCompleted,
        isTrackUnlocked,
        isModuleUnlocked,
        saveExecutionProof,
        getExecutionProof,
        hasExecutionProof,
        saveLessonNotes,
        getLessonNotes,
        getTrackProgress,
        getFlightHours,
        getGlobalRank,
        totalCompleted: completedLessons.size,
        completedSteps,
        toggleStep,
        isStepCompleted,
        quizScores,
        setQuizScore,
        getQuizScore,
        lastVisited,
        setLastVisited,
        completionTimestamps,
        getStudyStreak,
        getLessonsThisWeek,
        getDailyActivity,
        getActivityLog,
      }}
    >
      {children}
    </ProgressContext.Provider>
  );
}

export function useProgress() {
  const context = useContext(ProgressContext);
  if (!context) {
    throw new Error("useProgress must be used within a ProgressProvider");
  }
  return context;
}
