import { createFileRoute } from "@tanstack/react-router";
import { Server, Brain, Mic, MessageSquareText, Eye, Network, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { AmbientMotion } from "../components/ui/AmbientMotion";
import { Particles } from "../components/ui/Particles";
import { AuthGuard } from "@/components/auth/AuthGuard";

export const Route = createFileRoute("/tech")({
  head: () => ({
    meta: [
      { title: "Tech Stack — AI Interview Evaluator" },
      {
        name: "description",
        content: "FastAPI, PyTorch, Whisper, DistilBERT, CNN, ANN — the full stack.",
      },
    ],
  }),
  component: () => <TechPage />,
});

const engines = [
  {
    icon: Mic,
    name: "OpenAI Whisper",
    desc: "State-of-the-art ASR for transcription across 99 languages.",
  },
  {
    icon: MessageSquareText,
    name: "DistilBERT",
    desc: "67M param language model for sentiment + semantic relevance.",
  },
  {
    icon: Eye,
    name: "CNN Emotion Detection",
    desc: "Trained on FER-2013 — joy, neutral, surprise, fear, anger, sadness, disgust.",
  },
  {
    icon: Network,
    name: "ANN Fusion",
    desc: "Multimodal late-fusion network calibrated for interview scoring.",
  },
];

function TechPage() {
  return (
    <div className="relative min-h-screen bg-background text-white overflow-hidden font-sans selection:bg-[var(--brand-blue)]/30">
      {/* ── ENVIRONMENT ── */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <AmbientMotion />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
        <div className="absolute inset-0 bg-background/80 backdrop-blur-[100px]" />
        <div className="absolute inset-0 opacity-30 overflow-hidden pointer-events-none">
          <Particles />
        </div>
      </div>

      <div className="relative z-10 px-8 md:px-28 pt-32 pb-10">
        <div className="mx-auto max-w-5xl space-y-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <h1
              className="text-[64px] md:text-[104px] font-bold tracking-tight"
              style={{ fontFamily: "var(--font-serif)" }}
            >
              Technical <span className="text-[var(--brand-blue)]">Highlights</span>
            </h1>
            <p className="mt-4 text-lg text-white/60 leading-relaxed max-w-2xl">
              The components powering the fusion engine.
            </p>
          </motion.div>

          <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
            {/* ── NEURAL ENGINES (Spans 2 columns) ── */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="md:col-span-2 bg-card/40 backdrop-blur-xl border border-white/5 bg-gradient-to-br from-white/[0.04] to-transparent hover:border-[var(--brand-blue)]/30 hover:shadow-[0_0_30px_rgba(48,84,255,0.15)] transition-all duration-300 relative group h-full"
            >
              <div className="p-8 h-full flex flex-col">
                <div className="flex items-center gap-3 mb-8">
                  <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-[var(--brand-blue)] to-[var(--brand-blue)]/40 shadow-[0_0_20px_rgba(48,84,255,0.4)] shrink-0">
                    <Brain className="h-6 w-6 text-white" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-xl text-white truncate">
                      PyTorch Neural Engines
                    </h3>
                    <p className="text-sm text-white/50 truncate">
                      All neural nets trained and served via TorchScript.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 flex-1 min-h-0">
                  {engines.map((e) => (
                    <div key={e.name} className="flex gap-4 items-start min-w-0 break-words">
                      <e.icon
                        className="w-5 h-5 text-[var(--brand-blue)] mt-0.5 shrink-0"
                        strokeWidth={1.5}
                      />
                      <div className="min-w-0 flex-1">
                        <h4 className="font-medium text-sm text-white/90 truncate">{e.name}</h4>
                        <p className="text-xs text-white/50 mt-1 leading-relaxed line-clamp-2">
                          {e.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* ── INFRASTRUCTURE (Column 3) ── */}
            <div className="md:col-span-1 flex flex-col gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="flex-1 bg-card/40 backdrop-blur-xl border border-white/5 bg-gradient-to-br from-white/[0.04] to-transparent hover:border-[var(--brand-blue)]/30 hover:shadow-[0_0_30px_rgba(48,84,255,0.15)] transition-all duration-300 relative group"
              >
                <div className="p-8 flex flex-col items-start h-full min-w-0">
                  <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-[var(--brand-blue)] to-[var(--brand-blue)]/40 shadow-[0_0_20px_rgba(48,84,255,0.4)] mb-5 shrink-0">
                    <Zap className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-lg text-white truncate w-full">
                    Real-time Inference
                  </h3>
                  <p className="mt-2 text-sm text-white/50 leading-relaxed min-w-0 break-words line-clamp-3">
                    GPU-accelerated streaming inference, achieving sub-1.5s end-to-end latency for
                    multimodal fusion.
                  </p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="flex-1 bg-card/40 backdrop-blur-xl border border-white/5 bg-gradient-to-br from-white/[0.04] to-transparent hover:border-[var(--brand-blue)]/30 hover:shadow-[0_0_30px_rgba(48,84,255,0.15)] transition-all duration-300 relative group"
              >
                <div className="p-8 flex flex-col items-start h-full min-w-0">
                  <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-[var(--brand-blue)] to-[var(--brand-blue)]/40 shadow-[0_0_20px_rgba(48,84,255,0.4)] mb-5 shrink-0">
                    <Server className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-lg text-white truncate w-full">
                    FastAPI Backend
                  </h3>
                  <p className="mt-2 text-sm text-white/50 leading-relaxed min-w-0 break-words line-clamp-3">
                    Async Python API gateway with OpenAPI docs and websocket streaming.
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
