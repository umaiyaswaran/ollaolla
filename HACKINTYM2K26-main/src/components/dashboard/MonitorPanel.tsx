
import { useState } from "react";
import { useSimStore } from "@/store/simStore";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function MonitorPanel() {
  const monitor = useSimStore((s) => s.monitor);
  const setMonitorUrl = useSimStore((s) => s.setMonitorUrl);
  const checkMonitor = useSimStore((s) => s.checkMonitor);
  const [input, setInput] = useState("https://example.com");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    let url = input.trim();
    if (!/^https?:\/\//i.test(url)) url = "https://" + url;
    setMonitorUrl(url);
  };

  const statusColor =
    monitor?.status === "ok"
      ? "text-bio-green"
      : monitor?.status === "slow"
      ? "text-bio-amber"
      : monitor?.status === "down"
      ? "text-bio-coral"
      : "text-muted-foreground";

  return (
    <div className="panel p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xs uppercase tracking-widest text-muted-foreground">External Monitor</h2>
        <span className="font-mono text-[10px] text-bio-cyan/70">PROBE</span>
      </div>

      <form onSubmit={submit} className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="https://your-site.com"
          className="bg-surface-2 border-white/5 font-mono text-xs"
        />
        <Button type="submit" variant="secondary" className="font-mono text-xs">Track</Button>
      </form>

      {monitor && (
        <div className="flex flex-col gap-3 animate-fade-in">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] text-foreground/80 truncate max-w-[60%]">{monitor.url}</span>
            <span className={`font-mono text-[11px] uppercase ${statusColor}`}>
              {monitor.status === "idle" ? "Probing…" : monitor.status}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-surface-2 rounded-lg p-2.5 border border-white/5">
              <div className="text-[9px] uppercase tracking-widest text-muted-foreground">Latency</div>
              <div className="font-mono text-lg mt-1">
                {monitor.latencyMs ?? "—"}<span className="text-xs text-muted-foreground ml-1">ms</span>
              </div>
            </div>
            <div className="bg-surface-2 rounded-lg p-2.5 border border-white/5">
              <div className="text-[9px] uppercase tracking-widest text-muted-foreground">Status</div>
              <div className="font-mono text-lg mt-1">
                {monitor.httpStatus ?? (monitor.status === "down" ? "ERR" : "—")}
              </div>
            </div>
          </div>
          <Button
            onClick={() => checkMonitor()}
            variant="ghost"
            className="font-mono text-[10px] uppercase tracking-widest text-bio-cyan hover:text-bio-cyan hover:bg-bio-cyan/5"
          >
            Re-probe
          </Button>
        </div>
      )}
    </div>
  );
}
