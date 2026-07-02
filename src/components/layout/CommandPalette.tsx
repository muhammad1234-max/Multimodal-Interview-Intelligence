import { useState, useEffect, useDeferredValue, useMemo, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ArrowRight, LayoutGrid, PlusCircle, BarChart3, Settings, History, FileText } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";

const NAVIGATION_LINKS = [
  { id: "1", title: "New Interview Analysis", icon: PlusCircle, category: "Actions", href: "/analyze" },
  { id: "2", title: "View Dashboard Overview", icon: LayoutGrid, category: "Navigation", href: "/" },
  { id: "3", title: "Recent Results (Sarah Jenkins)", icon: BarChart3, category: "Recent", href: "/results" },
  { id: "4", title: "System Settings", icon: Settings, category: "Configuration", href: "/" },
  { id: "5", title: "Interview History", icon: History, category: "Navigation", href: "/" },
  { id: "6", title: "Generate PDF Report", icon: FileText, category: "Actions", href: "/results" },
];

export const CommandPalette = memo(function CommandPalette({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);

  const [selectedIndex, setSelectedIndex] = useState(0);

  const filtered = useMemo(() => 
    NAVIGATION_LINKS.filter(r => r.title.toLowerCase().includes(deferredQuery.toLowerCase())),
  [deferredQuery]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === "Escape") {
        onClose();
        return;
      }

      if (filtered.length > 0) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % filtered.length);
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          setSelectedIndex((prev) => (prev - 1 + filtered.length) % filtered.length);
        } else if (e.key === "Enter") {
          e.preventDefault();
          navigate({ to: filtered[selectedIndex].href });
          onClose();
        }
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [isOpen, onClose, filtered, selectedIndex, navigate]);

  // Reset query when closed
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => setQuery(""), 200);
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[12vh] pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="w-[92%] max-w-[640px] bg-card/90 backdrop-blur-3xl border border-white/10 rounded-2xl shadow-[0_0_40px_rgba(48,84,255,0.1)] overflow-hidden pointer-events-auto flex flex-col"
            >
              <div className="flex items-center px-4 py-4 border-b border-white/10 relative">
                <Search className="w-5 h-5 text-[var(--brand-blue)] mr-3" />
                <input
                  autoFocus
                  type="text"
                  placeholder="Search anything or type a command..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="flex-1 bg-transparent border-none outline-none text-base md:text-lg text-white placeholder:text-white/40"
                />
                <div className="px-2 py-1 bg-white/5 border border-white/10 rounded text-[10px] text-white/40 font-medium ml-2">ESC</div>
              </div>

              <div className="max-h-[60vh] overflow-y-auto p-2 scrollbar-thin">
                {filtered.length === 0 ? (
                  <div className="px-4 py-12 text-center text-white/40 text-sm">No results found for "{query}"</div>
                ) : (
                  <div className="flex flex-col gap-1">
                    {filtered.map((item, index) => (
                      <button
                        key={item.id}
                        onMouseEnter={() => setSelectedIndex(index)}
                        onClick={() => { navigate({ to: item.href }); onClose(); }}
                        className={`group flex items-center justify-between px-3 py-3 rounded-xl border transition-all duration-200 w-full text-left ${
                          index === selectedIndex
                            ? "bg-[var(--brand-blue)]/10 border-[var(--brand-blue)]/20"
                            : "hover:bg-[var(--brand-blue)]/10 hover:border-[var(--brand-blue)]/20 border-transparent"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center group-hover:bg-[var(--brand-blue)]/20 group-hover:border-[var(--brand-blue)]/20 transition-all">
                            <item.icon className="w-4 h-4 text-white/60 group-hover:text-[var(--brand-blue)] transition-colors" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-white/80 group-hover:text-white transition-colors">{item.title}</span>
                            <span className="text-[10px] text-white/40">{item.category}</span>
                          </div>
                        </div>
                        <ArrowRight className={`w-4 h-4 text-[var(--brand-blue)] transition-all duration-300 ${index === selectedIndex ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0"}`} />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
});
