import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation } from "@tanstack/react-router";
import { LayoutGrid, PlusCircle, BarChart3, X } from "lucide-react";
import { useEffect } from "react";

const NAV_ITEMS = [
  { label: "Overview", href: "/", icon: LayoutGrid },
  { label: "New Analysis", href: "/analyze", icon: PlusCircle },
  { label: "Results", href: "/results", icon: BarChart3 },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {/* Fullscreen Overlay */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 bg-black/45 backdrop-blur-sm z-40"
          onClick={onClose}
        />
      )}

      {/* Sidebar Drawer */}
      {isOpen && (
        <motion.aside
          initial={{ x: "-100%" }}
          animate={{ x: 0 }}
          exit={{ x: "-100%" }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="fixed top-28 bottom-4 left-4 md:left-6 w-[220px] z-50 flex flex-col pt-6 pb-6 shadow-[inset_1px_1px_1px_rgba(255,255,255,0.05),0_0_40px_rgba(48,84,255,0.05)] bg-[#030308]/60 backdrop-blur-3xl border border-white/5 rounded-3xl overflow-hidden"
        >
          {/* Mobile Close Button */}
          <button onClick={onClose} className="md:hidden absolute top-4 right-4 text-white/50 hover:text-white transition-colors z-50">
            <X className="w-5 h-5" />
          </button>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-2 flex-1 px-3 mt-8 md:mt-2">
            {NAV_ITEMS.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.label}
                  to={item.href}
                  onClick={onClose}
                  className={`group flex items-center px-3 py-3 rounded-2xl transition-all duration-300 relative overflow-hidden gap-4 ${
                    isActive 
                      ? "bg-[#3054ff]/10 border border-[#3054ff]/20 shadow-[inset_3px_0_0_0_rgba(48,84,255,1)]" 
                      : "border border-transparent hover:bg-white/5 hover:border-white/10 hover:-translate-y-[1px] hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)]"
                  }`}
                >
                  {/* Subtle active glow */}
                  {isActive && <div className="absolute inset-0 bg-gradient-to-r from-[#3054ff]/20 to-transparent pointer-events-none" />}
                  
                  <item.icon 
                    className={`w-[22px] h-[22px] transition-all duration-300 relative z-10 ${
                      isActive ? "text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" : "text-white/60 group-hover:text-white group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]"
                    }`} 
                    strokeWidth={isActive ? 2.5 : 2} 
                  />
                  
                  <span
                    className={`text-[14px] whitespace-nowrap relative z-10 ${
                      isActive ? "text-white font-medium drop-shadow-sm" : "text-white/60 group-hover:text-white"
                    }`}
                  >
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>

          {/* Neural Diagnostics Status Module */}
          <div className="mt-auto px-3">
            <div className="bg-[#050512]/60 backdrop-blur-md border border-white/5 rounded-2xl p-4 w-full relative overflow-hidden group hover:border-[#3054ff]/20 hover:shadow-[0_0_20px_rgba(48,84,255,0.1)] transition-all duration-500">
              {/* Subtle ambient pulse */}
              <div className="absolute inset-0 bg-[#3054ff]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 blur-xl pointer-events-none" />
              
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse" />
                <span className="text-xs font-semibold text-white/90 uppercase tracking-widest">Engine Online</span>
              </div>
              
              <div className="flex flex-col gap-2.5">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-white/50 font-medium">Whisper Tiny</span>
                  <span className="text-emerald-400 font-mono">Idle</span>
                </div>
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-white/50 font-medium">Fusion ANN</span>
                  <span className="text-emerald-400 font-mono">Ready</span>
                </div>
                <div className="flex justify-between items-center text-[10px] pt-2 border-t border-white/5 mt-1">
                  <span className="text-white/50 font-medium">Latency</span>
                  <span className="text-white/80 font-mono">24ms</span>
                </div>
              </div>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
