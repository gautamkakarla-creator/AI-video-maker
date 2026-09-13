import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) return NextResponse.json({ error: "REPLICATE_API_TOKEN is not configured in Vercel." }, { status: 500 });
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing prediction id." }, { status: 400 });
  const response = await fetch(`https://api.replicate.com/v1/predictions/${encodeURIComponent(id)}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  const data = await response.json();
  if (!response.ok) return NextResponse.json({ error: data?.detail || data?.error || "Status check failed." }, { status: response.status });
  return NextResponse.json({ id: data.id, status: data.status, output: typeof data.output === "string" ? data.output : null, error: data.error || null });
}
