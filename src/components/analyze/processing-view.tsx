import { motion, AnimatePresence } from "framer-motion";
import { Mic, Eye, MessageSquareText, Network, Brain, Zap, CheckCircle2, Loader2, Activity } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { LineChart, Line, ResponsiveContainer, AreaChart, Area } from "recharts";
import { AmbientMotion } from "../ui/AmbientMotion";
import { Particles } from "../ui/Particles";

const PIPELINE_STAGES = [
  {
    id: "speech",
    icon: Mic,
    label: "Speech Analysis",
    sublabel: "Whisper ASR + MFCC feature extraction",
    color: "#3054ff",
    duration: 6000,
  },
  {
    id: "vision",
    icon: Eye,
    label: "Vision Analysis",
    sublabel: "CNN facial emotion detection per frame",
    color: "#3054ff",
    duration: 7000,
  },
  {
    id: "nlp",
    icon: MessageSquareText,
    label: "NLP Engine",
    sublabel: "DistilBERT semantic relevance & sentiment",
    color: "#3054ff",
    duration: 5000,
  },
  {
    id: "fusion",
    icon: Network,
    label: "Neural Fusion",
    sublabel: "Cross-modal ANN vector synthesis",
    color: "#3054ff",
    duration: 4000,
  },
  {
    id: "confidence",
    icon: Zap,
    label: "Confidence Score",
    sublabel: "3-class ANN confidence classification",
    color: "#3054ff",
    duration: 3000,
  },
  {
    id: "score",
    icon: Brain,
    label: "Final Score",
    sublabel: "Objective 0–100 interview evaluation",
    color: "#3054ff",
    duration: 3000,
  },
];

const STREAM_LOGS = [
  "» Initializing Neuralyn processing engine...",
  "» Extracting audio track with ffmpeg...",
  "» Whisper ASR model loaded.",
  "» Transcribing speech to text...",
  "» Computing MFCC + pitch + energy features...",
  "» Decoding video frames for vision analysis...",
  "» EmotionCNN initialized.",
  "» Extracting facial landmarks per frame...",
  "» Running DistilBERT on transcript...",
  "» Computing semantic cosine similarity...",
  "» Aggregating multi-modal feature vectors...",
  "» Fusing signals through ANN fusion layer...",
  "» Classifying confidence level (Low/Med/High)...",
  "» Computing final interview score...",
  "» Awaiting backend response...",
];

type StageStatus = "pending" | "running" | "done";

