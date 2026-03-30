import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

export async function GET() {
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
      },
    });
  } catch {
    return NextResponse.json({ user: null });
  }
}
