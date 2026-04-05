import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import { db } from "@/db/index";
import { enrollments, lessonProgress } from "@/db/schema";
import { eq, and } from "drizzle-orm";

async function getUserId(): Promise<string | null> {
  const token = (await cookies()).get("session")?.value;
  if (!token) return null;
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return payload.userId as string;
  } catch {
    return null;
  }
}

export async function GET() {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userEnrollments = await db
    .select()
    .from(enrollments)
    .where(eq(enrollments.userId, userId));

  // For each enrollment, calculate completion percentage
  const enriched = await Promise.all(
    userEnrollments.map(async (enrollment) => {
      const progress = await db
        .select()
        .from(lessonProgress)
        .where(
          and(
            eq(lessonProgress.userId, userId),
            eq(lessonProgress.trackId, enrollment.trackId)
          )
        );
      const completed = progress.filter((p) => p.status === "completed").length;
      const total = progress.length;
      return {
        ...enrollment,
        completedLessons: completed,
        totalLessons: total,
        completionPercent: total > 0 ? Math.round((completed / total) * 100) : 0,
      };
    })
  );

  return NextResponse.json({ success: true, enrollments: enriched });
}

export async function POST(req: Request) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { track_id } = body;

  if (!track_id || typeof track_id !== "string") {
    return NextResponse.json(
      { error: "track_id is required" },
      { status: 400 }
    );
  }

  // Check for existing enrollment
  const existing = await db
    .select()
    .from(enrollments)
    .where(
      and(eq(enrollments.userId, userId), eq(enrollments.trackId, track_id))
    );

  if (existing.length > 0) {
    return NextResponse.json(
      { error: "Already enrolled in this track" },
      { status: 409 }
    );
  }

  const result = await db.insert(enrollments).values({
    userId,
    trackId: track_id,
    enrolledAt: new Date().toISOString(),
  }).returning();

  return NextResponse.json({ success: true, enrollment: result[0] }, { status: 201 });
}
