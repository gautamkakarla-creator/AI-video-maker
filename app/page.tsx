"use client";

import { useMemo, useState } from "react";

type Scene = { id: number; title: string; duration: string; shot: string; color: string };
const themes = ["🍓 Viral Fruit", "👻 Horror", "🧠 Facts", "🐶 Animals", "🍔 Food", "💰 Money", "🏎️ Cars", "✨ Custom"];
const initial: Scene[] = [
  { id: 1, title: "The hook", duration: "0–3s", shot: "Extreme close-up + push-in", color: "pink" },
  { id: 2, title: "The reveal", duration: "3–7s", shot: "Tracking movement", color: "orange" },
  { id: 3, title: "The twist", duration: "7–12s", shot: "Wide action shot", color: "purple" },
  { id: 4, title: "The payoff", duration: "12–17s", shot: "Dynamic hero shot", color: "blue" },
  { id: 5, title: "The loop", duration: "17–20s", shot: "Fast push-in", color: "green" },
];
const HF_SPACE = "https://lightricks-ltx-2-distilled.hf.space";

function extractVideoUrl(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === "string") {
    if (/^https?:\/\//i.test(value)) return value;
    if (/\.(mp4|webm|mov)(?:$|\?)/i.test(value) || value.startsWith("/tmp/")) return `${HF_SPACE}/gradio_api/file=${value.startsWith("/") ? value : `/${value}`}`;
    return null;
  }
  if (Array.isArray(value)) { for (const item of value) { const found = extractVideoUrl(item); if (found) return found; } }
  if (typeof value === "object") { const obj = value as Record<string, unknown>; for (const key of ["url", "video", "path", "name", "orig_name", "file", "value"]) { const found = extractVideoUrl(obj[key]); if (found) return found; } }
  return null;
}

function buildPrompt(theme: string, idea: string, style: string) {
  const movement = style === "Cinematic" ? "slow cinematic dolly-in, natural walking, head turns, blinking, cloth and environmental movement" : style === "Funny" ? "fast expressive body movement, clear reactions, animated facial expressions and quick camera movement" : "continuous walking or gesturing, blinking, turning, reacting, camera tracking and moving environment";
  return `Create a REAL MOVING AUDIO-VISUAL VIDEO for a viral vertical TikTok. IDEA: ${idea}. NICHE: ${theme}. ACTION: ${movement}. Generate synchronized natural audio including character speech, sound effects and background music. If a character speaks, make the spoken words audible and synchronize the character's mouth, jaw and facial expressions to the speech with visible natural lip movement. Keep the character identity consistent. The subject must visibly move from the first frame to the last. Use a strong hook, clear action, surprising reveal and memorable ending. Cinematic lighting, realistic motion, temporal consistency, detailed textures, 9:16 portrait composition.`;
}

