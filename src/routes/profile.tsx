import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { User, Mail, Shield, Calendar, BarChart2, ShieldCheck, Loader2 } from "lucide-react";
import { Particles } from "../components/ui/Particles";
import { AmbientMotion } from "../components/ui/AmbientMotion";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { useAuth } from "@/contexts/AuthContext";
import { apiGet } from "@/lib/api-client";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "My Profile — AI Interview Evaluator" },
      { name: "description", content: "Manage your user account profile and settings." },
    ],
  }),
  component: () => <AuthGuard><ProfilePage /></AuthGuard>,
});

interface SessionsCountResponse {
  total: number;
}

function formatDate(iso: string): string {
  if (!iso) return "N/A";
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(iso));
}

function ProfilePage() {
  const { user } = useAuth();
  const [sessionCount, setSessionCount] = useState<number | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await apiGet<SessionsCountResponse>("/api/sessions?skip=0&limit=1");
        setSessionCount(data.total);
      } catch {
        setSessionCount(0);
      } finally {
        setLoadingStats(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="relative min-h-screen text-foreground overflow-x-hidden">

      {/* ── BACKGROUND ── */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <Particles />
      </div>
      <div className="relative z-10 pointer-events-none">
        <AmbientMotion />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-[var(--brand-blue)]/[0.04] blur-[140px] rounded-full" />
      </div>

      <div className="relative z-20 px-6 md:px-16 lg:px-28 pt-32 pb-24 max-w-4xl mx-auto space-y-10">

        {/* ── HEADER ── */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center gap-3 px-1.5 py-1.5 pr-5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-6 w-fit">
            <div className="w-7 h-7 rounded-lg bg-[var(--brand-blue)]/15 border border-[var(--brand-blue)]/20 flex items-center justify-center">
              <User className="w-4 h-4 text-[var(--brand-blue)]" strokeWidth={1.5} />
            </div>
            <span className="text-xs text-white/60 font-medium tracking-wide">
              User Profile Workspace
            </span>
          </div>
          <h1 className="text-[36px] md:text-[56px] font-bold tracking-tight text-white leading-none" style={{ fontFamily: "var(--font-serif)" }}>
            Profile Settings.
          </h1>
        </motion.div>

        {/* ── PROFILE CONTENT CARD ── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="bg-card/60 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl space-y-8"
        >
          {/* Top Row: User Initials Big Avatar & Name */}
          <div className="flex flex-col sm:flex-row items-center gap-6 pb-8 border-b border-white/5">
            <div className="w-20 h-20 rounded-2xl bg-[var(--brand-blue)]/15 border border-[var(--brand-blue)]/30 flex items-center justify-center text-2xl font-bold text-white shadow-xl shadow-[var(--brand-blue)]/10 uppercase">
              {user?.full_name ? user.full_name.substring(0, 2) : "AI"}
            </div>
            <div className="text-center sm:text-left space-y-1.5">
              <h2 className="text-2xl font-bold text-white tracking-tight leading-none">{user?.full_name}</h2>
              <p className="text-xs text-white/40 flex items-center justify-center sm:justify-start gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-success" />
                Verified Candidate Account
              </p>
            </div>
          </div>

          {/* Account Details Form Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Field: Full name */}
            <div className="bg-white/[0.015] border border-white/5 p-5 rounded-2xl space-y-1">
              <span className="text-[9px] uppercase tracking-widest text-white/35 font-semibold flex items-center gap-1.5">
                <User className="w-3 h-3 text-white/30" />
                Full Name
              </span>
              <div className="text-sm font-semibold text-white/85 pt-1">
                {user?.full_name}
              </div>
            </div>

            {/* Field: Email */}
            <div className="bg-white/[0.015] border border-white/5 p-5 rounded-2xl space-y-1">
              <span className="text-[9px] uppercase tracking-widest text-white/35 font-semibold flex items-center gap-1.5">
                <Mail className="w-3 h-3 text-white/30" />
                Email Address
              </span>
              <div className="text-sm font-semibold text-white/85 pt-1">
                {user?.email}
              </div>
            </div>

            {/* Field: Date Joined */}
            <div className="bg-white/[0.015] border border-white/5 p-5 rounded-2xl space-y-1">
              <span className="text-[9px] uppercase tracking-widest text-white/35 font-semibold flex items-center gap-1.5">
                <Calendar className="w-3 h-3 text-white/30" />
                Member Since
              </span>
              <div className="text-sm font-semibold text-white/85 pt-1">
                {user ? formatDate(user.created_at) : "N/A"}
              </div>
            </div>

            {/* Field: Total Interviews Completed */}
            <div className="bg-white/[0.015] border border-white/5 p-5 rounded-2xl space-y-1">
              <span className="text-[9px] uppercase tracking-widest text-white/35 font-semibold flex items-center gap-1.5">
                <BarChart2 className="w-3 h-3 text-white/30" />
                Sessions Completed
              </span>
              <div className="text-sm font-semibold text-white/85 pt-1">
                {loadingStats ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--brand-blue)] mt-1" />
                ) : (
                  sessionCount ?? 0
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
