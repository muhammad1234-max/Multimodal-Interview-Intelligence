import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";
import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { CommandPalette } from "@/components/layout/CommandPalette";
import { AuthProvider } from "@/contexts/AuthContext";
import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="relative min-h-screen flex items-center justify-center px-6 text-foreground bg-black">
      <div className="relative text-center flex flex-col items-center gap-6">
        <div className="text-[96px] font-bold text-white tabular-nums leading-none [text-shadow:0_0_60px_rgba(48,84,255,0.5)] tracking-tighter">
          404
        </div>
        <p className="text-sm text-white/40 max-w-xs leading-relaxed">
          This neural pathway doesn't exist.
        </p>
        <Link
          to="/"
          className="group flex items-center gap-3 bg-white text-black font-semibold rounded-full pl-6 pr-2 py-2 transition-all hover:scale-[1.02] shadow-xl shadow-black/20"
        >
          <span className="text-[14px]">Back to Overview</span>
          <div className="bg-[var(--brand-blue)] rounded-full w-8 h-8 flex items-center justify-center group-hover:bg-[var(--brand-blue-hover)] transition-colors">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
          </div>
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="relative min-h-screen flex items-center justify-center px-6 text-foreground bg-black">
      <div className="bg-card/60 backdrop-blur-md border border-white/10 rounded-3xl p-8 max-w-md w-full text-center flex flex-col items-center gap-5 shadow-2xl shadow-black/80">
        <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
          <svg className="w-7 h-7 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
        </div>
        <h1 className="text-lg font-semibold text-white">Something glitched in the matrix</h1>
        <p className="text-sm text-white/40 leading-relaxed">{error.message}</p>
        <button
          onClick={reset}
          className="group flex items-center gap-3 bg-white text-black font-semibold rounded-full pl-6 pr-2 py-2 transition-all hover:scale-[1.02] shadow-xl shadow-black/20"
        >
          <span className="text-[14px]">Try again</span>
          <div className="bg-[var(--brand-blue)] rounded-full w-8 h-8 flex items-center justify-center group-hover:bg-[var(--brand-blue-hover)] transition-colors">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          </div>
        </button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "AI Interview Evaluator — Multimodal Fusion Platform" },
      { name: "description", content: "Next-gen AI platform analyzing speech, vision and NLP for interview intelligence." },
      { name: "author", content: "AI Evaluator Team" },
      { property: "og:title", content: "AI Interview Evaluator" },
      { property: "og:description", content: "Multimodal AI-powered interview analysis using Speech, Vision, and NLP" },
      { property: "og:type", content: "website" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@300;400;500;600;700;800&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCommandOpen, setIsCommandOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsCommandOpen(open => !open);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <div className="relative flex min-h-screen w-full bg-black text-foreground overflow-x-hidden">
          
          {/* Global Background Layer */}
          <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
            <img 
              src="/hero-bg-v4.jpg" 
              alt="Neural Background" 
              className="w-full h-full object-cover mix-blend-screen opacity-100 contrast-[1.15] saturate-[1.2] brightness-[1.1]"
            />
          </div>

          {/* Global Header */}
          <Header onMenuClick={() => setIsSidebarOpen(p => !p)} onOpenCommand={() => setIsCommandOpen(true)} />

          {/* Global Sidebar (Collapsible) */}
          <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

          {/* Main Content Area */}
          <main className="relative z-10 flex-1 w-full flex flex-col pt-0">
            <Outlet />
          </main>

          <CommandPalette isOpen={isCommandOpen} onClose={() => setIsCommandOpen(false)} />
          <Toaster richColors theme="dark" position="bottom-left" />
        </div>
      </QueryClientProvider>
    </AuthProvider>
  );
}
