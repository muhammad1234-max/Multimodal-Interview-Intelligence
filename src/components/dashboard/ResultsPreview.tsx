import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { TrendingUp, MessageSquareText, Eye, Mic, ThumbsUp, Lightbulb } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell, ResponsiveContainer } from "recharts";

const previewEmotionData = [
  { name: "😊 Happy", value: 85, color: "#ffffff" },
  { name: "😐 Neutral", value: 12, color: "#3054ff" },
  { name: "😟 Anxious", value: 3, color: "#52525b" },
];

export function ResultsPreview() {
  const container = useRef<HTMLDivElement>(null);
  
  // Parallax tracking
  const { scrollYProgress } = useScroll({
    target: container,
    offset: ["start end", "end start"]
  });
  
  // Subtle parallax: container moves up slightly relative to scroll
  const y = useTransform(scrollYProgress, [0, 1], [80, -80]);

  return (
    <div ref={container} className="relative w-full max-w-6xl mx-auto py-12 md:py-24 px-8 md:px-12 z-20">
      
      <div className="mb-16 text-center flex flex-col items-center">
        <span className="text-sm font-medium text-[#3054ff] uppercase tracking-widest bg-[#3054ff]/10 px-3 py-1 rounded-full border border-[#3054ff]/20">The Output</span>
        <h2 className="mt-6 text-4xl md:text-5xl font-semibold tracking-tighter" style={{ fontFamily: 'var(--font-serif)' }}>
          See the Intelligence in Action.
        </h2>
        <p className="mt-4 text-white/80 max-w-xl text-sm leading-relaxed">
          The moment your interview concludes, our neural engine synthesizes a comprehensive, objective performance dashboard.
        </p>
      </div>

      <motion.div 
        style={{ y }}
        className="relative bg-[#050512]/60 backdrop-blur-md border border-white/10 rounded-[2rem] p-6 md:p-10 shadow-2xl shadow-[#3054ff]/5 overflow-hidden"
      >
        {/* Subtle internal glow */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#3054ff]/10 blur-[100px] rounded-full pointer-events-none -z-10" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-white/[0.02] blur-[100px] rounded-full pointer-events-none -z-10" />

        <div className="grid gap-6 lg:gap-8 lg:grid-cols-12">
          
          {/* LEFT RAIL */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Overall Score Display */}
            <div className="bg-[#0a0a1a]/40 backdrop-blur-md border border-white/5 rounded-2xl p-6 md:p-8 relative overflow-hidden flex flex-col justify-center min-h-[200px] group transition-all duration-300 hover:border-white/10">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-semibold uppercase tracking-widest text-white/80">Overall Score</span>
                <div className="inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold bg-white/10 border-white/20 text-white">
                  <TrendingUp className="h-3.5 w-3.5" /> Excellent
                </div>
              </div>
              
              <div className="flex items-end gap-3 mb-6">
                <div className="text-7xl font-semibold tracking-tighter text-white tabular-nums leading-none">
                  92
                </div>
                <div className="pb-1 text-xl font-medium text-white/90">/ 100</div>
              </div>

              <div className="h-1.5 overflow-hidden rounded-full bg-white/10 mt-auto">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: "92%" }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.5, delay: 0.2, ease: "easeOut" }}
                  className="h-full bg-[#3054ff]"
                />
              </div>
            </div>

            {/* Drill-Downs */}
            <div className="grid gap-6 md:grid-cols-2">
              
              {/* Emotion Analysis */}
              <div className="bg-[#0a0a1a]/40 backdrop-blur-md border border-white/5 rounded-2xl p-6 group transition-all duration-300 hover:border-white/10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-[#3054ff]/10 rounded-lg">
                    <Eye className="h-4 w-4 text-[#3054ff]" />
                  </div>
                  <h4 className="text-base font-medium text-white/90">Emotion Analysis</h4>
                </div>
                
                <div className="h-36">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={previewEmotionData} layout="vertical" margin={{ left: 0, right: 16, top: 0, bottom: 0 }}>
                      <CartesianGrid stroke="rgba(255,255,255,0.05)" horizontal={false} />
                      <XAxis type="number" domain={[0, 100]} tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 10 }} tickFormatter={(v) => `${v}%`} />
                      <YAxis type="category" dataKey="name" tick={{ fill: "rgba(255,255,255,0.8)", fontSize: 11 }} width={80} />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={16}>
                        {previewEmotionData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Speech Metrics */}
              <div className="bg-[#0a0a1a]/40 backdrop-blur-md border border-white/5 rounded-2xl p-6 group transition-all duration-300 hover:border-white/10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-[#3054ff]/10 rounded-lg">
                    <Mic className="h-4 w-4 text-[#3054ff]" />
                  </div>
                  <h4 className="text-base font-medium text-white/90">Speech Intelligence</h4>
                </div>

                <div className="flex flex-col gap-6 mt-2">
                  {[
                    { k: "Speech Rate", v: 85, raw: "4.2 syl/s" },
                    { k: "Pitch Stability", v: 90, raw: "var: 12" }
                  ].map((item, i) => (
                    <div key={item.k} className="flex flex-col gap-1.5">
                      <div className="flex justify-between items-baseline">
                        <span className="text-sm font-medium text-white/80">{item.k}</span>
                        <span className="text-xs font-mono text-white/90">{item.raw}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          whileInView={{ width: `${item.v}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 1, delay: 0.5 + i * 0.1, ease: "easeOut" }}
                          className="h-full bg-[#3054ff]"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Transcript Preview */}
            <div className="bg-[#0a0a1a]/40 backdrop-blur-md border border-white/5 rounded-2xl p-6 relative overflow-hidden group transition-all duration-300 hover:border-white/10">
               <div className="text-xs uppercase tracking-widest text-white/90 font-semibold mb-4 flex items-center gap-2">
                 <MessageSquareText className="h-3 w-3" /> Transcript Snippet
               </div>
               <p className="text-sm leading-relaxed text-white/90 italic relative z-10">
                 "I spearheaded the cloud migration initiative, reducing operational costs by 30% while ensuring zero downtime during the transition. My primary focus was on..."
               </p>
               <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-[#0a0a1a] to-transparent z-10 pointer-events-none" />
            </div>
          </div>

          {/* RIGHT RAIL */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Confidence Gauge */}
            <div className="bg-[#0a0a1a]/40 backdrop-blur-md border border-white/5 rounded-2xl p-6 flex flex-col items-center justify-center text-center group transition-all duration-300 hover:border-white/10">
              <span className="text-xs font-semibold uppercase tracking-widest text-white/80 mb-4 block w-full text-left">Vocal Confidence</span>
              
              <div className="relative grid place-items-center mb-2 mt-2">
                <svg width="120" height="120" className="-rotate-90">
                  <circle cx="60" cy="60" r={50} stroke="rgba(255,255,255,0.05)" strokeWidth="6" fill="none" />
                  <motion.circle
                    cx="60" cy="60" r={50} stroke="#3054ff" strokeWidth="6" fill="none" strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 50}
                    initial={{ strokeDashoffset: 2 * Math.PI * 50 }}
                    whileInView={{ strokeDashoffset: (2 * Math.PI * 50) * (1 - 0.95) }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.5, delay: 0.3, ease: "easeOut" }}
                  />
                </svg>
                <div className="absolute text-center">
                  <div className="text-xl font-bold text-white">High</div>
                  <div className="mt-1 text-[10px] uppercase tracking-widest text-white/90 tabular-nums">95%</div>
                </div>
              </div>
            </div>

            {/* Feedback Summary */}
            <div className="bg-[#0a0a1a]/40 backdrop-blur-md border border-white/5 rounded-2xl p-6 group transition-all duration-300 hover:border-white/10">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-1.5 bg-emerald-500/10 rounded-md">
                  <ThumbsUp className="h-4 w-4 text-emerald-500" />
                </div>
                <h4 className="font-semibold text-white/90 text-sm">Key Strengths</h4>
              </div>
              <ul className="space-y-3 text-sm text-white/85">
                <li className="flex gap-2"><span className="text-emerald-500 shrink-0">›</span>Highly relevant to technical topic.</li>
                <li className="flex gap-2"><span className="text-emerald-500 shrink-0">›</span>Positive and confident delivery.</li>
              </ul>
              
              <div className="mt-8 flex items-center gap-3 mb-4 border-t border-white/5 pt-6">
                <div className="p-1.5 bg-[#3054ff]/10 rounded-md">
                  <Lightbulb className="h-4 w-4 text-[#3054ff]" />
                </div>
                <h4 className="font-semibold text-white/90 text-sm">Actionable Tip</h4>
              </div>
              <p className="text-sm text-white/85 leading-relaxed">
                Pacing was perfect. Try maintaining slightly more eye contact when explaining complex metrics.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
