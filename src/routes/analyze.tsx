import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence, useMotionValue, useMotionTemplate } from "framer-motion";
import { useState, useRef, useEffect, useCallback, MouseEvent } from "react";
import {
  Upload, Video, Mic, Sparkles, X, CheckCircle2,
  Circle, Square, ArrowRight, FileVideo, Brain,
  Eye, MessageSquareText, Network,
} from "lucide-react";
import { toast } from "sonner";
import { getAccessToken } from "@/lib/api-client";
import { setAnalysisResults, clearAnalysisResults } from "@/hooks/use-analysis";
import { Particles } from "../components/ui/Particles";
import { AmbientMotion } from "../components/ui/AmbientMotion";
import { AnalysisProcessingView } from "@/components/analyze/processing-view";
import { AuthGuard } from "@/components/auth/AuthGuard";

export const Route = createFileRoute("/analyze")({
  head: () => ({
    meta: [
      { title: "New Analysis — AI Interview Evaluator" },
      { name: "description", content: "Upload a video or record live to evaluate your interview performance with multimodal AI." },
    ],
  }),
  component: () => <AuthGuard><AnalyzePage /></AuthGuard>,
});

type RecordState = "idle" | "requesting" | "recording" | "stopped";
type InputMode = "upload" | "record";

const processHighlights = [
  { icon: Mic, title: "Speech Analysis", desc: "Whisper ASR + MFCC extraction" },
  { icon: Eye, title: "Vision Analysis", desc: "CNN facial emotion detection" },
  { icon: MessageSquareText, title: "NLP Engine", desc: "DistilBERT semantic scoring" },
  { icon: Network, title: "Neural Fusion", desc: "ANN cross-modal synthesis" },
];

