export interface LessonSection {
  id: string;
  title: string;
  type: "theory" | "code" | "exercise" | "quiz" | "summary";
  content: string;
  code?: string;
  language?: string;
}

export interface LessonContent {
  lessonId: string;
  trackId: string;
  moduleId: string;
  objectives: string[];
  prerequisites: string[];
  sections: LessonSection[];
  keyTakeaways: string[];
  resources: { title: string; url: string }[];
}