export default function Home() {
  const [theme, setTheme] = useState(themes[0]);
  const [prompt, setPrompt] = useState("A strawberry discovers a secret fruit world and says, 'Whoa, I've never seen anything like this!' ");
  const [style, setStyle] = useState("Viral / Fast");
  const [duration, setDuration] = useState("5s");
  const [scenes, setScenes] = useState(initial);
  const [active, setActive] = useState(1);
  const [generating, setGenerating] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const activeScene = useMemo(() => scenes.find((s) => s.id === active) ?? scenes[0], [active, scenes]);

  async function generate() {
    if (!prompt.trim()) { setError("Describe what you want to happen first."); return; }
    setGenerating(true); setVideoUrl(""); setError(""); setStatus("Joining the audio-video AI queue…");
    try {
      const seconds = Number.parseFloat(duration) || 5;
      const data = [null, buildPrompt(theme, prompt.trim(), style), seconds, true, Math.floor(Math.random() * 2147483647), true, 896, 512];
      const start = await fetch(`${HF_SPACE}/gradio_api/call/generate_video`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ data }) });
      const startText = await start.text();
      if (!start.ok) throw new Error(startText || `Hugging Face returned ${start.status}.`);
      const eventId = JSON.parse(startText).event_id;
      if (!eventId) throw new Error("The audio-video queue did not return a job ID.");
      setStatus("Generating moving video + audio + speech…");
      const result = await fetch(`${HF_SPACE}/gradio_api/call/generate_video/${encodeURIComponent(eventId)}`);
      if (!result.ok || !result.body) throw new Error(`The free GPU result stream failed (${result.status}).`);
      const reader = result.body.getReader(); const decoder = new TextDecoder(); let buffer = ""; let output: string | null = null;
      while (true) {
        const { value, done } = await reader.read(); if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split("\n\n"); buffer = events.pop() || "";
        for (const event of events) {
          const line = event.split("\n").find((x) => x.startsWith("data:")); if (!line) continue;
          const raw = line.slice(5).trim(); if (!raw) continue;
          let parsed: unknown; try { parsed = JSON.parse(raw); } catch { continue; }
          if (event.includes("error")) throw new Error(typeof parsed === "string" ? parsed : "The audio-video model failed. Try again when the queue is less busy.");
          const found = extractVideoUrl(parsed); if (found) output = found;
          if (event.includes("generating")) setStatus("Rendering frames and synchronized audio…");
          if (event.includes("complete")) setStatus("Finishing the MP4 with audio…");
        }
      }
      if (!output) throw new Error("The model finished without returning a playable MP4.");
      setVideoUrl(output); setStatus("Video + audio ready! 🎉");
    } catch (e) { setError(e instanceof Error ? e.message : "Generation failed. Please try again."); setStatus(""); }
    finally { setGenerating(false); }
  }

  function regenerate() { setScenes((s) => s.map((x) => x.id === active ? { ...x, title: "Fresh variation", shot: "Dynamic tracking shot + camera move" } : x)); }
  function newProject() { setPrompt(""); setVideoUrl(""); setError(""); setStatus(""); setScenes(initial); setActive(1); }

  return <main className="shell">
    <aside className="sidebar"><div className="brand"><div className="logo">✦</div><div><b>AI Video Maker</b><small>Creator Studio</small></div></div><button className="new" onClick={newProject}>＋ New project</button><nav>{["✦ Create", "▣ Projects", "◈ Characters", "◉ Assets", "↗ Export"].map((x) => <button className="nav" key={x}>{x}</button>)}</nav><div className="tools"><small>TOOLS</small><button className="nav">🖼️ Image generator</button><button className="nav">🎙️ Voice & audio</button><button className="nav">📝 Script writer</button></div><div className="credits">Free GPU <b>ZeroGPU</b><div className="meter"><i /></div><small>Audio + video • no Replicate billing</small></div></aside>
    <section className="workspace"><header><span>CREATE / <b>{theme}</b></span><div><button>⌘ K</button><button>Help</button><button className="export" disabled={!videoUrl} onClick={() => videoUrl && window.open(videoUrl, "_blank")}>Export video ↗</button></div></header><div className="content">
      <div className="hero"><div><small>AI CREATOR STUDIO</small><h1>Make videos people <em>can’t scroll past.</em></h1><p>Generate moving video with synchronized audio, speech and lip-sync-focused animation.</p></div><span>● Audio + video AI</span></div>
      <div className="themes"><small>CHOOSE A NICHE</small>{themes.map((t) => <button className={theme === t ? "selected" : ""} onClick={() => setTheme(t)} key={t}>{t}</button>)}</div>
      <div className="grid"><section className="panel"><div className="head"><h2><i>01</i> Describe your video</h2><span>Audio-Video AI</span></div><label>VIDEO IDEA + DIALOGUE</label><textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Describe the scene and put dialogue in quotes…" /><div className="controls"><select value={style} onChange={(e) => setStyle(e.target.value)}><option>Viral / Fast</option><option>Cinematic</option><option>Funny</option></select><select value={duration} onChange={(e) => setDuration(e.target.value)}><option>3s</option><option>5s</option><option>8s</option></select><select defaultValue="9:16"><option>9:16</option><option>1:1</option><option>16:9</option></select></div><button className="generate" onClick={generate} disabled={generating}>{generating ? status || "Generating…" : "Generate video + audio ✦"}</button><p style={{ color: "#999", marginTop: 10, fontSize: 12 }}>Powered by LTX-2 Audio-Video. The model generates sound with the video and the prompt requests synchronized speech movement.</p>{error && <p style={{ color: "#ff7070", marginTop: 12 }}>{error}</p>}{videoUrl && <p style={{ color: "#70ffb0", marginTop: 12 }}>✓ MP4 generated with audio</p>}</section>
      <section className="panel preview"><div className="head"><h2><i>02</i> Preview</h2><span>9:16 · 🔊</span></div><div className="phone">{videoUrl ? <video key={videoUrl} src={videoUrl} controls autoPlay loop playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <><div className={`visual ${activeScene.color}`}><div className="fruit">🍓</div><b>{activeScene.title.toUpperCase()}</b></div><strong>WAIT UNTIL YOU SEE<br />WHAT HAPPENS NEXT 👀</strong><small>♡ 24.8K　💬 1,284　↗ Share</small></>}</div><div className="score"><span>VIRAL SCORE</span><b>94</b><small>/100</small><div><i /></div><p>{videoUrl ? "Audio-video ready. The MP4 includes generated sound." : "Strong hook potential. Add a short spoken line for a talking-character clip."}</p></div></section></div>
      <section className="panel storyboard"><div className="head"><h2><i>03</i> Storyboard <small>5 shots · 20s</small></h2><button onClick={regenerate}>↻ Regenerate scene</button></div><div className="scenes">{scenes.map((s) => <button className={active === s.id ? "scene active" : "scene"} onClick={() => setActive(s.id)} key={s.id}><div className={`art ${s.color}`}><span>{s.id}</span>🍓</div><b>{s.title}<small>{s.duration}</small></b><small>{s.shot}</small></button>)}</div></section>
      <div className="bottom"><section className="panel"><div className="head"><h2><i>04</i> Characters</h2><button>＋ Add</button></div><div className="character">🍓 <div><b>Strawberry Hero</b><small>Consistent character · Speech animation ready</small></div></div></section><section className="panel"><div className="head"><h2><i>05</i> Sound & captions</h2></div><div className="setting">🎙️ Generated speech <b>●</b></div><div className="setting">🔊 Sound effects <b>●</b></div><div className="setting">🎵 Background music <b>●</b></div><div className="setting">💬 Captions <b>●</b></div></section></div>
    </div></section></main>;
}