function AnalyzePage() {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [question, setQuestion] = useState("Tell me about a time you led a team through a challenging project.");
  const [isProcessing, setIsProcessing] = useState(false);
  const [inputMode, setInputMode] = useState<InputMode>("upload");
  const [isDragging, setIsDragging] = useState(false);
  const drop = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Spotlight mouse tracking (from Landing Page)
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  // Must be computed at top level — not inside JSX (rules of hooks)
  const spotlightBg = useMotionTemplate`
    radial-gradient(
      500px circle at ${mouseX}px ${mouseY}px,
      rgba(48, 84, 255, 0.06),
      transparent 80%
    )
  `;

  const handleMouseMove = useCallback(({ currentTarget, clientX, clientY }: MouseEvent<HTMLDivElement>) => {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }, [mouseX, mouseY]);

  // Webcam recording state
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const [recordState, setRecordState] = useState<RecordState>("idle");
  const [recordSeconds, setRecordSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── File upload helpers ───────────────────────────────────────────────────
  const handleFile = (f: File) => {
    setFile(f);
    setProgress(0);
    const t = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) { clearInterval(t); return 100; }
        return p + 6;
      });
    }, 120);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  };

  // ── Webcam helpers ────────────────────────────────────────────────────────
  const startRecording = useCallback(async () => {
    setRecordState("requesting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
        videoRef.current.play();
      }

      const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
        ? "video/webm;codecs=vp9"
        : "video/webm";
      const recorder = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const f = new File([blob], "live_recording.webm", { type: mimeType });
        handleFile(f);
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      };
      recorder.start(250);
      mediaRecorderRef.current = recorder;
      setRecordState("recording");
      setRecordSeconds(0);
      timerRef.current = setInterval(() => setRecordSeconds((s) => s + 1), 1000);
    } catch (err: unknown) {
      setRecordState("idle");
      if (err instanceof Error) {
        if (err.name === "NotAllowedError") toast.error("Camera/microphone access denied. Please allow it in your browser settings.");
        else toast.error(`Could not access camera: ${err.message}`);
      } else {
        toast.error("Could not access camera due to an unknown error.");
      }
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    mediaRecorderRef.current?.stop();
    setRecordState("stopped");
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const fmtTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  // ── Submit ────────────────────────────────────────────────────────────────
  const analyze = async () => {
    if (!file) { toast.error("Please upload or record an interview file first"); return; }
    clearAnalysisResults();
    toast.success("Submitting to AI engine…");
    setIsProcessing(true);

    const formData = new FormData();
    formData.append("video", file);
    formData.append("question", question);

    try {
      const token = getAccessToken();
      const headers: HeadersInit = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const response = await fetch("http://127.0.0.1:8000/api/analyze", { 
        method: "POST", 
        headers,
        body: formData 
      });
      if (!response.ok) {
        const text = await response.text();
        let detail = "Unknown server error";
        try { detail = JSON.parse(text).detail || detail; } catch { detail = text.substring(0, 200) || `HTTP ${response.status}`; }
        throw new Error(detail);
      }
      const data = await response.json();
      setAnalysisResults(data);
      navigate({ to: "/results" });
    } catch (error: unknown) {
      console.error("Analysis failed:", error);
      toast.error(`Analysis failed: ${error instanceof Error ? error.message : "Unknown error"}`);
      setIsProcessing(false);
    }
  };

  return (
    <div className="relative min-h-screen text-foreground overflow-x-hidden" ref={containerRef}>

      {/* ── BACKGROUND ENVIRONMENT (identical to Landing page) ── */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <Particles />
      </div>
      <div className="relative z-20">
        <AmbientMotion />
        {/* Noise overlay */}
        <div
          className="absolute inset-0 z-0 opacity-[0.02] pointer-events-none mix-blend-overlay"
          style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}
        />
        {/* Radial blue glow center */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[900px] bg-[var(--brand-blue)]/[0.04] blur-[140px] rounded-full pointer-events-none" />

        <AnimatePresence mode="wait">
          {isProcessing ? (
            <AnalysisProcessingView key="processing" />
          ) : (
            <motion.div
              key="upload-form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="relative z-10 min-h-screen"
            >
              {/* ── HERO HEADER ── */}
              <section className="relative w-full pt-32 pb-10 px-8 md:px-28">
                <div className="max-w-5xl mx-auto">

                  {/* Badge (identical pattern to Landing) */}
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="flex items-center gap-3 px-1.5 py-1.5 pr-5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-8 w-fit"
                  >
                    <div className="bg-[var(--brand-blue)] text-white text-xs font-semibold px-2.5 py-1 rounded-full leading-none">Lab</div>
                    <div className="flex items-center gap-2 text-xs text-white/60 font-medium tracking-wide">
                      Neural Analysis Workstation <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </motion.div>

                  {/* Title */}
                  <div className="flex flex-col mb-6">
                    <motion.h2
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                      className="text-[40px] md:text-[56px] font-normal text-white/95 leading-tight tracking-normal"
                      style={{ fontFamily: 'var(--font-serif)' }}
                    >
                      Your Interview.
                    </motion.h2>

                    <motion.h1
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                      className="text-[64px] md:text-[104px] font-bold tracking-tight text-white leading-[1.05] [text-shadow:0_0_30px_rgba(255,255,255,0.15)]"
                    >
                      Analyzed.
                    </motion.h1>
                  </div>

                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                    className="text-[17px] leading-[1.6] text-white/55 max-w-xl"
                  >
                    Upload a video or record live. The neural engine dissects speech, facial affect, and language — fusing them into a single objective score.
                  </motion.p>
                </div>
              </section>

              {/* ── MAIN WORKSTATION ── */}
              <section className="relative py-12 md:py-16 px-8 md:px-28 z-20">
                <div className="max-w-5xl mx-auto grid gap-6 lg:grid-cols-[1fr_340px]">

                  {/* ── LEFT: Upload Workstation ── */}
                  <div className="space-y-6">

                    {/* Large Upload Workstation Card */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                      onMouseMove={handleMouseMove}
                      className="group relative bg-card/60 backdrop-blur-2xl border border-white/10 rounded-3xl overflow-hidden shadow-xl shadow-black/40 hover:border-[var(--brand-blue)]/30 hover:shadow-[0_0_30px_rgba(48,84,255,0.08)] transition-all duration-500"
                    >
                      {/* Interactive Spotlight (from Landing) */}
                      <motion.div
                        className="pointer-events-none absolute -inset-px rounded-3xl opacity-0 transition duration-300 group-hover:opacity-100 hidden md:block"
                        style={{ background: spotlightBg }}
                      />

                      {/* Neural scanning border animation */}
                      <motion.div
                        className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[var(--brand-blue)]/30 to-transparent pointer-events-none"
                        animate={{ x: ["-100%", "100%"] }}
                        transition={{ duration: 8, repeat: Infinity, ease: "linear", repeatDelay: 3 }}
                      />

                      {/* Tab Pills */}
                      <div className="flex items-center gap-1 p-4 border-b border-white/5">
                        {(["upload", "record"] as InputMode[]).map((mode) => (
                          <button
                            key={mode}
                            onClick={() => setInputMode(mode)}
                            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300 ${
                              inputMode === mode
                                ? "bg-[var(--brand-blue)] text-white shadow-[0_0_20px_rgba(48,84,255,0.4)]"
                                : "text-white/50 hover:text-white/80 hover:bg-white/5"
                            }`}
                          >
                            {mode === "upload" ? <Upload className="w-3.5 h-3.5" /> : <Video className="w-3.5 h-3.5" />}
                            {mode === "upload" ? "Upload File" : "Record Live"}
                          </button>
                        ))}
                        <div className="ml-auto flex items-center gap-2 text-xs text-white/30 font-mono uppercase tracking-widest">
                          <span className="h-1.5 w-1.5 rounded-full bg-[var(--brand-blue)] animate-pulse" />
                          System Ready
                        </div>
                      </div>

                      <AnimatePresence mode="wait">
                        {inputMode === "upload" ? (
                          <motion.div
                            key="upload-panel"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                            className="p-6"
                          >
                            {/* Drop Zone */}
                            <div
                              ref={drop}
                              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                              onDragLeave={() => setIsDragging(false)}
                              onDrop={onDrop}
                              className={`relative w-full border-2 border-dashed flex flex-col items-center justify-center transition-all duration-500 cursor-pointer py-20 px-6 gap-4 rounded-2xl ${
                                isDragging
                                  ? "border-[var(--brand-blue)] bg-[var(--brand-blue)]/10 shadow-[0_0_40px_rgba(48,84,255,0.2)]"
                                  : file
                                  ? "border-[var(--brand-blue)]/40 bg-card/40"
                                  : "border-white/10 bg-card/40 hover:border-[var(--brand-blue)]/40 hover:bg-[var(--brand-blue)]/5 hover:shadow-[0_0_30px_rgba(48,84,255,0.1)]"
                              }`}
                            >
                              <input
                                type="file"
                                accept="video/*"
                                className="absolute inset-0 cursor-pointer opacity-0 z-10"
                                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                              />

                              {/* Animated Upload Illustration */}
                              <div className="relative flex flex-col items-center gap-4">
                                <div className="relative">
                                  {/* Outer glow ring */}
                                  <motion.div
                                    className="absolute -inset-4 rounded-full bg-[var(--brand-blue)]/10 blur-xl"
                                    animate={{ opacity: isDragging ? [0.3, 0.7, 0.3] : [0.05, 0.15, 0.05], scale: isDragging ? [0.9, 1.1, 0.9] : [0.95, 1.05, 0.95] }}
                                    transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                                  />
                                  {/* Icon container */}
                                  <div className={`relative w-20 h-20 rounded-2xl flex items-center justify-center border transition-all duration-500 ${
                                    file
                                      ? "bg-[var(--brand-blue)]/20 border-[var(--brand-blue)]/40 shadow-[0_0_30px_rgba(48,84,255,0.3)]"
                                      : isDragging
                                      ? "bg-[var(--brand-blue)]/30 border-[var(--brand-blue)]/60 shadow-[0_0_40px_rgba(48,84,255,0.4)]"
                                      : "bg-white/[0.04] border-white/10 group-hover:border-[var(--brand-blue)]/30"
                                  }`}>
                                    {file ? (
                                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 400, damping: 15 }}>
                                        <CheckCircle2 className="w-8 h-8 text-[var(--brand-blue)]" strokeWidth={1.5} />
                                      </motion.div>
                                    ) : (
                                      <motion.div
                                        animate={{ y: isDragging ? [-4, 4, -4] : [0, -6, 0] }}
                                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                                      >
                                        <FileVideo className="w-8 h-8 text-white/40" strokeWidth={1.5} />
                                      </motion.div>
                                    )}
                                  </div>
                                </div>

                                {file ? (
                                  <div className="text-center">
                                    <p className="text-[15px] font-medium text-white/90">{file.name}</p>
                                    <p className="text-sm text-white/40 mt-1">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
                                  </div>
                                ) : (
                                  <div className="text-center">
                                    <p className="text-[15px] font-medium text-white/80">
                                      {isDragging ? "Release to load file" : "Click or drag video to upload"}
                                    </p>
                                    <p className="text-sm text-white/35 mt-1">MP4, WebM — max 500MB</p>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* File Progress Bar */}
                            <AnimatePresence>
                              {file && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: "auto" }}
                                  exit={{ opacity: 0, height: 0 }}
                                  className="mt-4"
                                >
                                  <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                                    <div className="w-9 h-9 rounded-xl bg-[var(--brand-blue)]/15 border border-[var(--brand-blue)]/20 flex items-center justify-center shrink-0">
                                      <FileVideo className="w-4 h-4 text-[var(--brand-blue)]" strokeWidth={1.5} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center justify-between mb-2 gap-3">
                                        <span className="text-sm font-medium text-white/80 truncate min-w-0 flex-1">{file.name}</span>
                                        <div className="flex items-center gap-2 shrink-0">
                                          {progress >= 100 && (
                                            <span className="text-xs text-[var(--brand-blue)] font-medium flex items-center gap-1">
                                              <CheckCircle2 className="w-3.5 h-3.5" /> Ready
                                            </span>
                                          )}
                                          <button
                                            onClick={() => { setFile(null); setProgress(0); setRecordState("idle"); }}
                                            className="text-white/30 hover:text-white/70 transition-colors"
                                          >
                                            <X className="w-4 h-4" />
                                          </button>
                                        </div>
                                      </div>
                                      <div className="h-[2px] rounded-full bg-white/5 overflow-hidden">
                                        <motion.div
                                          animate={{ width: `${progress}%` }}
                                          className="h-full rounded-full bg-gradient-to-r from-[var(--brand-blue)] to-[#4a6fff] shadow-[0_0_8px_rgba(48,84,255,0.6)]"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </motion.div>
                        ) : (
                          <motion.div
                            key="record-panel"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                            className="p-6 space-y-4"
                          >
                            {/* Webcam Preview */}
                            <div className="relative aspect-video rounded-2xl overflow-hidden border border-white/10 bg-black/60 flex items-center justify-center">
                              <video
                                ref={videoRef}
                                className={`h-full w-full object-cover transition-opacity duration-500 ${recordState === "recording" ? "opacity-100" : "opacity-0 absolute"}`}
                                playsInline
                                muted
                              />
                              {recordState !== "recording" && (
                                <div className="flex flex-col items-center gap-4 text-center">
                                  <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center">
                                    <Mic className="w-7 h-7 text-white/25" strokeWidth={1.5} />
                                  </div>
                                  <p className="text-sm text-white/35">
                                    {recordState === "stopped" ? "Recording saved — see upload panel." : "Camera preview will appear here."}
                                  </p>
                                </div>
                              )}

                              {/* Recording indicator overlay */}
                              {recordState === "recording" && (
                                <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-red-500/20">
                                  <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                                  <span className="text-xs text-red-400 font-mono font-medium">{fmtTime(recordSeconds)}</span>
                                </div>
                              )}
                            </div>

                            {/* Recording Controls */}
                            <div className="flex gap-3">
                              {recordState === "idle" || recordState === "requesting" ? (
                                <button
                                  onClick={startRecording}
                                  disabled={recordState === "requesting"}
                                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-white/[0.04] border border-white/10 text-sm font-medium text-white/70 hover:bg-[var(--brand-blue)]/10 hover:border-[var(--brand-blue)]/30 hover:text-white transition-all duration-300 disabled:opacity-50"
                                >
                                  <Circle className="w-3.5 h-3.5 fill-red-500 text-red-500" />
                                  {recordState === "requesting" ? "Requesting camera…" : "Start Recording"}
                                </button>
                              ) : recordState === "recording" ? (
                                <button
                                  onClick={stopRecording}
                                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-sm font-medium text-red-400 hover:bg-red-500/20 transition-all duration-300"
                                >
                                  <Square className="w-3.5 h-3.5 fill-red-500 text-red-500" />
                                  Stop Recording
                                </button>
                              ) : (
                                <button
                                  onClick={() => { setFile(null); setProgress(0); setRecordState("idle"); }}
                                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-white/[0.04] border border-white/10 text-sm font-medium text-white/70 hover:bg-white/[0.08] transition-all duration-300"
                                >
                                  <X className="w-4 h-4" /> Record Again
                                </button>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>

                    {/* ── Question Configuration Card ── */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
                      className="group bg-card/60 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 hover:border-[var(--brand-blue)]/20 hover:shadow-[0_0_20px_rgba(48,84,255,0.08)] transition-all duration-500"
                    >
                      {/* Section header */}
                      <div className="flex items-center gap-3 mb-5">
                        <div className="w-8 h-8 rounded-xl bg-[var(--brand-blue)]/15 border border-[var(--brand-blue)]/20 flex items-center justify-center">
                          <MessageSquareText className="w-4 h-4 text-[var(--brand-blue)]" strokeWidth={1.5} />
                        </div>
                        <div>
                          <h4 className="text-[14px] font-semibold text-white/90">Target Question</h4>
                          <p className="text-xs text-white/35">Used for semantic relevance scoring</p>
                        </div>
                      </div>

                      <textarea
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        rows={3}
                        className="w-full resize-none rounded-2xl border border-white/8 bg-white/[0.03] p-4 text-sm text-white/85 placeholder:text-white/25 transition-all duration-300 focus:outline-none focus:border-[var(--brand-blue)]/40 focus:bg-[var(--brand-blue)]/5 focus:shadow-[0_0_20px_rgba(48,84,255,0.1)] leading-relaxed break-words"
                        placeholder="Enter the interview question here…"
                      />
                    </motion.div>

                  </div>

                  {/* ── RIGHT: Side Panel ── */}
                  <div className="space-y-6">

                    {/* ── Primary CTA (identical button style to Landing) ── */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.45, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <button
                        onClick={analyze}
                        className="group w-full flex items-center justify-center gap-4 bg-white text-black font-semibold rounded-full pl-7 pr-2 py-2 btn-interaction shadow-xl shadow-black/20"
                      >
                        <Sparkles className="w-5 h-5" />
                        <span className="text-[17px] flex-1 text-left">Run Analysis</span>
                        <div className="bg-[var(--brand-blue)] rounded-full w-[42px] h-[42px] flex items-center justify-center group-hover:bg-[var(--brand-blue-hover)] transition-colors">
                          <ArrowRight className="w-5 h-5 text-white" />
                        </div>
                      </button>
                    </motion.div>

                    {/* ── Pipeline Cards (feature row from Landing) ── */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.55, ease: [0.22, 1, 0.36, 1] }}
                      className="grid grid-cols-2 gap-3"
                    >
                      {processHighlights.map((h, i) => (
                        <motion.div
                          key={h.title}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.4, delay: 0.6 + i * 0.08 }}
                          whileHover={{ y: -4 }}
                          className="group flex flex-col gap-2 p-4 bg-card/40 backdrop-blur-xl border border-white/5 rounded-2xl bg-gradient-to-br from-white/[0.04] to-transparent hover:border-[var(--brand-blue)]/30 hover:shadow-[0_0_25px_rgba(48,84,255,0.12)] transition-all duration-300 relative overflow-hidden"
                        >
                          <div className="absolute top-0 right-0 w-20 h-20 bg-[var(--brand-blue)]/10 blur-[30px] rounded-full group-hover:bg-[var(--brand-blue)]/25 group-hover:scale-150 transition-all duration-500 pointer-events-none" />
                          <h.icon className="w-5 h-5 text-[var(--brand-blue)] group-hover:text-white relative z-10 transition-colors duration-300" strokeWidth={1.5} />
                          <div className="relative z-10 min-w-0 break-words">
                            <p className="text-[12px] font-semibold text-white/80 group-hover:text-white transition-colors truncate">{h.title}</p>
                            <p className="text-[10px] text-white/40 group-hover:text-white/60 transition-colors leading-tight mt-0.5 line-clamp-2">{h.desc}</p>
                          </div>
                        </motion.div>
                      ))}
                    </motion.div>

                    {/* ── Expectations Card ── */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.65, ease: [0.22, 1, 0.36, 1] }}
                      className="bg-card/40 backdrop-blur-xl border border-white/5 rounded-2xl p-5 bg-gradient-to-br from-white/[0.04] to-transparent"
                    >
                      <div className="flex items-center gap-2 mb-5">
                        <span className="h-1.5 w-1.5 rounded-full bg-[var(--brand-blue)] animate-pulse" />
                        <h4 className="text-xs font-semibold text-white/80 uppercase tracking-widest">Processing Notes</h4>
                      </div>

                      <ul className="space-y-4">
                        {[
                          { icon: "🎙️", tip: "Ensure clear audio. Whisper transcription performs best without heavy background noise." },
                          { icon: "👀", tip: "Keep face visible. The CNN evaluates frame-by-frame facial affect." },
                          { icon: "⏱️", tip: "First cold-start may take 2–5 min while neural models load into memory." },
                        ].map((item, i) => (
                          <motion.li
                            key={i}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.7 + i * 0.08 }}
                            className="flex gap-3 items-start"
                          >
                            <span className="text-base leading-tight mt-0.5 shrink-0">{item.icon}</span>
                            <span className="text-xs text-white/50 leading-relaxed">{item.tip}</span>
                          </motion.li>
                        ))}
                      </ul>

                      <div className="mt-5 p-3.5 rounded-xl border border-white/5 bg-white/[0.02] text-xs text-white/35 leading-relaxed">
                        <span className="font-medium text-white/55 block mb-1">Privacy Notice</span>
                        Videos are processed locally or in memory and discarded immediately after feature extraction.
                      </div>
                    </motion.div>

                    {/* ── Supported Formats ── */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.75, ease: [0.22, 1, 0.36, 1] }}
                      className="bg-card/40 backdrop-blur-xl border border-white/5 rounded-2xl p-5 bg-gradient-to-br from-white/[0.04] to-transparent"
                    >
                      <p className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-4">Supported Formats</p>
                      <div className="flex flex-wrap gap-2">
                        {["MP4", "WebM", "Live Capture"].map((fmt) => (
                          <span
                            key={fmt}
                            className="px-3 py-1 rounded-full text-xs font-medium text-white/60 bg-white/[0.05] border border-white/8"
                          >
                            {fmt}
                          </span>
                        ))}
                      </div>
                      <p className="text-xs text-white/25 mt-3">Max file size: 500MB</p>
                    </motion.div>

                  </div>
                </div>
              </section>

              {/* ── PIPELINE EXPLANATION SECTION ── */}
              <section className="relative py-12 md:py-16 px-8 md:px-28 z-20">
                <div className="max-w-5xl mx-auto">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="mb-14 text-center"
                  >
                    <span className="text-sm font-medium text-[var(--brand-blue)] uppercase tracking-widest bg-[var(--brand-blue)]/10 px-3 py-1 rounded-full border border-[var(--brand-blue)]/20">How it works</span>
                    <h2 className="mt-6 text-3xl md:text-4xl font-semibold tracking-tighter" style={{ fontFamily: 'var(--font-serif)' }}>
                      From Video to Verdict.
                    </h2>
                    <p className="mt-3 text-white/40 text-sm max-w-lg mx-auto leading-relaxed">
                      Four parallel neural pipelines process your interview in real-time, fusing signals into a single objective evaluation.
                    </p>
                  </motion.div>

                  {/* Connecting animation line */}
                  <div className="relative">
                    <motion.div
                      initial={{ scaleX: 0 }}
                      whileInView={{ scaleX: 1 }}
                      viewport={{ once: true, margin: "-100px" }}
                      transition={{ duration: 1.2, ease: "easeInOut" }}
                      className="hidden md:block absolute top-7 left-14 right-14 h-[2px] bg-white/[0.05] z-0 overflow-hidden rounded-full origin-left"
                    >
                      <motion.div
                        className="absolute top-0 bottom-0 w-1/2 bg-gradient-to-r from-transparent via-[var(--brand-blue)] to-transparent opacity-80"
                        animate={{ left: ["-100%", "200%"] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "linear", delay: 0.5 }}
                      />
                    </motion.div>

                    <div className="flex flex-col md:flex-row justify-between gap-8 md:gap-4 relative z-10">
                      {[
                        { icon: FileVideo, title: "Video Input", desc: "Raw audiovisual capture" },
                        { icon: Mic, title: "Speech Processing", desc: "Prosody & MFCC features" },
                        { icon: Eye, title: "Facial Emotion", desc: "Frame-by-frame CNN affect" },
                        { icon: MessageSquareText, title: "NLP Engine", desc: "Semantic context scoring" },
                        { icon: Network, title: "Neural Fusion", desc: "Cross-modal ANN synthesis" },
                        { icon: Brain, title: "Final Score", desc: "Objective 0–100 assessment" },
                      ].map((step, i) => (
                        <motion.div
                          key={step.title}
                          initial={{ opacity: 0, y: 20 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          whileHover={{ y: -4 }}
                          viewport={{ once: true, margin: "-50px" }}
                          transition={{ duration: 0.5, delay: i * 0.12 }}
                          className="group flex md:flex-col items-center text-left md:text-center gap-4 md:gap-3 w-full md:w-auto transition-transform duration-300 relative min-w-0"
                        >
                          <motion.div
                            className="absolute top-7 left-7 md:left-1/2 w-8 h-8 -translate-x-1/2 -translate-y-1/2 bg-[var(--brand-blue)] rounded-full blur-[16px] z-0 pointer-events-none"
                            animate={{ opacity: [0.05, 0.3, 0.05], scale: [0.8, 1.4, 0.8] }}
                            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: i * 0.2 }}
                          />
                          <div className="relative w-14 h-14 rounded-full bg-card/40 backdrop-blur-xl border border-white/5 flex items-center justify-center shrink-0 group-hover:border-[var(--brand-blue)]/40 group-hover:bg-[var(--brand-blue)]/10 transition-all duration-300 shadow-xl shadow-black/50 group-hover:shadow-[0_0_20px_rgba(48,84,255,0.2)] z-10">
                            <motion.div
                              animate={{ color: ["rgba(255,255,255,0.4)", "rgba(48,84,255,0.9)", "rgba(255,255,255,0.4)"] }}
                              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: i * 0.2 }}
                            >
                              <step.icon className="w-5 h-5 group-hover:text-white group-hover:scale-110 transition-all duration-300" strokeWidth={1.5} />
                            </motion.div>
                            <div className="absolute inset-0 rounded-full border border-[var(--brand-blue)]/0 group-hover:border-[var(--brand-blue)]/40 group-hover:scale-125 transition-all duration-500 opacity-0 group-hover:opacity-100" />
                          </div>
                          <div className="min-w-0 flex-1 break-words">
                            <h4 className="text-[13px] font-semibold text-white/90 group-hover:text-white transition-colors truncate">{step.title}</h4>
                            <p className="text-[11px] text-white/40 leading-tight mt-1 group-hover:text-white/65 transition-colors line-clamp-2">{step.desc}</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                </div>
              </section>

            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
