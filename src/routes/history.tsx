import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useMemo, useCallback } from "react";
import {
  History, Brain, TrendingUp, Trash2, ChevronRight,
  Clock, MessageSquareText, Sparkles, Loader2, RefreshCw,
  AlertTriangle, Search, SlidersHorizontal, Calendar,
  BarChart3, User, Quote, CheckCircle2, ChevronDown, ChevronUp,
} from "lucide-react";
import { toast } from "sonner";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend, BarChart, Bar, Cell,
} from "recharts";
import { Particles } from "../components/ui/Particles";
import { AmbientMotion } from "../components/ui/AmbientMotion";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { apiGet, apiDelete } from "@/lib/api-client";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "Dashboard & History — AI Interview Evaluator" },
      { name: "description", content: "Interactive analytics trend dashboard and past interview history." },
    ],
  }),
  component: () => <AuthGuard><HistoryPage /></AuthGuard>,
});

// ── Types ─────────────────────────────────────────────────────────────────────

interface SessionSummary {
  id: string;
  timestamp: string;
  question: string;
  video_filename: string;
  final_score: number;
  confidence_label: string;
  relevance: number;
  sentiment: number;
  emotion_probs: Record<string, number>;
  transcription: string;
  speech_rate?: number;
}

interface SessionsResponse {
  items: SessionSummary[];
  total: number;
  skip: number;
  limit: number;
  has_more: boolean;
}

// ── Custom Tooltip for Charts ──────────────────────────────────────────────────

