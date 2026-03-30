import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    if (
      !username ||
      !password ||
      typeof username !== "string" ||
      typeof password !== "string"
    ) {
      return NextResponse.json(
        { error: "Username and password are required" },
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

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.execute({
      sql: "INSERT INTO users (id, username, password) VALUES (?, ?, ?)",
      args: [crypto.randomUUID(), username, hashedPassword],
    });

    return NextResponse.json({ message: "User created" }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "User already exists" },
      { status: 400 }
    );
  }
}
