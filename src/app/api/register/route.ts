import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { Resend } from "resend";

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

    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      console.warn("RESEND_API_KEY is not configured.");
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomUUID();

    await db.execute({
      sql: "INSERT INTO users (id, username, password, email, email_verified, verification_token, role, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))",
      args: [crypto.randomUUID(), username, hashedPassword, email, 0, verificationToken, "student"],
    });

    if (resendApiKey) {
      const resend = new Resend(resendApiKey);
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || (req.headers.get("origin") || "http://localhost:3000");
      const verifyLink = `${appUrl}/api/verify-email?token=${verificationToken}`;

      try {
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
          to: email,
          subject: "Verify your email - DroneAI Academy",
          html: `<p>Hi ${username},</p><p>Please verify your email address by clicking the link below:</p><p><a href="${verifyLink}">${verifyLink}</a></p>`,
        });
      } catch (emailError) {
        console.error("Failed to send verification email:", emailError);
        // We still return success for creation, the user will just have to request another email later or we might alert them.
        // In a real app we'd have a 'resend verification' button.
      }
    } else {
      console.log("Mock sending verification email to:", email);
      console.log("Verification Token:", verificationToken);
    }

    return NextResponse.json({ message: "Registration successful. Please check your email to verify your account." }, { status: 201 });
  } catch (err: any) {
    if (err?.message?.includes("UNIQUE constraint failed: users.username")) {
      return NextResponse.json(
        { error: "Username already exists" },
        { status: 400 }
      );
    }
    if (err?.message?.includes("UNIQUE constraint failed: users.email")) {
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
