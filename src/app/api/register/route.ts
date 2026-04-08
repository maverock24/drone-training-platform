import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { username, password, email } = await req.json();

    if (
      !username ||
      !password ||
      !email ||
      typeof username !== "string" ||
      typeof password !== "string" ||
      typeof email !== "string"
    ) {
      return NextResponse.json(
        { error: "Username, email, and password are required" },
        { status: 400 }
      );
    }

    if (username.length < 3 || username.length > 30) {
      return NextResponse.json(
        { error: "Username must be 3-30 characters" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Please provide a valid email address" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.execute({
      sql: "INSERT INTO users (id, username, password, email, email_verified, verification_token, email_verified_at, role, created_at) VALUES (?, ?, ?, ?, ?, ?, datetime('now'), ?, datetime('now'))",
      args: [crypto.randomUUID(), username, hashedPassword, email, 1, null, "student"],
    });

    return NextResponse.json(
      { message: "Registration successful. You can now log in." },
      { status: 201 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "";

    if (message.includes("UNIQUE constraint failed: users.username")) {
      return NextResponse.json(
        { error: "Username already exists" },
        { status: 400 }
      );
    }
    if (message.includes("UNIQUE constraint failed: users.email")) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 400 }
      );
    }
    console.error("Registration error:", err);
    return NextResponse.json(
      { error: "An error occurred during registration" },
      { status: 500 }
    );
  }
}
