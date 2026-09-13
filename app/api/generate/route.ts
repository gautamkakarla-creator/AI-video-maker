import { NextResponse } from "next/server";

const MODEL = "wan-video/wan-2.2-5b-fast";

export async function POST(request: Request) {
  try {
    const token = process.env.REPLICATE_API_TOKEN;
    if (!token) {
      return NextResponse.json(
        { error: "REPLICATE_API_TOKEN is not configured in Vercel." },
        { status: 500 }
      );
    }

    const body = await request.json();
    const prompt = String(body.prompt || "").trim();
    const aspectRatio = body.aspectRatio === "16:9" ? "16:9" : "9:16";

    if (!prompt) {
      return NextResponse.json({ error: "Please enter a video idea." }, { status: 400 });
    }

    const response = await fetch(
      `https://api.replicate.com/v1/models/${MODEL}/predictions`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          input: {
            prompt,
            go_fast: true,
            num_frames: 121,
            resolution: "480p",
            aspect_ratio: aspectRatio,
            sample_shift: 5,
            frames_per_second: 24,
          },
        }),
      }
    );

    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json(
        { error: data?.detail || data?.error || "Video generation failed." },
        { status: response.status }
      );
    }

    return NextResponse.json({ id: data.id, status: data.status });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Could not start video generation." }, { status: 500 });
  }
}
