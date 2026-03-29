"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { tracks } from "@/lib/course-data";

interface ProgressContextType {
  completedLessons: Set<string>;
  toggleLesson: (lessonId: string) => void;
  isCompleted: (lessonId: string) => boolean;
  getTrackProgress: (trackId: string) => number;
  totalCompleted: number;
}

const ProgressContext = createContext<ProgressContextType | undefined>(undefined);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());
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

  const toggleLesson = (lessonId: string) => {
    setCompletedLessons((prev) => {
      const next = new Set(prev);
      if (next.has(lessonId)) {
        next.delete(lessonId);
      } else {
        next.add(lessonId);
      }
      return next;
    });
  };

  const isCompleted = (lessonId: string) => completedLessons.has(lessonId);

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

  return (
    <ProgressContext.Provider
      value={{
        completedLessons,
        toggleLesson,
        isCompleted,
        getTrackProgress,
        totalCompleted: completedLessons.size,
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
