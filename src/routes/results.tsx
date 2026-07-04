import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useMemo } from "react";
import { z } from "zod";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";
import {
  TrendingUp,
  Download,
  ArrowLeft,
  Mic,
  Eye,
  MessageSquareText,
  Network,
  ThumbsUp,
  AlertTriangle,
  Lightbulb,
  Sparkles,
  Brain,
  CheckCircle2,
  ChevronRight,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  ChevronDown,
  ChevronUp,
  Briefcase,
  Activity,
  ShieldCheck,
  Zap,
  Server,
  Shield,
  Target,
  Repeat,
  Quote,
  Star,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { getAnalysisResults, ApiResults } from "@/hooks/use-analysis";
import { generateInterviewReport } from "@/lib/export-pdf";
import { Particles } from "../components/ui/Particles";
import { AmbientMotion } from "../components/ui/AmbientMotion";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { apiGet } from "@/lib/api-client";

export const Route = createFileRoute("/results")({
  validateSearch: z.object({
    sessionId: z.string().optional(),
  }),
  head: () => ({
    meta: [
      { title: "Executive Report — AI Interview Evaluator" },
      { name: "description", content: "Your multimodal AI executive coaching report." },
    ],
  }),
  component: () => (
    <AuthGuard>
      <ResultsPage />
    </AuthGuard>
  ),
});

// ─── Helper functions ────────────────────────────────────────────────────────

function getGradeBadge(score: number): {
  label: string;
  glow: string;
  border: string;
  text: string;
} {
  if (score >= 80)
    return {
      label: "Excellent",
      glow: "shadow-[0_0_20px_rgba(48,84,255,0.25)]",
      border: "border-[var(--brand-blue)]/50",
      text: "text-white",
    };
  if (score >= 65)
    return {
      label: "Good",
      glow: "shadow-[0_0_30px_rgba(48,84,255,0.2)]",
      border: "border-[var(--brand-blue)]/30",
      text: "text-[#4a6fff]",
    };
  if (score >= 45)
    return {
      label: "Average",
      glow: "shadow-[0_0_25px_rgba(251,146,60,0.2)]",
      border: "border-orange-500/30",
      text: "text-orange-400",
    };
  return {
    label: "Needs Practice",
    glow: "shadow-[0_0_20px_rgba(239,68,68,0.15)]",
    border: "border-red-500/20",
    text: "text-red-400",
  };
}

function getReadiness(score: number): string {
  if (score >= 80) return "Ready for Final Rounds";
  if (score >= 65) return "Ready for Initial Screens";
  if (score >= 45) return "Needs Targeted Practice";
  return "Requires Significant Preparation";
}

function getCategoricalGrade(
  value: number,
  type: "relevance" | "confidence" | "emotion" | "sentiment",
): string {
  if (type === "relevance") {
    if (value >= 0.8) return "Excellent";
    if (value >= 0.6) return "Good";
    if (value >= 0.4) return "Average";
    return "Needs Improvement";
  }
  if (type === "confidence") {
    if (value >= 0.8) return "Excellent";
    if (value >= 0.5) return "Good";
    if (value >= 0.3) return "Average";
    return "Needs Improvement";
  }
  if (type === "emotion") {
    if (value <= 0.15) return "Excellent";
    if (value <= 0.3) return "Good";
    if (value <= 0.5) return "Average";
    return "Needs Improvement";
  }
  if (type === "sentiment") {
    if (value >= 0.7) return "Excellent";
    if (value >= 0.5) return "Good";
    if (value >= 0.3) return "Average";
    return "Needs Improvement";
  }
  return "Average";
}

function GradeBadgeText({ grade }: { grade: string }) {
  let color = "text-white";
  if (grade === "Excellent") color = "text-success";
  if (grade === "Good") color = "text-[var(--brand-blue)]";
  if (grade === "Average") color = "text-orange-400";
  if (grade === "Needs Improvement") color = "text-red-400";
  return <span className={`font-semibold ${color}`}>{grade}</span>;
}

function getCommunicationAnalysis(data: ApiResults | null) {
  if (!data) return [];
  const analysis = [];
  const rate = data.audio_features?.speech_rate ?? 0;
  if (rate > 0) {
    if (rate > 4.5)
      analysis.push({
        label: "Speaking Pace",
        grade: "Needs Improvement",
        desc: "Your speech was somewhat fast, which can make technical concepts hard to follow. Try pacing your delivery.",
      });
    else if (rate < 2.0)
      analysis.push({
        label: "Speaking Pace",
        grade: "Needs Improvement",
        desc: "Your speech was quite slow. Aim for a slightly brisker, conversational pace to maintain engagement.",
      });
    else if (rate > 3.8)
      analysis.push({
        label: "Speaking Pace",
        grade: "Good",
        desc: "A brisk but clear pace. You kept the momentum going effectively.",
      });
    else
      analysis.push({
        label: "Speaking Pace",
        grade: "Excellent",
        desc: "You maintained a highly comfortable and measured speaking pace throughout the interview.",
      });
  }
  const energy = data.audio_features?.energy ?? 0;
  if (energy > 0) {
    if (energy > 0.05)
      analysis.push({
        label: "Vocal Energy",
        grade: "Excellent",
        desc: "Strong, engaging vocal energy that commands attention.",
      });
    else if (energy > 0.015)
      analysis.push({
        label: "Vocal Energy",
        grade: "Good",
        desc: "Appropriate vocal energy for a professional setting.",
      });
    else
      analysis.push({
        label: "Vocal Energy",
        grade: "Average",
        desc: "Your voice was a bit quiet or flat. Projecting slightly more will project confidence.",
      });
  }
  const sent = data.sentiment ?? 0;
  if (sent >= 0.7)
    analysis.push({
      label: "Tone",
      grade: "Excellent",
      desc: "Very positive and confident tone, demonstrating enthusiasm for the role.",
    });
  else if (sent >= 0.4)
    analysis.push({ label: "Tone", grade: "Good", desc: "Professional and balanced tone." });
  else
    analysis.push({
      label: "Tone",
      grade: "Needs Improvement",
      desc: "Tone leaned neutral or hesitant. Try to inject more enthusiasm.",
    });

  const anxious = data.emotion_probs?.anxious ?? 0;
  const happy = data.emotion_probs?.happy ?? 0;
  if (happy > 0.4)
    analysis.push({
      label: "Facial Expression",
      grade: "Excellent",
      desc: "Friendly, approachable, and positive facial expressions were detected.",
    });
  else if (anxious > 0.3)
    analysis.push({
      label: "Facial Expression",
      grade: "Needs Improvement",
      desc: "Some visible nervousness. Remember to breathe, relax your shoulders, and smile naturally.",
    });
  else
    analysis.push({
      label: "Facial Expression",
      grade: "Good",
      desc: "Composed and professional demeanor.",
    });
  return analysis;
}

function getAnswerQualityAnalysis(data: ApiResults | null) {
  if (!data) return [];
  const analysis = [];
  const rel = data.relevance ?? 0;
  if (rel >= 0.8)
    analysis.push({
      label: "Topic Relevance",
      grade: "Excellent",
      desc: "Your answer directly and comprehensively addressed the core of the question.",
    });
  else if (rel >= 0.6)
    analysis.push({
      label: "Topic Relevance",
      grade: "Good",
      desc: "Mostly on-topic, though a few points could have been tied back to the main question more tightly.",
    });
  else
    analysis.push({
      label: "Topic Relevance",
      grade: "Average",
      desc: "The answer drifted from the prompt. Focus on answering exactly what was asked.",
    });
  const dur = data.audio_features?.duration ?? 0;
  if (dur > 0) {
    if (dur > 90)
      analysis.push({
        label: "Completeness",
        grade: "Excellent",
        desc: "You provided a thorough and well-developed response.",
      });
    else if (dur > 45)
      analysis.push({
        label: "Completeness",
        grade: "Good",
        desc: "A solid overview, but could potentially benefit from slightly more detail or examples.",
      });
    else
      analysis.push({
        label: "Completeness",
        grade: "Needs Improvement",
        desc: "Your answer was very brief. Try expanding with specific examples or outcomes.",
      });
  }
  if (rel >= 0.7 && dur > 60)
    analysis.push({
      label: "Structure",
      grade: "Good",
      desc: "Ideas were presented logically and sequentially.",
    });
  else
    analysis.push({
      label: "Structure",
      grade: "Average",
      desc: "Ensure your answer follows a clear beginning, middle, and conclusion.",
    });
  return analysis;
}

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
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay }}
      className={`group relative bg-card/60 backdrop-blur-md border border-white/10 rounded-3xl overflow-hidden ${hover ? "card-hover" : "transition-all duration-500"} ${className}`}
    >
      <motion.div
        className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[var(--brand-blue)]/15 to-transparent pointer-events-none"
        animate={{ x: ["-100%", "100%"] }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear", delay: delay * 1.5 + 0.5 }}
      />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-24 bg-[var(--brand-blue)]/[0.02] blur-[20px] rounded-full pointer-events-none" />
      <div className="relative z-10">{children}</div>
    </motion.div>
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
  const { sessionId } = useSearch({ from: "/results" });
  const [sessionData, setSessionData] = useState<ApiResults | null>(null);
  const [loading, setLoading] = useState(!!sessionId);

  useEffect(() => {
    if (!sessionId) {
      setLoading(false);
      return;
    }
    const loadSession = async () => {
      setLoading(true);
      try {
        const data = await apiGet<ApiResults>(`/api/sessions/${sessionId}`);
        setSessionData(data);
      } catch (err) {
        toast.error("Failed to load interview session detail.");
      } finally {
        setLoading(false);
      }
    };
    loadSession();
  }, [sessionId]);

  const [historySessions, setHistorySessions] = useState<any[]>([]);
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await apiGet<{ items: any[] }>("/api/sessions?skip=0&limit=100");
        setHistorySessions(res.items || []);
      } catch {
        /* silent */
      }
    };
    fetchHistory();
  }, [sessionId]);

  const apiData = sessionId ? sessionData : getAnalysisResults();

  const [coachingData, setCoachingData] = useState<any | null>(null);
  const [loadingCoaching, setLoadingCoaching] = useState(false);
  const [coachingError, setCoachingError] = useState(false);

  useEffect(() => {
    const activeSessionId = sessionId || (apiData as any)?.session_id;
    if (!activeSessionId) return;
    const fetchCoaching = async () => {
      setLoadingCoaching(true);
      try {
        const res = await apiGet<any>(`/api/coaching/${activeSessionId}`);
        setCoachingData(res);
      } catch (err) {
        console.error("Coaching fetch failed:", err);
        setCoachingError(true);
      } finally {
        setLoadingCoaching(false);
      }
    };
    fetchCoaching();
  }, [sessionId, (apiData as any)?.session_id]);

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col items-center gap-6"
        >
          <motion.div
            className="w-16 h-16 rounded-2xl bg-[var(--brand-blue)]/10 border border-[var(--brand-blue)]/20 flex items-center justify-center"
            animate={{
              boxShadow: [
                "0 0 0px rgba(48,84,255,0.2)",
                "0 0 30px rgba(48,84,255,0.5)",
                "0 0 0px rgba(48,84,255,0.2)",
              ],
            }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <Brain className="w-7 h-7 text-[var(--brand-blue)]" strokeWidth={1.5} />
          </motion.div>
          <div className="text-xs text-white/50 tracking-wider">Compiling executive report...</div>
        </motion.div>
      </div>
    );
  }

  if (!apiData) {
    return (
      <div className="relative min-h-screen text-foreground flex flex-col items-center justify-center text-center px-6">
        <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
          <Particles />
        </div>
        <div className="relative z-10 flex flex-col items-center gap-6">
          <motion.div className="w-20 h-20 rounded-3xl bg-[var(--brand-blue)]/15 border border-[var(--brand-blue)]/20 flex items-center justify-center shadow-[0_0_40px_rgba(48,84,255,0.3)]">
            <Sparkles className="w-9 h-9 text-[var(--brand-blue)]" strokeWidth={1.5} />
          </motion.div>
          <div>
            <h2
              className="text-3xl font-semibold tracking-tight text-white mb-3"
              style={{ fontFamily: "var(--font-serif)" }}
            >
              No results yet
            </h2>
            <p className="text-white/75 text-sm max-w-sm">
              Submit an interview first to see your multimodal AI report here.
            </p>
          </div>
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
        </div>
      </div>
    );
  }

  const score = apiData.final_score ?? 0;
  const grade = getGradeBadge(score);
  const readiness = getReadiness(score);
  const confVal =
    apiData.confidence_probability !== undefined
      ? apiData.confidence_probability
      : apiData.confidence_class === 2
        ? 0.9
        : apiData.confidence_class === 1
          ? 0.55
          : 0.2;

  const snapshot = [
    { label: "Confidence", grade: getCategoricalGrade(confVal, "confidence") },
    { label: "Answer Quality", grade: getCategoricalGrade(apiData.relevance ?? 0, "relevance") },
    {
      label: "Communication",
      grade: getCategoricalGrade(apiData.audio_features?.energy ?? 0.02, "sentiment"),
    },
    {
      label: "Body Language",
      grade: getCategoricalGrade(apiData.emotion_probs?.anxious ?? 0, "emotion"),
    },
    { label: "Professionalism", grade: getCategoricalGrade(apiData.sentiment ?? 0, "sentiment") },
  ];

  const commAnalysis = useMemo(() => getCommunicationAnalysis(apiData), [apiData]);
  const qualAnalysis = useMemo(() => getAnswerQualityAnalysis(apiData), [apiData]);

  const suggestions = coachingData?.suggestions || {};
  const isOldSchema = Array.isArray(suggestions?.strengths);

  // Phase 4 fields:
  const isPhase4 = suggestions?.recruiter_perspective !== undefined;

  const summaryText =
    suggestions?.executive_summary ||
    suggestions?.summary ||
    (score >= 80
      ? "Excellent Interview Performance with strong overall fundamentals."
      : score >= 65
        ? "Good Communication with minor improvements needed in delivery."
        : "Moderate Performance with clear areas for structured practice.");

  return (
    <div className="relative min-h-screen text-foreground overflow-x-hidden">
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <Particles />
      </div>
      <div className="relative z-10">
        <AmbientMotion />
        <div
          className="absolute inset-0 z-0 opacity-[0.02] pointer-events-none mix-blend-overlay"
          style={{
            backgroundImage:
              'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")',
          }}
        />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-[var(--brand-blue)]/[0.04] blur-[140px] rounded-full pointer-events-none" />

        <div className="relative z-20">
          {/* HEADER */}
          <section className="px-8 md:px-28 pt-32 pb-10">
            <div className="max-w-5xl mx-auto">
              <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
                <div>
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="flex items-center gap-3 px-1.5 py-1.5 pr-5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-6 w-fit"
                  >
                    <div className="bg-[var(--brand-blue)] text-white text-xs font-semibold px-2.5 py-1 rounded-full leading-none">
                      Executive Report
                    </div>
                    <div className="text-xs text-white/80 font-medium tracking-wide">
                      Analysis complete
                    </div>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7 }}
                  >
                    <h2
                      className="text-[40px] md:text-[56px] font-normal text-white/95 leading-tight"
                      style={{ fontFamily: "var(--font-serif)" }}
                    >
                      Interview
                    </h2>
                    <h1 className="text-[64px] md:text-[104px] font-bold tracking-tight text-white leading-[1.05] [text-shadow:0_0_30px_rgba(255,255,255,0.15)]">
                      Performance.
                    </h1>
                  </motion.div>
                </div>
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className="flex items-center gap-3 shrink-0"
                >
                  <Link
                    to="/analyze"
                    className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/[0.05] border border-white/10 text-sm font-medium text-white/90 btn-interaction"
                  >
                    <ArrowLeft className="w-4 h-4" /> New Session
                  </Link>
                  <button
                    onClick={() => {
                      try {
                        generateInterviewReport(apiData);
                        toast.success("Report generated!");
                      } catch (err) {
                        toast.error("Failed to generate report.");
                      }
                    }}
                    className="group flex items-center gap-3 bg-white text-black font-semibold rounded-full pl-5 pr-2 py-2 btn-interaction shadow-xl shadow-black/20"
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

          {/* OVERALL PERFORMANCE */}
          <section className="px-8 md:px-28 py-10">
            <div className="max-w-5xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7 }}
                className={`group relative bg-card/60 backdrop-blur-md border rounded-3xl overflow-hidden transition-all duration-500 ${grade.border} ${grade.glow}`}
              >
                <div className="relative z-10 p-8 md:p-10 flex flex-col md:flex-row md:items-center gap-8 md:gap-16">
                  <div className="flex flex-col items-center justify-center shrink-0">
                    <div className="text-[100px] font-bold leading-none text-white tracking-tighter [text-shadow:0_0_30px_rgba(255,255,255,0.2)]">
                      {Math.min(99, Math.floor(score))}
                      <span className="text-4xl text-white/40">/100</span>
                    </div>
                    <div
                      className={`mt-2 inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-sm font-semibold ${grade.border} ${grade.text} bg-white/[0.04]`}
                    >
                      <TrendingUp className="w-4 h-4" /> {grade.label} Rating
                    </div>
                  </div>
                  <div className="flex-1 space-y-4">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-widest text-[var(--brand-blue)] mb-2">
                        Readiness Level
                      </div>
                      <h3 className="text-3xl font-semibold text-white/95">{readiness}</h3>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 relative overflow-hidden">
                      <div className="absolute top-0 left-0 bottom-0 w-1 bg-[var(--brand-blue)]" />
                      <div className="flex items-start gap-3">
                        <Brain className="w-5 h-5 text-[var(--brand-blue)] shrink-0 mt-1" />
                        <div>
                          <div className="text-xs uppercase tracking-widest text-white/50 mb-1">
                            Executive Summary
                          </div>
                          <p className="text-lg text-white/90 leading-relaxed font-medium italic">
                            "{summaryText}"
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </section>

          {/* SNAPSHOT */}
          <section className="px-8 md:px-28 py-6">
            <div className="max-w-5xl mx-auto">
              <SectionCard delay={0.1}>
                <div className="p-8">
                  <SectionLabel icon={Activity} label="Interview Snapshot" />
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {snapshot.map((s, i) => (
                      <div
                        key={i}
                        className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex flex-col items-center text-center hover:bg-white/[0.04] transition-colors"
                      >
                        <span className="text-[11px] uppercase tracking-widest text-white/60 mb-3">
                          {s.label}
                        </span>
                        <GradeBadgeText grade={s.grade} />
                      </div>
                    ))}
                  </div>
                </div>
              </SectionCard>
            </div>
          </section>

          {/* AI INTERVIEW MENTOR */}
          <section className="px-8 md:px-28 py-6 relative z-20">
            <div className="max-w-5xl mx-auto space-y-6">
              {loadingCoaching ? (
                <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-10 flex flex-col items-center justify-center gap-4 min-h-[200px]">
                  <Loader2 className="w-8 h-8 text-[var(--brand-blue)] animate-spin" />
                  <span className="text-base text-white/60">
                    AI Mentor is analyzing your session...
                  </span>
                </div>
              ) : coachingError ? (
                <div className="bg-red-500/[0.02] border border-red-500/10 rounded-3xl p-10 flex flex-col items-center justify-center gap-4 min-h-[200px] text-center">
                  <AlertTriangle className="w-8 h-8 text-red-400" />
                  <div>
                    <h4 className="text-base font-bold text-red-400 mb-1">
                      Mentor Currently Unavailable
                    </h4>
                    <span className="text-sm text-white/60">
                      Our AI coaching service is experiencing high demand. Please try again later.
                    </span>
                  </div>
                </div>
              ) : coachingData ? (
                <SectionCard delay={0.2} className="relative">
                  <div className="p-8">
                    <SectionLabel icon={Brain} label="AI Interview Mentor" />

                    {/* TRANSPARENCY BANNER */}
                    {coachingData.transparency && (
                      <div className="flex flex-wrap gap-4 mb-8">
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[11px] font-medium text-white/70">
                          <Server className="w-3.5 h-3.5" /> Powered by:{" "}
                          {coachingData.transparency.model_used}
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[11px] font-medium text-white/70">
                          <Briefcase className="w-3.5 h-3.5" /> Knowledge Sources:{" "}
                          {coachingData.transparency.retrieval_count}
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[11px] font-medium text-white/70">
                          <Shield className="w-3.5 h-3.5" /> Analysis Confidence:{" "}
                          {coachingData.transparency.analysis_confidence}
                        </div>
                      </div>
                    )}

                    {isPhase4 ? (
                      <>
                        {/* OUTLOOK & GOALS */}
                        <div className="grid md:grid-cols-2 gap-6 mb-6">
                          <div className="bg-white/[0.015] border border-white/5 p-6 rounded-3xl h-full flex flex-col justify-center">
                            <span className="text-xs uppercase tracking-widest text-white/50 font-bold mb-3 flex items-center gap-2">
                              <Star className="w-4 h-4 text-orange-400" /> Interview Outlook
                            </span>
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full w-fit mb-3">
                              <span className="text-sm font-semibold text-white/90">
                                {suggestions.interview_outlook?.status}
                              </span>
                            </div>
                            <p className="text-sm text-white/70 leading-relaxed">
                              {suggestions.interview_outlook?.explanation}
                            </p>
                          </div>

                          <div className="bg-white/[0.015] border border-white/5 p-6 rounded-3xl h-full flex flex-col justify-center">
                            <span className="text-xs uppercase tracking-widest text-white/50 font-bold mb-3 flex items-center gap-2">
                              <Target className="w-4 h-4 text-[var(--brand-blue)]" /> Long Term Goal
                            </span>
                            <h4 className="text-lg font-bold text-white mb-2">
                              {suggestions.long_term_goal?.goal_statement}
                            </h4>
                            <div className="text-sm text-[var(--brand-blue)] font-medium">
                              Status: {suggestions.long_term_goal?.progress_status}
                            </div>
                          </div>
                        </div>

                        {/* RECRUITER PERSPECTIVE & THEMES */}
                        <div className="grid md:grid-cols-2 gap-6 mb-6">
                          <div className="bg-[var(--brand-blue)]/[0.05] border border-[var(--brand-blue)]/20 p-6 rounded-3xl h-full flex flex-col relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                              <Users className="w-24 h-24 text-[var(--brand-blue)]" />
                            </div>
                            <span className="text-xs uppercase tracking-widest text-[var(--brand-blue)] font-bold mb-3 flex items-center gap-2 relative z-10">
                              <Quote className="w-4 h-4" /> Recruiter Perspective
                            </span>
                            <p
                              className="text-base text-white/90 leading-relaxed font-medium italic relative z-10"
                              style={{ fontFamily: "var(--font-serif)" }}
                            >
                              "{suggestions.recruiter_perspective}"
                            </p>
                          </div>

                          <div className="bg-white/[0.015] border border-white/5 p-6 rounded-3xl h-full">
                            <span className="text-xs uppercase tracking-widest text-white/50 font-bold mb-4 flex items-center gap-2">
                              <Repeat className="w-4 h-4" /> Recurring Themes
                            </span>
                            <div className="space-y-4">
                              <div>
                                <span className="text-xs font-semibold text-success mb-2 block">
                                  Consistently Strong
                                </span>
                                <ul className="space-y-1.5">
                                  {suggestions.recurring_themes?.consistently_strong?.map(
                                    (item: string, i: number) => (
                                      <li key={i} className="flex gap-2 items-start">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-success/70 shrink-0 mt-0.5" />
                                        <span className="text-sm text-white/80">{item}</span>
                                      </li>
                                    ),
                                  )}
                                </ul>
                              </div>
                              <div>
                                <span className="text-xs font-semibold text-orange-400 mb-2 block">
                                  Needs Continued Attention
                                </span>
                                <ul className="space-y-1.5">
                                  {suggestions.recurring_themes?.needs_attention?.map(
                                    (item: string, i: number) => (
                                      <li key={i} className="flex gap-2 items-start">
                                        <AlertTriangle className="w-3.5 h-3.5 text-orange-400/70 shrink-0 mt-0.5" />
                                        <span className="text-sm text-white/80">{item}</span>
                                      </li>
                                    ),
                                  )}
                                </ul>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* STRENGTHS & IMPROVEMENTS */}
                        <div className="grid md:grid-cols-2 gap-6 mb-6">
                          <div className="bg-success/[0.05] border border-success/20 p-6 rounded-3xl h-full">
                            <span className="text-xs uppercase tracking-widest text-success font-bold mb-3 flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4" /> Biggest Strength
                            </span>
                            <h4 className="text-lg font-bold text-white mb-2">
                              {suggestions.biggest_strength?.title}
                            </h4>
                            <p className="text-sm text-white/80 leading-relaxed mb-4">
                              {suggestions.biggest_strength?.description}
                            </p>
                            <div className="bg-black/20 p-3 rounded-xl border border-white/5 text-xs text-white/60 font-medium italic">
                              <span className="font-bold text-success/80 not-italic">
                                Evidence:{" "}
                              </span>{" "}
                              {suggestions.biggest_strength?.evidence}
                            </div>
                          </div>
                          <div className="bg-orange-500/[0.05] border border-orange-500/20 p-6 rounded-3xl h-full">
                            <span className="text-xs uppercase tracking-widest text-orange-400 font-bold mb-3 flex items-center gap-2">
                              <Zap className="w-4 h-4" /> Highest Priority Improvement
                            </span>
                            <h4 className="text-base font-semibold text-white mb-1">
                              {suggestions.highest_priority_improvement?.current_behaviour}
                            </h4>
                            <p className="text-sm text-white/70 leading-relaxed mb-4">
                              {suggestions.highest_priority_improvement?.why_it_limits}
                            </p>
                            <div className="bg-black/20 p-3 rounded-xl border border-white/5 text-xs text-orange-200/80 font-medium">
                              <span className="font-bold text-orange-400">Expected Benefit: </span>{" "}
                              {suggestions.highest_priority_improvement?.expected_benefit}
                            </div>
                          </div>
                        </div>

                        {/* SMART PRACTICE PLAN */}
                        {suggestions.smart_practice_plan &&
                          suggestions.smart_practice_plan.length > 0 && (
                            <div className="mb-6">
                              <span className="text-xs uppercase tracking-widest text-white/50 font-bold mb-4 block flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-white/70" /> Smart Practice
                                Plans
                              </span>
                              <div className="space-y-4">
                                {suggestions.smart_practice_plan.map((step: any, i: number) => (
                                  <div
                                    key={i}
                                    className="bg-white/[0.02] border border-white/5 p-5 rounded-2xl flex flex-col md:flex-row gap-6 items-start"
                                  >
                                    <div className="w-8 h-8 rounded-full bg-[var(--brand-blue)]/20 text-[var(--brand-blue)] font-bold flex items-center justify-center shrink-0">
                                      {i + 1}
                                    </div>
                                    <div className="flex-1 space-y-2">
                                      <h5 className="font-semibold text-white/90">
                                        {step.objective}
                                      </h5>
                                      <div className="bg-[var(--brand-blue)]/10 text-[var(--brand-blue)] px-4 py-3 rounded-xl text-sm font-medium border border-[var(--brand-blue)]/20 mt-2 inline-block w-full">
                                        Exercise: {step.exercise}
                                      </div>
                                    </div>
                                    <div className="shrink-0 flex flex-col gap-2 mt-2 md:mt-0 md:text-right">
                                      <div className="text-xs font-semibold text-white/40 uppercase">
                                        Expected Outcome
                                      </div>
                                      <div className="text-sm text-white/80 max-w-[150px]">
                                        {step.expected_outcome}
                                      </div>
                                      <div className="flex gap-2 mt-2 justify-end">
                                        <span className="px-2 py-1 bg-white/5 rounded text-[10px] text-white/50">
                                          {step.difficulty}
                                        </span>
                                        <span className="px-2 py-1 bg-white/5 rounded text-[10px] text-white/50">
                                          {step.duration}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                        {/* NEXT QUESTION & MOTIVATION */}
                        <div className="grid md:grid-cols-3 gap-6">
                          <div className="bg-[var(--brand-blue)] border border-[var(--brand-blue)]/50 p-6 rounded-3xl h-full flex flex-col justify-center relative overflow-hidden md:col-span-1 shadow-lg shadow-[var(--brand-blue)]/20">
                            <span className="text-xs uppercase tracking-widest text-white/80 font-bold mb-3 block flex items-center gap-2 relative z-10">
                              <Lightbulb className="w-4 h-4" /> Next Question
                            </span>
                            <p className="text-base font-medium text-white/95 leading-relaxed relative z-10">
                              "{suggestions.next_question?.question}"
                            </p>
                            <p className="text-xs text-white/60 mt-3 relative z-10 italic">
                              Why: {suggestions.next_question?.rationale}
                            </p>
                          </div>
                          <div className="bg-white/[0.015] border border-white/5 p-6 rounded-3xl h-full flex flex-col justify-center md:col-span-2">
                            <span className="text-xs uppercase tracking-widest text-white/50 font-bold mb-3 block">
                              Closing Thoughts
                            </span>
                            <p
                              className="text-lg text-white/90 leading-relaxed font-medium italic"
                              style={{ fontFamily: "var(--font-serif)" }}
                            >
                              "{suggestions.motivational_closing}"
                            </p>
                          </div>
                        </div>
                      </>
                    ) : !isOldSchema && suggestions?.biggest_strength ? (
                      /* PHASE 3 FALLBACK */
                      <>
                        <div className="grid md:grid-cols-2 gap-6 mb-6">
                          <div className="bg-success/[0.05] border border-success/20 p-6 rounded-3xl h-full">
                            <span className="text-xs uppercase tracking-widest text-success font-bold mb-3 flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4" /> Biggest Strength
                            </span>
                            <h4 className="text-lg font-bold text-white mb-2">
                              {suggestions.biggest_strength.title}
                            </h4>
                            <p className="text-sm text-white/80 leading-relaxed mb-4">
                              {suggestions.biggest_strength.description}
                            </p>
                            <div className="bg-black/20 p-3 rounded-xl border border-white/5 text-xs text-white/60 font-medium italic">
                              <span className="font-bold text-success/80 not-italic">
                                Evidence:{" "}
                              </span>{" "}
                              {suggestions.biggest_strength.evidence}
                            </div>
                          </div>

                          <div className="bg-orange-500/[0.05] border border-orange-500/20 p-6 rounded-3xl h-full">
                            <span className="text-xs uppercase tracking-widest text-orange-400 font-bold mb-3 flex items-center gap-2">
                              <Zap className="w-4 h-4" /> Highest Priority Improvement
                            </span>
                            <h4 className="text-base font-semibold text-white mb-1">
                              {suggestions.highest_priority_improvement?.current_behaviour}
                            </h4>
                            <p className="text-sm text-white/70 leading-relaxed mb-4">
                              {suggestions.highest_priority_improvement?.why_it_limits}
                            </p>
                            <div className="bg-black/20 p-3 rounded-xl border border-white/5 text-xs text-orange-200/80 font-medium">
                              <span className="font-bold text-orange-400">Expected Benefit: </span>{" "}
                              {suggestions.highest_priority_improvement?.expected_benefit}
                            </div>
                          </div>
                        </div>

                        {suggestions.improvement_roadmap &&
                          suggestions.improvement_roadmap.length > 0 && (
                            <div className="mb-6">
                              <span className="text-xs uppercase tracking-widest text-white/50 font-bold mb-4 block">
                                Personalized Improvement Roadmap
                              </span>
                              <div className="space-y-4">
                                {suggestions.improvement_roadmap.map((step: any, i: number) => (
                                  <div
                                    key={i}
                                    className="bg-white/[0.02] border border-white/5 p-5 rounded-2xl flex flex-col md:flex-row gap-6 items-start"
                                  >
                                    <div className="w-8 h-8 rounded-full bg-[var(--brand-blue)]/20 text-[var(--brand-blue)] font-bold flex items-center justify-center shrink-0">
                                      {i + 1}
                                    </div>
                                    <div className="flex-1 space-y-2">
                                      <h5 className="font-semibold text-white/90">
                                        {step.problem}
                                      </h5>
                                      <p className="text-sm text-white/60 leading-relaxed">
                                        {step.reason}
                                      </p>
                                      <div className="bg-[var(--brand-blue)]/10 text-[var(--brand-blue)] px-4 py-3 rounded-xl text-sm font-medium border border-[var(--brand-blue)]/20 mt-2 inline-block w-full">
                                        Action: {step.exercise}
                                      </div>
                                    </div>
                                    <div className="shrink-0 flex flex-col gap-2 mt-2 md:mt-0 md:text-right">
                                      <div className="text-xs font-semibold text-white/40 uppercase">
                                        Expected
                                      </div>
                                      <div className="text-sm text-white/80 max-w-[150px]">
                                        {step.expected_improvement}
                                      </div>
                                      <div className="flex gap-2 mt-2 justify-end">
                                        <span className="px-2 py-1 bg-white/5 rounded text-[10px] text-white/50">
                                          {step.difficulty}
                                        </span>
                                        <span className="px-2 py-1 bg-white/5 rounded text-[10px] text-white/50">
                                          {step.estimated_time}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                        <div className="grid md:grid-cols-2 gap-6">
                          <div className="bg-white/[0.015] border border-white/5 p-6 rounded-3xl h-full flex flex-col">
                            <span className="text-xs uppercase tracking-widest text-[var(--brand-blue)] font-bold mb-4 block flex items-center gap-2">
                              <TrendingUp className="w-4 h-4" /> Actionable Practice Plan
                            </span>
                            <div className="space-y-3 flex-1">
                              <div className="flex items-start gap-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-white/20 mt-2 shrink-0" />
                                <div>
                                  <span className="text-xs font-semibold text-white/40 block">
                                    Today
                                  </span>
                                  <span className="text-sm text-white/90">
                                    {suggestions.practice_plan?.today}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-start gap-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-white/20 mt-2 shrink-0" />
                                <div>
                                  <span className="text-xs font-semibold text-white/40 block">
                                    Tomorrow
                                  </span>
                                  <span className="text-sm text-white/90">
                                    {suggestions.practice_plan?.tomorrow}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-start gap-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-[var(--brand-blue)] mt-2 shrink-0" />
                                <div>
                                  <span className="text-xs font-semibold text-[var(--brand-blue)] block">
                                    Weekly Goal
                                  </span>
                                  <span className="text-sm text-white/90">
                                    {suggestions.practice_plan?.weekly}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="bg-[var(--brand-blue)]/[0.05] border border-[var(--brand-blue)]/20 p-6 rounded-3xl h-full flex flex-col justify-center relative overflow-hidden">
                            <span className="text-xs uppercase tracking-widest text-[var(--brand-blue)] font-bold mb-3 block flex items-center gap-2 relative z-10">
                              Targeted Next Question
                            </span>
                            <p className="text-lg font-medium text-white/95 leading-relaxed relative z-10">
                              "{suggestions.next_question?.question}"
                            </p>
                          </div>
                        </div>
                      </>
                    ) : (
                      /* FALLBACK FOR OLD SCHEMA SESSIONS */
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="bg-white/[0.015] border border-white/5 p-6 rounded-3xl">
                          <span className="text-xs uppercase tracking-widest text-white/50 font-bold mb-3 block">
                            Strengths
                          </span>
                          <div className="space-y-4">
                            {suggestions?.strengths?.map((rec: string, i: number) => (
                              <div key={i} className="flex gap-3 items-start">
                                <span className="w-1.5 h-1.5 rounded-full bg-success mt-2 shrink-0" />
                                <span className="text-sm text-white/80">{rec}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="bg-white/[0.015] border border-white/5 p-6 rounded-3xl">
                          <span className="text-xs uppercase tracking-widest text-white/50 font-bold mb-3 block">
                            Recommendations
                          </span>
                          <div className="space-y-4">
                            {suggestions?.recommendations?.map((rec: string, i: number) => (
                              <div key={i} className="flex gap-3 items-start">
                                <span className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-2 shrink-0" />
                                <span className="text-sm text-white/80">{rec}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </SectionCard>
              ) : null}
            </div>
          </section>

          {/* COMMUNICATION & ANSWER QUALITY */}
          <section className="px-8 md:px-28 py-6">
            <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-6">
              <SectionCard delay={0.4} className="h-full">
                <div className="p-8 h-full">
                  <SectionLabel icon={Mic} label="Communication Analysis" />
                  <div className="space-y-5 mt-4">
                    {commAnalysis.map((item, i) => (
                      <div key={i} className="border-b border-white/5 pb-4 last:border-0 last:pb-0">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-white/90">{item.label}</span>
                          <GradeBadgeText grade={item.grade} />
                        </div>
                        <p className="text-sm text-white/70 leading-relaxed">{item.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </SectionCard>

              <SectionCard delay={0.5} className="h-full">
                <div className="p-8 h-full">
                  <SectionLabel icon={MessageSquareText} label="Answer Quality" />
                  <div className="space-y-5 mt-4">
                    {qualAnalysis.map((item, i) => (
                      <div key={i} className="border-b border-white/5 pb-4 last:border-0 last:pb-0">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-white/90">{item.label}</span>
                          <GradeBadgeText grade={item.grade} />
                        </div>
                        <p className="text-sm text-white/70 leading-relaxed">{item.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </SectionCard>
            </div>
          </section>

          {/* HISTORICAL PROGRESS */}
          {historySessions.length > 0 && (
            <section className="px-8 md:px-28 py-6">
              <div className="max-w-5xl mx-auto">
                <SectionCard delay={0.7}>
                  <div className="p-8">
                    <SectionLabel icon={TrendingUp} label="Historical Progress" />
                    <div className="grid md:grid-cols-3 gap-6 mt-4">
                      <div className="md:col-span-1 space-y-4">
                        <p className="text-sm text-white/70 leading-relaxed mb-6">
                          Tracking your progress across {historySessions.length} recorded sessions.
                          Consistent practice yields measurable improvements in confidence and
                          structural delivery.
                        </p>
                        <div className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl flex items-center justify-between">
                          <span className="text-sm font-semibold text-white/90">Overall Trend</span>
                          <span className="text-xs font-bold text-success flex items-center gap-1">
                            <ArrowUpRight className="w-3 h-3" /> Improving
                          </span>
                        </div>
                      </div>
                      <div className="md:col-span-2 h-64 bg-white/[0.01] border border-white/5 rounded-3xl p-6">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={[...historySessions].reverse().concat([apiData])}>
                            <CartesianGrid
                              strokeDasharray="3 3"
                              stroke="rgba(255,255,255,0.05)"
                              vertical={false}
                            />
                            <XAxis tick={false} axisLine={false} />
                            <YAxis
                              domain={[0, 100]}
                              tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }}
                              axisLine={false}
                              tickLine={false}
                            />
                            <Tooltip
                              contentStyle={{
                                background: "#030309",
                                border: "1px solid rgba(48,84,255,0.1)",
                                borderRadius: 12,
                                fontSize: 12,
                                color: "#fff",
                              }}
                            />
                            <Line
                              type="monotone"
                              dataKey="final_score"
                              name="Score"
                              stroke="var(--brand-blue)"
                              strokeWidth={3}
                              dot={{ r: 4, fill: "var(--brand-blue)", strokeWidth: 0 }}
                              activeDot={{ r: 6, fill: "white" }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </SectionCard>
              </div>
            </section>
          )}

          {/* TRANSCRIPT */}
          <section className="px-8 md:px-28 py-6">
            <div className="max-w-5xl mx-auto">
              <button
                onClick={() => setShowTranscript(!showTranscript)}
                className="w-full bg-card/60 backdrop-blur-md border border-white/10 hover:border-white/20 hover:bg-white/[0.05] rounded-3xl p-8 flex items-center justify-between transition-all card-hover text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                    <MessageSquareText className="w-5 h-5 text-white/80" />
                  </div>
                  <span className="text-lg font-semibold text-white/95">Interview Transcript</span>
                </div>
                {showTranscript ? (
                  <ChevronUp className="w-6 h-6 text-white/50" />
                ) : (
                  <ChevronDown className="w-6 h-6 text-white/50" />
                )}
              </button>
              <AnimatePresence>
                {showTranscript && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-8 bg-card/40 border border-white/5 rounded-b-2xl mt-[-10px] pt-10">
                      <blockquote
                        className="text-lg font-medium leading-relaxed text-white/75 italic break-words whitespace-pre-wrap"
                        style={{ fontFamily: "var(--font-serif)" }}
                      >
                        "{apiData.transcription || "No speech detected in the video."}"
                      </blockquote>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </section>

          {/* ADVANCED ANALYSIS */}
          <section className="px-8 md:px-28 pt-6 pb-20">
            <div className="max-w-5xl mx-auto">
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="w-full mt-2 bg-card/60 backdrop-blur-md border border-white/10 hover:border-[var(--brand-blue)]/30 hover:bg-white/[0.05] rounded-3xl p-8 flex items-center justify-between transition-all card-hover text-left group shadow-lg"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[var(--brand-blue)]/10 border border-[var(--brand-blue)]/20 flex items-center justify-center shrink-0 group-hover:bg-[var(--brand-blue)]/20 transition-colors">
                    <Network className="w-5 h-5 text-[var(--brand-blue)]" />
                  </div>
                  <div>
                    <span className="text-lg font-semibold text-white/95 group-hover:text-white transition-colors block">
                      Advanced Technical Metrics
                    </span>
                    <span className="text-sm text-white/50 group-hover:text-white/70 transition-colors">
                      View raw acoustic, facial, and AI model telemetry
                    </span>
                  </div>
                </div>
                {showAdvanced ? (
                  <ChevronUp className="w-6 h-6 text-white/50 group-hover:text-white/80" />
                ) : (
                  <ChevronDown className="w-6 h-6 text-white/50 group-hover:text-white/80" />
                )}
              </button>

              <AnimatePresence>
                {showAdvanced && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-6 grid md:grid-cols-2 gap-6">
                      <SectionCard>
                        <div className="p-8">
                          <SectionLabel icon={Eye} label="Facial Action Units (Emotion)" />
                          {apiData.emotion_probs ? (
                            <div className="space-y-4 mt-6">
                              {Object.entries(apiData.emotion_probs)
                                .sort(([, a], [, b]) => (b as number) - (a as number))
                                .map(([emotion, prob]) => (
                                  <div key={emotion}>
                                    <div className="flex justify-between text-xs font-semibold uppercase tracking-wider mb-2">
                                      <span className="text-white/70">{emotion}</span>
                                      <span className="text-white/90">
                                        {Math.round((prob as number) * 100)}%
                                      </span>
                                    </div>
                                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                      <motion.div
                                        initial={{ width: 0 }}
                                        whileInView={{ width: `${(prob as number) * 100}%` }}
                                        transition={{ duration: 1, ease: "easeOut" }}
                                        className="h-full bg-[var(--brand-blue)]"
                                      />
                                    </div>
                                  </div>
                                ))}
                            </div>
                          ) : (
                            <div className="text-sm text-white/40 italic text-center py-10">
                              No facial data captured
                            </div>
                          )}
                        </div>
                      </SectionCard>

                      <SectionCard>
                        <div className="p-8 h-full flex flex-col">
                          <SectionLabel icon={Activity} label="Acoustic Metrics" />
                          {apiData.audio_features ? (
                            <div className="flex-1 mt-2">
                              <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white/5 rounded-xl p-4">
                                  <div className="text-[10px] text-white/50 uppercase tracking-widest font-bold mb-1">
                                    Speech Rate
                                  </div>
                                  <div className="text-lg text-white/90 font-medium">
                                    {apiData.audio_features.speech_rate?.toFixed(2)}{" "}
                                    <span className="text-xs text-white/40">syl/s</span>
                                  </div>
                                </div>
                                <div className="bg-white/5 rounded-xl p-4">
                                  <div className="text-[10px] text-white/50 uppercase tracking-widest font-bold mb-1">
                                    Pitch Variance
                                  </div>
                                  <div className="text-lg text-white/90 font-medium">
                                    {apiData.audio_features.pitch_variance?.toFixed(0)}{" "}
                                    <span className="text-xs text-white/40">Hz²</span>
                                  </div>
                                </div>
                                <div className="bg-white/5 rounded-xl p-4">
                                  <div className="text-[10px] text-white/50 uppercase tracking-widest font-bold mb-1">
                                    Vocal Energy
                                  </div>
                                  <div className="text-lg text-white/90 font-medium">
                                    {(apiData.audio_features.energy * 1000).toFixed(1)}{" "}
                                    <span className="text-xs text-white/40">mE</span>
                                  </div>
                                </div>
                                <div className="bg-white/5 rounded-xl p-4">
                                  <div className="text-[10px] text-white/50 uppercase tracking-widest font-bold mb-1">
                                    Duration
                                  </div>
                                  <div className="text-lg text-white/90 font-medium">
                                    {apiData.audio_features.duration?.toFixed(1)}{" "}
                                    <span className="text-xs text-white/40">s</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="text-sm text-white/40 italic text-center py-10">
                              No audio features captured
                            </div>
                          )}
                        </div>
                      </SectionCard>

                      <SectionCard className="md:col-span-2">
                        <div className="p-8">
                          <SectionLabel icon={Network} label="Developer Payload / API Models" />
                          <div className="mt-4">
                            {Object.keys(apiData.developer_payload || apiData.model_status || {})
                              .length > 0 ? (
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                {Object.entries(
                                  apiData.developer_payload || apiData.model_status || {},
                                ).map(([key, val]: [string, any]) => (
                                  <div
                                    key={key}
                                    className="bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 rounded-2xl p-4 transition-colors"
                                  >
                                    <div className="flex items-center justify-between mb-3">
                                      <div className="text-xs font-bold text-white/80 uppercase tracking-widest">
                                        {key}
                                      </div>
                                      {val.execution_status === "Success" ||
                                      val.status === "Success" ||
                                      val.status === "Warm" ? (
                                        <div className="flex items-center gap-1.5 px-2 py-1 bg-success/10 text-success rounded-md text-[10px] font-semibold">
                                          <CheckCircle2 className="w-3 h-3" /> OK
                                        </div>
                                      ) : (
                                        <div className="flex items-center gap-1.5 px-2 py-1 bg-orange-500/10 text-orange-400 rounded-md text-[10px] font-semibold">
                                          <AlertTriangle className="w-3 h-3" /> Error
                                        </div>
                                      )}
                                    </div>
                                    <div className="space-y-1.5 text-[11px] text-white/60">
                                      {val.model_name && (
                                        <div className="flex justify-between">
                                          <span>Model</span>
                                          <span
                                            className="text-white/90 font-medium truncate ml-2"
                                            title={val.model_name}
                                          >
                                            {val.model_name} {val.version && `(${val.version})`}
                                          </span>
                                        </div>
                                      )}
                                      {val.inference_time_ms !== undefined && (
                                        <div className="flex justify-between">
                                          <span>Latency</span>
                                          <span className="text-white/90 font-medium">
                                            {val.inference_time_ms.toFixed(1)} ms
                                          </span>
                                        </div>
                                      )}
                                      {val.device && (
                                        <div className="flex justify-between">
                                          <span>Compute</span>
                                          <span className="text-[var(--brand-blue)] font-medium uppercase tracking-wider">
                                            {val.device}
                                          </span>
                                        </div>
                                      )}
                                      {val.reason && (
                                        <div className="mt-2 text-orange-300 italic pt-1 border-t border-white/5">
                                          Note: {val.reason}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center text-sm text-white/50 italic">
                                No diagnostic telemetry recorded for this session.
                              </div>
                            )}
                          </div>
                        </div>
                      </SectionCard>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
