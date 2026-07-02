import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, useScroll, useTransform, useMotionValue, useMotionTemplate } from "framer-motion";
import { useRef, MouseEvent, useCallback } from "react";
import { Mic, Eye, MessageSquareText, Network, ArrowRight, Brain, Zap, ShieldCheck, Target, ChevronDown, Video, Smile, FileText } from "lucide-react";
import { Particles } from "../components/ui/Particles";
import { AmbientMotion } from "../components/ui/AmbientMotion";
import { ResultsPreview } from "../components/dashboard/ResultsPreview";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AI Interview Evaluator — Overview" },
      { name: "description", content: "Multimodal AI-powered interview analysis using Speech, Vision, and NLP." },
    ],
  }),
  component: Landing,
});

const features = [
  { icon: Mic, title: "Speech Analysis", desc: "Whisper transcription, MFCC, pitch, energy, speech rate." },
  { icon: Eye, title: "Emotion Detection", desc: "CNN trained on FER-2013 for real-time facial affect." },
  { icon: MessageSquareText, title: "NLP Understanding", desc: "DistilBERT sentiment + semantic relevance scoring." },
  { icon: Network, title: "Neural Fusion", desc: "ANN fusion layer combines all modalities into one signal." },
];

const stats = [
  { label: "Interviews analyzed", value: "12.4k" },
  { label: "Avg latency", value: "1.2s" },
  { label: "Model accuracy", value: "94.7%" },
  { label: "Modalities fused", value: "3" },
];

