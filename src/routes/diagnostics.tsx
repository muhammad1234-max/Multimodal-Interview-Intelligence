import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Terminal, Database, Server, Cpu, Brain, Loader2, HardDrive, Network, Clock } from "lucide-react";
import { apiGet } from "@/lib/api-client";
import { Particles } from "@/components/ui/Particles";

export const Route = createFileRoute("/diagnostics")({
  head: () => ({ meta: [{ title: "Developer Diagnostics — AI Interview Evaluator" }] }),
  component: DiagnosticsPage,
});

function DiagnosticsPage() {
  const { data: modelsHealth, isLoading: modelsLoading } = useQuery({
    queryKey: ["health-models"],
    queryFn: () => apiGet<any>("/api/health/models"),
    refetchInterval: 10000, // Poll every 10s
  });

  const { data: dbHealth, isLoading: dbLoading } = useQuery({
    queryKey: ["health-database"],
    queryFn: () => apiGet<any>("/api/health/database"),
    refetchInterval: 10000,
  });

  return (
    <div className="relative min-h-screen text-foreground px-6 py-24 md:py-32 font-mono">
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none opacity-20">
        <Particles />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto space-y-8">
        <div className="flex items-center gap-4 mb-12">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
            <Terminal className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Developer Diagnostics</h1>
            <p className="text-sm text-white/50 mt-1">Operational observability and telemetry</p>
          </div>
        </div>

        {/* DATABASE HEALTH */}
        <section className="bg-black/40 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
          <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-4">
            <Database className="w-5 h-5 text-[var(--brand-blue)]" />
            <h2 className="text-lg font-semibold text-white/90">MongoDB Telemetry</h2>
          </div>
          {dbLoading ? (
            <div className="flex items-center gap-3 text-white/50"><Loader2 className="w-4 h-4 animate-spin" /> Pinging cluster...</div>
          ) : dbHealth ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                <span className="text-xs text-white/40 block mb-1">Status</span>
                <div className={`text-base font-semibold ${dbHealth.status === "Healthy" ? "text-green-400" : "text-red-400"}`}>{dbHealth.status}</div>
              </div>
              <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                <span className="text-xs text-white/40 block mb-1">Latency</span>
                <div className="flex items-end gap-2">
                  <span className="text-xl font-semibold text-white">{dbHealth.latency_ms ?? "--"}</span>
                  <span className="text-xs text-white/50 mb-1">ms</span>
                </div>
              </div>
              <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                <span className="text-xs text-white/40 block mb-1">Error</span>
                <div className="text-sm text-white/70 truncate">{dbHealth.error || "None"}</div>
              </div>
            </div>
          ) : (
             <div className="text-red-400">Failed to fetch database health</div>
          )}
        </section>

        {/* AI MODELS STATUS */}
        <section className="bg-black/40 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
          <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-4">
            <Brain className="w-5 h-5 text-orange-400" />
            <h2 className="text-lg font-semibold text-white/90">PyTorch Singletons</h2>
            {modelsHealth?.device && (
              <span className="ml-auto px-3 py-1 bg-white/5 rounded-full text-xs text-white/60 font-mono border border-white/10 flex items-center gap-2">
                <Cpu className="w-3.5 h-3.5" /> Runtime: {modelsHealth.device.toUpperCase()}
              </span>
            )}
          </div>
          
          {modelsLoading ? (
            <div className="flex items-center gap-3 text-white/50"><Loader2 className="w-4 h-4 animate-spin" /> Querying memory states...</div>
          ) : modelsHealth ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {['nlp_processor', 'vision_processor', 'confidence_predictor', 'fusion_scorer'].map((modelName) => {
                const info = modelsHealth[modelName];
                if (!info) return null;
                const isWarm = info.status === "Warm";
                return (
                  <div key={modelName} className="flex items-center justify-between bg-white/5 p-4 rounded-xl border border-white/5">
                    <div className="flex flex-col gap-1">
                      <span className="text-sm text-white/90 font-semibold">{modelName}</span>
                      <span className="text-xs text-white/40">Weights Loaded: {info.weights_loaded ? "Yes" : "No"}</span>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-semibold border ${isWarm ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-white/5 text-white/40 border-white/10"}`}>
                      {info.status}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-red-400">Failed to fetch model diagnostics</div>
          )}
        </section>

      </div>
    </div>
  );
}
