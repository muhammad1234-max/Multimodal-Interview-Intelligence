import { Menu, Search, Bell, ChevronDown, Brain } from "lucide-react";

interface HeaderProps {
  onMenuClick: () => void;
  onOpenCommand: () => void;
}

export function Header({ onMenuClick, onOpenCommand }: HeaderProps) {
  return (
    <header className="fixed top-6 left-1/2 -translate-x-1/2 w-[95%] max-w-[1400px] h-16 z-40 bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-3xl flex items-center justify-between px-6 shadow-2xl">
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
            <span className="text-[7.5px] text-white/40 font-semibold tracking-[0.2em] uppercase mt-[1px]">Multimodal Intelligence</span>
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
          <span className="text-sm text-white/40 group-hover:text-white/70 transition-colors mr-auto font-medium">Search anything or press ⌘K...</span>
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
        <div className="flex items-center gap-2 cursor-pointer group pl-4 border-l border-white/10">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#3054ff] to-[#4a6fff] flex items-center justify-center text-xs font-semibold text-white shadow-lg group-hover:scale-105 group-hover:shadow-[0_0_15px_rgba(48,84,255,0.4)] transition-all">
            MA
          </div>
          <ChevronDown className="w-4 h-4 text-white/50 group-hover:text-white transition-colors" />
        </div>
      </div>
    </header>
  );
}
