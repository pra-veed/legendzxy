import { useState } from "react";
import { motion } from "motion/react";
import {
  Key,
  Copy,
  Check,
  Code,
  Terminal,
  Zap,
  Sparkles,
  Globe,
  Database,
  Send,
  Layers,
  ShieldCheck,
  RefreshCw,
  Server,
  Download,
  BookOpen
} from "lucide-react";

interface FreeApiViewProps {
  onTriggerAlert?: (title: string, message: string) => void;
}

export default function FreeApiView({ onTriggerAlert }: FreeApiViewProps) {
  const [developerName, setDeveloperName] = useState("");
  const [developerEmail, setDeveloperEmail] = useState("");
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [keyDetails, setKeyDetails] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  // Playground State
  const [playgroundEndpoint, setPlaygroundEndpoint] = useState("/api/v1/extract?url=https://www.youtube.com/watch?v=dQw4w9WgXcQ");
  const [playgroundMethod, setPlaygroundMethod] = useState<"GET" | "POST">("GET");
  const [playgroundLang, setPlaygroundLang] = useState<"curl" | "javascript" | "python" | "go">("curl");
  const [playgroundResponse, setPlaygroundResponse] = useState<string | null>(null);
  const [isPlayinggroundLoading, setIsPlaygroundLoading] = useState(false);

  const handleGenerateFreeKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);

    try {
      const res = await fetch("/api/v1/keys/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: developerName || "Developer Operator",
          email: developerEmail || "developer@extractile.io"
        })
      });

      const data = await res.json();
      if (res.ok && data.apiKey) {
        setGeneratedKey(data.apiKey);
        setKeyDetails(data);
        if (onTriggerAlert) {
          onTriggerAlert(
            "Free API Key Generated!",
            "Your $0.00 Free Developer API Key is ready. Use this token for REST requests."
          );
        }
      } else {
        throw new Error(data.error || "Failed to generate key.");
      }
    } catch (err: any) {
      if (onTriggerAlert) {
        onTriggerAlert("Key Generation Error", err.message || "Failed to generate free key.");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyKey = () => {
    if (!generatedKey) return;
    navigator.clipboard.writeText(generatedKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
    if (onTriggerAlert) {
      onTriggerAlert("Copied to Clipboard", "API Key copied successfully!");
    }
  };

  const handleRunPlaygroundRequest = async () => {
    setIsPlaygroundLoading(true);
    setPlaygroundResponse(null);

    try {
      const headers: Record<string, string> = {};
      if (generatedKey) {
        headers["x-api-key"] = generatedKey;
      }

      let res: Response;
      if (playgroundMethod === "GET") {
        res = await fetch(playgroundEndpoint, { headers });
      } else {
        headers["Content-Type"] = "application/json";
        res = await fetch("/api/ai/chat", {
          method: "POST",
          headers,
          body: JSON.stringify({
            messages: [{ role: "user", text: "Hello from Extractile Free API Playground!" }],
            modelType: "general"
          })
        });
      }

      const data = await res.json();
      setPlaygroundResponse(JSON.stringify(data, null, 2));
    } catch (err: any) {
      setPlaygroundResponse(JSON.stringify({ error: err.message || "API Request Failed" }, null, 2));
    } finally {
      setIsPlaygroundLoading(false);
    }
  };

  const getCodeSnippet = () => {
    const keyToUse = generatedKey || "ext_free_live_8f3a92b1c4e7";
    const origin = typeof window !== "undefined" ? window.location.origin : "https://extractile.io";

    if (playgroundLang === "curl") {
      return `curl -X ${playgroundMethod} "${origin}${playgroundEndpoint}" \\
  -H "x-api-key: ${keyToUse}" \\
  -H "Content-Type: application/json"`;
    }

    if (playgroundLang === "javascript") {
      return `// JavaScript / Node.js Fetch Example
const response = await fetch("${origin}${playgroundEndpoint}", {
  method: "${playgroundMethod}",
  headers: {
    "x-api-key": "${keyToUse}",
    "Content-Type": "application/json"
  }
});

const data = await response.json();
console.log("Extractile Stream Data:", data);`;
    }

    if (playgroundLang === "python") {
      return `# Python Requests Example
import requests

url = "${origin}${playgroundEndpoint}"
headers = {
    "x-api-key": "${keyToUse}",
    "Content-Type": "application/json"
}

response = requests.request("${playgroundMethod}", url, headers=headers)
print("Extractile Response:", response.json())`;
    }

    if (playgroundLang === "go") {
      return `// Go HTTP Request Example
package main

import (
    "fmt"
    "io/ioutil"
    "net/http"
)

func main() {
    client := &http.Client{}
    req, _ := http.NewRequest("${playgroundMethod}", "${origin}${playgroundEndpoint}", nil)
    req.Header.Set("x-api-key", "${keyToUse}")
    
    resp, err := client.Do(req)
    if err != nil {
        fmt.Println("Error:", err)
        return
    }
    defer resp.Body.Close()
    
    body, _ := ioutil.ReadAll(resp.Body)
    fmt.Println(string(body))
}`;
    }

    return "";
  };

  return (
    <div className="flex flex-col w-full max-w-7xl mx-auto space-y-6">
      
      {/* Top Hero Banner */}
      <div className="bg-surface border border-outline-variant p-6 rounded-none relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm">
        <div className="absolute -top-12 -right-12 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-mono text-xs uppercase tracking-widest font-bold">
            <Zap className="w-4 h-4 fill-emerald-500 text-emerald-500" />
            <span>100% FREE DEVELOPER API & PORTAL</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-primary">
            Extractile Free API & SDK Hub
          </h1>
          <p className="text-xs md:text-sm text-on-surface-variant leading-relaxed">
            Instant $0.00 developer API access. Programmatically extract media streams, generate Gemini AI scripts, synthesize Lyria music, create Veo videos, and retrieve high-fidelity metadata.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase font-bold">
          <span className="px-3 py-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>NO CREDIT CARD REQUIRED</span>
          </span>
          <span className="px-3 py-1.5 bg-primary/10 text-primary border border-primary/20 flex items-center gap-1.5">
            <Server className="w-3.5 h-3.5" />
            <span>10,000 REQ / DAY</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Col: Instant Key Generator */}
        <div className="bg-surface border border-outline-variant p-6 space-y-4 shadow-sm">
          <h3 className="font-serif font-bold text-lg text-primary flex items-center gap-2">
            <Key className="w-5 h-5 text-secondary" />
            <span>Generate Free API Key</span>
          </h3>
          <p className="text-xs text-on-surface-variant font-sans">
            Get your instant developer credential key. No registration barriers or payment needed.
          </p>

          <form onSubmit={handleGenerateFreeKey} className="space-y-3 font-mono text-xs">
            <div>
              <label className="block uppercase font-bold text-on-surface-variant mb-1">
                Developer / App Name
              </label>
              <input
                type="text"
                value={developerName}
                onChange={(e) => setDeveloperName(e.target.value)}
                placeholder="e.g. My Media App"
                className="w-full p-2.5 bg-background border border-outline-variant text-on-surface focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block uppercase font-bold text-on-surface-variant mb-1">
                Contact Email
              </label>
              <input
                type="email"
                value={developerEmail}
                onChange={(e) => setDeveloperEmail(e.target.value)}
                placeholder="dev@example.com"
                className="w-full p-2.5 bg-background border border-outline-variant text-on-surface focus:outline-none focus:border-primary"
              />
            </div>

            <button
              type="submit"
              disabled={isGenerating}
              className="w-full py-3 bg-primary text-on-primary font-mono text-xs uppercase font-bold tracking-widest hover:bg-secondary cursor-pointer transition-all flex items-center justify-center gap-2"
            >
              {isGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              <span>{generatedKey ? "REGENERATE FREE KEY" : "GENERATE FREE API KEY NOW"}</span>
            </button>
          </form>

          {/* Key Output Box */}
          {generatedKey && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-emerald-500/10 border border-emerald-500/30 space-y-3 font-mono text-xs"
            >
              <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-300 font-bold uppercase">
                <span className="flex items-center gap-1">
                  <Check className="w-4 h-4" />
                  <span>FREE KEY ACTIVE</span>
                </span>
                <span className="text-[10px] bg-emerald-500/20 px-2 py-0.5">TIER: FREE</span>
              </div>

              <div className="p-2.5 bg-background border border-outline-variant flex items-center justify-between gap-2">
                <code className="text-primary font-bold truncate text-[11px]">{generatedKey}</code>
                <button
                  onClick={handleCopyKey}
                  className="p-1.5 bg-primary text-on-primary hover:bg-secondary cursor-pointer transition-all flex items-center gap-1 text-[10px] uppercase font-bold"
                  title="Copy Key"
                >
                  {copiedKey ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey ? "COPIED" : "COPY"}</span>
                </button>
              </div>

              {keyDetails && (
                <div className="text-[10px] space-y-1 text-on-surface-variant">
                  <p>• Rate Limit: <strong className="text-primary">{keyDetails.rateLimit}</strong></p>
                  <p>• Monthly Cost: <strong className="text-emerald-600 dark:text-emerald-400">{keyDetails.monthlyCost}</strong></p>
                  <p>• Status: <strong className="text-emerald-600 dark:text-emerald-400">UNLIMITED DEVELOPER TIERS</strong></p>
                </div>
              )}
            </motion.div>
          )}

          <div className="pt-2 border-t border-outline-variant space-y-2 text-xs font-mono text-on-surface-variant">
            <h4 className="font-bold text-primary uppercase text-[11px] flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Free Endpoints Available</span>
            </h4>
            <ul className="space-y-1 text-[10px]">
              <li className="flex items-center justify-between p-1.5 bg-background border border-outline-variant">
                <span>GET /api/v1/extract</span>
                <span className="text-emerald-600 font-bold">$0.00</span>
              </li>
              <li className="flex items-center justify-between p-1.5 bg-background border border-outline-variant">
                <span>POST /api/ai/chat</span>
                <span className="text-emerald-600 font-bold">$0.00</span>
              </li>
              <li className="flex items-center justify-between p-1.5 bg-background border border-outline-variant">
                <span>POST /api/ai/generate-image</span>
                <span className="text-emerald-600 font-bold">$0.00</span>
              </li>
              <li className="flex items-center justify-between p-1.5 bg-background border border-outline-variant">
                <span>POST /api/ai/generate-music</span>
                <span className="text-emerald-600 font-bold">$0.00</span>
              </li>
              <li className="flex items-center justify-between p-1.5 bg-background border border-outline-variant">
                <span>POST /api/ai/generate-video</span>
                <span className="text-emerald-600 font-bold">$0.00</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Middle & Right: Code Snippet & Interactive Playground */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Playground Selector Bar */}
          <div className="bg-surface border border-outline-variant p-4 space-y-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-primary" />
                <span className="font-bold text-primary uppercase">API Playground & SDK Preview</span>
              </div>

              {/* Language Switcher */}
              <div className="flex items-center gap-1">
                {(["curl", "javascript", "python", "go"] as const).map(lang => (
                  <button
                    key={lang}
                    onClick={() => setPlaygroundLang(lang)}
                    className={`px-2.5 py-1 text-[10px] uppercase font-bold tracking-wider cursor-pointer border transition-all ${
                      playgroundLang === lang
                        ? "bg-primary text-on-primary border-primary"
                        : "bg-background text-on-surface border-outline-variant hover:border-primary/50"
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>

            {/* Endpoint Selector Controls */}
            <div className="flex flex-col sm:flex-row items-stretch gap-2 font-mono text-xs">
              <select
                value={playgroundMethod}
                onChange={(e: any) => setPlaygroundMethod(e.target.value)}
                className="p-2.5 bg-background border border-outline-variant text-primary font-bold focus:outline-none"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
              </select>

              <input
                type="text"
                value={playgroundEndpoint}
                onChange={(e) => setPlaygroundEndpoint(e.target.value)}
                className="flex-grow p-2.5 bg-background border border-outline-variant text-on-surface focus:outline-none focus:border-primary"
              />

              <button
                onClick={handleRunPlaygroundRequest}
                disabled={isPlayinggroundLoading}
                className="px-6 py-2.5 bg-emerald-600 text-white hover:bg-emerald-700 font-mono text-xs uppercase font-bold tracking-wider cursor-pointer transition-all flex items-center justify-center gap-2"
              >
                {isPlayinggroundLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span>TEST FREE REQUEST</span>
              </button>
            </div>

            {/* Code Snippet Box */}
            <div className="relative bg-neutral-900 text-neutral-100 p-4 border border-outline-variant font-mono text-xs space-y-2 overflow-x-auto">
              <div className="flex items-center justify-between text-[10px] text-neutral-400 uppercase font-bold border-b border-neutral-800 pb-2">
                <span>Code Example ({playgroundLang})</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(getCodeSnippet());
                    if (onTriggerAlert) onTriggerAlert("Copied Code", "Code snippet copied to clipboard!");
                  }}
                  className="flex items-center gap-1 hover:text-white cursor-pointer"
                >
                  <Copy className="w-3 h-3" />
                  <span>Copy Code</span>
                </button>
              </div>
              <pre className="text-emerald-400 leading-relaxed whitespace-pre">{getCodeSnippet()}</pre>
            </div>

            {/* Live Response Output */}
            {playgroundResponse && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-neutral-900 border border-emerald-500/40 p-4 font-mono text-xs space-y-2"
              >
                <div className="flex items-center justify-between text-[10px] text-emerald-400 uppercase font-bold border-b border-neutral-800 pb-2">
                  <span className="flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    <span>Live HTTP 200 OK Response</span>
                  </span>
                  <span>Payload Size: {playgroundResponse.length} Bytes</span>
                </div>
                <pre className="text-neutral-200 text-[11px] leading-relaxed max-h-64 overflow-y-auto whitespace-pre-wrap">
                  {playgroundResponse}
                </pre>
              </motion.div>
            )}
          </div>

          {/* Features Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-sans text-xs">
            <div className="p-4 bg-surface border border-outline-variant space-y-2">
              <div className="flex items-center gap-2 text-primary font-bold">
                <Globe className="w-4 h-4 text-secondary" />
                <span>Zero Latency Edge Proxies</span>
              </div>
              <p className="text-on-surface-variant text-[11px] leading-relaxed">
                Free requests are routed through Fastly & Cloudflare edge networks for minimal network delay and instant response times worldwide.
              </p>
            </div>

            <div className="p-4 bg-surface border border-outline-variant space-y-2">
              <div className="flex items-center gap-2 text-primary font-bold">
                <Database className="w-4 h-4 text-emerald-500" />
                <span>No Throttle & No Credit Card</span>
              </div>
              <p className="text-on-surface-variant text-[11px] leading-relaxed">
                Developers get 10,000 requests per day for free. Seamlessly integrate stream extraction and Gemini AI into your software.
              </p>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
