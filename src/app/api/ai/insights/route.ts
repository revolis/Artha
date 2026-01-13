import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body?.prompt) {
    return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
  }

  return NextResponse.json({
    reply: "Gemini integration pending. Send aggregated numbers + notes only."
  });
}
