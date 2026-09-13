"use client";

import { useMemo, useState } from "react";

type Scene = { id: number; title: string; duration: string; shot: string; color: string };

const themes = ["🍓 Viral Fruit", "👻 Horror", "🧠 Facts", "🐶 Animals", "🍔 Food", "💰 Money", "🏎️ Cars", "✨ Custom"];
const initial: Scene[] = [
  { id: 1, title: "The hook", duration: "0–3s", shot: "Extreme close-up", color: "pink" },
  { id: 2, title: "The reveal", duration: "3–7s", shot: "Medium tracking shot", color: "orange" },
  { id: 3, title: "The twist", duration: "7–12s", shot: "Wide then close-up", color: "purple" },
  { id: 4, title: "The payoff", duration: "12–17s", shot: "Hero close-up", color: "blue" },
  { id: 5, title: "The loop", duration: "17–20s", shot: "Fast push-in", color: "green" },
];

const HF_SPACE = "https://lightricks-ltx-video-distilled.hf.space";
const NEGATIVE = "worst quality, blurry, jittery, distorted, inconsistent motion, watermark";

function extractVideoUrl(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === "string") {
    if (value.startsWith("http")) return value;
    if (value.includes(".mp4") || value.includes("/tmp/") || value.startsWith("/")) {
      return `${HF_SPACE}${value.startsWith("/") ? value : `/${value}`}`;
    }
    return null;
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = extractVideoUrl(item);
      if (found) return found;
    }
  }
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    for (const key of ["url", "video", "path", "name", "file", "value"]) {
      const found = extractVideoUrl(obj[key]);
      if (found) return found;
    }
  }
  return null;
}

