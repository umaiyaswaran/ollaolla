import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Loader2, Upload, Github, AlertCircle, CheckCircle2, FileUp } from "lucide-react";

interface UploadPanelProps {
  onAnalyze: (data: string | File, type: "github" | "zip" | "http" | "local-file") => Promise<void>;
  isAnalyzing?: boolean;
}

export default function UploadPanel({ onAnalyze, isAnalyzing = false }: UploadPanelProps) {
  const [url, setUrl] = useState("");
  const [uploadType, setUploadType] = useState<"github">("github");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const validateUrl = (input: string) => {
    // Accept GitHub URLs
    if (input.includes("github.com")) {
      const githubRegex = /^https:\/\/github\.com\/[\w-]+\/[\w-]+\/?$/;
      return githubRegex.test(input);
    }
    // Accept any HTTP/HTTPS URL (websites, deployed apps, etc.)
    try {
      const url = new URL(input);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch {
      return false;
    }
  };

  const handleAnalyze = async () => {
    setError("");
    setSuccess(false);

    if (!url.trim()) {
      setError("Please enter a URL");
      return;
    }

    if (!validateUrl(url)) {
      setError(
        "Invalid URL format. Please use: https://github.com/user/repo or https://yourwebsite.com"
      );
      return;
    }

    try {
      // Detect if it's GitHub or regular HTTP
      const type = url.includes("github.com") ? "github" : "http";
      await onAnalyze(url, type);
      setSuccess(true);
      setUrl("");
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Analysis failed";
      console.error("Analysis error:", errorMsg);
      setError(errorMsg || "Failed to analyze URL. Please check the URL is accessible.");
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.name.endsWith(".zip")) {
      setError("Please select a ZIP file");
      return;
    }

    setSelectedFile(file);
    setError("");
    setSuccess(false);

    try {
      await onAnalyze(file, "local-file");
      setSuccess(true);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "File analysis failed");
    }
  };

  return (
    <Card className="bg-gradient-to-br from-bio-dark to-bio-darker border-bio-cyan/20 p-6 space-y-4">
      <div className="space-y-2">
        <h3 className="font-mono text-sm font-bold text-bio-cyan uppercase tracking-widest">
          Infrastructure Analyzer
        </h3>
        <p className="text-xs text-muted-foreground">Upload your project to analyze architecture</p>
      </div>

      {/* Tab: URL vs File */}
      <div className="flex gap-2">
        <Button
          size="sm"
          variant={uploadType === "github" ? "default" : "outline"}
          onClick={() => {
            setUploadType("github");
            setError("");
            setSelectedFile(null);
          }}
          className="flex-1 gap-2"
        >
          <Github size={16} />
          GitHub / URL
        </Button>
        <Button
          size="sm"
          variant={selectedFile ? "default" : "outline"}
          onClick={() => fileInputRef.current?.click()}
          className="flex-1 gap-2"
        >
          <FileUp size={16} />
          Local ZIP
        </Button>
      </div>

      {/* GitHub / URL Input */}
      {!selectedFile && (
        <div className="space-y-2">
          <Input
            placeholder="https://github.com/user/repo OR https://example.com/app"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              setError("");
            }}
            disabled={isAnalyzing}
            className="font-mono text-xs"
          />
          <p className="text-[9px] text-muted-foreground">
            Enter GitHub repo URL or any website URL (will analyze the codebase)
          </p>
        </div>
      )}

      {/* File Input (Hidden) */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".zip"
        onChange={handleFileSelect}
        disabled={isAnalyzing}
        className="hidden"
      />

      {/* Selected File Display */}
      {selectedFile && (
        <div className="p-3 bg-green-500/10 border border-green-500/20 rounded text-xs text-green-400">
          📦 {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="flex gap-2 items-start p-3 bg-red-500/10 border border-red-500/20 rounded text-xs text-red-400">
          <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Success Display */}
      {success && (
        <div className="flex gap-2 items-start p-3 bg-green-500/10 border border-green-500/20 rounded text-xs text-green-400">
          <CheckCircle2 size={14} className="mt-0.5 flex-shrink-0" />
          <span>Analysis started! Building 3D visualization...</span>
        </div>
      )}

      {/* Analyze Button - only show for URL input */}
      {!selectedFile && (
        <Button
          onClick={handleAnalyze}
          disabled={isAnalyzing || !url.trim()}
          className="w-full bg-bio-cyan hover:bg-bio-cyan/90 text-bio-dark font-mono text-xs gap-2"
        >
          {isAnalyzing ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Upload size={14} />
              Analyze URL
            </>
          )}
        </Button>
      )}

      {/* Help Text */}
      <div className="text-[10px] text-muted-foreground space-y-1 p-2 bg-muted/30 rounded">
        <p>✓ GitHub: https://github.com/user/repo</p>
        <p>✓ Websites: https://example.com, https://app.vercel.app</p>
        <p>✓ Any HTTPS/HTTP: Your deployed applications</p>
        <p>✓ Local ZIP: Upload your codebase as .zip</p>
        <p>✓ Generates: 3D topology, ML predictions, recommendations</p>
      </div>
    </Card>
  );
}
