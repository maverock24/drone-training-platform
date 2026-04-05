import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

export async function GET() {
  // In local development, auto-authenticate as a test user
  if (process.env.NODE_ENV === "development") {
    return NextResponse.json({
      user: { userId: "dev-user", username: "testuser", role: "student" },
    });
  }

  try {
    const token = (await cookies()).get("session")?.value;

    if (!token) {
      return NextResponse.json({ user: null });
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);

    return NextResponse.json({
      user: {
        userId: payload.userId,
        username: payload.username,
        role: payload.role || "student",
      },
    });
  } catch {
    return NextResponse.json({ user: null });
  }
}