function ChartTooltip({ active, payload, label, valuePrefix = "", valueSuffix = "" }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#030309]/90 backdrop-blur-2xl border border-white/10 p-3.5 rounded-2xl shadow-2xl">
        <p className="text-[10px] uppercase tracking-widest text-white/30 font-semibold mb-2">{label}</p>
        <div className="space-y-1">
          {payload.map((pld: any) => (
            <div key={pld.name} className="flex items-center gap-4 justify-between">
              <span className="text-xs text-white/60 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: pld.color || pld.fill }} />
                {pld.name}
              </span>
              <span className="text-xs font-bold text-white">
                {valuePrefix}{typeof pld.value === "number" ? pld.value.toFixed(0) : pld.value}{valueSuffix}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function scoreColor(score: number): string {
  if (score >= 80) return "text-white";
  if (score >= 65) return "text-[var(--brand-blue)]";
  if (score >= 45) return "text-orange-400";
  return "text-red-400";
}

function scoreGlow(score: number): string {
  if (score >= 80) return "shadow-[0_0_20px_rgba(255,255,255,0.06)] hover:border-white/20";
  if (score >= 65) return "shadow-[0_0_20px_rgba(48,84,255,0.12)] hover:border-[var(--brand-blue)]/30";
  if (score >= 45) return "shadow-[0_0_20px_rgba(251,146,60,0.1)] hover:border-orange-500/20";
  return "shadow-[0_0_20px_rgba(239,68,68,0.08)] hover:border-red-500/20";
}

function formatDate(iso: string, short = false): string {
  const d = new Date(iso);
  if (short) {
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function pct(v: number): string {
  return `${Math.round(v * 100)}%`;
}

// ── Main Page Component ────────────────────────────────────────────────────────

function HistoryPage() {
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [minScore, setMinScore] = useState<number>(0);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Detailed Modal/Detail View State
  const [selectedSession, setSelectedSession] = useState<SessionSummary | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Fetch all sessions (up to 100 to feed the charts properly)
  const loadAllSessions = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await apiGet<SessionsResponse>("/api/sessions?skip=0&limit=100");
      setSessions(data.items);
      setTotalCount(data.total);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load interview history.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllSessions();
  }, [loadAllSessions]);

  // Deletion logic
  const deleteSession = async (id: string) => {
    setDeletingId(id);
    try {
      await apiDelete(`/api/sessions/${id}`);
      toast.success("Interview session deleted.");
      setSessions((prev) => prev.filter((s) => s.id !== id));
      setTotalCount((t) => t - 1);
      if (selectedSession?.id === id) {
        setSelectedSession(null);
      }
    } catch (err) {
      toast.error("Failed to delete session.");
      console.error(err);
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  };

  // Filtered sessions computation
  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      const matchesSearch = s.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.transcription.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesScore = s.final_score >= minScore;

      let matchesDate = true;
      if (startDate) {
        matchesDate = matchesDate && new Date(s.timestamp) >= new Date(startDate);
      }
      if (endDate) {
        // Adjust to end of that day
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
        matchesDate = matchesDate && new Date(s.timestamp) <= endOfDay;
      }

      return matchesSearch && matchesScore && matchesDate;
    });
  }, [sessions, searchQuery, minScore, startDate, endDate]);

  // General Statistics
  const stats = useMemo(() => {
    if (filteredSessions.length === 0) {
      return { avgScore: 0, highestScore: 0, avgSentiment: 0, avgRelevance: 0 };
    }
    const sumScore = filteredSessions.reduce((acc, s) => acc + s.final_score, 0);
    const highest = Math.max(...filteredSessions.map((s) => s.final_score));
    const sumSentiment = filteredSessions.reduce((acc, s) => acc + s.sentiment, 0);
    const sumRelevance = filteredSessions.reduce((acc, s) => acc + s.relevance, 0);

    return {
      avgScore: sumScore / filteredSessions.length,
      highestScore: highest,
      avgSentiment: (sumSentiment / filteredSessions.length) * 100,
      avgRelevance: (sumRelevance / filteredSessions.length) * 100,
    };
  }, [filteredSessions]);

  // Chronological data mapping for Recharts (oldest to newest)
  const chartData = useMemo(() => {
    return [...filteredSessions]
      .reverse()
      .map((s) => {
        const dateStr = formatDate(s.timestamp, true);
        const confidenceVal =
          s.confidence_label === "High" ? 3 : s.confidence_label === "Medium" ? 2 : 1;

        return {
          date: dateStr,
          Score: Math.round(s.final_score),
          Relevance: Math.round(s.relevance * 100),
          Sentiment: Math.round(s.sentiment * 100),
          Confidence: confidenceVal * 33.33,
          confidenceLabel: s.confidence_label,
          Happy: Math.round((s.emotion_probs?.happy ?? 0) * 100),
          Neutral: Math.round((s.emotion_probs?.neutral ?? 0) * 100),
          Anxious: Math.round((s.emotion_probs?.anxious ?? 0) * 100),
          Sad: Math.round((s.emotion_probs?.sad ?? 0) * 100),
        };
      });
  }, [filteredSessions]);

  // Reset Filters helper
  const resetFilters = () => {
    setSearchQuery("");
    setMinScore(0);
    setStartDate("");
    setEndDate("");
  };

  return (
    <div className="relative min-h-screen text-foreground overflow-x-hidden">
      {/* ── BACKGROUND ── */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <Particles />
      </div>
      <div className="relative z-10 pointer-events-none">
        <AmbientMotion />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-[var(--brand-blue)]/[0.04] blur-[140px] rounded-full" />
      </div>

      <div className="relative z-20 px-4 md:px-8 lg:px-16 pt-32 pb-24 max-w-7xl mx-auto space-y-10">

        {/* ── HEADER ── */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-3 px-1.5 py-1.5 pr-5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-6 w-fit">
              <div className="w-7 h-7 rounded-lg bg-[var(--brand-blue)]/15 border border-[var(--brand-blue)]/20 flex items-center justify-center">
                <History className="w-4 h-4 text-[var(--brand-blue)]" strokeWidth={1.5} />
              </div>
              <span className="text-xs text-white/60 font-medium tracking-wide">
                Analytics & History Workspace
              </span>
            </div>
            <h1 className="text-[36px] md:text-[56px] font-bold tracking-tight text-white leading-none" style={{ fontFamily: "var(--font-serif)" }}>
              Interview Dashboard.
            </h1>
            <p className="text-sm text-white/45 mt-3 max-w-xl leading-relaxed">
              Track your performance over time, search transcripts, isolate metrics, and examine detailed session analysis logs.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex items-center gap-3 shrink-0"
          >
            <Link
              to="/analyze"
              className="group flex items-center gap-3 bg-white text-black font-semibold rounded-full pl-6 pr-2 py-2 shadow-xl shadow-black/20 btn-interaction"
            >
              <span className="text-sm">New Session</span>
              <div className="bg-[var(--brand-blue)] rounded-full w-8 h-8 flex items-center justify-center group-hover:bg-[var(--brand-blue-hover)] transition-colors">
                <ChevronRight className="w-4 h-4 text-white" />
              </div>
            </Link>
          </motion.div>
        </div>

        {/* ── KEY PERFORMANCE METRICS ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Sessions", val: filteredSessions.length, detail: `${totalCount} overall in DB`, icon: History },
            { label: "Average Score", val: `${Math.round(stats.avgScore)}%`, detail: `Peak performance: ${Math.round(stats.highestScore)}%`, icon: TrendingUp },
            { label: "Avg Relevance", val: `${Math.round(stats.avgRelevance)}%`, detail: "Question match rate", icon: Brain },
            { label: "Avg Sentiment", val: `${Math.round(stats.avgSentiment)}%`, detail: "Tonal positivity rate", icon: MessageSquareText },
          ].map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="bg-card/50 backdrop-blur-2xl border border-white/5 rounded-3xl p-5 relative overflow-hidden group hover:border-white/10 transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] uppercase tracking-widest text-white/35 font-semibold">{item.label}</span>
                <item.icon className="w-4 h-4 text-white/20 group-hover:text-[var(--brand-blue)] transition-colors" strokeWidth={1.5} />
              </div>
              <div className="text-2xl md:text-3xl font-bold text-white tracking-tight mb-1">{item.val}</div>
              <div className="text-[10px] text-white/40">{item.detail}</div>
            </motion.div>
          ))}
        </div>

        {/* ── PROGRESS ANALYTICS COMPARISON MODULE ── */}
        {filteredSessions.length >= 2 && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-card/40 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 space-y-6"
          >
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-orange-400" />
                <h3 className="text-xs font-semibold text-white/80 uppercase tracking-widest">Progress Analytics</h3>
              </div>
              <span className="text-[10px] text-white/40 font-mono">Latest session vs. Previous log session</span>
            </div>

            {/* Score matrix layout */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Current Score */}
              <div className="bg-white/[0.015] border border-white/5 p-4 rounded-2xl">
                <span className="text-[9px] uppercase tracking-widest text-white/40 block mb-1">Current Score</span>
                <div className="text-2xl font-bold text-white font-mono">{Math.round(filteredSessions[0].final_score)}%</div>
                <div className="text-[9px] text-white/30 mt-1">Latest completed session</div>
              </div>

              {/* Previous Score */}
              <div className="bg-white/[0.015] border border-white/5 p-4 rounded-2xl">
                <span className="text-[9px] uppercase tracking-widest text-white/40 block mb-1">Previous Score</span>
                <div className="text-2xl font-bold text-white/70 font-mono">{Math.round(filteredSessions[1].final_score)}%</div>
                <div className="text-[9px] text-white/30 mt-1">Session before latest</div>
              </div>

              {/* Best Score */}
              <div className="bg-white/[0.015] border border-white/5 p-4 rounded-2xl">
                <span className="text-[9px] uppercase tracking-widest text-white/40 block mb-1">Best Score</span>
                <div className="text-2xl font-bold text-white font-mono">{Math.round(stats.highestScore)}%</div>
                <div className="text-[9px] text-white/30 mt-1">Highest score overall</div>
              </div>

              {/* Average Score */}
              <div className="bg-white/[0.015] border border-white/5 p-4 rounded-2xl">
                <span className="text-[9px] uppercase tracking-widest text-white/40 block mb-1">Average Score</span>
                <div className="text-2xl font-bold text-white font-mono">{Math.round(stats.avgScore)}%</div>
                <div className="text-[9px] text-white/30 mt-1">Historical running average</div>
              </div>
            </div>

            {/* Percentage Improvement Deltas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              {[
                {
                  label: "Overall Score Delta",
                  curr: filteredSessions[0].final_score,
                  prev: filteredSessions[1].final_score,
                  suffix: "%",
                },
                {
                  label: "Speech Rhythm Growth",
                  curr: filteredSessions[0].speech_rate ?? 0.0,
                  prev: filteredSessions[1].speech_rate ?? 0.0,
                  suffix: " syl/s",
                  isFloat: true,
                },
                {
                  label: "NLP Relevance Growth",
                  curr: filteredSessions[0].relevance * 100,
                  prev: filteredSessions[1].relevance * 100,
                  suffix: "%",
                }
              ].map((metric) => {
                const diff = metric.curr - metric.prev;
                const pctChange = metric.prev > 0 ? (diff / metric.prev) * 100 : 0;
                const positive = diff >= 0;

                const displayCurr = metric.isFloat ? metric.curr.toFixed(1) : Math.round(metric.curr);
                const displayPrev = metric.isFloat ? metric.prev.toFixed(1) : Math.round(metric.prev);

                return (
                  <div key={metric.label} className="bg-white/[0.01] border border-white/5 p-4 rounded-xl flex items-center justify-between gap-4">
                    <div>
                      <span className="text-[9px] uppercase tracking-widest text-white/40 block mb-0.5">{metric.label}</span>
                      <span className="text-xs text-white/70 font-medium font-mono">
                        {displayCurr}{metric.suffix} <span className="text-white/30 text-[10px] font-sans">vs {displayPrev}{metric.suffix}</span>
                      </span>
                    </div>
                    <div className={`px-2.5 py-1 rounded-lg text-[10px] font-bold font-mono ${
                      positive ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"
                    }`}>
                      {positive ? "+" : ""}{Math.round(pctChange)}%
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ── TRENDS CHART CONTAINER ── */}
        {chartData.length > 1 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1: Performance Score Trend */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="bg-card/45 backdrop-blur-2xl border border-white/5 rounded-3xl p-6 flex flex-col min-h-[300px]"
            >
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-4 h-4 text-[var(--brand-blue)]" />
                <h3 className="text-sm font-semibold text-white/80 uppercase tracking-widest">Score Performance Trend</h3>
              </div>
              <div className="flex-1 w-full min-h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="scoreGlow" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--brand-blue)" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="var(--brand-blue)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<ChartTooltip valueSuffix="%" />} />
                    <Area type="monotone" dataKey="Score" stroke="var(--brand-blue)" strokeWidth={2} fillOpacity={1} fill="url(#scoreGlow)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Chart 2: NLP & Confidence Metrics Trend */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="bg-card/45 backdrop-blur-2xl border border-white/5 rounded-3xl p-6 flex flex-col min-h-[300px]"
            >
              <div className="flex items-center gap-2 mb-4">
                <Brain className="w-4 h-4 text-[var(--brand-blue)]" />
                <h3 className="text-sm font-semibold text-white/80 uppercase tracking-widest">Relevance, Sentiment & Confidence</h3>
              </div>
              <div className="flex-1 w-full min-h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <XAxis dataKey="date" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<ChartTooltip valueSuffix="%" />} />
                    <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: 11, color: "rgba(255,255,255,0.6)" }} />
                    <Line type="monotone" dataKey="Relevance" stroke="var(--brand-blue)" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                    <Line type="monotone" dataKey="Sentiment" stroke="rgba(255,255,255,0.5)" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                    <Line type="monotone" dataKey="Confidence" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Chart 3: Emotion Spectrum Trend */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="bg-card/45 backdrop-blur-2xl border border-white/5 rounded-3xl p-6 flex flex-col min-h-[300px] lg:col-span-2"
            >
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-4 h-4 text-[var(--brand-blue)]" />
                <h3 className="text-sm font-semibold text-white/80 uppercase tracking-widest">Facial Emotion Progression</h3>
              </div>
              <div className="flex-1 w-full min-h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <XAxis dataKey="date" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<ChartTooltip valueSuffix="%" />} />
                    <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                    <Line type="monotone" dataKey="Happy" stroke="#ffffff" strokeWidth={1.5} dot={{ r: 2 }} />
                    <Line type="monotone" dataKey="Neutral" stroke="var(--brand-blue)" strokeWidth={1.5} dot={{ r: 2 }} />
                    <Line type="monotone" dataKey="Anxious" stroke="#f59e0b" strokeWidth={1.5} dot={{ r: 2 }} />
                    <Line type="monotone" dataKey="Sad" stroke="#6b7280" strokeWidth={1.5} dot={{ r: 2 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          </div>
        ) : chartData.length === 1 ? (
          <div className="bg-card/40 backdrop-blur-2xl border border-white/5 rounded-3xl p-6 text-center text-xs text-white/40">
            Trend visualisations require at least 2 sessions to render progression metrics.
          </div>
        ) : null}

        {/* ── DASHBOARD FILTERS PANEL ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-card/60 backdrop-blur-3xl border border-white/10 rounded-3xl p-6 shadow-2xl space-y-6"
        >
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-white/50" />
              <span className="text-xs font-semibold text-white/70 uppercase tracking-widest">Filter System</span>
            </div>
            {(searchQuery || minScore > 0 || startDate || endDate) && (
              <button
                onClick={resetFilters}
                className="text-xs text-[var(--brand-blue)] hover:text-white transition-colors font-medium"
              >
                Clear all filters
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Filter: Question & Transcript Text */}
            <div className="space-y-2">
              <label htmlFor="search-input" className="text-[10px] font-semibold text-white/60 uppercase tracking-widest">
                Search Question / Text
              </label>
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  id="search-input"
                  type="text"
                  placeholder="Keyword, topic, question..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/8 bg-white/[0.03] text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-[var(--brand-blue)]/40 focus:bg-[var(--brand-blue)]/5 transition-all"
                />
              </div>
            </div>

            {/* Filter: Minimum Score Range */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label htmlFor="score-range" className="text-[10px] font-semibold text-white/60 uppercase tracking-widest">
                  Min Score
                </label>
                <span className="text-xs font-mono text-white/70 font-semibold">{minScore}%</span>
              </div>
              <div className="flex items-center gap-3 py-2">
                <input
                  id="score-range"
                  type="range"
                  min="0"
                  max="100"
                  value={minScore}
                  onChange={(e) => setMinScore(Number(e.target.value))}
                  className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[var(--brand-blue)]"
                />
              </div>
            </div>

            {/* Filter: Start Date */}
            <div className="space-y-2">
              <label htmlFor="start-date" className="text-[10px] font-semibold text-white/60 uppercase tracking-widest flex items-center gap-1.5">
                <Calendar className="w-3 h-3 text-white/40" />
                Start Date
              </label>
              <input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-white/8 bg-white/[0.03] text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-[var(--brand-blue)]/40 focus:bg-[var(--brand-blue)]/5 transition-all filter-dark-picker"
              />
            </div>

            {/* Filter: End Date */}
            <div className="space-y-2">
              <label htmlFor="end-date" className="text-[10px] font-semibold text-white/60 uppercase tracking-widest flex items-center gap-1.5">
                <Calendar className="w-3 h-3 text-white/40" />
                End Date
              </label>
              <input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-white/8 bg-white/[0.03] text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-[var(--brand-blue)]/40 focus:bg-[var(--brand-blue)]/5 transition-all filter-dark-picker"
              />
            </div>
          </div>
        </motion.div>

        {/* ── WORKSPACE SECTION: HISTORY LOG & TRANSCRIPT PREVIEW ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

          {/* List of Sessions */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between mb-2 px-2">
              <span className="text-xs font-semibold text-white/40 uppercase tracking-widest">Interview Logs ({filteredSessions.length})</span>
            </div>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-24 gap-5 bg-card/30 backdrop-blur-md border border-white/5 rounded-3xl animate-pulse">
                <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center relative">
                  <div className="absolute inset-0 rounded-2xl bg-[var(--brand-blue)]/20 blur-xl animate-pulse" />
                  <Loader2 className="w-6 h-6 text-[var(--brand-blue)] animate-spin relative z-10" />
                </div>
                <span className="text-sm text-white/50 font-medium">Loading historical analytics...</span>
              </div>
            ) : filteredSessions.length === 0 ? (
              <div className="bg-card/30 backdrop-blur-xl border border-white/10 rounded-3xl p-14 text-center space-y-5 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[300px] bg-[var(--brand-blue)]/10 blur-[80px] pointer-events-none" />
                <div className="relative z-10 flex flex-col items-center">
                  <div className="w-16 h-16 rounded-3xl bg-white/[0.03] border border-white/10 flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(48,84,255,0.15)] glow-border-blue">
                    <Search className="w-7 h-7 text-[var(--brand-blue)]" />
                  </div>
                  <h4 className="text-lg font-semibold text-white/90 mb-2">No Sessions Found</h4>
                  <p className="text-sm text-white/50 max-w-sm mb-6 leading-relaxed">
                    We couldn't find any interview sessions matching your current filters. Try adjusting your search criteria.
                  </p>
                  <button
                    onClick={resetFilters}
                    className="btn-interaction bg-white/[0.05] hover:bg-white/[0.08] text-white font-medium text-sm px-6 py-2.5 rounded-full border border-white/10 transition-colors"
                  >
                    Clear all filters
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3.5">
                {filteredSessions.map((session, index) => {
                  const isSelected = selectedSession?.id === session.id;
                  return (
                    <motion.div
                      key={session.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: Math.min(10, index) * 0.04 }}
                      className={`group relative bg-card/60 backdrop-blur-2xl border rounded-3xl overflow-hidden cursor-pointer transition-all duration-300 ${
                        isSelected ? "border-[var(--brand-blue)]/60 shadow-[0_0_20px_rgba(48,84,255,0.1)]" : "border-white/8 hover:border-white/20"
                      }`}
                      onClick={() => setSelectedSession(session)}
                    >
                      <div className="p-5 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
                        <div className="flex items-start gap-4">
                          {/* Score Badge */}
                          <div className={`w-12 h-12 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col items-center justify-center shrink-0`}>
                            <span className={`text-base font-bold tabular-nums leading-none ${scoreColor(session.final_score)}`}>
                              {Math.round(session.final_score)}
                            </span>
                            <span className="text-[7px] uppercase tracking-widest text-white/30 mt-0.5 font-bold">/100</span>
                          </div>

                          <div className="min-w-0">
                            <span className="text-[9px] uppercase tracking-widest text-white/35 font-semibold flex items-center gap-1.5 mb-1">
                              <Clock className="w-2.5 h-2.5" />
                              {formatDate(session.timestamp)}
                            </span>
                            <h4 className="text-sm font-medium text-white/80 truncate max-w-[280px] sm:max-w-[420px]">
                              {session.question}
                            </h4>
                            <p className="text-[11px] text-white/40 leading-relaxed mt-1.5 max-w-[280px] sm:max-w-[420px] line-clamp-1 italic">
                              "{session.transcription ? (session.transcription.substring(0, 90) + (session.transcription.length > 90 ? '...' : '')) : 'No voice transcription detected.'}"
                            </p>
                          </div>
                        </div>

                        {/* Right Section */}
                        <div className="flex items-center gap-4 shrink-0 sm:ml-auto">
                          <div className="hidden sm:flex flex-col items-end">
                            <span className="text-[9px] uppercase tracking-widest text-white/30">Confidence</span>
                            <span className="text-xs font-semibold text-white/70">{session.confidence_label}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            {confirmDeleteId === session.id ? (
                              <div className="flex items-center gap-1.5 bg-red-950/20 border border-red-900/40 rounded-xl p-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                                <button
                                  onClick={() => deleteSession(session.id)}
                                  className="px-2.5 py-1 rounded-lg bg-red-500/10 text-xs text-red-400 hover:bg-red-500/25 transition-all"
                                >
                                  Delete
                                </button>
                                <button
                                  onClick={() => setConfirmDeleteId(null)}
                                  className="px-2 py-1 text-[10px] text-white/40 hover:text-white"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                id={`delete-btn-${session.id}`}
                                onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(session.id); }}
                                className="w-8 h-8 rounded-xl flex items-center justify-center text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0"
                              >
                                {deletingId === session.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Trash2 className="w-4 h-4" />
                                )}
                              </button>
                            )}

                            <Link
                              to="/results"
                              search={{ sessionId: session.id }}
                              className="w-8 h-8 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center text-white/50 hover:text-white hover:bg-[var(--brand-blue)]/10 hover:border-[var(--brand-blue)]/40 transition-all shrink-0"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Transcript History / Detailed Inspector panel */}
          <div className="lg:col-span-1 space-y-4">
            <span className="text-xs font-semibold text-white/40 uppercase tracking-widest px-1">Session Detail & Transcript</span>

            <div className="bg-card/65 backdrop-blur-3xl border border-white/10 rounded-3xl p-6 shadow-2xl relative min-h-[380px] flex flex-col justify-between">
              {selectedSession ? (
                <div className="space-y-6 flex-1 flex flex-col justify-between h-full">
                  <div className="space-y-5">
                    {/* Header */}
                    <div>
                      <span className="text-[9px] uppercase tracking-widest text-[var(--brand-blue)] font-bold">Metadata</span>
                      <h4 className="text-sm font-semibold text-white mt-1 leading-snug">{selectedSession.question}</h4>
                      <p className="text-[10px] text-white/35 font-mono mt-1.5 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(selectedSession.timestamp)}
                      </p>
                    </div>

                    <div className="border-t border-white/5 pt-4">
                      <span className="text-[9px] uppercase tracking-widest text-white/40 font-bold block mb-1">Uploaded Video</span>
                      <span className="text-xs font-mono text-white/70 break-all">{selectedSession.video_filename}</span>
                    </div>

                    {/* Metrics snapshot */}
                    <div className="border-t border-white/5 pt-4 grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-[8px] uppercase tracking-widest text-white/30 font-bold">Relevance</span>
                        <div className="text-xs font-semibold text-white">{pct(selectedSession.relevance)}</div>
                      </div>
                      <div>
                        <span className="text-[8px] uppercase tracking-widest text-white/30 font-bold">Sentiment</span>
                        <div className="text-xs font-semibold text-white">{pct(selectedSession.sentiment)}</div>
                      </div>
                    </div>

                    {/* Transcription section */}
                    <div className="border-t border-white/5 pt-4 flex-1">
                      <div className="flex items-center gap-1.5 mb-2">
                        <Quote className="w-3.5 h-3.5 text-[var(--brand-blue)]" />
                        <span className="text-[9px] uppercase tracking-widest text-white/40 font-bold">Transcript History</span>
                      </div>
                      <div className="max-h-48 overflow-y-auto pr-1.5 scrollbar-thin text-xs text-white/70 leading-relaxed italic bg-white/[0.015] border border-white/5 p-3 rounded-2xl whitespace-pre-wrap">
                        "{selectedSession.transcription || "No voice transcription detected."}"
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-white/5">
                    <Link
                      to="/results"
                      search={{ sessionId: selectedSession.id }}
                      className="w-full flex items-center justify-center gap-3 bg-white text-black font-semibold rounded-full pl-6 pr-2 py-2 hover:scale-[1.01] transition-transform"
                    >
                      <span className="text-xs">Open Complete Report</span>
                      <div className="bg-[var(--brand-blue)] rounded-full w-7 h-7 flex items-center justify-center">
                        <ChevronRight className="w-3.5 h-3.5 text-white" />
                      </div>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center py-24 text-center space-y-4 relative overflow-hidden">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] bg-white/[0.02] blur-[60px] pointer-events-none" />
                  <div className="relative z-10 flex flex-col items-center">
                    <div className="w-16 h-16 rounded-3xl bg-white/[0.02] border border-white/5 flex items-center justify-center mb-2 shadow-[0_0_20px_rgba(255,255,255,0.02)]">
                      <MessageSquareText className="w-7 h-7 text-white/20" />
                    </div>
                    <h4 className="text-base font-semibold text-white/70 mb-1">Inspector Idle</h4>
                    <p className="text-xs text-white/40 max-w-[200px] leading-relaxed">
                      Select an interview session from the list to inspect transcripts and metrics.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
