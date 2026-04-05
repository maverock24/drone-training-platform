import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import { db } from "@/db/index";
import { lessonProgress, enrollments } from "@/db/schema";
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

  const progress = await db
    .select()
    .from(lessonProgress)
    .where(eq(lessonProgress.userId, userId));

  const userEnrollments = await db
    .select()
    .from(enrollments)
    .where(eq(enrollments.userId, userId));

  return NextResponse.json({ success: true, progress, enrollments: userEnrollments });
}

export async function POST(req: Request) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { track_id, module_id, lesson_id, status, score } = body;

  if (!track_id || !module_id || !lesson_id || !status) {
    return NextResponse.json(
      { error: "track_id, module_id, lesson_id, and status are required" },
      { status: 400 }
    );
  }

  if (!["not_started", "in_progress", "completed"].includes(status)) {
    return NextResponse.json(
      { error: "status must be not_started, in_progress, or completed" },
      { status: 400 }
    );
  }

  // Upsert: try to find existing, then insert or update
  const existing = await db
    .select()
    .from(lessonProgress)
    .where(
      and(
        eq(lessonProgress.userId, userId),
        eq(lessonProgress.trackId, track_id),
        eq(lessonProgress.moduleId, module_id),
        eq(lessonProgress.lessonId, lesson_id)
      )
    );

  if (existing.length > 0) {
    await db
      .update(lessonProgress)
      .set({
        status,
        score: score ?? existing[0].score,
        completedAt: status === "completed" ? new Date().toISOString() : existing[0].completedAt,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(lessonProgress.id, existing[0].id));

    const updated = await db
      .select()
      .from(lessonProgress)
      .where(eq(lessonProgress.id, existing[0].id));

    return NextResponse.json({ success: true, progress: updated[0] });
  }

  const result = await db.insert(lessonProgress).values({
    userId,
    trackId: track_id,
    moduleId: module_id,
    lessonId: lesson_id,
    status,
    score: score ?? null,
    completedAt: status === "completed" ? new Date().toISOString() : null,
    updatedAt: new Date().toISOString(),
  }).returning();

  return NextResponse.json({ success: true, progress: result[0] }, { status: 201 });
}

export async function PATCH(req: Request) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { id, status, score } = body;

  if (!id || !status) {
    return NextResponse.json(
      { error: "id and status are required" },
      { status: 400 }
    );
  }

  // Verify ownership
  const existing = await db
    .select()
    .from(lessonProgress)
    .where(and(eq(lessonProgress.id, id), eq(lessonProgress.userId, userId)));

  if (existing.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await db
    .update(lessonProgress)
    .set({
      status,
      score: score ?? existing[0].score,
      completedAt: status === "completed" ? new Date().toISOString() : existing[0].completedAt,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(lessonProgress.id, id));

  const updated = await db
    .select()
    .from(lessonProgress)
    .where(eq(lessonProgress.id, id));

  return NextResponse.json({ success: true, progress: updated[0] });
}
