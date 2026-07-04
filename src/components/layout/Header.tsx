import { Menu, Search, Bell, ChevronDown, Brain, LogOut } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/contexts/AuthContext";

interface HeaderProps {
  onMenuClick: () => void;
  onOpenCommand: () => void;
}

export function Header({ onMenuClick, onOpenCommand }: HeaderProps) {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Compute initials from the user's name
  const initials = user?.full_name
    ? user.full_name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "?";

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const handleLogout = () => {
    setDropdownOpen(false);
    logout();
    navigate({ to: "/login", replace: true });
  };

  return (
    <header className="fixed top-6 left-1/2 -translate-x-1/2 w-[95%] max-w-[1400px] h-16 z-40 bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-3xl flex items-center justify-between px-6 shadow-2xl">
      {/* Left */}
      <div className="flex items-center gap-4 sm:gap-6">
        <button onClick={onMenuClick} className="text-white/70 hover:text-white transition-colors">
          <Menu className="w-5 h-5" />
        </button>
        <div className="hidden sm:flex items-center gap-3 border-l border-white/10 pl-5">
          <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
            <Brain className="w-4 h-4 text-[#3054ff]" />
          </div>
          <div className="flex flex-col">
            <span className="text-white font-medium text-[13px] leading-tight">AI Evaluator</span>
            <span className="text-[7.5px] text-white/40 font-semibold tracking-[0.2em] uppercase mt-[1px]">
              Multimodal Intelligence
            </span>
          </div>
        </div>
      </div>

      {/* Center - Command Palette Launcher */}
      <div className="hidden md:flex flex-1 max-w-[540px] mx-8 justify-center">
        <button
          onClick={onOpenCommand}
          className="group flex items-center w-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-[#3054ff]/40 rounded-xl px-4 py-2 transition-all duration-300 shadow-[0_0_15px_rgba(0,0,0,0.1)] hover:shadow-[0_0_20px_rgba(48,84,255,0.15)]"
        >
          <Search className="w-4 h-4 text-white/40 group-hover:text-[#3054ff] mr-3 transition-colors" />
          <span className="text-sm text-white/40 group-hover:text-white/70 transition-colors mr-auto font-medium">
            Search anything or press ⌘K...
          </span>
          <div className="flex items-center justify-center bg-white/10 border border-white/5 rounded px-1.5 py-0.5 ml-3 group-hover:border-[#3054ff]/30 transition-colors">
            <span className="text-[10px] text-white/60 font-medium">⌘K</span>
          </div>
        </button>
      </div>

      {/* Right */}
      <div className="flex items-center gap-4 sm:gap-6">
        <div className="relative cursor-pointer group">
          <Bell className="w-5 h-5 text-white/60 group-hover:text-white transition-colors" />
          <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#3054ff] rounded-full border-2 border-[#050512]" />
        </div>

        {/* User Avatar + Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            id="user-avatar-btn"
            onClick={() => setDropdownOpen((p) => !p)}
            className="flex items-center gap-2 cursor-pointer group pl-4 border-l border-white/10"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#3054ff] to-[#4a6fff] flex items-center justify-center text-xs font-semibold text-white shadow-lg group-hover:scale-105 group-hover:shadow-[0_0_15px_rgba(48,84,255,0.4)] transition-all">
              {isAuthenticated ? initials : "?"}
            </div>
            {isAuthenticated && (
              <span className="hidden sm:block text-xs text-white/60 group-hover:text-white/90 transition-colors max-w-[100px] truncate">
                {user?.full_name?.split(" ")[0]}
              </span>
            )}
            <ChevronDown
              className={`w-4 h-4 text-white/50 group-hover:text-white transition-all ${dropdownOpen ? "rotate-180" : ""}`}
            />
          </button>

          {/* Dropdown */}
          <AnimatePresence>
            {dropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                className="absolute right-0 top-full mt-3 w-52 bg-card/80 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden z-50"
              >
                {isAuthenticated && user && (
                  <>
                    {/* User info */}
                    <div className="px-4 py-3 border-b border-white/5">
                      <p className="text-sm font-medium text-white/90 truncate">{user.full_name}</p>
                      <p className="text-xs text-white/35 truncate">{user.email}</p>
                    </div>

                    {/* Logout */}
                    <button
                      id="logout-btn"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-white/60 hover:text-white hover:bg-white/5 transition-all duration-200 group"
                    >
                      <LogOut className="w-4 h-4 group-hover:text-red-400 transition-colors" />
                      <span>Sign out</span>
                    </button>
                  </>
                )}

                {!isAuthenticated && (
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      navigate({ to: "/login" });
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-white/60 hover:text-white hover:bg-white/5 transition-all duration-200"
                  >
                    Sign in
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
