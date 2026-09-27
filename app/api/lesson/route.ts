import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/supabase/server";
import { getLessonsForUser } from "@/services/lesson";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const lessons = await getLessonsForUser(user.userId);
    return NextResponse.json({ lessons });
  } catch (error) {
    console.error("lesson failed", error);
    return NextResponse.json(
      { error: "We couldn't load your lesson right now. Please try again." },
      { status: 500 }
    );
  }
}