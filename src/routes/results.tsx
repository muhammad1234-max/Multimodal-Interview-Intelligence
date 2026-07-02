import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, Cell,
} from "recharts";
import {
  TrendingUp, Download, ArrowLeft, Mic, Eye, MessageSquareText,
  Network, ThumbsUp, AlertTriangle, Lightbulb, Sparkles, Brain,
  CheckCircle2, ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { getAnalysisResults } from "@/hooks/use-analysis";
import { generateInterviewReport } from "@/lib/export-pdf";
import { Particles } from "../components/ui/Particles";
import { AmbientMotion } from "../components/ui/AmbientMotion";

export const Route = createFileRoute("/results")({
  head: () => ({
    meta: [
      { title: "Results Dashboard — AI Interview Evaluator" },
      { name: "description", content: "Your multimodal AI interview analysis results." },
    ],
  }),
  component: ResultsPage,
});

// ─── Helper functions ────────────────────────────────────────────────────────

function scoreGrade(s: number): { label: string; glow: string; border: string; text: string } {
  if (s >= 80) return { label: "Excellent", glow: "shadow-[0_0_20px_rgba(48,84,255,0.25)]", border: "border-[var(--brand-blue)]/50", text: "text-white" };
  if (s >= 65) return { label: "Good", glow: "shadow-[0_0_30px_rgba(48,84,255,0.2)]", border: "border-[var(--brand-blue)]/30", text: "text-[#4a6fff]" };
  if (s >= 45) return { label: "Average", glow: "shadow-[0_0_25px_rgba(251,146,60,0.2)]", border: "border-orange-500/30", text: "text-orange-400" };
  return { label: "Needs Practice", glow: "shadow-[0_0_20px_rgba(239,68,68,0.15)]", border: "border-red-500/20", text: "text-red-400" };
}

function relevanceLabel(r: number): string {
  if (r >= 0.80) return "Highly relevant — your answer directly addressed the question.";
  if (r >= 0.60) return "Mostly relevant — a few points could be tied back to the question.";
  if (r >= 0.40) return "Somewhat relevant — the answer drifted from the core topic.";
  return "Off-topic — try to align your answer more closely with the question asked.";
}

function sentimentLabel(s: number): string {
  if (s >= 0.80) return "Very positive & confident tone throughout.";
  if (s >= 0.60) return "Generally positive with a confident delivery.";
  if (s >= 0.40) return "Neutral tone — try adding more enthusiasm.";
  return "Negative or hesitant tone detected — aim for a more assured delivery.";
}

function emotionInsight(probs: Record<string, number>): string {
  const dominant = Object.entries(probs).sort((a, b) => b[1] - a[1])[0];
  if (!dominant) return "Expression analysis complete.";
  const map: Record<string, string> = {
    happy: "You appeared engaged and positive — a great sign for interviews.",
    neutral: "Your expression was composed and professional.",
    anxious: "Some nervousness was detected — try slowing down and breathing steadily.",
    sad: "Your expression appeared subdued. Try to smile naturally and maintain eye contact.",
  };
  return map[dominant[0]] ?? "Expression analysis complete.";
}

function generateFeedback(data: ReturnType<typeof getAnalysisResults>) {
  if (!data) return { strengths: [], weaknesses: [], suggestions: [] };

  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const suggestions: string[] = [];

  if (data.relevance >= 0.70) strengths.push("Answer was on-topic and addressed the question well.");
  else weaknesses.push("Answer could be more focused on the question asked.");

  if (data.sentiment >= 0.65) strengths.push("Positive and confident tone in your response.");
  else { weaknesses.push("Tone came across as hesitant or neutral."); suggestions.push("Practice speaking with more enthusiasm and conviction."); }

  if (data.confidence_label === "High") strengths.push("Strong vocal confidence detected across the interview.");
  else if (data.confidence_label === "Medium") suggestions.push("Build on your confidence — try rehearsing aloud before interviews.");
  else weaknesses.push("Low vocal confidence detected — focus on steady pacing and clear enunciation.");

  const happy = data.emotion_probs?.happy ?? 0;
  const anxious = data.emotion_probs?.anxious ?? 0;
  if (happy > 0.4) strengths.push("Friendly and approachable facial expressions.");
  if (anxious > 0.35) weaknesses.push("Some nervousness visible in your facial expressions.");

  const rate = data.audio_features?.speech_rate;
  if (rate !== undefined) {
    if (rate > 4.5) weaknesses.push("Speech rate was a bit fast — slow down slightly for clarity.");
    else if (rate < 1.5) weaknesses.push("Speech was quite slow — try maintaining a brisker pace.");
    else strengths.push("Speech pace was clear and well-measured.");
  }

  if (data.final_score < 50) suggestions.push("Practice the STAR method (Situation, Task, Action, Result) for structured answers.");
  if (data.final_score < 70) suggestions.push("Record yourself answering common interview questions and review the playback.");
  if (data.relevance < 0.60) suggestions.push("Before answering, take a moment to identify the key skills the question is testing.");
  if (happy < 0.3) suggestions.push("Smile naturally — it builds rapport and conveys confidence.");

  return { strengths, weaknesses, suggestions };
}

function pct(v: number) { return `${Math.round(v * 100)}%`; }

// ─── Reusable sub-components ─────────────────────────────────────────────────

function SectionCard({
  children,
  delay = 0,
  className = "",
  hover = false,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  hover?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      whileHover={hover ? { y: -2 } : undefined}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay }}
      className={`group relative bg-card/60 backdrop-blur-2xl border border-white/10 rounded-3xl overflow-hidden hover:border-[var(--brand-blue)]/20 hover:shadow-[0_0_20px_rgba(48,84,255,0.06)] transition-all duration-500 ${className}`}
    >
      {/* Scanning border animation */}
      <motion.div
        className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[var(--brand-blue)]/15 to-transparent pointer-events-none"
        animate={{ x: ["-100%", "100%"] }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear", delay: delay * 1.5 + 0.5 }}
      />
      {/* Inner top glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-24 bg-[var(--brand-blue)]/[0.02] blur-[20px] rounded-full pointer-events-none" />
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}

function MetricBar({
  label,
  value,
  raw,
  delay = 0,
  accent = "var(--brand-blue)",
}: {
  label: string;
  value: number;
  raw?: string;
  delay?: number;
  accent?: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        {label && <span className="text-sm font-medium text-white/70">{label}</span>}
        {raw && <span className="text-xs font-mono text-white/40">{raw}</span>}
      </div>
      <div className="h-[3px] rounded-full bg-white/5 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          whileInView={{ width: `${value}%` }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay, ease: "easeOut" }}
          className="h-full rounded-full"
          style={{ background: `linear-gradient(90deg, ${accent}, ${accent}cc)`, boxShadow: `0 0 4px ${accent}44` }}
        />
      </div>
    </div>
  );
}

function SectionLabel({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="w-8 h-8 rounded-xl bg-[var(--brand-blue)]/15 border border-[var(--brand-blue)]/20 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-[var(--brand-blue)]" strokeWidth={1.5} />
      </div>
      <h3 className="text-sm font-semibold text-white/80 uppercase tracking-widest">{label}</h3>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

function ResultsPage() {
  const apiData = getAnalysisResults();

  // ── Empty state ──
  if (!apiData) {
    return (
      <div className="relative min-h-screen text-foreground flex flex-col items-center justify-center text-center px-6">
        <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none"><Particles /></div>
        <div className="relative z-10">
          <AmbientMotion />
          <div className="relative z-20 flex flex-col items-center gap-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              className="w-20 h-20 rounded-3xl bg-[var(--brand-blue)]/15 border border-[var(--brand-blue)]/20 flex items-center justify-center shadow-[0_0_40px_rgba(48,84,255,0.3)]"
            >
              <Sparkles className="w-9 h-9 text-[var(--brand-blue)]" strokeWidth={1.5} />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.15 }}>
              <h2 className="text-3xl font-semibold tracking-tight text-white mb-3" style={{ fontFamily: 'var(--font-serif)' }}>No results yet</h2>
              <p className="text-white/45 text-sm max-w-sm">Submit an interview first to see your multimodal AI analysis here.</p>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}>
              <Link
                to="/analyze"
                className="group flex items-center gap-3 bg-white text-black font-semibold rounded-full pl-6 pr-2 py-2 transition-all hover:scale-[1.02] shadow-xl shadow-black/20"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-[15px]">Go to Analyze</span>
                <div className="bg-[var(--brand-blue)] rounded-full w-9 h-9 flex items-center justify-center group-hover:bg-[var(--brand-blue-hover)] transition-colors">
                  <ChevronRight className="w-4 h-4 text-white" />
                </div>
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  const score = apiData.final_score ?? 0;
  const grade = scoreGrade(score);
  const { strengths, weaknesses, suggestions } = generateFeedback(apiData);
  const af = apiData.audio_features;

  // Radar data
  const radarData = [
    { metric: "Relevance", v: Math.round((apiData.relevance ?? 0) * 100) },
    { metric: "Sentiment", v: Math.round((apiData.sentiment ?? 0) * 100) },
    { metric: "Confidence", v: apiData.confidence_class === 2 ? 90 : apiData.confidence_class === 1 ? 60 : 30 },
    { metric: "Happiness", v: Math.round((apiData.emotion_probs?.happy ?? 0) * 100) },
    { metric: "Composure", v: Math.round((1 - (apiData.emotion_probs?.anxious ?? 0)) * 100) },
  ];

  // Emotion bar data
  const emotionData = [
    { name: "Happy", value: Math.round((apiData.emotion_probs?.happy ?? 0) * 100), color: "#ffffff" },
    { name: "Neutral", value: Math.round((apiData.emotion_probs?.neutral ?? 0) * 100), color: "var(--brand-blue)" },
    { name: "Anxious", value: Math.round((apiData.emotion_probs?.anxious ?? 0) * 100), color: "#f59e0b" },
    { name: "Sad", value: Math.round((apiData.emotion_probs?.sad ?? 0) * 100), color: "#6b7280" },
  ];

  // Speech metrics
  const speechMetrics = af ? [
    { label: "Speech Rate", value: Math.min(100, Math.round((af.speech_rate / 6) * 100)), raw: `${af.speech_rate.toFixed(1)} syl/s`, delay: 0 },
    { label: "Vocal Energy", value: Math.min(100, Math.round(af.energy * 2000)), raw: af.energy.toFixed(4), delay: 0.08 },
    { label: "Pitch Stability", value: Math.min(100, Math.max(0, 100 - Math.round(Math.sqrt(af.pitch_variance) / 5))), raw: `var: ${af.pitch_variance.toFixed(0)}`, delay: 0.16 },
    { label: "Duration", value: 100, raw: `${af.duration.toFixed(1)}s`, delay: 0.24 },
  ] : null;

  // Confidence ring
  const confPct = apiData.confidence_class === 2 ? 0.90 : apiData.confidence_class === 1 ? 0.58 : 0.28;
  const r = 64;
  const circumference = 2 * Math.PI * r;

  return (
    <div className="relative min-h-screen text-foreground overflow-x-hidden">

      {/* ── BACKGROUND (identical to Landing) ── */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none"><Particles /></div>
      <div className="relative z-10">
        <AmbientMotion />
        <div
          className="absolute inset-0 z-0 opacity-[0.02] pointer-events-none mix-blend-overlay"
          style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}
        />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-[var(--brand-blue)]/[0.04] blur-[140px] rounded-full pointer-events-none" />

        <div className="relative z-20">

          {/* ─────────────────────────────────────────────
              DASHBOARD HEADER
          ───────────────────────────────────────────── */}
          <section className="px-8 md:px-28 pt-32 pb-10">
            <div className="max-w-5xl mx-auto">
              <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">

                {/* Title block */}
                <div>
                  {/* Badge */}
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="flex items-center gap-3 px-1.5 py-1.5 pr-5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-6 w-fit"
                  >
                    <div className="bg-[var(--brand-blue)] text-white text-xs font-semibold px-2.5 py-1 rounded-full leading-none">Results</div>
                    <div className="text-xs text-white/55 font-medium tracking-wide">
                      {af ? `${af.duration.toFixed(0)}s of multimodal data processed` : "Analysis complete"}
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <h2 className="text-[40px] md:text-[56px] font-normal text-white/95 leading-tight" style={{ fontFamily: 'var(--font-serif)' }}>
                      Objective
                    </h2>
                    <h1 className="text-[64px] md:text-[104px] font-bold tracking-tight text-white leading-[1.05] [text-shadow:0_0_30px_rgba(255,255,255,0.15)]">
                      Assessment.
                    </h1>
                  </motion.div>
                </div>

                {/* Action buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.35 }}
                  className="flex items-center gap-3 shrink-0"
                >
                  <Link
                    to="/analyze"
                    className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/[0.05] border border-white/10 text-sm font-medium text-white/70 hover:bg-white/[0.09] hover:text-white transition-all duration-300"
                  >
                    <ArrowLeft className="w-4 h-4" /> New Session
                  </Link>
                  <button
                    onClick={() => {
                      try {
                        generateInterviewReport(apiData);
                        toast.success("Report generated successfully!");
                      } catch (err) {
                        toast.error("Failed to generate report.");
                      }
                    }}
                    className="group flex items-center gap-3 bg-white text-black font-semibold rounded-full pl-5 pr-2 py-2 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-black/20"
                  >
                    <Download className="w-4 h-4" />
                    <span className="text-[14px]">Export Report</span>
                    <div className="bg-[var(--brand-blue)] rounded-full w-8 h-8 flex items-center justify-center group-hover:bg-[var(--brand-blue-hover)] transition-colors">
                      <Download className="w-3.5 h-3.5 text-white" />
                    </div>
                  </button>
                </motion.div>
              </div>
            </div>
          </section>

          {/* ─────────────────────────────────────────────
              OVERALL SCORE HERO
          ───────────────────────────────────────────── */}
          <section className="px-8 md:px-28 py-12 md:py-16">
            <div className="max-w-5xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                className={`group relative bg-card/60 backdrop-blur-2xl border rounded-3xl overflow-hidden transition-all duration-500 ${grade.border} ${grade.glow}`}
              >
                {/* Top scanning laser */}
                <motion.div
                  className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[var(--brand-blue)]/80 to-transparent pointer-events-none"
                  animate={{ x: ["-100%", "100%"] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                />
                {/* Background glow */}
                <div className="absolute -right-20 -top-20 w-80 h-80 bg-[var(--brand-blue)]/[0.04] blur-[50px] rounded-full pointer-events-none" />
                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.025] to-transparent pointer-events-none" />

                <div className="relative z-10 p-8 md:p-10 flex flex-col md:flex-row md:items-center gap-8 md:gap-16">

                  {/* Score ring */}
                  <div className="relative shrink-0 flex items-center justify-center w-[180px] h-[180px] mx-auto md:mx-0">
                    {/* Outer pulse glow */}
                    <motion.div
                      className="absolute inset-0 rounded-full bg-[var(--brand-blue)]/10"
                      animate={{ scale: [1, 1.08, 1], opacity: [0.5, 0.15, 0.5] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    />
                    <svg width="180" height="180" className="-rotate-90 absolute inset-0">
                      {/* Track */}
                      <circle cx="90" cy="90" r="80" stroke="rgba(255,255,255,0.05)" strokeWidth="8" fill="none" />
                      {/* Score arc */}
                      <motion.circle
                        cx="90" cy="90" r="80"
                        stroke="var(--brand-blue)"
                        strokeWidth="8"
                        fill="none"
                        strokeLinecap="round"
                        strokeDasharray={2 * Math.PI * 80}
                        initial={{ strokeDashoffset: 2 * Math.PI * 80 }}
                        animate={{ strokeDashoffset: 2 * Math.PI * 80 * (1 - score / 100) }}
                        transition={{ duration: 1.5, ease: "easeOut", delay: 0.3 }}
                        style={{ filter: "drop-shadow(0 0 6px rgba(48,84,255,0.4))" }}
                      />
                    </svg>
                    {/* Center number */}
                    <div className="relative text-center z-10">
                      <motion.div
                        initial={{ scale: 0.6, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: "spring", stiffness: 120, damping: 14, delay: 0.4 }}
                        className="text-5xl font-bold tabular-nums text-white [text-shadow:0_0_20px_rgba(255,255,255,0.2)] leading-none"
                      >
                        {Math.round(score)}
                      </motion.div>
                      <div className="text-xs text-white/35 mt-1 font-mono uppercase tracking-widest">/ 100</div>
                    </div>
                  </div>

                  {/* Score text block */}
                  <div className="flex-1">
                    {/* Grade badge */}
                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold mb-4 ${grade.border} ${grade.text} bg-white/[0.04]`}>
                      <TrendingUp className="w-3.5 h-3.5" />
                      {grade.label}
                    </div>

                    <div className="text-xs font-semibold uppercase tracking-widest text-white/35 mb-2">Overall Score</div>
                    <div className="text-4xl md:text-5xl font-bold text-white tracking-tighter mb-4" style={{ fontFamily: 'var(--font-serif)' }}>
                      {score >= 80 ? "Outstanding." : score >= 65 ? "Well done." : score >= 45 ? "Room to grow." : "Keep practicing."}
                    </div>
                    <p className="text-sm text-white/45 leading-relaxed max-w-md">
                      This score reflects a weighted fusion of your speech cadence, facial emotion, semantic relevance, and vocal confidence — processed through our dual ANN scoring layer.
                    </p>

                    {/* Full progress bar */}
                    <div className="mt-6">
                      <div className="h-[4px] rounded-full bg-white/5 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${score}%` }}
                          transition={{ duration: 1.5, ease: "easeOut", delay: 0.4 }}
                          className="h-full rounded-full bg-gradient-to-r from-[var(--brand-blue)] to-[#4a6fff]"
                          style={{ boxShadow: "0 0 8px rgba(48,84,255,0.4)" }}
                        />
                      </div>
                      <div className="flex justify-between mt-2 text-xs text-white/25 font-mono">
                        <span>0</span><span>25</span><span>50</span><span>75</span><span>100</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: quick stats */}
                  <div className="shrink-0 flex flex-row md:flex-col gap-4 md:gap-5 flex-wrap">
                    {[
                      { label: "Relevance", val: pct(apiData.relevance ?? 0) },
                      { label: "Sentiment", val: pct(apiData.sentiment ?? 0) },
                      { label: "Confidence", val: apiData.confidence_label },
                    ].map((s, i) => (
                      <motion.div
                        key={s.label}
                        initial={{ opacity: 0, x: 15 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.5 + i * 0.1 }}
                        className="flex flex-col gap-1"
                      >
                        <span className="text-[10px] uppercase tracking-widest text-white/30 font-medium">{s.label}</span>
                        <span className="text-xl font-bold text-white tabular-nums">{s.val}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>
          </section>

          {/* ─────────────────────────────────────────────
              MAIN DASHBOARD GRID (Bento Layout)
          ───────────────────────────────────────────── */}
          <section className="px-8 md:px-28 py-12 md:py-16">
            <div className="max-w-5xl mx-auto grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">

              {/* ── ROW 1: AI Summary & Confidence ── */}
              <SectionCard delay={0.1} className="lg:col-span-2 h-full flex flex-col justify-center">
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-8 h-8 rounded-xl bg-[var(--brand-blue)]/15 border border-[var(--brand-blue)]/20 flex items-center justify-center shrink-0">
                      <Sparkles className="w-4 h-4 text-[var(--brand-blue)]" strokeWidth={1.5} />
                    </div>
                    <h3 className="text-sm font-semibold text-white/80 uppercase tracking-widest">AI Summary</h3>
                  </div>
                  <div className="space-y-3 text-sm text-white/55 leading-relaxed">
                    <p>Relevance score of <span className="text-white/85 font-medium">{pct(apiData.relevance ?? 0)}</span> indicates {(apiData.relevance ?? 0) >= 0.7 ? "strong alignment" : "partial alignment"} with the target question.</p>
                    <p>Sentiment analysis returned <span className="text-white/85 font-medium">{pct(apiData.sentiment ?? 0)}</span> — a {(apiData.sentiment ?? 0) >= 0.65 ? "positive" : "neutral"} tonal signature.</p>
                    <p>Dominant facial affect: <span className="text-white/85 font-medium capitalize">{Object.entries(apiData.emotion_probs ?? {}).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "N/A"}</span>.</p>
                    <p>Final fusion score <span className="text-white/85 font-medium">{Math.round(score)}/100</span> — computed via dual ANN scoring architecture.</p>
                  </div>
                </div>
              </SectionCard>

              <SectionCard delay={0.15} className="lg:col-span-1 h-full">
                <div className="p-6 flex flex-col items-center text-center h-full justify-center">
                  <div className="w-full mb-5 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-[var(--brand-blue)]/15 border border-[var(--brand-blue)]/20 flex items-center justify-center shrink-0">
                      <Brain className="w-4 h-4 text-[var(--brand-blue)]" strokeWidth={1.5} />
                    </div>
                    <h3 className="text-sm font-semibold text-white/80 uppercase tracking-widest text-left">Vocal Confidence</h3>
                  </div>

                  {/* Ring */}
                  <div className="relative flex items-center justify-center w-[150px] h-[150px] mb-5">
                    <motion.div
                      className="absolute inset-0 rounded-full bg-[var(--brand-blue)]/10"
                      animate={{ scale: [1, 1.06, 1], opacity: [0.6, 0.2, 0.6] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    />
                    <svg width="150" height="150" className="-rotate-90 absolute">
                      <circle cx="75" cy="75" r={r} stroke="rgba(255,255,255,0.05)" strokeWidth="7" fill="none" />
                      <motion.circle
                        cx="75" cy="75" r={r}
                        stroke="var(--brand-blue)"
                        strokeWidth="7"
                        fill="none"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        initial={{ strokeDashoffset: circumference }}
                        whileInView={{ strokeDashoffset: circumference * (1 - confPct) }}
                        viewport={{ once: true }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        style={{ filter: "drop-shadow(0 0 6px rgba(48,84,255,0.8))" }}
                      />
                    </svg>
                    <div className="relative z-10 text-center">
                      <div className="text-2xl font-bold text-white">{apiData.confidence_label}</div>
                      <div className="text-xs text-white/30 font-mono uppercase tracking-widest mt-1">{Math.round(confPct * 100)}%</div>
                    </div>
                  </div>

                  <p className="text-xs text-white/45 leading-relaxed px-2">
                    {apiData.confidence_label === "High"
                      ? "Strong confidence projected through voice and expressions."
                      : apiData.confidence_label === "Medium"
                      ? "Moderate confidence — more practice will sharpen this."
                      : "Work on vocal steadiness and maintain a calm expression."}
                  </p>
                </div>
              </SectionCard>

              {/* ── ROW 2: Speech & Emotion ── */}
              <SectionCard delay={0.2} className="lg:col-span-2 h-full">
                <div className="p-6 h-full flex flex-col justify-center">
                  <SectionLabel icon={Mic} label="Speech Intelligence" />
                  {speechMetrics ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-5">
                      {speechMetrics.map((m) => (
                        <MetricBar key={m.label} label={m.label} value={m.value} raw={m.raw} delay={m.delay} />
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-white/35">No audio data processed.</p>
                  )}

                  {af && (
                    <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        { k: "Rate", v: `${af.speech_rate.toFixed(1)}`, unit: "syl/s" },
                        { k: "Energy", v: `${(af.energy * 1000).toFixed(1)}`, unit: "mE" },
                        { k: "Duration", v: `${af.duration.toFixed(1)}`, unit: "sec" },
                        { k: "Pitch Var", v: `${af.pitch_variance.toFixed(0)}`, unit: "Hz²" },
                      ].map((stat) => (
                        <div key={stat.k} className="bg-white/[0.025] border border-white/5 rounded-2xl p-3 text-center">
                          <div className="text-[11px] uppercase tracking-widest text-white/30 mb-1">{stat.k}</div>
                          <div className="text-lg font-bold text-white tabular-nums">{stat.v}</div>
                          <div className="text-[10px] text-white/25 font-mono">{stat.unit}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </SectionCard>

              <SectionCard delay={0.25} className="lg:col-span-1 h-full flex flex-col">
                <div className="p-6 h-full flex flex-col">
                  <SectionLabel icon={Eye} label="Emotion Analysis" />
                  <div className="flex-1 min-h-[160px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={emotionData} layout="vertical" margin={{ left: 8, right: 16, top: 0, bottom: 0 }}>
                        <XAxis type="number" domain={[0, 100]} tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 10 }} tickFormatter={(v) => `${v}%`} axisLine={false} tickLine={false} />
                        <YAxis type="category" dataKey="name" tick={{ fill: "rgba(255,255,255,0.55)", fontSize: 12 }} width={62} axisLine={false} tickLine={false} />
                        <Tooltip
                          contentStyle={{ background: "#030309", border: "1px solid rgba(48,84,255,0.1)", borderRadius: 12, fontSize: 12, color: "#fff", backdropFilter: "blur(12px)" }}
                          formatter={(v) => [`${v}%`, "Detected"]}
                          cursor={{ fill: "rgba(255,255,255,0.03)" }}
                        />
                        <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={18}>
                          {emotionData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="mt-4 text-xs text-white/45 leading-relaxed border-t border-white/5 pt-4">
                    {emotionInsight(apiData.emotion_probs ?? {})}
                  </p>
                </div>
              </SectionCard>

              {/* ── ROW 3: NLP, Fusion, & Feedback ── */}
              <SectionCard delay={0.3} className="lg:col-span-1 h-full flex flex-col">
                <div className="p-6 h-full flex flex-col">
                  <SectionLabel icon={MessageSquareText} label="NLP Understanding" />
                  <div className="flex-1 flex flex-col justify-center space-y-6">
                    <div>
                      <div className="flex justify-between items-baseline mb-3">
                        <span className="text-sm font-medium text-white/70">Answer Relevance</span>
                        <span className="text-lg font-bold text-white tabular-nums">{pct(apiData.relevance ?? 0)}</span>
                      </div>
                      <MetricBar label="" value={Math.round((apiData.relevance ?? 0) * 100)} />
                      <p className="mt-3 text-xs text-white/45 leading-relaxed">{relevanceLabel(apiData.relevance ?? 0)}</p>
                    </div>
                    <div className="border-t border-white/5 pt-6">
                      <div className="flex justify-between items-baseline mb-3">
                        <span className="text-sm font-medium text-white/70">Tone & Sentiment</span>
                        <span className="text-lg font-bold text-white tabular-nums">{pct(apiData.sentiment ?? 0)}</span>
                      </div>
                      <MetricBar label="" value={Math.round((apiData.sentiment ?? 0) * 100)} accent="rgba(255,255,255,0.6)" />
                      <p className="mt-3 text-xs text-white/45 leading-relaxed">{sentimentLabel(apiData.sentiment ?? 0)}</p>
                    </div>
                  </div>
                </div>
              </SectionCard>

              <SectionCard delay={0.35} className="lg:col-span-1 h-full flex flex-col">
                <div className="p-6 h-full flex flex-col">
                  <SectionLabel icon={Network} label="Fusion Dimensions" />
                  <div className="flex-1 min-h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={radarData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
                        <PolarGrid stroke="rgba(255,255,255,0.06)" />
                        <PolarAngleAxis dataKey="metric" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} />
                        <Radar dataKey="v" stroke="var(--brand-blue)" fill="var(--brand-blue)" fillOpacity={0.15} strokeWidth={2} dot={{ fill: "var(--brand-blue)", r: 4 }} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </SectionCard>

              {/* Feedback Column */}
              <div className="lg:col-span-1 flex flex-col gap-6 h-full">
                <SectionCard delay={0.4} className="flex-1">
                  <div className="p-6 h-full flex flex-col justify-center">
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-8 h-8 rounded-xl bg-success/15 border border-success/20 flex items-center justify-center shrink-0">
                        <ThumbsUp className="w-4 h-4 text-success" strokeWidth={1.5} />
                      </div>
                      <h3 className="text-sm font-semibold text-white/80 uppercase tracking-widest">Strengths</h3>
                    </div>
                    <ul className="space-y-3">
                      {strengths.length > 0
                        ? strengths.map((s, i) => (
                          <motion.li
                            key={i}
                            initial={{ opacity: 0, x: -8 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.07 }}
                            className="flex gap-3 items-start min-w-0"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-success mt-0.5 shrink-0" strokeWidth={2} />
                            <span className="text-xs text-white/60 leading-relaxed min-w-0 flex-1 break-words">{s}</span>
                          </motion.li>
                        ))
                        : <li className="text-xs text-white/30 italic">Keep practicing — strengths will emerge.</li>
                      }
                    </ul>
                  </div>
                </SectionCard>
                <SectionCard delay={0.45} className="flex-1">
                  <div className="p-6 h-full flex flex-col justify-center">
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-8 h-8 rounded-xl bg-warning/15 border border-warning/20 flex items-center justify-center shrink-0">
                        <AlertTriangle className="w-4 h-4 text-warning" strokeWidth={1.5} />
                      </div>
                      <h3 className="text-sm font-semibold text-white/80 uppercase tracking-widest">Areas to Improve</h3>
                    </div>
                    <ul className="space-y-3">
                      {weaknesses.length > 0
                        ? weaknesses.map((w, i) => (
                          <motion.li
                            key={i}
                            initial={{ opacity: 0, x: -8 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.07 }}
                            className="flex gap-3 items-start min-w-0"
                          >
                            <AlertTriangle className="w-3.5 h-3.5 text-warning mt-0.5 shrink-0" strokeWidth={2} />
                            <span className="text-xs text-white/60 leading-relaxed min-w-0 flex-1 break-words">{w}</span>
                          </motion.li>
                        ))
                        : <li className="text-xs text-white/30 italic">No major weaknesses detected — great job!</li>
                      }
                    </ul>
                  </div>
                </SectionCard>
              </div>

              {/* ── ROW 4: Recommendations & Transcript ── */}
              <SectionCard delay={0.5} className="lg:col-span-1 h-full flex flex-col">
                <div className="p-6 h-full flex flex-col justify-center">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-8 h-8 rounded-xl bg-[var(--brand-blue)]/15 border border-[var(--brand-blue)]/20 flex items-center justify-center shrink-0">
                      <Lightbulb className="w-4 h-4 text-[var(--brand-blue)]" strokeWidth={1.5} />
                    </div>
                    <h3 className="text-sm font-semibold text-white/80 uppercase tracking-widest">Recommendations</h3>
                  </div>
                  <ul className="space-y-3">
                    {suggestions.length > 0
                      ? suggestions.map((s, i) => (
                        <motion.li
                          key={i}
                          initial={{ opacity: 0, x: -8 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: i * 0.07 }}
                          className="flex gap-3 items-start min-w-0"
                        >
                          <Lightbulb className="w-3.5 h-3.5 text-[var(--brand-blue)] mt-0.5 shrink-0" strokeWidth={2} />
                          <span className="text-[13px] text-white/60 leading-relaxed min-w-0 flex-1 break-words">{s}</span>
                        </motion.li>
                      ))
                      : <li className="text-xs text-white/30 italic">Keep up the great work!</li>
                    }
                  </ul>
                </div>
              </SectionCard>

              <SectionCard delay={0.55} className="lg:col-span-2 h-full flex flex-col">
                <div className="p-8 h-full flex flex-col justify-center">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-[var(--brand-blue)]/15 border border-[var(--brand-blue)]/20 flex items-center justify-center shrink-0">
                        <MessageSquareText className="w-4 h-4 text-[var(--brand-blue)]" strokeWidth={1.5} />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-white/80 uppercase tracking-widest">Transcription</h3>
                        <p className="text-xs text-white/30 mt-0.5">Whisper ASR output</p>
                      </div>
                    </div>
                  </div>

                  <div className="relative flex-1 max-h-48 overflow-y-auto pr-2 scrollbar-thin">
                    {/* Bottom fade */}
                    <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-card/80 to-transparent pointer-events-none z-10" />
                    <motion.blockquote
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.8 }}
                      className="text-lg md:text-xl font-medium leading-relaxed text-white/75 italic break-words whitespace-pre-wrap"
                      style={{ fontFamily: 'var(--font-serif)' }}
                    >
                      "{apiData.transcription || "No speech detected in the video."}"
                    </motion.blockquote>
                  </div>
                </div>
              </SectionCard>

            </div>
          </section>

          {/* ─────────────────────────────────────────────
              BOTTOM CTA
          ───────────────────────────────────────────── */}
        <section className="px-8 md:px-28 pb-24">
            <div className="max-w-5xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.8 }}
                className="group relative bg-card/60 backdrop-blur-2xl border border-white/5 rounded-3xl p-10 md:p-14 text-center hover:border-[var(--brand-blue)]/25 hover:shadow-[0_0_50px_rgba(48,84,255,0.12)] transition-all duration-500 overflow-hidden bg-gradient-to-br from-white/[0.03] to-transparent"
              >
                {/* Glow beam */}
                <div className="absolute -inset-px bg-gradient-to-r from-transparent via-[var(--brand-blue)]/15 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none blur-sm" />
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-[var(--brand-blue)]/8 blur-[60px] rounded-full pointer-events-none" />
                {/* Neural scan line */}
                <motion.div
                  className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[var(--brand-blue)]/60 to-transparent pointer-events-none"
                  animate={{ x: ["-100%", "100%"] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                />
                <Brain className="w-8 h-8 text-[var(--brand-blue)] mx-auto mb-5 opacity-80 relative z-10" strokeWidth={1.5} />
                <h3 className="text-2xl font-semibold text-white mb-3 tracking-tight relative z-10" style={{ fontFamily: 'var(--font-serif)' }}>
                  Ready to improve?
                </h3>
                <p className="text-sm text-white/45 leading-relaxed max-w-lg mx-auto mb-8 relative z-10">
                  Run a new analysis session to track your progress. Each iteration improves your score with refined AI feedback.
                </p>
                <Link
                  to="/analyze"
                  className="group/btn inline-flex items-center gap-4 bg-white text-black font-semibold rounded-full pl-7 pr-2 py-2 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-black/20 relative z-10"
                >
                  <span className="text-[16px]">Start New Session</span>
                  <div className="bg-[var(--brand-blue)] rounded-full w-[40px] h-[40px] flex items-center justify-center group-hover/btn:bg-[var(--brand-blue-hover)] transition-colors">
                    <ChevronRight className="w-5 h-5 text-white" />
                  </div>
                </Link>
              </motion.div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