export function AnalysisProcessingView() {
  const [stageStatuses, setStageStatuses] = useState<StageStatus[]>(
    PIPELINE_STAGES.map(() => "pending")
  );
  const [currentStage, setCurrentStage] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);

  // Advance stages progressively (purely visual — real completion comes from API resolve)
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    let elapsed = 0;
    PIPELINE_STAGES.forEach((stage, i) => {
      // Mark running
      const startTimer = setTimeout(() => {
        setCurrentStage(i);
        setStageStatuses((prev) => {
          const next = [...prev];
          next[i] = "running";
          return next;
        });
      }, elapsed);
      timers.push(startTimer);

      elapsed += stage.duration;

      // Mark done
      const doneTimer = setTimeout(() => {
        setStageStatuses((prev) => {
          const next = [...prev];
          next[i] = "done";
          return next;
        });
      }, elapsed - 600); // finish slightly before next starts
      timers.push(doneTimer);
    });

    return () => timers.forEach(clearTimeout);
  }, []);

  // Stream logs
  useEffect(() => {
    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex < STREAM_LOGS.length) {
        setLogs((prev) => [...prev, STREAM_LOGS[currentIndex]]);
        currentIndex++;
      } else {
        clearInterval(interval);
      }
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  const energyData = useMemo(() => Array.from({ length: 40 }, (_, i) => ({ v: 30 + Math.sin(i / 2) * 20 + Math.random() * 15 })), []);
  const emotionData = useMemo(() => Array.from({ length: 40 }, (_, i) => ({ joy: 50 + Math.sin(i / 3) * 30, neu: 40 + Math.cos(i / 3) * 20 })), []);

  const completedCount = stageStatuses.filter((s) => s === "done").length;
  const overallProgress = Math.round((completedCount / PIPELINE_STAGES.length) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="relative min-h-screen text-foreground overflow-x-hidden"
    >
      {/* Background environment — identical to the main page */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <Particles />
      </div>
      <div className="relative z-10">
        <AmbientMotion />
        <div
          className="absolute inset-0 z-0 opacity-[0.02] pointer-events-none mix-blend-overlay"
          style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}
        />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-[#3054ff]/[0.05] blur-[150px] rounded-full pointer-events-none" />

        <div className="relative z-20 max-w-5xl mx-auto px-8 md:px-28 pt-36 pb-20">

          {/* ── Hero Header ── */}
          <div className="text-center mb-16">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="flex items-center justify-center gap-3 px-1.5 py-1.5 pr-5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-8 w-fit mx-auto"
            >
              <div className="bg-[#3054ff] text-white text-xs font-semibold px-2.5 py-1 rounded-full leading-none">Live</div>
              <div className="flex items-center gap-2 text-xs text-white/60 font-medium tracking-wide">
                Neural engine running
                <span className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#3054ff] animate-pulse" />
                </span>
              </div>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="text-[32px] md:text-[44px] font-normal text-white/95 leading-tight tracking-normal"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              Analyzing your interview.
            </motion.h2>
            <motion.h1
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="text-[52px] md:text-[72px] font-bold tracking-tight text-white leading-[1.05] [text-shadow:0_0_60px_rgba(255,255,255,0.25)]"
            >
              Please wait.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="mx-auto max-w-md text-[16px] leading-[1.6] text-white/45 mt-5"
            >
              Speech, vision, and NLP pipelines are running in parallel. Results will appear in a moment.
            </motion.p>

            {/* Global progress bar */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="mt-8 max-w-sm mx-auto"
            >
              <div className="flex items-center justify-between text-xs text-white/40 mb-2 font-mono">
                <span className="uppercase tracking-widest">Pipeline Progress</span>
                <span>{overallProgress}%</span>
              </div>
              <div className="h-[3px] bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-[#3054ff] to-[#4a6fff] rounded-full shadow-[0_0_10px_rgba(48,84,255,0.4)]"
                  animate={{ width: `${overallProgress}%` }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                />
              </div>
            </motion.div>
          </div>

          {/* ── Main Content Grid ── */}
          <div className="grid gap-8 lg:grid-cols-[1fr_300px]">

            {/* ── LEFT: Pipeline Stages ── */}
            <div className="space-y-6">

              {/* Stage cards */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="group bg-[#050512]/60 backdrop-blur-2xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl shadow-black/60"
              >
                {/* Neural scanning border */}
                <motion.div
                  className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#3054ff]/30 to-transparent pointer-events-none"
                  animate={{ x: ["-100%", "100%"] }}
                  transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                />

                <div className="flex items-center gap-3 px-6 py-4 border-b border-white/5">
                  <div className="w-7 h-7 rounded-xl bg-[#3054ff]/15 border border-[#3054ff]/20 flex items-center justify-center">
                    <Activity className="w-3.5 h-3.5 text-[#3054ff] animate-pulse" strokeWidth={1.5} />
                  </div>
                  <h4 className="text-sm font-semibold text-white/80 uppercase tracking-widest">Active Pipelines</h4>
                  <div className="ml-auto flex items-center gap-2 text-xs font-mono text-white/30 uppercase tracking-wider">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#3054ff] animate-pulse" />
                    Running
                  </div>
                </div>

                <div className="p-5 space-y-3">
                  {PIPELINE_STAGES.map((stage, i) => {
                    const status = stageStatuses[i];
                    return (
                      <motion.div
                        key={stage.id}
                        initial={{ opacity: 0, x: -15 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: 0.5 + i * 0.07 }}
                        className={`relative flex items-center gap-4 p-4 rounded-2xl border transition-all duration-500 overflow-hidden ${
                          status === "running"
                            ? "bg-[#3054ff]/10 border-[#3054ff]/30 shadow-[0_0_15px_rgba(48,84,255,0.10)]"
                            : status === "done"
                            ? "bg-white/[0.03] border-white/10"
                            : "bg-white/[0.02] border-white/5"
                        }`}
                      >
                        {/* Running laser scan effect */}
                        {status === "running" && (
                          <motion.div
                            initial={{ x: "-100%" }}
                            animate={{ x: "100%" }}
                            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                            className="absolute inset-0 h-full w-1/2 bg-gradient-to-r from-transparent via-[#3054ff]/10 to-transparent pointer-events-none"
                          />
                        )}
                        {/* Top line scanner */}
                        {status === "running" && (
                          <motion.div
                            initial={{ x: "-100%" }}
                            animate={{ x: "100%" }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear", delay: 0.3 }}
                            className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#3054ff]/30 to-transparent pointer-events-none"
                          />
                        )}

                        {/* Icon */}
                        <div className={`relative w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-all duration-500 ${
                          status === "running"
                            ? "bg-[#3054ff]/20 border-[#3054ff]/40 shadow-[0_0_15px_rgba(48,84,255,0.15)]"
                            : status === "done"
                            ? "bg-white/[0.06] border-white/10"
                            : "bg-white/[0.03] border-white/5"
                        }`}>
                          <AnimatePresence mode="wait">
                            {status === "done" ? (
                              <motion.div key="done" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 400, damping: 15 }}>
                                <CheckCircle2 className="w-4 h-4 text-[#3054ff]" strokeWidth={1.5} />
                              </motion.div>
                            ) : status === "running" ? (
                              <motion.div key="running" animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
                                <Loader2 className="w-4 h-4 text-[#3054ff]" strokeWidth={2} />
                              </motion.div>
                            ) : (
                              <motion.div key="pending">
                                <stage.icon className="w-4 h-4 text-white/25" strokeWidth={1.5} />
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        {/* Text */}
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-semibold transition-colors duration-300 ${
                            status === "running" ? "text-white" : status === "done" ? "text-white/70" : "text-white/30"
                          }`}>
                            {stage.label}
                          </p>
                          <p className={`text-xs transition-colors duration-300 leading-tight mt-0.5 ${
                            status === "running" ? "text-white/50" : "text-white/20"
                          }`}>
                            {stage.sublabel}
                          </p>
                        </div>

                        {/* Status tag */}
                        <div className={`shrink-0 text-xs font-mono font-medium uppercase tracking-widest px-2.5 py-1 rounded-full border transition-all duration-300 ${
                          status === "running"
                            ? "text-[#3054ff] bg-[#3054ff]/10 border-[#3054ff]/20"
                            : status === "done"
                            ? "text-white/40 bg-white/[0.04] border-white/8"
                            : "text-white/15 bg-transparent border-transparent"
                        }`}>
                          {status === "running" ? "Running" : status === "done" ? "Done" : "Queued"}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>

              {/* Charts Row */}
              <div className="grid grid-cols-2 gap-5">
                {/* Audio waveform */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.6 }}
                  className="bg-[#050512]/40 backdrop-blur-xl border border-white/5 rounded-2xl p-5 bg-gradient-to-br from-white/[0.04] to-transparent relative overflow-hidden"
                >
                  {/* Neural scanning border */}
                  <motion.div
                    className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#3054ff]/25 to-transparent pointer-events-none"
                    animate={{ x: ["-100%", "100%"] }}
                    transition={{ duration: 7, repeat: Infinity, ease: "linear", delay: 1 }}
                  />
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-xs font-semibold text-white/50 uppercase tracking-widest">Audio Features</h4>
                    <Activity className="h-3.5 w-3.5 text-[#3054ff]/50" strokeWidth={1.5} />
                  </div>
                  <div className="h-28 opacity-60 filter blur-[0.5px]">
                    <ResponsiveContainer>
                      <AreaChart data={energyData}>
                        <defs>
                          <linearGradient id="ge" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#3054ff" stopOpacity={0.4} />
                            <stop offset="100%" stopColor="#3054ff" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <Area type="monotone" dataKey="v" stroke="#3054ff" fill="url(#ge)" strokeWidth={2} isAnimationActive={true} animationDuration={3000} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </motion.div>

                {/* Emotion mapping */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.7 }}
                  className="bg-[#050512]/40 backdrop-blur-xl border border-white/5 rounded-2xl p-5 bg-gradient-to-br from-white/[0.04] to-transparent relative overflow-hidden"
                >
                  <motion.div
                    className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#3054ff]/25 to-transparent pointer-events-none"
                    animate={{ x: ["-100%", "100%"] }}
                    transition={{ duration: 7, repeat: Infinity, ease: "linear", delay: 2 }}
                  />
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-xs font-semibold text-white/50 uppercase tracking-widest">Emotion Map</h4>
                    <Eye className="h-3.5 w-3.5 text-[#3054ff]/50" strokeWidth={1.5} />
                  </div>
                  <div className="h-28 opacity-60 filter blur-[0.5px]">
                    <ResponsiveContainer>
                      <LineChart data={emotionData}>
                        <Line type="monotone" dataKey="joy" stroke="#ffffff" strokeWidth={2} dot={false} strokeOpacity={0.6} isAnimationActive={true} animationDuration={3000} />
                        <Line type="monotone" dataKey="neu" stroke="#3054ff" strokeWidth={2} dot={false} strokeOpacity={0.7} isAnimationActive={true} animationDuration={3000} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </motion.div>
              </div>

            </div>

            {/* ── RIGHT: System Log ── */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="h-full"
            >
              <div className="h-full bg-[#030309]/80 backdrop-blur-xl border border-white/8 rounded-3xl overflow-hidden flex flex-col shadow-2xl shadow-black/60 relative" style={{ minHeight: '480px' }}>
                {/* Neural scanning border on log panel */}
                <motion.div
                  className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#3054ff]/20 to-transparent pointer-events-none"
                  animate={{ x: ["-100%", "100%"] }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear", delay: 0.5 }}
                />

                {/* Log header */}
                <div className="flex items-center gap-3 px-5 py-3.5 border-b border-white/5 bg-black/40">
                  <Activity className="h-3.5 w-3.5 text-[#3054ff] animate-pulse" strokeWidth={1.5} />
                  <h4 className="text-xs font-mono font-semibold text-white/60 uppercase tracking-widest">System Logs</h4>
                  {/* Terminal dots */}
                  <div className="ml-auto flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-white/10" />
                    <span className="w-2.5 h-2.5 rounded-full bg-white/10" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#3054ff]/40" />
                  </div>
                </div>

                {/* Log stream */}
                <div className="flex-1 p-5 font-mono text-xs leading-[1.9] overflow-hidden relative">
                  {/* Top fade */}
                  <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-[#030309]/80 to-transparent z-10 pointer-events-none" />

                  <div className="flex flex-col justify-end h-full gap-px">
                    {logs.map((l, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3 }}
                        className="text-white/35 leading-relaxed"
                      >
                        {l}
                      </motion.div>
                    ))}
                    {/* Blinking cursor */}
                    <motion.span
                      animate={{ opacity: [1, 0, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                      className="text-[#3054ff] text-sm leading-none"
                    >
                      ▍
                    </motion.span>
                  </div>
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </div>
    </motion.div>
  );
}
