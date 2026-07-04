import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Brain, Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import { toast } from "sonner";
import { Particles } from "../components/ui/Particles";
import { AmbientMotion } from "../components/ui/AmbientMotion";
import { useAuth } from "@/contexts/AuthContext";

// Route definition with optional redirect search param
export const Route = createFileRoute("/login")({
  validateSearch: z.object({ redirect: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "Sign In — AI Interview Evaluator" },
      { name: "description", content: "Sign in to your AI Interview Evaluator account." },
    ],
  }),
  component: LoginPage,
});

// ── Zod schema ────────────────────────────────────────────────────────────────

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(1, "Password is required."),
});

type LoginFormData = z.infer<typeof loginSchema>;

// ── Component ─────────────────────────────────────────────────────────────────

function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const search = useSearch({ from: "/login" });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true);
    try {
      await login(data.email, data.password);
      toast.success("Welcome back! Redirecting…");
      const destination = search.redirect ?? "/analyze";
      navigate({ to: destination, replace: true });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Sign in failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-[100dvh] pt-20 pb-12 text-foreground flex items-center justify-center overflow-hidden px-4">

      {/* ── BACKGROUND (identical to Landing/Analyze) ── */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <Particles />
      </div>
      <div className="absolute inset-0 z-10 overflow-hidden pointer-events-none">
        <AmbientMotion />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[var(--brand-blue)]/[0.04] blur-[140px] rounded-full pointer-events-none" />
      </div>

      {/* ── CARD ── */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-20 w-full max-w-md"
      >
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex items-center justify-center gap-3 px-1.5 py-1.5 pr-5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-8 w-fit mx-auto"
        >
          <div className="w-7 h-7 rounded-lg bg-[var(--brand-blue)]/15 border border-[var(--brand-blue)]/20 flex items-center justify-center">
            <Brain className="w-4 h-4 text-[var(--brand-blue)]" strokeWidth={1.5} />
          </div>
          <div className="text-xs text-white/60 font-medium tracking-wide">
            AI Interview Evaluator
          </div>
        </motion.div>

        {/* Glassmorphic card — premium central layout */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="bg-[#050512]/60 backdrop-blur-3xl border border-white/10 rounded-[2rem] p-8 sm:p-10 shadow-2xl shadow-black/80"
        >
          {/* Header */}
          <div className="mb-10 text-center flex flex-col items-center">
            <h1 className="text-3xl font-bold text-white tracking-tight mb-3" style={{ fontFamily: "var(--font-serif)" }}>
              Welcome back
            </h1>
            <p className="text-sm text-white/50 max-w-[280px] leading-relaxed">
              Sign in to access your multimodal interview workspace.
            </p>
          </div>

          <form id="login-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>

            {/* Email field */}
            <div className="space-y-2">
              <label htmlFor="login-email" className="text-xs font-semibold text-white/60 uppercase tracking-widest">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  {...register("email")}
                  className={`w-full pl-11 pr-4 py-3 rounded-2xl border bg-white/[0.03] text-sm text-white/85 placeholder:text-white/25 transition-all duration-300 focus:outline-none focus:bg-[var(--brand-blue)]/5 focus:shadow-[0_0_20px_rgba(48,84,255,0.1)] ${
                    errors.email
                      ? "border-red-500/50 focus:border-red-500/70"
                      : "border-white/8 focus:border-[var(--brand-blue)]/40"
                  }`}
                />
              </div>
              {errors.email && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs text-red-400 pl-1"
                >
                  {errors.email.message}
                </motion.p>
              )}
            </div>

            {/* Password field */}
            <div className="space-y-2">
              <label htmlFor="login-password" className="text-xs font-semibold text-white/60 uppercase tracking-widest">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  {...register("password")}
                  className={`w-full pl-11 pr-12 py-3 rounded-2xl border bg-white/[0.03] text-sm text-white/85 placeholder:text-white/25 transition-all duration-300 focus:outline-none focus:bg-[var(--brand-blue)]/5 focus:shadow-[0_0_20px_rgba(48,84,255,0.1)] ${
                    errors.password
                      ? "border-red-500/50 focus:border-red-500/70"
                      : "border-white/8 focus:border-[var(--brand-blue)]/40"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs text-red-400 pl-1"
                >
                  {errors.password.message}
                </motion.p>
              )}
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between py-1 text-xs">
              <label className="flex items-center gap-2.5 cursor-pointer text-white/40 hover:text-white/60 transition-colors select-none">
                <input
                  id="remember-me"
                  type="checkbox"
                  className="w-3.5 h-3.5 rounded border-white/10 bg-white/5 text-[var(--brand-blue)] focus:ring-[var(--brand-blue)]/50 focus:ring-offset-black cursor-pointer"
                />
                Remember me
              </label>
              <button
                type="button"
                onClick={() => toast.info("Forgot password flow is a placeholder in this demo.")}
                className="text-[var(--brand-blue)] hover:text-white transition-colors font-medium"
              >
                Forgot password?
              </button>
            </div>

            {/* Submit — same white pill button style as the rest of the app */}
            <motion.button
              id="login-submit"
              type="submit"
              disabled={isSubmitting}
              whileHover={{ scale: isSubmitting ? 1 : 1.01 }}
              whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
              className="group mt-2 w-full flex items-center justify-center gap-4 bg-white text-black font-semibold rounded-full pl-7 pr-2 py-2 shadow-xl shadow-black/20 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
            >
              <span className="text-[17px] flex-1 text-left">
                {isSubmitting ? "Signing in…" : "Sign in"}
              </span>
              <div className="bg-[var(--brand-blue)] rounded-full w-[42px] h-[42px] flex items-center justify-center group-hover:bg-[var(--brand-blue-hover)] transition-colors">
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 text-white animate-spin" />
                ) : (
                  <ArrowRight className="w-5 h-5 text-white" />
                )}
              </div>
            </motion.button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-white/5" />
            <span className="text-xs text-white/25">or</span>
            <div className="flex-1 h-px bg-white/5" />
          </div>

          {/* Register link */}
          <p className="text-center text-sm text-white/40">
            Don't have an account?{" "}
            <Link
              to="/signup"
              className="text-[var(--brand-blue)] hover:text-white font-medium transition-colors"
            >
              Create one free
            </Link>
          </p>
        </motion.div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-xs text-white/20 mt-6"
        >
          By signing in you agree to our{" "}
          <span className="text-white/35">Terms of Service</span> and{" "}
          <span className="text-white/35">Privacy Policy</span>.
        </motion.p>
      </motion.div>
    </div>
  );
}