export default function Home() {
  const [theme, setTheme] = useState(themes[0]);
  const [prompt, setPrompt] = useState("A strawberry discovers a secret fruit world");
  const [scenes, setScenes] = useState(initial);
  const [active, setActive] = useState(1);
  const [generating, setGenerating] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const activeScene = useMemo(() => scenes.find((s) => s.id === active) ?? scenes[0], [active, scenes]);

  async function generate() {
    if (!prompt.trim()) {
      setError("Please enter a video idea first.");
      return;
    }

    setGenerating(true);
    setVideoUrl("");
    setError("");
    setStatus("Joining the free AI video queue…");

    try {
      // LTX Video is hosted on Hugging Face ZeroGPU. This browser-side call avoids
      // Replicate billing and avoids Vercel function timeouts while the GPU works.
      const start = await fetch(`${HF_SPACE}/gradio_api/call/text_to_video`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: [
            prompt.trim(),
            NEGATIVE,
            null,
            null,
            896,
            512,
            "text-to-video",
            3,
            9,
            42,
            true,
            1,
            false,
          ],
        }),
      });

      const startText = await start.text();
      if (!start.ok) {
        throw new Error(startText || `Hugging Face returned ${start.status}.`);
      }

      const startData = JSON.parse(startText);
      const eventId = startData.event_id;
      if (!eventId) throw new Error("The free video queue did not return a job ID.");

      setStatus("AI is generating your video… this can take a little while on the free GPU.");

      const result = await fetch(`${HF_SPACE}/gradio_api/call/text_to_video/${encodeURIComponent(eventId)}`);
      if (!result.ok || !result.body) {
        throw new Error(`Could not connect to the free GPU result stream (${result.status}).`);
      }

      const reader = result.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let output: string | null = null;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const events = buffer.split("\n\n");
        buffer = events.pop() || "";

        for (const event of events) {
          const dataLine = event.split("\n").find((line) => line.startsWith("data:"));
          if (!dataLine) continue;
          const raw = dataLine.slice(5).trim();
          if (!raw) continue;

          let parsed: unknown;
          try {
            parsed = JSON.parse(raw);
          } catch {
            continue;
          }

          if (event.includes("error")) {
            throw new Error(typeof parsed === "string" ? parsed : "The free AI video service failed.");
          }

          const found = extractVideoUrl(parsed);
          if (found) output = found;
          if (event.includes("complete")) setStatus("Finalising your video…");
        }
      }

      if (!output) throw new Error("The AI finished but did not return an MP4 video. Please try again.");
      setVideoUrl(output);
      setStatus("Video ready! 🎉");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong while generating the video.");
      setStatus("");
    } finally {
      setGenerating(false);
    }
  }

  function regenerate() {
    setScenes((s) => s.map((x) => (x.id === active ? { ...x, title: "Fresh variation", shot: "Dynamic close-up" } : x)));
  }

  return <main className="shell">
    <aside className="sidebar">
      <div className="brand"><div className="logo">✦</div><div><b>AI Video Maker</b><small>Creator Studio</small></div></div>
      <button className="new">＋ New project</button>
      <nav>{["✦ Create", "▣ Projects", "◈ Characters", "◉ Assets", "↗ Export"].map((x) => <button className="nav" key={x}>{x}</button>)}</nav>
      <div className="tools"><small>TOOLS</small><button className="nav">🖼️ Image generator</button><button className="nav">🎙️ Voice</button><button className="nav">📝 Script writer</button></div>
      <div className="credits">Free GPU <b>ZeroGPU</b><div className="meter"><i /></div><small>No Replicate credits needed</small></div>
    </aside>

    <section className="workspace">
      <header><span>CREATE / <b>{theme}</b></span><div><button>⌘ K</button><button>Help</button><button className="export" onClick={() => videoUrl && window.open(videoUrl, "_blank")}>Export video ↗</button></div></header>
      <div className="content">
        <div className="hero"><div><small>AI CREATOR STUDIO</small><h1>Make videos people <em>can’t scroll past.</em></h1><p>Build consistent AI stories for TikTok theme pages — from idea to storyboard to video.</p></div><span>● Free AI ready</span></div>
        <div className="themes"><small>CHOOSE A NICHE</small>{themes.map((t) => <button className={theme === t ? "selected" : ""} onClick={() => setTheme(t)} key={t}>{t}</button>)}</div>

        <div className="grid">
          <section className="panel">
            <div className="head"><h2><i>01</i> Describe your video</h2><span>Free AI</span></div>
            <label>VIDEO IDEA</label>
            <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} />
            <div className="controls"><select defaultValue="Viral / Fast"><option>Viral / Fast</option><option>Cinematic</option><option>Funny</option></select><select defaultValue="3s"><option>3s</option><option>5s</option><option>8s</option></select><select defaultValue="9:16"><option>9:16</option><option>1:1</option><option>16:9</option></select></div>
            <button className="generate" onClick={generate} disabled={generating}>{generating ? status || "Generating…" : "Generate free video ✦"}</button>
            <p style={{ color: "#999", marginTop: 10, fontSize: 12 }}>Uses Hugging Face ZeroGPU. Free queues can be busy and have daily limits.</p>
            {error && <p style={{ color: "#ff7070", marginTop: 12 }}>{error}</p>}
            {videoUrl && <p style={{ color: "#70ffb0", marginTop: 12 }}>✓ Video generated successfully</p>}
          </section>

          <section className="panel preview">
            <div className="head"><h2><i>02</i> Preview</h2><span>9:16</span></div>
            <div className="phone">{videoUrl ? <video src={videoUrl} controls autoPlay loop playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <><div className={`visual ${activeScene.color}`}><div className="fruit">🍓</div><b>{activeScene.title.toUpperCase()}</b></div><strong>WAIT UNTIL YOU SEE<br />WHAT HAPPENS NEXT 👀</strong><small>♡ 24.8K　💬 1,284　↗ Share</small></>}</div>
            <div className="score"><span>VIRAL SCORE</span><b>87</b><small>/100</small><div><i /></div><p>{videoUrl ? "Your AI video is ready to preview and export." : "Strong hook potential. Consider a bigger twist at 7s."}</p></div>
          </section>
        </div>

        <section className="panel storyboard"><div className="head"><h2><i>03</i> Storyboard <small>5 shots · 20s</small></h2><button onClick={regenerate}>↻ Regenerate scene</button></div><div className="scenes">{scenes.map((s) => <button className={active === s.id ? "scene active" : "scene"} onClick={() => setActive(s.id)} key={s.id}><div className={`art ${s.color}`}><span>{s.id}</span>🍓</div><b>{s.title}<small>{s.duration}</small></b><small>{s.shot}</small></button>)}</div></section>

        <div className="bottom"><section className="panel"><div className="head"><h2><i>04</i> Characters</h2><button>＋ Add</button></div><div className="character">🍓 <div><b>Strawberry Hero</b><small>Consistent character · Used in 5 scenes</small></div></div></section><section className="panel"><div className="head"><h2><i>05</i> Sound & captions</h2></div><div className="setting">🎙️ AI voice <select><option>Energetic male</option><option>Energetic female</option></select></div><div className="setting">🎵 Background <select><option>Trending upbeat</option><option>Cinematic</option></select></div><div className="setting">💬 Captions <b>●</b></div></section></div>
      </div>
    </section>
  </main>;
}
