import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, TrendingUp, Zap, AlertTriangle, CheckCircle2 } from "lucide-react";
import type { PredictionResult } from "@/services/aiAnalyzer";

interface AnalysisResultsProps {
  result: PredictionResult;
  projectName?: string;
}

export default function AnalysisResults({ result, projectName = "Project" }: AnalysisResultsProps) {
  const getRiskColor = (risk: number) => {
    if (risk > 70) return "text-red-400";
    if (risk > 40) return "text-yellow-400";
    return "text-green-400";
  };

  const getScoreColor = (score: number) => {
    if (score > 75) return "bg-green-500/20 border-green-500/30 text-green-300";
    if (score > 50) return "bg-yellow-500/20 border-yellow-500/30 text-yellow-300";
    return "bg-red-500/20 border-red-500/30 text-red-300";
  };

  return (
    <div className="space-y-4">
      {/* Main Risk Assessment */}
      <Card className="bg-gradient-to-br from-bio-dark to-bio-darker border-bio-cyan/20 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-mono text-sm font-bold text-bio-cyan uppercase tracking-widest">
            Deployment Risk Analysis
          </h3>
          <div className={`text-2xl font-bold ${getRiskColor(result.deploymentRisk)}`}>
            {result.deploymentRisk}%
          </div>
        </div>

        <div className="w-full bg-muted rounded-full h-2">
          <div
            className={`h-full rounded-full transition-all ${
              result.deploymentRisk > 70
                ? "bg-red-500"
                : result.deploymentRisk > 40
                  ? "bg-yellow-500"
                  : "bg-green-500"
            }`}
            style={{ width: `${result.deploymentRisk}%` }}
          />
        </div>

        <p className="text-xs text-muted-foreground">
          {result.deploymentRisk > 70
            ? "⚠️ High risk - Address critical bottlenecks before deployment"
            : result.deploymentRisk > 40
              ? "⚡ Medium risk - Improvements recommended for smooth deployment"
              : "✅ Low risk - Architecture is ready for deployment"}
        </p>
      </Card>

      {/* ML Scores */}
      <Card className="bg-gradient-to-br from-bio-dark to-bio-darker border-bio-cyan/20 p-6 space-y-4">
        <h3 className="font-mono text-xs font-bold text-bio-cyan uppercase tracking-widest">
          Infrastructure Health Scores
        </h3>

        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Reliability", value: result.mlScore.reliability },
            { label: "Stability", value: result.mlScore.stability },
            { label: "Scalability", value: result.mlScore.scalability },
            { label: "Performance", value: result.mlScore.performance },
          ].map((score) => (
            <div
              key={score.label}
              className={`p-3 rounded border ${getScoreColor(score.value)}`}
            >
              <div className="text-[10px] font-mono uppercase tracking-widest opacity-70">
                {score.label}
              </div>
              <div className="text-lg font-bold mt-1">{score.value}</div>
              <div className="w-full bg-black/30 rounded-full h-1 mt-2">
                <div
                  className="h-full rounded-full bg-current"
                  style={{ width: `${score.value}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Performance Metrics */}
      <Card className="bg-gradient-to-br from-bio-dark to-bio-darker border-bio-cyan/20 p-6 space-y-4">
        <h3 className="font-mono text-xs font-bold text-bio-cyan uppercase tracking-widest">
          Performance Predictions
        </h3>

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-muted/30 rounded p-3 border border-muted">
            <div className="text-[9px] text-muted-foreground uppercase tracking-widest">
              ⏱️ Latency
            </div>
            <div className="text-2xl font-bold text-bio-cyan mt-2">
              {result.estimatedLatency}ms
            </div>
          </div>

          <div className="bg-muted/30 rounded p-3 border border-muted">
            <div className="text-[9px] text-muted-foreground uppercase tracking-widest">
              📊 Load Capacity
            </div>
            <div className="text-2xl font-bold text-bio-cyan mt-2">
              {result.estimatedLoad.toLocaleString()}
            </div>
            <div className="text-[9px] text-muted-foreground">req/sec</div>
          </div>

          <div className="bg-muted/30 rounded p-3 border border-muted">
            <div className="text-[9px] text-muted-foreground uppercase tracking-widest">
              ⚙️ Scaling
            </div>
            <div className="text-2xl font-bold text-bio-cyan mt-2">
              {result.scalingNeeded ? "YES" : "NO"}
            </div>
          </div>
        </div>
      </Card>

      {/* Bottlenecks */}
      {result.bottlenecks.length > 0 && (
        <Card className="bg-red-500/10 border-red-500/20 p-6 space-y-4">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-red-400" />
            <h3 className="font-mono text-xs font-bold text-red-400 uppercase tracking-widest">
              Detected Bottlenecks
            </h3>
          </div>

          <div className="space-y-2">
            {result.bottlenecks.map((bottleneck, idx) => (
              <div
                key={idx}
                className="flex gap-2 items-start p-3 bg-red-500/5 border border-red-500/10 rounded text-xs text-red-300"
              >
                <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                <span>{bottleneck}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* AI Recommendations */}
      {result.recommendations.length > 0 && (
        <Card className="bg-gradient-to-br from-bio-dark to-bio-darker border-bio-cyan/20 p-6 space-y-4">
          <h3 className="font-mono text-xs font-bold text-bio-cyan uppercase tracking-widest">
            🤖 AI-Generated Recommendations
          </h3>

          <div className="space-y-3">
            {result.recommendations.map((rec, idx) => (
              <div
                key={idx}
                className="p-4 bg-muted/20 border border-muted rounded space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-mono text-xs font-bold text-bio-cyan">{rec.title}</h4>
                    <p className="text-[10px] text-muted-foreground mt-1">{rec.description}</p>
                  </div>
                  <Badge
                    variant={
                      rec.priority === "critical"
                        ? "destructive"
                        : rec.priority === "high"
                          ? "default"
                          : rec.priority === "medium"
                            ? "secondary"
                            : "outline"
                    }
                    className="flex-shrink-0 text-[9px]"
                  >
                    {rec.priority}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div className="flex gap-2 items-start">
                    <Zap size={12} className="text-yellow-400 mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">{rec.impact}</span>
                  </div>
                  <div className="flex gap-2 items-start">
                    <TrendingUp size={12} className="text-green-400 mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">{rec.estimatedBenefit}</span>
                  </div>
                </div>

                <div className="p-2 bg-bio-dark/50 rounded border border-bio-cyan/10 text-[9px] text-muted-foreground font-mono">
                  → {rec.action}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Summary */}
      <Card className="bg-gradient-to-br from-bio-cyan/10 to-bio-cyan/5 border-bio-cyan/30 p-6">
        <div className="flex items-start gap-3">
          <CheckCircle2 size={16} className="text-bio-cyan mt-1" />
          <div className="space-y-1">
            <h4 className="font-mono text-xs font-bold text-bio-cyan uppercase tracking-widest">
              Next Steps
            </h4>
            <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Address the {result.bottlenecks.length} critical bottleneck(s)</li>
              <li>Implement top {Math.min(3, result.recommendations.length)} AI recommendations</li>
              <li>Run deployment in staging environment</li>
              <li>Monitor latency, memory, and CPU during ramp-up</li>
            </ol>
          </div>
        </div>
      </Card>
    </div>
  );
}
