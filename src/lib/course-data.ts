import trainingData from "../../courses/drone_training.json";
import aiEngineerLecture from "../../courses/ai_engineer.json";
import mlPlatformLecture from "../../courses/ml_platform_engineer.json";
import dataEngineerLecture from "../../courses/data_engineer.json";
import edgeEngineerLecture from "../../courses/edge_engineer.json";

// --- Types matching the JSON schema ---

export interface QuizQuestion {
  question: string;
  options: string[];
  answer: string;
}

export interface Step {
  step: number;
  title: string;
  description: string;
  code?: string;
}

export interface Lesson {
  id: string;
  title: string;
  detailed_explanation: string;
  step_by_step_guide: Step[];
  quiz: QuizQuestion[];
}

export interface Module {
  id: string;
  title: string;
  description: string;
  lessons: Lesson[];
}

export interface Track {
  id: string;
  title: string;
  shortTitle: string;
  description: string;
  prerequisites: string;
  icon: string;
  color: string;
  gradient: string;
  modules: Module[];
  lecture?: string;
}

export interface GlossaryTerm {
  term: string;
  definition: string;
}

export interface GrandProjectComponent {
  track: string;
  contribution: string;
}

export interface GrandProjectMaterial {
  title: string;
  url: string;
}

export interface GrandProject {
  name: string;
  description: string;
  components: GrandProjectComponent[];
  learning_materials: GrandProjectMaterial[];
}

export interface HardwareComponent {
  name: string;
  role: string;
  buy_link?: string;
  documentation?: string;
  note?: string;
}

export interface HardwareSetup {
  description: string;
  components: HardwareComponent[];
  utilization_by_track: Record<string, string>;
  safety_note: string;
  week1_setup_guide: {
    title: string;
    steps: string[];
  };
}

export interface Resource {
  name?: string;
  title?: string;
  url?: string;
  note?: string;
  author?: string;
}

export interface Resources {
  simulators: Resource[];
  communities: Resource[];
  books: Resource[];
}

// --- Slug generation ---

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// --- Track metadata mapping ---

const trackMeta: Record<
  string,
  { shortTitle: string; icon: string; color: string; gradient: string }
> = {
  "AI Engineer (Generalist)": {
    shortTitle: "AI Engineer",
    icon: "Brain",
    color: "text-violet-500",
    gradient: "from-violet-600 to-purple-600",
  },
  "ML Platform Engineer (MLOps)": {
    shortTitle: "MLOps Engineer",
    icon: "Factory",
    color: "text-cyan-500",
    gradient: "from-cyan-600 to-blue-600",
  },
  "Data Engineer (Geospatial & Sensor Fusion)": {
    shortTitle: "Data Engineer",
    icon: "Database",
    color: "text-emerald-500",
    gradient: "from-emerald-600 to-teal-600",
  },
  "Edge AI Engineer": {
    shortTitle: "Edge AI",
    icon: "Cpu",
    color: "text-orange-500",
    gradient: "from-orange-600 to-red-600",
  },
};

const defaultMeta = {
  shortTitle: "Track",
  icon: "BookOpen",
  color: "text-gray-500",
  gradient: "from-gray-600 to-gray-600",
};

// --- Lecture mapping: track name → essay content ---

const trackLectures: Record<string, string> = {
  "AI Engineer (Generalist)": aiEngineerLecture.ai_engineer_essay,
  "ML Platform Engineer (MLOps)": mlPlatformLecture.ml_platform_engineer_essay,
  "Data Engineer (Geospatial & Sensor Fusion)": dataEngineerLecture.data_engineer_essay,
  "Edge AI Engineer": edgeEngineerLecture.edge_ai_engineer_essay,
};

// --- Transform JSON data into app types ---

function transformTrack(raw: (typeof trainingData.tracks)[number]): Track {
  const meta = trackMeta[raw.name] || defaultMeta;
  const id = slugify(meta.shortTitle);

  const modules: Module[] = raw.lessons.map((lesson, idx) => ({
    id: slugify(lesson.title).substring(0, 50),
    title: lesson.title,
    description:
      lesson.detailed_explanation.length > 200
        ? lesson.detailed_explanation.substring(0, 200) + "…"
        : lesson.detailed_explanation,
    lessons: [
      {
        id: `lesson-${idx + 1}`,
        title: lesson.title,
        detailed_explanation: lesson.detailed_explanation,
        step_by_step_guide: lesson.step_by_step_guide,
        quiz: lesson.quiz,
      },
    ],
  }));

  return {
    id,
    title: raw.name,
    shortTitle: meta.shortTitle,
    description: raw.focus,
    prerequisites: raw.prerequisites,
    icon: meta.icon,
    color: meta.color,
    gradient: meta.gradient,
    modules,
    lecture: trackLectures[raw.name],
  };
}

// --- Exported data ---

export const tracks: Track[] = trainingData.tracks.map(transformTrack);

export const glossary: GlossaryTerm[] = trainingData.glossary;

export const grandProject: GrandProject = trainingData.grand_project;

export const hardwareSetup: HardwareSetup = trainingData.hardware_setup;

export const resources: Resources = trainingData.resources;

export const overview: string = trainingData.overview;

// --- Helper functions ---

export function getTotalLessons(): number {
  return tracks.reduce(
    (acc, track) =>
      acc +
      track.modules.reduce((mAcc, mod) => mAcc + mod.lessons.length, 0),
    0
  );
}

export function getTotalSteps(): number {
  return tracks.reduce(
    (acc, track) =>
      acc +
      track.modules.reduce(
        (mAcc, mod) =>
          mAcc +
          mod.lessons.reduce(
            (lAcc, lesson) => lAcc + lesson.step_by_step_guide.length,
            0
          ),
        0
      ),
    0
  );
}

export function getTotalQuizQuestions(): number {
  return tracks.reduce(
    (acc, track) =>
      acc +
      track.modules.reduce(
        (mAcc, mod) =>
          mAcc +
          mod.lessons.reduce(
            (lAcc, lesson) => lAcc + lesson.quiz.length,
            0
          ),
        0
      ),
    0
  );
}

export function getTotalDuration(): string {
  // Approximate hours based on step count (~1h per step)
  const total = getTotalSteps();
  return `${total}h`;
}

export function getTrackBySlug(slug: string): Track | undefined {
  return tracks.find((t) => t.id === slug);
}

export function getLesson(
  trackId: string,
  moduleId: string,
  lessonId: string
): { track: Track; module: Module; lesson: Lesson } | undefined {
  const track = tracks.find((t) => t.id === trackId);
  if (!track) return undefined;
  const mod = track.modules.find((m) => m.id === moduleId);
  if (!mod) return undefined;
  const lesson = mod.lessons.find((l) => l.id === lessonId);
  if (!lesson) return undefined;
  return { track, module: mod, lesson };
}
