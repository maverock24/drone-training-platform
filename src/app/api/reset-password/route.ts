import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { ensurePasswordResetSchema } from "@/lib/password-reset";

export async function POST(req: Request) {
  try {
    const { email, temporaryPassword, newPassword } = await req.json();

    if (
      !email ||
      !temporaryPassword ||
      !newPassword ||
      typeof email !== "string" ||
      typeof temporaryPassword !== "string" ||
      typeof newPassword !== "string"
    ) {
      return NextResponse.json(
        { error: "Email, temporary password, and new password are required" },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "New password must be at least 6 characters" },
        { status: 400 }
      );
    }

    await ensurePasswordResetSchema();

    const normalizedEmail = email.trim().toLowerCase();
    const result = await db.execute({
      sql: "SELECT id, temporary_password_hash, temporary_password_expires_at FROM users WHERE email = ?",
      args: [normalizedEmail],
    });

    const user = result.rows[0];
    if (!user || !user.temporary_password_hash || !user.temporary_password_expires_at) {
      return NextResponse.json(
        { error: "Invalid or expired temporary password" },
        { status: 400 }
      );
    }

    const expiryTime = new Date(String(user.temporary_password_expires_at)).getTime();
    if (Number.isNaN(expiryTime) || expiryTime < Date.now()) {
      await db.execute({
        sql: "UPDATE users SET temporary_password_hash = NULL, temporary_password_expires_at = NULL WHERE id = ?",
        args: [user.id],
      });

      return NextResponse.json(
        { error: "Temporary password expired. Request a new one." },
        { status: 400 }
      );
    }

    const isMatch = await bcrypt.compare(
      temporaryPassword,
      String(user.temporary_password_hash)
    );

    if (!isMatch) {
      return NextResponse.json(
        { error: "Invalid or expired temporary password" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.execute({
      sql: "UPDATE users SET password = ?, temporary_password_hash = NULL, temporary_password_expires_at = NULL WHERE id = ?",
      args: [hashedPassword, user.id],
    });

    return NextResponse.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: "Unable to reset password right now" },
      { status: 500 }
    );
  }
}
