import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import { db } from "@/db/index";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

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

  const result = await db
    .select({
      id: users.id,
      username: users.username,
      email: users.email,
      role: users.role,
      fullName: users.fullName,
      avatarUrl: users.avatarUrl,
      locale: users.locale,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, userId));

  if (result.length === 0) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, profile: result[0] });
}

export async function PATCH(req: Request) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { full_name, avatar_url, locale } = body;

  const updateData: Record<string, string> = {};
  if (typeof full_name === "string") updateData.fullName = full_name.trim();
  if (typeof avatar_url === "string") updateData.avatarUrl = avatar_url.trim();
  if (typeof locale === "string" && ["en", "de", "fr", "es", "it", "nl"].includes(locale)) {
    updateData.locale = locale;
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json(
      { error: "No valid fields to update" },
      { status: 400 }
    );
  }

  await db.update(users).set(updateData).where(eq(users.id, userId));

  const updated = await db
    .select({
      id: users.id,
      username: users.username,
      email: users.email,
      role: users.role,
      fullName: users.fullName,
      avatarUrl: users.avatarUrl,
      locale: users.locale,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, userId));

  return NextResponse.json({ success: true, profile: updated[0] });
}
