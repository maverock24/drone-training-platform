import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "No token provided" }, { status: 400 });
  }

  try {
    const result = await db.execute({
      sql: "SELECT * FROM users WHERE verification_token = ?",
      args: [token],
    });

    const user = result.rows[0];

    if (!user) {
      return NextResponse.json(
        { error: "Invalid verification token" },
        { status: 400 }
      );
    }

    if (user.email_verified) {
      // Return a redirect anyway if already verified
      const baseUrl = req.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "";
      return NextResponse.redirect(`${baseUrl}/login?verified=1`);
    }

    await db.execute({
      sql: "UPDATE users SET email_verified = 1, verification_token = NULL WHERE id = ?",
      args: [user.id],
    });

    const baseUrl = req.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "";
    return NextResponse.redirect(`${baseUrl}/login?verified=1`);

  } catch (error) {
    console.error("Verification error:", error);
    return NextResponse.json(
      { error: "An error occurred during verification" },
      { status: 500 }
    );
  }
}
