import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { Resend } from "resend";
import { db } from "@/lib/db";
import {
  ensurePasswordResetSchema,
  generateTemporaryPassword,
  getTemporaryPasswordExpiry,
  TEMP_PASSWORD_TTL_MINUTES,
} from "@/lib/password-reset";

const GENERIC_RESPONSE =
  "If that email is registered, we sent a temporary password and reset instructions.";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function getAppUrl(req: Request) {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    req.headers.get("origin") ||
    "http://localhost:3000"
  );
}

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string" || !isValidEmail(email)) {
      return NextResponse.json(
        { error: "Please provide a valid email address" },
        { status: 400 }
      );
    }

    await ensurePasswordResetSchema();

    const normalizedEmail = email.trim().toLowerCase();
    const result = await db.execute({
      sql: "SELECT id, username, email FROM users WHERE email = ?",
      args: [normalizedEmail],
    });

    const user = result.rows[0];
    if (!user) {
      return NextResponse.json({ message: GENERIC_RESPONSE });
    }

    const temporaryPassword = generateTemporaryPassword();
    const hashedTemporaryPassword = await bcrypt.hash(temporaryPassword, 10);
    const expiresAt = getTemporaryPasswordExpiry();

    await db.execute({
      sql: "UPDATE users SET temporary_password_hash = ?, temporary_password_expires_at = ? WHERE id = ?",
      args: [hashedTemporaryPassword, expiresAt, user.id],
    });

    const appUrl = getAppUrl(req);
    const resetLink = `${appUrl}/reset-password?email=${encodeURIComponent(normalizedEmail)}`;
    const resendApiKey = process.env.RESEND_API_KEY;

    if (resendApiKey) {
      const resend = new Resend(resendApiKey);

      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
        to: normalizedEmail,
        subject: "Your temporary password - DroneAI Academy",
        html: `<p>Hi ${String(user.username)},</p><p>We received a password reset request for your account.</p><p>Your temporary password is:</p><p style="font-size: 24px; font-weight: 700; letter-spacing: 0.08em;">${temporaryPassword}</p><p>This temporary password expires in ${TEMP_PASSWORD_TTL_MINUTES} minutes.</p><p>Use it here to set a new password:</p><p><a href="${resetLink}">${resetLink}</a></p><p>If you did not request this, you can ignore this email.</p>`,
      });
    } else {
      console.log("Mock password reset email to:", normalizedEmail);
      console.log("Temporary password:", temporaryPassword);
      console.log("Reset link:", resetLink);
    }

    return NextResponse.json({ message: GENERIC_RESPONSE });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Unable to process password reset right now" },
      { status: 500 }
    );
  }
}
