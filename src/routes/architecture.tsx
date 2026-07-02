import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Video, AudioLines, Eye, MessageSquareText, Network, Sparkles, ChevronDown } from "lucide-react";
import { AmbientMotion } from "../components/ui/AmbientMotion";
import { Particles } from "../components/ui/Particles";

export const Route = createFileRoute("/architecture")({
  head: () => ({
    meta: [
      { title: "Architecture — AI Interview Evaluator" },
      { name: "description", content: "End-to-end multimodal AI fusion pipeline architecture." },
    ],
  }),
  component: ArchPage,
});

const stages = [
  { icon: Video, title: "Input Video", sub: "MP4 / MOV / WAV", color: "from-[var(--brand-blue)]/80 to-[var(--brand-blue)]/40" },
  { icon: AudioLines, title: "Speech Pipeline", sub: "Whisper + MFCC", color: "from-[var(--brand-blue)] to-white/20" },
  { icon: Eye, title: "Vision Pipeline", sub: "CNN · FER-2013", color: "from-white/20 to-[var(--brand-blue)]" },
  { icon: MessageSquareText, title: "NLP Pipeline", sub: "DistilBERT", color: "from-[var(--brand-blue)] to-[var(--brand-blue)]/50" },
  { icon: Network, title: "Fusion ANN", sub: "Multimodal merge", color: "from-[var(--brand-blue)]/50 to-[var(--brand-blue)]" },
  { icon: Sparkles, title: "Final Score + Confidence", sub: "Calibrated softmax", color: "from-[var(--brand-blue)] to-white/50" },
];

function ArchPage() {
  return (
    <div className="relative min-h-screen bg-background text-white overflow-hidden font-sans selection:bg-[var(--brand-blue)]/30">
      {/* ── ENVIRONMENT ── */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <AmbientMotion />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
        <div className="absolute inset-0 bg-background/80 backdrop-blur-[100px]" />
        <div className="absolute inset-0 opacity-30 overflow-hidden pointer-events-none"><Particles /></div>
      </div>

      <div className="relative z-10 px-8 md:px-28 pt-32 pb-10">
        <div className="mx-auto max-w-5xl space-y-16 md:space-y-24">
          
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>
            <h1 className="text-[64px] md:text-[104px] font-bold tracking-tight" style={{ fontFamily: 'var(--font-serif)' }}>System <span className="text-[var(--brand-blue)]">Architecture</span></h1>
            <p className="mt-4 text-lg text-white/60 leading-relaxed max-w-2xl">A neural data flow from raw input to fused decision.</p>
          </motion.div>

          <div className="space-y-2">
            {stages.map((s, i) => (
              <div key={s.title}>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-card/40 backdrop-blur-xl border border-white/5 relative flex items-center gap-4 rounded-2xl p-5"
                >
                  <div className={`grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${s.color} shadow-[0_0_20px_rgba(48,84,255,0.2)]`}>
                    <s.icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-white/90 truncate">{s.title}</div>
                    <div className="text-sm text-white/50 truncate">{s.sub}</div>
                  </div>
                  <div className="hidden text-xs uppercase tracking-widest text-white/30 md:block shrink-0">stage {i + 1}</div>
                </motion.div>
                {i < stages.length - 1 && (
                  <motion.div
                    initial={{ opacity: 0, scaleY: 0 }}
                    whileInView={{ opacity: 1, scaleY: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 + 0.05 }}
                    className="my-1 grid place-items-center"
                  >
                    <div className="h-6 w-px bg-gradient-to-b from-[var(--brand-blue)]/60 to-[var(--brand-blue)]/20" />
                    <ChevronDown className="-mt-2 h-4 w-4 text-[var(--brand-blue)]/50" />
                  </motion.div>
                )}
              </div>
            ))}
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.6 }} className="bg-card/40 backdrop-blur-xl border border-white/5 bg-gradient-to-br from-white/[0.04] to-transparent hover:border-[var(--brand-blue)]/30 hover:shadow-[0_0_30px_rgba(48,84,255,0.15)] transition-all duration-300 relative group">
            <div className="p-6">
              <h4 className="font-semibold text-xl text-[var(--brand-blue)]">Why fusion?</h4>
              <p className="mt-2 text-sm text-white/70 leading-relaxed min-w-0 break-words">
                Each modality alone is fragile: speech misses context, vision misses content, NLP misses delivery.
                The fusion ANN learns the weights between them so the final signal is more robust than any single channel.
              </p>
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
}
