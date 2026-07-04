/**
 * AuthGuard — wraps protected routes and redirects unauthenticated users.
 *
 * Usage:
 *   function MyPage() {
 *     return <AuthGuard><PageContent /></AuthGuard>
 *   }
 */
import { useEffect } from "react";
import { useNavigate, useLocation } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Brain } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate({
        to: "/login",
        search: { redirect: location.pathname },
        replace: true,
      });
    }
  }, [isAuthenticated, isLoading, navigate, location.pathname]);

  // Full-screen loading state — matches the app's dark aesthetic
  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col items-center gap-6"
        >
          {/* Pulsing brain icon */}
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

          {/* Animated dots */}
          <div className="flex items-center gap-1.5">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-[var(--brand-blue)]/60"
                animate={{ opacity: [0.3, 1, 0.3], y: [0, -4, 0] }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: i * 0.15,
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  // While redirect is pending, render nothing
  if (!isAuthenticated) return null;

  return <>{children}</>;
}
