import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { 
  Brain, PlusCircle, ArrowRight, Clock, Award, BarChart3, 
  TrendingUp, Activity, User, Sparkles, Loader2, Play 
} from "lucide-react";
import { toast } from "sonner";
import { Particles } from "../components/ui/Particles";
import { AmbientMotion } from "../components/ui/AmbientMotion";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { useAuth } from "@/contexts/AuthContext";
import { apiGet } from "@/lib/api-client";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Candidate Dashboard — AI Interview Evaluator" },
      { name: "description", content: "AI performance summary, average readiness, and recent interviews." },
    ],
  }),
  component: () => <AuthGuard><DashboardPage /></AuthGuard>,
});

interface SessionItem {
  id: string;
  timestamp: string;
  question: string;
  final_score: number;
  confidence_label: string;
  relevance: number;
  sentiment: number;
}

interface SessionsResponse {
  sessions: SessionItem[];
  total: number;
}

function formatDate(iso: string): string {
  if (!iso) return "N/A";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function DashboardPage() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const data = await apiGet<SessionsResponse>("/api/sessions?skip=0&limit=10");
        setSessions(data.sessions || []);
        setTotalCount(data.total || 0);
      } catch (err) {
        console.error("Dashboard load failed:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  // Compute metrics
  const avgScore = sessions.length 
    ? Math.round(sessions.reduce((acc, s) => acc + s.final_score, 0) / sessions.length) 
    : 0;

  const maxScore = sessions.length 
    ? Math.max(...sessions.map(s => s.final_score)) 
    : 0;

  const latestSession = sessions[0] || null;

  // Comparison for Improvement Summary
  const previousSessions = sessions.slice(1);
  const prevAvgScore = previousSessions.length
    ? Math.round(previousSessions.reduce((acc, s) => acc + s.final_score, 0) / previousSessions.length)
    : 0;

  const scoreDiff = latestSession && prevAvgScore 
    ? latestSession.final_score - prevAvgScore 
    : 0;

  return (
    <div className="relative min-h-screen text-foreground overflow-x-hidden">

      {/* ── BACKGROUND ── */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <Particles />
      </div>
      <div className="relative z-10 pointer-events-none">
        <AmbientMotion />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[700px] bg-[var(--brand-blue)]/[0.04] blur-[150px] rounded-full" />
      </div>

      <div className="relative z-20 px-6 md:px-16 lg:px-28 pt-32 pb-24 max-w-6xl mx-auto space-y-10">

        {/* ── WELCOME HEADER ── */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-6"
        >
          <div>
            <div className="flex items-center gap-3 px-1.5 py-1.5 pr-5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-5 w-fit">
              <div className="w-7 h-7 rounded-lg bg-[var(--brand-blue)]/15 border border-[var(--brand-blue)]/20 flex items-center justify-center">
                <Brain className="w-4 h-4 text-[var(--brand-blue)]" strokeWidth={1.5} />
              </div>
              <span className="text-xs text-white/60 font-medium tracking-wide">
                Executive Workspace Dashboard
              </span>
            </div>
            <h1 className="text-[36px] md:text-[52px] font-bold tracking-tight text-white leading-none" style={{ fontFamily: "var(--font-serif)" }}>
              Welcome back, {user?.full_name?.split(" ")[0]}.
            </h1>
            <p className="text-sm text-white/45 mt-3">
              Track readiness parameters, review evaluation histories, and coach metrics.
            </p>
          </div>

          <Link
            to="/analyze"
            className="group flex items-center gap-4 bg-white text-black font-semibold rounded-full pl-6 pr-2 py-2 transition-transform hover:scale-[1.01] active:scale-[0.98] shadow-xl shadow-black/20 shrink-0 w-fit"
          >
            <span className="text-sm">Start New Interview</span>
            <div className="bg-[var(--brand-blue)] rounded-full w-[38px] h-[38px] flex items-center justify-center group-hover:bg-[var(--brand-blue-hover)] transition-colors">
              <PlusCircle className="w-5 h-5 text-white" strokeWidth={1.5} />
            </div>
          </Link>
        </motion.div>

        {loading ? (
          <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-24 flex flex-col items-center justify-center gap-4 min-h-[400px]">
            <Loader2 className="w-8 h-8 text-[var(--brand-blue)] animate-spin" />
            <span className="text-xs text-white/35">Syncing candidate profile data & aggregating metrics...</span>
          </div>
        ) : (
          <>
            {/* ── KEY METRICS GRID ── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Avg Score */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="bg-card/40 backdrop-blur-xl border border-white/5 rounded-2xl p-6 relative overflow-hidden group bg-gradient-to-br from-white/[0.02] to-transparent hover:border-[var(--brand-blue)]/20 transition-all duration-300"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-[var(--brand-blue)]/10 blur-[40px] rounded-full" />
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Average Score</span>
                  <BarChart3 className="w-4 h-4 text-[var(--brand-blue)]" />
                </div>
                <div className="text-4xl font-semibold text-white tracking-tight tabular-nums">
                  {avgScore} <span className="text-xs text-white/30 font-normal">/ 100</span>
                </div>
                <p className="text-[11px] text-white/40 mt-3">Mean rating aggregated across all sessions</p>
              </motion.div>

              {/* Highest Score */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="bg-card/40 backdrop-blur-xl border border-white/5 rounded-2xl p-6 relative overflow-hidden group bg-gradient-to-br from-white/[0.02] to-transparent hover:border-[var(--brand-blue)]/20 transition-all duration-300"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-orange-400/5 blur-[40px] rounded-full" />
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Highest Score</span>
                  <Award className="w-4 h-4 text-orange-400" />
                </div>
                <div className="text-4xl font-semibold text-white tracking-tight tabular-nums">
                  {maxScore} <span className="text-xs text-white/30 font-normal">/ 100</span>
                </div>
                <p className="text-[11px] text-white/40 mt-3">Peak performance index registered to date</p>
              </motion.div>

              {/* Total Sessions */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="bg-card/40 backdrop-blur-xl border border-white/5 rounded-2xl p-6 relative overflow-hidden group bg-gradient-to-br from-white/[0.02] to-transparent hover:border-[var(--brand-blue)]/20 transition-all duration-300"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-green-400/5 blur-[40px] rounded-full" />
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Total Interviews</span>
                  <Activity className="w-4 h-4 text-green-400" />
                </div>
                <div className="text-4xl font-semibold text-white tracking-tight tabular-nums">
                  {totalCount}
                </div>
                <p className="text-[11px] text-white/40 mt-3">Completed evaluations logged in database</p>
              </motion.div>
            </div>

            {/* ── MAIN DASHBOARD LAYOUT ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              
              {/* Left Column: Recent Interviews & Improvement Summary (Spans 2) */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Recent Interviews */}
                <div className="bg-card/60 backdrop-blur-md border border-white/10 rounded-3xl p-6 space-y-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[var(--brand-blue)]" />
                      <h3 className="text-sm font-semibold uppercase tracking-widest text-white/80">Recent Evaluations</h3>
                    </div>
                    <Link
                      to="/history"
                      className="text-xs text-[var(--brand-blue)] hover:text-white transition-colors"
                    >
                      View All History
                    </Link>
                  </div>

                  {sessions.length === 0 ? (
                    <div className="bg-white/[0.01] border border-white/5 rounded-2xl p-12 text-center text-xs text-white/35">
                      No interviews recorded yet. Click "Start New Interview" above to create one.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {sessions.slice(0, 3).map((session) => (
                        <div 
                          key={session.id} 
                          className="bg-white/[0.015] border border-white/5 hover:border-[var(--brand-blue)]/20 p-4 rounded-2xl flex items-center justify-between gap-4 transition-all duration-300 group"
                        >
                          <div className="min-w-0 flex-1 space-y-1">
                            <span className="text-[10px] text-white/35 font-mono block">
                              {formatDate(session.timestamp)}
                            </span>
                            <h4 className="text-xs font-medium text-white/80 truncate leading-snug">
                              Q: "{session.question}"
                            </h4>
                          </div>

                          <div className="flex items-center gap-4">
                            {/* Score Badge */}
                            <div className="text-right">
                              <span className="text-sm font-bold text-white font-mono">{session.final_score}</span>
                              <span className="text-[10px] text-white/35 block leading-none">score</span>
                            </div>

                            {/* Chevron Link */}
                            <Link
                              to="/results"
                              search={{ sessionId: session.id }}
                              className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:bg-[var(--brand-blue)]/20 hover:border-[var(--brand-blue)]/30 transition-all"
                            >
                              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Improvement Summary */}
                <div className="bg-card/60 backdrop-blur-md border border-white/10 rounded-3xl p-6 space-y-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-orange-400" />
                    <h3 className="text-sm font-semibold uppercase tracking-widest text-white/80">Improvement Summary</h3>
                  </div>

                  {sessions.length < 2 ? (
                    <p className="text-xs text-white/40 leading-relaxed">
                      Complete at least two interviews to compile a comparison matrix and view score progression metrics.
                    </p>
                  ) : (
                    <div className="bg-white/[0.01] border border-white/5 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
                      <div className="space-y-1.5 z-10">
                        <span className="text-[9px] uppercase tracking-widest text-orange-400 font-bold">Latest Comparison</span>
                        <h4 className="text-sm font-semibold text-white">
                          Latest Performance vs. Previous Log Average
                        </h4>
                        <p className="text-xs text-white/50 leading-relaxed max-w-md">
                          Your latest response scored {latestSession?.final_score} points, showing how your metrics correlate with historical trends.
                        </p>
                      </div>

                      <div className="flex items-center gap-3.5 shrink-0 z-10">
                        <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center border font-mono ${
                          scoreDiff >= 0 
                            ? "bg-green-500/10 border-green-500/20 text-green-400" 
                            : "bg-red-500/10 border-red-500/20 text-red-400"
                        }`}>
                          <span className="text-sm font-bold">{scoreDiff >= 0 ? `+${scoreDiff}` : scoreDiff}</span>
                          <span className="text-[8px] uppercase tracking-wider font-semibold font-sans">delta</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Start New Interview & Quick Actions */}
              <div className="space-y-6">
                
                {/* Micro CTA Box */}
                <div className="bg-gradient-to-br from-[var(--brand-blue)]/20 to-transparent border border-[var(--brand-blue)]/25 rounded-3xl p-6 relative overflow-hidden shadow-xl shadow-[var(--brand-blue)]/5 group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--brand-blue)]/30 blur-[40px] rounded-full pointer-events-none" />
                  <Sparkles className="w-6 h-6 text-[var(--brand-blue)] mb-4 animate-pulse" />
                  <h3 className="text-base font-semibold text-white tracking-tight mb-2">Practice evaluations</h3>
                  <p className="text-xs text-white/60 leading-relaxed mb-5">
                    Utilize our multimodal interface to record audio or upload a video directly. Evaluates speed, emotions, and context instantly.
                  </p>
                  <Link
                    to="/analyze"
                    className="flex items-center justify-between w-full bg-white text-black font-semibold text-xs rounded-xl px-4 py-3 hover:scale-[1.01] active:scale-[0.98] transition-all shadow-md"
                  >
                    <span>Record Live Response</span>
                    <Play className="w-3.5 h-3.5 fill-black" />
                  </Link>
                </div>

                {/* Quick Actions List */}
                <div className="bg-card/60 backdrop-blur-md border border-white/10 rounded-3xl p-6 space-y-4">
                  <h3 className="text-sm font-semibold uppercase tracking-widest text-white/80">Quick Actions</h3>
                  
                  <div className="grid grid-cols-1 gap-2.5">
                    <Link
                      to="/history"
                      className="bg-white/[0.015] border border-white/5 hover:border-[var(--brand-blue)]/20 p-3.5 rounded-xl text-xs text-white/70 hover:text-white transition-all flex items-center justify-between group"
                    >
                      <span className="font-medium">Check History Trends</span>
                      <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 text-white/40 group-hover:text-white" />
                    </Link>

                    <Link
                      to="/profile"
                      className="bg-white/[0.015] border border-white/5 hover:border-[var(--brand-blue)]/20 p-3.5 rounded-xl text-xs text-white/70 hover:text-white transition-all flex items-center justify-between group"
                    >
                      <span className="font-medium">Manage Account Details</span>
                      <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 text-white/40 group-hover:text-white" />
                    </Link>

                    {latestSession && (
                      <Link
                        to="/results"
                        search={{ sessionId: latestSession.id }}
                        className="bg-white/[0.015] border border-white/5 hover:border-[var(--brand-blue)]/20 p-3.5 rounded-xl text-xs text-white/70 hover:text-white transition-all flex items-center justify-between group"
                      >
                        <span className="font-medium">View Latest Analysis</span>
                        <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 text-white/40 group-hover:text-white" />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
