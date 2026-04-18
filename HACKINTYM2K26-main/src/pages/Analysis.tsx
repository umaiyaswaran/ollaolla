import { useState } from "react";
import Header from "@/components/dashboard/Header";
import UploadPanel from "@/components/dashboard/UploadPanel";
import AnalysisResults from "@/components/dashboard/AnalysisResults";
import NetworkGraph3D from "@/components/dashboard/NetworkGraph3D";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft } from "lucide-react";
import { analyzeGitHubRepo, analyzeHttpUrl, analyzeLocalZip } from "@/services/codeAnalyzer";
import { analyzeWithAI, predictDeploymentSuccess } from "@/services/aiAnalyzer";
import type { AnalysisResult } from "@/services/codeAnalyzer";
import type { PredictionResult } from "@/services/aiAnalyzer";

const AnalysisPage = () => {
  const [analysisData, setAnalysisData] = useState<AnalysisResult | null>(null);
  const [aiResults, setAIResults] = useState<PredictionResult | null>(null);
  const [deploymentPrediction, setDeploymentPrediction] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState("");

  const handleAnalyze = async (
    data: string | File,
    type: "github" | "zip" | "http" | "local-file"
  ) => {
    setIsAnalyzing(true);
    setError("");

    try {
      let analysis: AnalysisResult;

      if (type === "github") {
        analysis = await analyzeGitHubRepo(data as string);
      } else if (type === "http") {
        const url = data as string;
        console.log(`Analyzing HTTP URL: ${url}`);
        analysis = await analyzeHttpUrl(url);
      } else if (type === "local-file") {
        console.log("Analyzing local ZIP file");
        analysis = await analyzeLocalZip(data as File);
      } else {
        throw new Error("Unknown analysis type");
      }

      setAnalysisData(analysis);

      // Run AI analysis
      const aiAnalysis = analyzeWithAI(analysis);
      setAIResults(aiAnalysis);

      // Run ML prediction
      const prediction = predictDeploymentSuccess(analysis);
      setDeploymentPrediction(prediction);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Analysis failed";
      console.error("Analysis error:", errorMsg);
      setError(errorMsg);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setAnalysisData(null);
    setAIResults(null);
    setDeploymentPrediction(null);
    setError("");
  };

  return (
    <div className="h-dvh w-full flex flex-col overflow-hidden">
      <Header />

      {!analysisData ? (
        // Upload Phase
        <main className="flex-1 grid grid-cols-12 gap-4 p-4 min-h-0 relative overflow-y-auto">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-bio-cyan/[0.04] rounded-full blur-[120px] pointer-events-none" />

          {/* Left: Instructions */}
          <div className="col-span-4 flex flex-col gap-4 min-h-0">
            <Card className="bg-gradient-to-br from-bio-dark to-bio-darker border-bio-cyan/20 p-6 space-y-4">
              <h2 className="font-mono text-sm font-bold text-bio-cyan uppercase tracking-widest">
                How It Works
              </h2>

              <div className="space-y-4">
                {[
                  {
                    step: "1",
                    title: "Upload Project",
                    desc: "Paste GitHub URL or ZIP link",
                  },
                  {
                    step: "2",
                    title: "Analyze Architecture",
                    desc: "Extract services, databases, dependencies",
                  },
                  {
                    step: "3",
                    title: "Visualize in 3D",
                    desc: "Interactive topology visualization",
                  },
                  {
                    step: "4",
                    title: "AI Recommendations",
                    desc: "Get intelligent scaling & optimization tips",
                  },
                  {
                    step: "5",
                    title: "ML Prediction",
                    desc: "Forecast deployment success & risks",
                  },
                ].map((item) => (
                  <div key={item.step} className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-bio-cyan/20 border border-bio-cyan/50 flex items-center justify-center">
                      <span className="font-mono text-xs font-bold text-bio-cyan">{item.step}</span>
                    </div>
                    <div>
                      <h4 className="font-mono text-xs font-bold text-foreground">{item.title}</h4>
                      <p className="text-[10px] text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Middle: Upload Panel */}
          <div className="col-span-4 flex flex-col gap-4 min-h-0">
            <UploadPanel onAnalyze={handleAnalyze} isAnalyzing={isAnalyzing} />

            {error && (
              <Card className="bg-red-500/10 border-red-500/20 p-4 text-xs text-red-400">
                <p>❌ {error}</p>
              </Card>
            )}

            <Card className="bg-gradient-to-br from-bio-dark to-bio-darker border-bio-cyan/20 p-6 space-y-4">
              <h3 className="font-mono text-xs font-bold text-bio-cyan uppercase tracking-widest">
                ✨ Features
              </h3>

              <ul className="text-[10px] text-muted-foreground space-y-2">
                <li>✓ Detects microservices architecture</li>
                <li>✓ Identifies databases & caches</li>
                <li>✓ Maps API dependencies</li>
                <li>✓ Extracts tech stack info</li>
                <li>✓ Analyzes resource requirements</li>
                <li>✓ AI bottleneck detection</li>
                <li>✓ ML-powered recommendations</li>
                <li>✓ Deployment risk scoring</li>
                <li>✓ Performance predictions</li>
                <li>✓ Cost optimization tips</li>
              </ul>
            </Card>
          </div>

          {/* Right: Demo Visualization */}
          <div className="col-span-4 flex flex-col gap-4 min-h-0">
            <Card className="bg-gradient-to-br from-bio-dark to-bio-darker border-bio-cyan/20 p-6 space-y-4 flex flex-col flex-1">
              <h3 className="font-mono text-xs font-bold text-bio-cyan uppercase tracking-widest">
                Demo 3D View
              </h3>

              <div className="flex-1 relative rounded overflow-hidden border border-bio-cyan/20">
                <NetworkGraph3D />
              </div>

              <p className="text-[10px] text-muted-foreground">
                After analysis, you'll see your actual project topology here with real services,
                databases, and connections visualized in 3D.
              </p>
            </Card>
          </div>
        </main>
      ) : (
        // Analysis Results Phase
        <main className="flex-1 grid grid-cols-12 gap-4 p-4 min-h-0 relative overflow-y-auto">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-bio-cyan/[0.04] rounded-full blur-[120px] pointer-events-none" />

          {/* Left: 3D Visualization */}
          <section className="col-span-6 panel relative overflow-hidden flex flex-col min-h-0">
            <div className="flex items-center justify-between p-4 border-b border-bio-cyan/20">
              <div className="flex items-center gap-2">
                <div className="size-1.5 rounded-full bg-bio-cyan animate-pulse" />
                <span className="font-mono text-[10px] text-bio-cyan uppercase tracking-widest">
                  {analysisData.projectName} - 3D Topology
                </span>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={handleReset}
                className="gap-2 text-xs"
              >
                <ArrowLeft size={12} />
                New Analysis
              </Button>
            </div>

            <div className="flex-1">
              <NetworkGraph3D />
            </div>

            {/* Architecture Summary */}
            <div className="p-4 bg-muted/20 border-t border-bio-cyan/20 space-y-2">
              <h4 className="font-mono text-[10px] font-bold text-bio-cyan uppercase">Architecture</h4>

              <div className="grid grid-cols-3 gap-2 text-[9px]">
                <div>
                  <span className="text-muted-foreground">Services:</span>{" "}
                  <span className="font-bold text-bio-cyan">{analysisData.services.length}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Databases:</span>{" "}
                  <span className="font-bold text-bio-cyan">{analysisData.databases.length}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Complexity:</span>{" "}
                  <span className="font-bold text-bio-cyan uppercase">
                    {analysisData.metrics.complexity}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-1 mt-2">
                {analysisData.frameworks.map((fw) => (
                  <span
                    key={fw}
                    className="px-2 py-1 bg-bio-cyan/10 border border-bio-cyan/30 rounded text-[8px] text-bio-cyan"
                  >
                    {fw}
                  </span>
                ))}
              </div>
            </div>
          </section>

          {/* Right: Analysis Results */}
          <aside className="col-span-6 flex flex-col gap-4 min-h-0 overflow-y-auto">
            {aiResults && deploymentPrediction && (
              <>
                {/* Deployment Prediction Summary */}
                <Card className="bg-gradient-to-br from-bio-dark to-bio-darker border-bio-cyan/20 p-6 space-y-3">
                  <h3 className="font-mono text-xs font-bold text-bio-cyan uppercase tracking-widest">
                    Deployment Prediction
                  </h3>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-muted/30 rounded p-3">
                      <div className="text-[9px] text-muted-foreground uppercase">Success Rate</div>
                      <div
                        className={`text-2xl font-bold mt-1 ${
                          deploymentPrediction.successRate > 75
                            ? "text-green-400"
                            : deploymentPrediction.successRate > 50
                              ? "text-yellow-400"
                              : "text-red-400"
                        }`}
                      >
                        {deploymentPrediction.successRate}%
                      </div>
                    </div>

                    <div className="bg-muted/30 rounded p-3">
                      <div className="text-[9px] text-muted-foreground uppercase">Prediction</div>
                      <div
                        className={`text-lg font-bold mt-1 uppercase ${
                          deploymentPrediction.prediction === "go"
                            ? "text-green-400"
                            : deploymentPrediction.prediction === "caution"
                              ? "text-yellow-400"
                              : "text-red-400"
                        }`}
                      >
                        {deploymentPrediction.prediction}
                      </div>
                    </div>
                  </div>

                  <p className="text-[10px] text-muted-foreground italic">
                    "{deploymentPrediction.reason}"
                  </p>
                </Card>

                {/* Full Analysis Results */}
                <AnalysisResults result={aiResults} projectName={analysisData.projectName} />
              </>
            )}

            {isAnalyzing && (
              <Card className="bg-gradient-to-br from-bio-dark to-bio-darker border-bio-cyan/20 p-6 flex items-center justify-center gap-3">
                <Loader2 size={16} className="animate-spin text-bio-cyan" />
                <span className="font-mono text-xs text-muted-foreground">
                  Analyzing architecture with AI...
                </span>
              </Card>
            )}
          </aside>
        </main>
      )}
    </div>
  );
};

export default AnalysisPage;