function Landing() {
  const containerRef = useRef<HTMLDivElement>(null);

  // Spotlight mouse tracking
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const handleMouseMove = useCallback(({ currentTarget, clientX, clientY }: MouseEvent) => {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }, [mouseX, mouseY]);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const heroY = useTransform(scrollYProgress, [0, 1], [0, -150]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <div className="relative min-h-screen text-foreground" ref={containerRef}>
      
      {/* SECTION 1: HERO */}
      <section className="relative w-full min-h-screen flex flex-col overflow-hidden bg-transparent pt-32 pb-10">
        
        {/* Background Overlay */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          {/* Animated Particles Overlay */}
          <Particles />
          {/* Bottom Fade Gradient for seamless transition */}
          <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-black/50 to-transparent z-20 pointer-events-none" />
        </div>

        {/* Hero Content */}
        <motion.div 
          className="relative z-10 flex flex-col items-center flex-1 w-full max-w-[1200px] mx-auto px-4 text-center mt-6"
          style={{ y: heroY, opacity: heroOpacity }}
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="flex items-center gap-3 px-1.5 py-1.5 pr-5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-8"
          >
            <div className="bg-[var(--brand-blue)] text-white text-xs font-semibold px-2.5 py-1 rounded-full leading-none">New</div>
            <div className="flex items-center gap-2 text-xs text-white/60 font-medium tracking-wide">
              Introducing Multimodal Fusion <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </motion.div>

          {/* Typography Hierarchy */}
          <div className="flex flex-col items-center">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="text-[40px] md:text-[56px] font-normal text-white/95 leading-tight tracking-normal mb-1"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              Your Insights.
            </motion.h2>

            <motion.h1
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="text-[64px] md:text-[104px] font-bold tracking-tight text-white leading-[1.05] [text-shadow:0_0_30px_rgba(255,255,255,0.2)]"
            >
              Build Faster.
            </motion.h1>
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mx-auto max-w-2xl text-[18px] md:text-[20px] leading-[1.6] text-white/60 mt-6"
          >
            Create fully functional, AI-optimized evaluations in seconds<br className="hidden md:block" />
            with our advanced neural engine.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5, ease: "easeOut" }}
            className="flex flex-col sm:flex-row items-center gap-8 mt-12 mb-8"
          >
            <Link
              to="/analyze"
              className="group flex items-center gap-4 bg-white text-black font-semibold rounded-full pl-7 pr-2 py-2 transition-transform hover:scale-[1.01] active:scale-[0.98] shadow-xl shadow-black/20"
            >
              <span className="text-[17px]">Start Using Free</span>
              <div className="bg-[var(--brand-blue)] rounded-full w-[42px] h-[42px] flex items-center justify-center group-hover:bg-[var(--brand-blue-hover)] transition-colors">
                <ArrowRight className="w-5 h-5 text-white" />
              </div>
            </Link>
            
            <Link
              to="/results"
              className="group text-white/90 font-medium hover:text-white transition-colors flex items-center gap-2 text-[16px] drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
            >
              View Demo <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" />
            </Link>
          </motion.div>
          
          {/* Bottom Feature Panel */}
          <motion.div 
            onMouseMove={handleMouseMove}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="group relative w-full max-w-[1040px] mt-auto bg-card/60 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 flex shadow-xl shadow-black/40 overflow-hidden"
          >
            {/* Interactive Spotlight */}
            <motion.div
              className="pointer-events-none absolute -inset-px rounded-3xl opacity-0 transition duration-300 group-hover:opacity-100 hidden md:block"
              style={{
                background: useMotionTemplate`
                  radial-gradient(
                    600px circle at ${mouseX}px ${mouseY}px,
                    rgba(48, 84, 255, 0.15),
                    transparent 80%
                  )
                `,
              }}
            />

            <div className="flex flex-col sm:grid sm:grid-cols-2 md:flex md:flex-row w-full justify-between items-start md:items-center px-2 md:px-4 gap-6 md:gap-0 md:divide-x md:divide-white/10 z-10">
              
              {/* Feature 1 */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.9 }}
                className="flex items-center gap-4 w-full md:w-1/4 md:px-6 justify-start md:justify-center"
              >
                <Brain className="w-8 h-8 text-[#4a6fff] flex-shrink-0 drop-shadow-md" strokeWidth={1.5} />
                <div className="flex flex-col text-left">
                  <span className="text-[15px] font-semibold text-white drop-shadow-sm whitespace-nowrap">Multimodal AI</span>
                  <span className="text-[13px] text-white/70 drop-shadow-sm whitespace-nowrap">Speech, Vision, NLP Fusion</span>
                </div>
              </motion.div>

              {/* Feature 2 */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 1.0 }}
                className="flex items-center gap-4 w-full md:w-1/4 md:px-6 justify-start md:justify-center"
              >
                <Zap className="w-8 h-8 text-[#4a6fff] flex-shrink-0 drop-shadow-md" strokeWidth={1.5} />
                <div className="flex flex-col text-left">
                  <span className="text-[15px] font-semibold text-white drop-shadow-sm whitespace-nowrap">Real-time Analysis</span>
                  <span className="text-[13px] text-white/70 drop-shadow-sm whitespace-nowrap">Instant deep insights</span>
                </div>
              </motion.div>

              {/* Feature 3 */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 1.1 }}
                className="flex items-center gap-4 w-full md:w-1/4 md:px-6 justify-start md:justify-center"
              >
                <ShieldCheck className="w-8 h-8 text-[#4a6fff] flex-shrink-0 drop-shadow-md" strokeWidth={1.5} />
                <div className="flex flex-col text-left min-w-0">
                  <span className="text-[15px] font-semibold text-white drop-shadow-sm truncate">Enterprise Ready</span>
                  <span className="text-[13px] text-white/70 drop-shadow-sm truncate">Secure & Scalable</span>
                </div>
              </motion.div>

              {/* Feature 4 */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 1.2 }}
                className="flex items-center gap-4 w-full md:w-1/4 md:px-6 justify-start md:justify-center"
              >
                <Target className="w-8 h-8 text-[#4a6fff] flex-shrink-0 drop-shadow-md" strokeWidth={1.5} />
                <div className="flex flex-col text-left">
                  <span className="text-[15px] font-semibold text-white drop-shadow-sm whitespace-nowrap">Extremely Accurate</span>
                  <span className="text-[13px] text-white/70 drop-shadow-sm whitespace-nowrap">State-of-the-art models</span>
                </div>
              </motion.div>

            </div>
          </motion.div>

          {/* Scroll Indicator */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1.6 }}
            className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-1 hidden md:flex"
          >
            <motion.div
              animate={{ y: [0, 3, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <ChevronDown className="w-5 h-5 text-white/40" />
            </motion.div>
          </motion.div>

        </motion.div>
      </section>

      {/* CONTINUOUS NEURAL ENVIRONMENT WRAPPER */}
      <div className="relative z-20 overflow-hidden bg-gradient-to-b from-transparent via-black/80 to-[#03030a]">
        
        {/* Animated Ambient Motion Background */}
        <AmbientMotion />
        {/* Subtle noise and radial glow */}
        <div 
          className="absolute inset-0 z-0 opacity-[0.02] pointer-events-none mix-blend-overlay"
          style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}
        />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[1000px] bg-[var(--brand-blue)]/[0.03] blur-[120px] rounded-full pointer-events-none" />

        {/* SECTION 2: STATS (Metric Cards - Quantitative Proof) */}
        <section className="relative pt-12 pb-8 px-8 md:px-28 z-20">
        <div className="max-w-5xl mx-auto">
          <div className="grid gap-6 grid-cols-2 md:grid-cols-4">
            {stats.map((s, i) => (
              <motion.div 
                key={s.label}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                whileHover={{ y: -4 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="group flex flex-col gap-2 p-6 bg-card/40 backdrop-blur-xl border border-white/5 rounded-2xl bg-gradient-to-br from-white/[0.04] to-transparent hover:border-[var(--brand-blue)]/30 hover:shadow-[0_0_30px_rgba(48,84,255,0.15)] transition-all duration-300 relative overflow-hidden"
              >
                {/* Internal Glow Effect */}
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--brand-blue)]/0 to-[var(--brand-blue)]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                
                <div className="text-sm font-medium text-white/50 group-hover:text-white/70 transition-colors uppercase tracking-widest relative z-10">{s.label}</div>
                <div className="text-4xl font-semibold tracking-tighter text-white relative z-10">{s.value}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 3: FEATURES (Glow Cards - Capabilities) */}
      <section className="relative py-8 px-8 md:px-28 z-20">
        <div className="max-w-5xl mx-auto">
           <div className="mb-16">
            <span className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Capabilities</span>
            <h2 className="mt-4 text-4xl font-semibold tracking-tighter" style={{ fontFamily: 'var(--font-serif)' }}>Three minds, one verdict.</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {features.map((f, i) => (
              <motion.div 
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                whileHover={{ y: -4 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="bg-card/40 backdrop-blur-xl border border-white/5 rounded-2xl p-6 relative overflow-hidden group bg-gradient-to-br from-white/[0.04] to-transparent hover:border-[var(--brand-blue)]/40 hover:shadow-[0_0_40px_rgba(48,84,255,0.15)] transition-all duration-300"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--brand-blue)]/10 blur-[50px] rounded-full group-hover:bg-[var(--brand-blue)]/30 group-hover:scale-150 transition-all duration-500 pointer-events-none" />
                <f.icon className="h-8 w-8 text-[var(--brand-blue)] group-hover:text-white mb-6 relative z-10 group-hover:scale-110 transition-transform duration-300" strokeWidth={1.5} />
                <h3 className="text-lg font-medium text-white/90 group-hover:text-white relative z-10 transition-colors">{f.title}</h3>
                <p className="mt-2 text-sm text-white/50 group-hover:text-white/70 relative z-10 transition-colors">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 4: PIPELINE (How the AI Works) */}
      <section className="relative py-12 px-8 md:px-28 z-20 overflow-hidden">
        <div className="max-w-[1200px] mx-auto">
          <div className="mb-20 text-center flex flex-col items-center">
            <span className="text-sm font-medium text-[var(--brand-blue)] uppercase tracking-widest bg-[var(--brand-blue)]/10 px-3 py-1 rounded-full border border-[var(--brand-blue)]/20">How it works</span>
            <h2 className="mt-6 text-4xl md:text-5xl font-semibold tracking-tighter" style={{ fontFamily: 'var(--font-serif)' }}>
              From Interview to Insight.
            </h2>
            <p className="mt-4 text-muted-foreground max-w-xl text-sm">
              Watch as raw multimodal data flows through our neural architecture to produce perfectly objective evaluations.
            </p>
          </div>

          <div className="relative">
            {/* Horizontal Connecting Line (Desktop) */}
            <motion.div 
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 1.2, ease: "easeInOut" }}
              className="hidden md:block absolute top-7 left-14 right-14 h-[2px] bg-white/[0.05] z-0 overflow-hidden rounded-full origin-left"
            >
              <motion.div 
                className="absolute top-0 bottom-0 w-1/2 bg-gradient-to-r from-transparent via-[var(--brand-blue)] to-transparent opacity-80"
                animate={{ left: ["-100%", "200%"] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear", delay: 0.5 }}
              />
            </motion.div>

            {/* Vertical Connecting Line (Mobile) */}
            <motion.div 
              initial={{ scaleY: 0 }}
              whileInView={{ scaleY: 1 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 1.2, ease: "easeInOut" }}
              className="md:hidden absolute top-14 bottom-14 left-7 w-[2px] bg-white/[0.05] z-0 overflow-hidden rounded-full origin-top"
            >
              <motion.div 
                className="absolute left-0 right-0 h-1/3 bg-gradient-to-b from-transparent via-[var(--brand-blue)] to-transparent opacity-80"
                animate={{ top: ["-100%", "200%"] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear", delay: 0.5 }}
              />
            </motion.div>

            <div className="flex flex-col md:flex-row justify-between gap-10 md:gap-4 relative z-10">
              {[
                { icon: Video, title: "Interview Video", desc: "Raw audiovisual capture" },
                { icon: Mic, title: "Speech Processing", desc: "Prosody & tone analysis" },
                { icon: Smile, title: "Facial Expression", desc: "Micro-expression mapping" },
                { icon: MessageSquareText, title: "NLU", desc: "Context & semantics" },
                { icon: Network, title: "Multimodal Fusion", desc: "Cross-modal synthesis" },
                { icon: Target, title: "Confidence", desc: "Probability scoring" },
                { icon: FileText, title: "Final Report", desc: "Objective AI assessment" }
              ].map((step, i) => (
                <motion.div 
                  key={step.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -4 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: i * 0.15 }}
                  className="group flex md:flex-col items-center text-left md:text-center gap-5 md:gap-4 w-full md:w-32 transition-transform duration-300 relative"
                >
                  {/* Subtle active glowing pulse behind each node */}
                  <motion.div 
                    className="absolute top-7 left-7 md:left-1/2 w-10 h-10 -translate-x-1/2 -translate-y-1/2 bg-[var(--brand-blue)] rounded-full blur-[20px] z-0 pointer-events-none"
                    animate={{ opacity: [0.05, 0.35, 0.05], scale: [0.8, 1.4, 0.8] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: i * 0.2 }}
                  />

                  <div className="relative w-14 h-14 rounded-full bg-card/40 backdrop-blur-xl border border-white/5 flex items-center justify-center shrink-0 group-hover:border-[var(--brand-blue)]/40 group-hover:bg-[var(--brand-blue)]/10 transition-all duration-300 shadow-xl shadow-black/50 group-hover:shadow-[0_0_20px_rgba(48,84,255,0.2)] z-10">
                    <motion.div
                      animate={{ color: ["rgba(255,255,255,0.5)", "rgba(48,84,255,0.9)", "rgba(255,255,255,0.5)"] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: i * 0.2 }}
                    >
                      <step.icon className="w-5 h-5 group-hover:text-white group-hover:scale-110 transition-all duration-300" strokeWidth={1.5} />
                    </motion.div>
                    {/* Pulse effect */}
                    <div className="absolute inset-0 rounded-full border border-[var(--brand-blue)]/0 group-hover:border-[var(--brand-blue)]/40 group-hover:scale-125 transition-all duration-500 opacity-0 group-hover:opacity-100" />
                  </div>
                  <div>
                    <h4 className="text-[13px] font-semibold text-white/90 group-hover:text-white transition-colors">{step.title}</h4>
                    <p className="text-[11px] text-white/50 leading-tight mt-1.5 group-hover:text-white/70 transition-colors">{step.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Callout Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            whileHover={{ y: -4 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="mt-16 max-w-2xl mx-auto relative group transition-transform duration-300"
          >
            <div className="absolute -inset-px bg-gradient-to-r from-transparent via-[var(--brand-blue)]/20 to-transparent rounded-2xl opacity-50 group-hover:opacity-100 transition-opacity duration-500 blur-sm pointer-events-none" />
            <div className="relative bg-card/40 backdrop-blur-xl border border-white/5 rounded-2xl p-8 md:p-10 text-center shadow-2xl group-hover:border-[var(--brand-blue)]/30 group-hover:shadow-[0_0_40px_rgba(48,84,255,0.15)] transition-all duration-500 bg-gradient-to-br from-white/[0.04] to-transparent overflow-hidden">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-[var(--brand-blue)]/10 blur-[50px] rounded-full pointer-events-none group-hover:bg-[var(--brand-blue)]/20 transition-colors duration-500" />
              <Network className="w-8 h-8 text-[var(--brand-blue)] group-hover:text-white mx-auto mb-4 opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300 relative z-10" strokeWidth={1.5} />
              <h3 className="text-xl font-medium text-white mb-3 tracking-tight relative z-10">Powered by Multimodal AI</h3>
              <p className="text-sm text-white/60 group-hover:text-white/80 transition-colors leading-relaxed max-w-lg mx-auto relative z-10">
                Speech, Vision and Natural Language models collaborate through a neural fusion engine to generate an objective, bias-free interview assessment.
              </p>
            </div>
          </motion.div>
        </div>
      </section>
      
      {/* SECTION 5: RESULTS PREVIEW (See the Intelligence in Action) */}
      <section className="relative z-20">
        <ResultsPreview />
      </section>

      </div>

    </div>
  );
}

