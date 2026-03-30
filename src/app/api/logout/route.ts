import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
  (await cookies()).set("session", "", { expires: new Date(0) });
  return NextResponse.json({ message: "Logged out" });
}
