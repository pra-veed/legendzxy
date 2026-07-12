import { useState, useRef, useEffect, FormEvent } from "react";
import { 
  Send, 
  X, 
  Terminal, 
  HelpCircle, 
  Sparkles, 
  History, 
  Trash2, 
  RotateCw, 
  Copy, 
  Check, 
  ThumbsUp, 
  ThumbsDown, 
  Bot, 
  Code, 
  Cpu, 
  MessageSquare, 
  Zap, 
  Activity, 
  Info 
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ChatMessage } from "../types";

interface LiveChatProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Suggestion {
  id: string;
  keywords: string[];
  question: string;
  answer: string;
}

const suggestionsData: Suggestion[] = [
  {
    id: "formats",
    keywords: ["formats", "codecs", "quality", "resolution", "mp3", "mp4", "flac", "aac", "download", "format", "audio"],
    question: "What quality formats and codecs are supported?",
    answer: "We support direct extraction to high-bitrate **MP4 container bundles** (up to 1080p Premium Scaled), raw **MP3**, **AAC**, and master-quality **FLAC** (320kbps preservation), along with HD original artwork captures."
  },
  {
    id: "failed",
    keywords: ["error", "fail", "failed", "bug", "stuck", "core id", "corrupted", "problem", "triage", "broken"],
    question: "How do I fix a failed extraction?",
    answer: "In the rare event that a stream block fails to unpack: \n- Record the unique **Core ID** shown on the features dashboard \n- Paste it here in the triage chat \n- Our operator pool will manually re-route the node trace instantly."
  },
  {
    id: "bulk",
    keywords: ["bulk", "queue", "multiple urls", "multi", "many", "at once", "batch", "multiple", "urls", "links"],
    question: "How can I extract multiple URLs at once?",
    answer: "You can switch to the **'Bulk Queue'** tab under the **Extractor** screen. Paste multiple video stream links (one per line) and hit **'Start Bulk Extraction'** to process them in parallel."
  },
  {
    id: "history",
    keywords: ["history", "save", "saved", "localstorage", "restore", "past", "vault", "local"],
    question: "How do I access past downloads?",
    answer: "We preserve your processed stream records locally inside your browser's `localStorage`. You can access them anytime in the **'History'** tab to restore items to the active workspace, purge logs, or download reports."
  }
];

const getModelSpecificAnswer = (id: string, model: "gemini" | "claude" | "gpt"): string => {
  if (id === "formats") {
    if (model === "gemini") {
      return "Hi there! Gemini Triage Core here. 😊 We'd love to help you with formats! Here is how our high-fidelity extraction system handles containers:\n\n* **Video Ensembles:** Direct unpacking into gorgeous, high-bitrate **MP4 containers** supporting smooth resolutions up to 1080p Premium Scaled.\n* **Audio Streams:** Native extraction to raw **MP3**, **AAC**, and lossless master-quality **FLAC** (at 320kbps preservation standard).\n* **Visual Assets:** Perfect capture of high-definition original video thumbnails and artwork in standard **JPEG** format.\n\nLet me know if you need help with any specific codec!";
    }
    if (model === "claude") {
      return "### Stream Extraction Formats & Codec Support\n\nAn analytical breakdown of the Extractile extraction layer demonstrates comprehensive format compatibility:\n\n1. **Video Containers:** We utilize standard `MP4` stream wrappers, supporting frame delivery up to `1080p` Premium Scaled.\n2. **Audio Transcoding:** Supports high-bitrate conversions to `MP3` and `AAC`, alongside high-fidelity archive preservation in `FLAC` format at `320kbps` limit.\n3. **Metadata & Imagery:** Direct extraction of high-resolution video thumbnail assets in raw `JPEG` representation.\n\nPlease specify if your pipeline requires a particular container multiplexing pattern.";
    }
    return "🚀 **Instant Format & Codec Guide!** Let's get your media in the perfect format! 🛠️\n\nHere is exactly what Extractile supports:\n\n1. **HD Video:** Direct-to-consumer **MP4 container bundles** (up to 1080p Premium Scaled for maximum clarity). 📺\n2. **Audio Extraction:** High-bitrate **MP3** & **AAC** transcoding, plus master-quality lossless **FLAC** (320kbps) 🎵.\n3. **Artwork:** High-definition original stream cover art captures in **JPEG**! 🖼️\n\nSelect your format on the dashboard and extract away!";
  }

  if (id === "failed") {
    if (model === "gemini") {
      return "Oh no, I'm so sorry to hear that your extraction didn't go through! Let's get this resolved for you right away. Here is our polite recovery checklist:\n\n* **Locate the Core ID:** Look at your features dashboard and find the unique **Core ID** of the stream block.\n* **Share it Here:** Simply paste that ID right here in our Gemini chat.\n* **Manual Routing:** Our operator pool will manually re-route and unpack your node trace immediately!\n\nYou're in good hands!";
    }
    if (model === "claude") {
      return "### Diagnostic Analysis: Failed Node Extraction\n\nIn the event of an anomalous unpacking failure within the stream block, follow this trace recovery sequence:\n\n1. **Extract Core ID:** Identify the unique hexadecimal `Core ID` designated on the active features dashboard.\n2. **Submit to Triage:** Input the `Core ID` into this console thread to invoke manual review.\n3. **Manual Trace Re-route:** This action notifies the operational node pool to run a manual unpacking sequence, bypass blockages, and deliver your stream.\n\nLet me know if you have the core identifier ready.";
    }
    return "🚨 **Oops! Extraction Failed? Let's fix it right now!** 🛠️\n\nFollow these 3 simple steps to get back on track instantly:\n\n1. **Grab the Core ID:** Copy the unique **Core ID** from your features dashboard. 📋\n2. **Paste it Here:** Paste that ID directly into this ChatGPT triage chat. 💬\n3. **Instant Re-route:** Our backup operator pool will manually re-route the node trace and repair the extraction immediately! 📡";
  }

  if (id === "bulk") {
    if (model === "gemini") {
      return "Yes, absolutely! Extractile makes it incredibly easy to extract multiple links at once. Let's do a bulk download:\n\n* **Switch Tab:** Head over to the **Extractor** screen and select the **'Bulk Queue'** tab.\n* **Paste Links:** Paste all your video stream URLs there, with one link per line.\n* **Execute:** Click **'Start Bulk Extraction'** to begin downloading them simultaneously in parallel.\n\nLet me know how the bulk queue goes for you!";
    }
    if (model === "claude") {
      return "### Multi-Stream Extraction Protocol\n\nTo execute concurrent extractions in bulk, use the native parallel pipeline:\n\n1. **Navigation:** Access the **Extractor** interface.\n2. **Configuration:** Select the **'Bulk Queue'** viewport tab.\n3. **Payload Entry:** Input target URLs sequentially, separating each address with a new line.\n4. **Execution:** Trigger the `Start Bulk Extraction` button to spawn parallel worker threads.\n\nThis distributes network load optimally across our system.";
    }
    return "⚡ **Bulk Downloading is fully supported! Double your efficiency!** 🚀\n\nHere's how to queue up multiple links in seconds:\n\n1. **Go to Extractor:** Open the main Extractor panel. 🎛️\n2. **Click 'Bulk Queue':** Select the Bulk Queue tab. 📂\n3. **Paste & Launch:** Paste your list of URLs (one per line) and hit **'Start Bulk Extraction'** to download them in parallel! 🌪️\n\nBoom! You're done!";
  }

  if (id === "history") {
    if (model === "gemini") {
      return "That is a great question! Your hard work is always safe. We preserve all past download records securely using your browser's local sandbox:\n\n* **Local Preservation:** All historic video blocks and reports are cached inside your device's `localStorage` vault.\n* **Access Tab:** Simply switch to the **'History'** tab to view your complete log.\n* **Control Board:** From there, you can restore items to your active workspace, purge old logs, or download reports.\n\nLet me know if you need anything else!";
    }
    if (model === "claude") {
      return "### Local Storage & Session Persistence\n\nThe workspace employs secure, sandboxed client-side state preservation:\n\n1. **State Store:** Persistent history is written directly to the browser's `localStorage` subsystem.\n2. **Restoration:** Access the **'History'** workspace tab to inspect historical index arrays.\n3. **Commands:** You can dynamically restore blocks back to the active workspace, perform secure garbage collection (purge logs), or write CSV audit reports.";
    }
    return "💾 **Never lose your files! Your history is fully secured!** 🔒\n\nHere is how we keep your downloads safe and accessible:\n\n1. **Local Sandbox:** All of your past stream extractions are cached directly in your browser's **localStorage**! 🌐\n2. **Find Past Downloads:** Head over to the **'History'** tab to view your complete library. 📁\n3. **Take Action:** Instantly restore any past file to your active workspace, wipe the cache, or export clean reports! 📊";
  }

  return "I am processing your inquiry uniquely.";
};

// Helper to render basic markdown structures to clean, styled JSX
function renderFormattedText(text: string) {
  const lines = text.split("\n");
  return lines.map((line, lineIdx) => {
    // Check if it's a list item
    const listMatch = line.match(/^[-*]\s+(.*)$/);
    let content = line;
    let isListItem = false;
    if (listMatch) {
      content = listMatch[1];
      isListItem = true;
    }

    // Parse bold (**text**) & inline code (`code`)
    const parts = [];
    let currentText = content;
    const regex = /(\*\*.*?\*\*|`.*?`)/g;
    let match;
    let lastIndex = 0;

    while ((match = regex.exec(currentText)) !== null) {
      const matchIndex = match.index;
      const matchText = match[0];

      // Add preceding plain text
      if (matchIndex > lastIndex) {
        parts.push({ type: "text", content: currentText.slice(lastIndex, matchIndex) });
      }

      if (matchText.startsWith("**") && matchText.endsWith("**")) {
        parts.push({ type: "bold", content: matchText.slice(2, -2) });
      } else if (matchText.startsWith("`") && matchText.endsWith("`")) {
        parts.push({ type: "code", content: matchText.slice(1, -1) });
      }

      lastIndex = regex.lastIndex;
    }

    if (lastIndex < currentText.length) {
      parts.push({ type: "text", content: currentText.slice(lastIndex) });
    }

    const renderedParts = parts.length > 0 ? parts.map((part, pIdx) => {
      if (part.type === "bold") {
        return <strong key={pIdx} className="font-sans font-extrabold text-primary">{part.content}</strong>;
      }
      if (part.type === "code") {
        return <code key={pIdx} className="px-1.5 py-0.5 bg-[#cbd6e2] text-secondary font-mono text-[10px] rounded-none border border-primary/20">{part.content}</code>;
      }
      return <span key={pIdx}>{part.content}</span>;
    }) : [content];

    if (isListItem) {
      return (
        <li key={lineIdx} className="ml-4 list-disc pl-1 py-0.5 text-xs text-on-surface leading-relaxed">
          {renderedParts}
        </li>
      );
    }

    return (
      <p key={lineIdx} className="text-xs text-on-surface leading-relaxed min-h-[1.2em]">
        {renderedParts}
      </p>
    );
  });
}

// Word-by-word streaming typewriter component to replicate real AI models
interface StreamingTextProps {
  text: string;
  onComplete: () => void;
}

function StreamingText({ text, onComplete }: StreamingTextProps) {
  const [displayedText, setDisplayedText] = useState("");
  
  useEffect(() => {
    const words = text.split(" ");
    let currentWordIndex = 0;
    setDisplayedText("");

    const interval = setInterval(() => {
      if (currentWordIndex < words.length) {
        setDisplayedText(prev => prev + (prev ? " " : "") + words[currentWordIndex]);
        currentWordIndex++;
      } else {
        clearInterval(interval);
        onComplete();
      }
    }, 35); // Fast, ultra-smooth and realistic streaming speed

    return () => clearInterval(interval);
  }, [text, onComplete]);

  return (
    <div className="space-y-1">
      {renderFormattedText(displayedText)}
      <span className="inline-block w-1.5 h-3.5 bg-secondary animate-pulse ml-0.5 align-middle" />
    </div>
  );
}

export default function LiveChat({ isOpen, onClose }: LiveChatProps) {
  const [selectedModel, setSelectedModel] = useState<"gemini" | "claude" | "gpt">("gemini");
  
  const [geminiMessages, setGeminiMessages] = useState<ChatMessage[]>(() => {
    const stored = localStorage.getItem("extractile_chat_history_gemini");
    if (stored) {
      try { return JSON.parse(stored); } catch (e) {}
    }
    return [
      {
        id: "welcome-gemini",
        sender: "support",
        text: "✨ **Google Gemini Triage Core** initialized. I specialize in highly polite, conversational, and user-friendly troubleshooting for video resolutions and containers. How can I assist you today?",
        timestamp: "Just now"
      }
    ];
  });

  const [claudeMessages, setClaudeMessages] = useState<ChatMessage[]>(() => {
    const stored = localStorage.getItem("extractile_chat_history_claude");
    if (stored) {
      try { return JSON.parse(stored); } catch (e) {}
    }
    return [
      {
        id: "welcome-claude",
        sender: "support",
        text: "🧠 **Anthropic Claude Triage Specialist** initialized. I will conduct a deep, analytical trace of your stream extraction issues using detailed steps, clear headers, and structured markdown lists. Present your trace query.",
        timestamp: "Just now"
      }
    ];
  });

  const [gptMessages, setGptMessages] = useState<ChatMessage[]>(() => {
    const stored = localStorage.getItem("extractile_chat_history_gpt");
    if (stored) {
      try { return JSON.parse(stored); } catch (e) {}
    }
    return [
      {
        id: "welcome-gpt",
        sender: "support",
        text: "🚀 **ChatGPT Triage Lead** initialized. Direct, fast-paced, highly actionable steps. Let's resolve any download, operating system compatibility, or formatting bottlenecks instantly! 🛠️",
        timestamp: "Just now"
      }
    ];
  });

  // Dynamic getters and setters to seamlessly route operations to the correct thread tab
  const messages = selectedModel === "gemini" 
    ? geminiMessages 
    : selectedModel === "claude" 
      ? claudeMessages 
      : gptMessages;

  const setMessages = (newMsgs: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => {
    const update = (prev: ChatMessage[]) => {
      if (typeof newMsgs === "function") {
        return newMsgs(prev);
      }
      return newMsgs;
    };

    if (selectedModel === "gemini") {
      setGeminiMessages(update);
    } else if (selectedModel === "claude") {
      setClaudeMessages(update);
    } else {
      setGptMessages(update);
    }
  };

  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [streamingId, setStreamingId] = useState<string | null>(null);
  
  // Track copy and reaction states locally per message to prevent general UI jitter
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [reactions, setReactions] = useState<Record<string, "up" | "down">>({});
  const [filteredSuggestions, setFilteredSuggestions] = useState<Suggestion[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Save each model's message thread to localStorage independently whenever they change
  useEffect(() => {
    localStorage.setItem("extractile_chat_history_gemini", JSON.stringify(geminiMessages));
  }, [geminiMessages]);

  useEffect(() => {
    localStorage.setItem("extractile_chat_history_claude", JSON.stringify(claudeMessages));
  }, [claudeMessages]);

  useEffect(() => {
    localStorage.setItem("extractile_chat_history_gpt", JSON.stringify(gptMessages));
  }, [gptMessages]);

  useEffect(() => {
    if (!inputText.trim()) {
      setFilteredSuggestions([]);
      return;
    }
    const query = inputText.toLowerCase().trim();
    const stopWords = new Set(["a", "an", "the", "is", "are", "was", "were", "to", "for", "in", "on", "at", "by", "of", "how", "what", "do", "i", "can", "with", "any", "your", "my"]);
    const queryWords = query.split(/\s+/).filter(word => word.length > 0 && !stopWords.has(word));

    if (queryWords.length === 0) {
      const matched = suggestionsData.filter(s => 
        s.question.toLowerCase().includes(query) ||
        s.keywords.some(k => k.includes(query))
      );
      setFilteredSuggestions(matched);
      return;
    }

    const scored = suggestionsData.map(s => {
      let score = 0;
      if (s.question.toLowerCase().includes(query)) {
        score += 25;
      }
      queryWords.forEach(word => {
        if (s.question.toLowerCase().includes(word)) score += 5;
        if (s.answer.toLowerCase().includes(word)) score += 2;
        s.keywords.forEach(keyword => {
          if (keyword === word) score += 10;
          else if (keyword.includes(word) || word.includes(keyword)) score += 4;
        });
      });
      return { suggestion: s, score };
    });

    const matched = scored
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(item => item.suggestion);

    setFilteredSuggestions(matched);
  }, [inputText]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping, streamingId]);

  const handleClearChat = () => {
    let initialMsgText = "";
    let welcomeId = "";
    if (selectedModel === "gemini") {
      welcomeId = "welcome-gemini";
      initialMsgText = "✨ **Google Gemini Triage Core** initialized. I specialize in highly polite, conversational, and user-friendly troubleshooting for video resolutions and containers. How can I assist you today?";
    } else if (selectedModel === "claude") {
      welcomeId = "welcome-claude";
      initialMsgText = "🧠 **Anthropic Claude Triage Specialist** initialized. I will conduct a deep, analytical trace of your stream extraction issues using detailed steps, clear headers, and structured markdown lists. Present your trace query.";
    } else {
      welcomeId = "welcome-gpt";
      initialMsgText = "🚀 **ChatGPT Triage Lead** initialized. Direct, fast-paced, highly actionable steps. Let's resolve any download, operating system compatibility, or formatting bottlenecks instantly! 🛠️";
    }

    const initialMsg: ChatMessage = {
      id: welcomeId,
      sender: "support",
      text: initialMsgText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages([initialMsg]);
    setStreamingId(null);
    localStorage.setItem(`extractile_chat_history_${selectedModel}`, JSON.stringify([initialMsg]));
  };

  const handleRefreshChat = () => {
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      const reconnectMsgId = `reconnect-${Date.now()}`;
      setStreamingId(reconnectMsgId);
      setMessages(prev => [
        ...prev,
        {
          id: reconnectMsgId,
          sender: "support",
          text: `📡 Connected successfully to **${selectedModel === "gemini" ? "Google Gemini Core" : selectedModel === "claude" ? "Anthropic Claude Core" : "OpenAI ChatGPT Core"}**. Session token refreshed.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }, 600);
  };

  const handleSelectSuggestion = (s: Suggestion) => {
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: "user",
      text: s.question,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setMessages(prev => [...prev, userMsg]);
    setInputText("");
    setIsTyping(true);
    
    setTimeout(() => {
      setIsTyping(false);
      const newSupportId = (Date.now() + 1).toString();
      setStreamingId(newSupportId);

      const engineName = selectedModel === "claude" 
        ? "Anthropic Claude 3.5 Core" 
        : selectedModel === "gpt" 
          ? "OpenAI ChatGPT-4o Lead" 
          : "Google Gemini 3.5 Flash Core";

      const latency = selectedModel === "claude"
        ? "35ms (Analytical Preset Match)"
        : selectedModel === "gpt"
          ? "10ms (Direct Cache Match)"
          : "18ms (Conversational Flow Match)";

      const status = selectedModel === "claude"
        ? "CACHE_RESOLVED_STEPS"
        : selectedModel === "gpt"
          ? "CACHE_SOLVED_ACTIONS"
          : "CACHE_GREETING_COMPLETED";

      const tokens = Math.floor(45 + Math.random() * 20);

      setMessages(prev => [
        ...prev,
        {
          id: newSupportId,
          sender: "support",
          text: getModelSpecificAnswer(s.id, selectedModel),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          metadata: {
            engine: engineName,
            processingTime: latency,
            status: status,
            tokens: tokens
          }
        }
      ]);
    }, 600);
  };

  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const queryText = inputText.trim();

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: "user",
      text: queryText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInputText("");
    setIsTyping(true);

    // Try to match a local suggestion first for an instant local answer
    const queryLower = queryText.toLowerCase();
    const exactLocalMatch = suggestionsData.find(s => 
      queryLower === s.question.toLowerCase() ||
      s.keywords.some(k => queryLower === k || k.toLowerCase().includes(queryLower))
    );

    if (exactLocalMatch) {
      setTimeout(() => {
        setIsTyping(false);
        const localSupportId = (Date.now() + 1).toString();
        setStreamingId(localSupportId);

        const engineName = selectedModel === "claude" 
          ? "Anthropic Claude 3.5 Core" 
          : selectedModel === "gpt" 
            ? "OpenAI ChatGPT-4o Lead" 
            : "Google Gemini 3.5 Flash Core";

        const latency = selectedModel === "claude"
          ? "45ms (Cached Analytical Trace)"
          : selectedModel === "gpt"
            ? "12ms (Direct Cache Match)"
            : "22ms (Conversational Cache)";

        const status = selectedModel === "claude"
          ? "CACHE_STRUCT_RESOLVED"
          : selectedModel === "gpt"
            ? "CACHE_STEPS_COMPLETED"
            : "CACHE_RESPONSE_GENERATED";

        const tokens = Math.floor(40 + Math.random() * 30);

        setMessages((prev) => [
          ...prev,
          {
            id: localSupportId,
            sender: "support",
            text: getModelSpecificAnswer(exactLocalMatch.id, selectedModel),
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            metadata: {
              engine: engineName,
              processingTime: latency,
              status: status,
              tokens: tokens
            }
          }
        ]);
      }, 650);
      return;
    }

    try {
      const response = await fetch("/api/triage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: updatedMessages.map((m) => ({
            sender: m.sender,
            text: m.text,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error("AI Support agent offline.");
      }

      const data = await response.json();
      setIsTyping(false);
      
      const responseMsgId = (Date.now() + 1).toString();
      setStreamingId(responseMsgId);
      
      setMessages((prev) => [
        ...prev,
        {
          id: responseMsgId,
          sender: "support",
          text: data.text || "I was unable to process your request.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          metadata: data.metadata
        }
      ]);
    } catch (err) {
      console.warn("AI Support backend unavailable, using client-side AI support agent:", err);
      setIsTyping(false);
      
      const lastText = queryText.trim();
      let simulatedText = "";
      if (selectedModel === "gemini") {
        simulatedText = `Hello! This is Gemini Triage Core running in Offline Backup Mode. 🚀\n\nI detected your question about: **"${lastText}"**.\n\nExtractile is fully operational in high-fidelity client-side mode! You can extract YouTube, Facebook, and Instagram links. Since we are running in local fallback, all video and audio processing has been redirected to our offline, high-speed WebAssembly-simulated upscale pipeline inside your browser.\n\nLet me know if you want help with format configuration, downloading histories, or workspace parameters!`;
      } else if (selectedModel === "claude") {
        simulatedText = `### Offline Diagnostics & Triage Node (Claude Engine)\n\nSystem registered: **Backend unreachable. Offline-first local backup engaged.**\n\nRegarding your query **"${lastText}"**:\n\n* **Status**: Extractile Client-Side modules are 100% healthy.\n* **Capability**: Single extraction & bulk queued tasks are operating via high-precision local heuristics.\n* **Data Protection**: All operations are secured and stored locally in your browser's \`localStorage\` sandbox.\n\nPlease proceed with your extraction and cover art designs.`;
      } else {
        simulatedText = `🚀 **Extractile Local Triage Assistant is here!** ✨\n\nYour message: **"${lastText}"** was processed in our offline-first local mode!\n\nDon't worry—Extractile is built to withstand connection dropouts. You can still use the **Extractor** to grab metadata, scale video up to 1080p, isolate vocal audio tracks, and save your favourite artworks to the **Showcase Board**!\n\nAsk me anything about how to optimize your workspace setups! 🛠️`;
      }

      const responseMsgId = (Date.now() + 1).toString();
      setStreamingId(responseMsgId);
      setMessages((prev) => [
        ...prev,
        {
          id: responseMsgId,
          sender: "support",
          text: simulatedText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          metadata: {
            engine: selectedModel === "gemini" ? "Gemini-3.5-Flash (Simulated)" : selectedModel === "claude" ? "Claude-3.5-Sonnet (Simulated)" : "GPT-4o (Simulated)",
            processingTime: "120ms",
            status: "LOCAL_OFFLINE_FALLBACK",
            tokens: 150
          }
        }
      ]);
    }
  };

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleReaction = (id: string, type: "up" | "down") => {
    setReactions(prev => ({
      ...prev,
      [id]: prev[id] === type ? "" : (type as any)
    }));
  };

  const handleRegenerate = async (msgIndex: number) => {
    // Find the last user message before this index
    let lastUserMsg = "";
    for (let i = msgIndex - 1; i >= 0; i--) {
      if (messages[i].sender === "user") {
        lastUserMsg = messages[i].text;
        break;
      }
    }
    if (!lastUserMsg) return;

    setIsTyping(true);
    // Remove the current support response and everything after it to make way for the clean retry
    const trimmedMessages = messages.slice(0, msgIndex);
    setMessages(trimmedMessages);

    try {
      const response = await fetch("/api/triage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: trimmedMessages.map((m) => ({
            sender: m.sender,
            text: m.text,
          })),
        }),
      });

      if (!response.ok) throw new Error();
      const data = await response.json();
      setIsTyping(false);
      
      const regeneratedId = (Date.now() + 2).toString();
      setStreamingId(regeneratedId);
      setMessages(prev => [
        ...prev,
        {
          id: regeneratedId,
          sender: "support",
          text: data.text || "Failed to regenerate answer.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          metadata: data.metadata
        }
      ]);
    } catch (e) {
      console.warn("AI Support backend unavailable for regenerate, using client-side fallback:", e);
      setIsTyping(false);
      
      let simulatedText = "";
      if (selectedModel === "gemini") {
        simulatedText = `Hello! This is Gemini Triage Core running in Offline Backup Mode. 🚀\n\nI regenerated the response regarding: **"${lastUserMsg}"**.\n\nEverything in Extractile is designed to work client-side instantly! All extraction formats, media visualizers, audio players, and local database entries operate with high-fidelity accuracy regardless of server status.`;
      } else if (selectedModel === "claude") {
        simulatedText = `### Offline Diagnostics & Triage Node (Claude Engine)\n\nRegeneration completed in client-side fallback mode for: **"${lastUserMsg}"**.\n\nAll system interfaces, high-definition downscaling/upscaling previews, and aesthetic cards are fully operational in your web browser. Check the other workspace tabs to process more targets!`;
      } else {
        simulatedText = `🚀 **Extractile Local Triage Assistant is back!** ✨\n\nI've refreshed the response for: **"${lastUserMsg}"**.\n\nYou have full capability to test all workspace audio knobs, bulk staging cues, and download complete reports locally. Enjoy the seamless experience!`;
      }

      const regeneratedId = (Date.now() + 2).toString();
      setStreamingId(regeneratedId);
      setMessages(prev => [
        ...prev,
        {
          id: regeneratedId,
          sender: "support",
          text: simulatedText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          metadata: {
            engine: selectedModel === "gemini" ? "Gemini-3.5-Flash (Simulated)" : selectedModel === "claude" ? "Claude-3.5-Sonnet (Simulated)" : "GPT-4o (Simulated)",
            processingTime: "85ms",
            status: "LOCAL_OFFLINE_FALLBACK_REGEN",
            tokens: 120
          }
        }
      ]);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      id="chat-triage-modal-panel"
      className="fixed bottom-4 right-4 w-96 max-w-[calc(100vw-32px)] h-[540px] bg-[#e4eaf0] dark:bg-surface-container border border-primary rounded-none shadow-[8px_8px_0px_#1b222c] dark:shadow-[8px_8px_0px_rgba(255,255,255,0.05)] flex flex-col overflow-hidden z-50 font-sans"
    >
      {/* Titlebar Header */}
      <div className="bg-[#dae2ec] dark:bg-surface-container-high border-b border-primary px-4 py-3 flex justify-between items-center select-none">
        <div className="flex items-center gap-2">
          <div className="p-1 bg-background border border-primary text-secondary relative">
            <Bot className="w-4 h-4 animate-pulse" />
            <span className="absolute bottom-0 right-0 w-2 h-2 bg-[#4f5e7c] rounded-full border border-primary" />
          </div>
          <div>
            <h3 className="font-serif font-bold text-xs text-on-surface leading-tight">AI Triage Desk</h3>
            <p className="text-[9px] font-mono text-[#4f5e7c] font-bold mt-0.5 tracking-wider uppercase">OPERATORS ACTIVE</p>
          </div>
        </div>
        
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleRefreshChat}
            className="p-1.5 text-primary hover:text-secondary hover:bg-background/40 transition-all cursor-pointer rounded-none"
            title="Refresh AI handshakes"
            aria-label="Refresh session"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={handleClearChat}
            className="p-1.5 text-rose-800 hover:text-rose-950 hover:bg-background/40 transition-all cursor-pointer rounded-none"
            title="Purge chat logs"
            aria-label="Clear session"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          <span className="w-[1px] h-3.5 bg-primary/20 mx-0.5" />

          <button 
            type="button"
            onClick={onClose}
            className="p-1 text-primary hover:text-secondary transition-colors cursor-pointer rounded-none hover:bg-background/40"
            aria-label="Close support chat"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* AI Model Multi-Selector Panel */}
      <div className="grid grid-cols-3 bg-[#dae2ec] border-b border-primary/50 text-[10px] font-mono font-bold uppercase select-none">
        {/* Gemini */}
        <button
          type="button"
          onClick={() => {
            setSelectedModel("gemini");
            setInputText("");
          }}
          className={`py-2 px-1 flex items-center justify-center gap-1.5 transition-all cursor-pointer border-r border-primary/20 ${
            selectedModel === "gemini" 
              ? "bg-[#7c3aed]/10 text-[#7c3aed] border-b-2 border-[#7c3aed]" 
              : "text-on-surface/60 hover:bg-background/40"
          }`}
        >
          <Sparkles className={`w-3.5 h-3.5 ${selectedModel === "gemini" ? "animate-spin text-[#7c3aed]" : ""}`} />
          <span>Google Gemini</span>
        </button>

        {/* Claude */}
        <button
          type="button"
          onClick={() => {
            setSelectedModel("claude");
            setInputText("");
          }}
          className={`py-2 px-1 flex items-center justify-center gap-1.5 transition-all cursor-pointer border-r border-primary/20 ${
            selectedModel === "claude" 
              ? "bg-[#ea580c]/10 text-[#ea580c] border-b-2 border-[#ea580c]" 
              : "text-on-surface/60 hover:bg-background/40"
          }`}
        >
          <Cpu className={`w-3.5 h-3.5 ${selectedModel === "claude" ? "animate-pulse text-[#ea580c]" : ""}`} />
          <span>Claude</span>
        </button>

        {/* ChatGPT */}
        <button
          type="button"
          onClick={() => {
            setSelectedModel("gpt");
            setInputText("");
          }}
          className={`py-2 px-1 flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            selectedModel === "gpt" 
              ? "bg-[#059669]/10 text-[#059669] border-b-2 border-[#059669]" 
              : "text-on-surface/60 hover:bg-background/40"
          }`}
        >
          <Zap className={`w-3.5 h-3.5 ${selectedModel === "gpt" ? "animate-bounce text-[#059669]" : ""}`} />
          <span>ChatGPT</span>
        </button>
      </div>

      {/* Mini Active Core Status indicator */}
      <div className="bg-[#dae2ec] px-4 py-1.5 border-b border-primary/20 flex items-center justify-between text-[9px] font-mono text-on-surface-variant/80 uppercase">
        <div className="flex items-center gap-1">
          <Activity className="w-3 h-3 text-[#4f5e7c] animate-pulse" />
          <span>System: {selectedModel === "gemini" ? "Gemini-3.5-Flash" : selectedModel === "claude" ? "Claude-3.5-Sonnet-Sim" : "GPT-4o-Turbo-Sim"}</span>
        </div>
        <span className="text-[8px] bg-background px-1.5 py-0.5 border border-primary/10">Active Handshake</span>
      </div>

      {/* Messages Board */}
      <div className="flex-grow p-4 overflow-y-auto space-y-4 bg-[#f2f5fa]/90">
        {messages.map((msg, index) => {
          const isSupport = msg.sender === "support";
          const isStreaming = msg.id === streamingId;
          const hasReaction = reactions[msg.id];
          
          return (
            <div 
              key={msg.id}
              className={`flex flex-col max-w-[90%] ${
                isSupport ? "mr-auto items-start" : "ml-auto items-end"
              }`}
            >
              {/* Message Header (Sender name) */}
              {isSupport && (
                <div className="flex items-center gap-1 mb-1 px-1 text-[9px] font-mono font-bold uppercase tracking-wider text-on-surface-variant/80">
                  {msg.metadata?.engine ? (
                    <>
                      {msg.metadata.engine.includes("Gemini") && <Sparkles className="w-2.5 h-2.5 text-[#7c3aed] animate-pulse" />}
                      {msg.metadata.engine.includes("Claude") && <Cpu className="w-2.5 h-2.5 text-[#ea580c]" />}
                      {msg.metadata.engine.includes("ChatGPT") && <Zap className="w-2.5 h-2.5 text-[#059669]" />}
                      <span>{msg.metadata.engine}</span>
                    </>
                  ) : (
                    <>
                      {selectedModel === "gemini" && (
                        <>
                          <Sparkles className="w-2.5 h-2.5 text-[#7c3aed] animate-pulse" />
                          <span>Gemini Triage Core</span>
                        </>
                      )}
                      {selectedModel === "claude" && (
                        <>
                          <Cpu className="w-2.5 h-2.5 text-[#ea580c]" />
                          <span>Claude Triage Core</span>
                        </>
                      )}
                      {selectedModel === "gpt" && (
                        <>
                          <Zap className="w-2.5 h-2.5 text-[#059669]" />
                          <span>ChatGPT Triage Lead</span>
                        </>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Message Bubble Container */}
              <div className={`p-3 rounded-none text-xs shadow-sm transition-all duration-300 relative ${
                isSupport 
                  ? `bg-white text-on-surface border-l-4 ${
                      selectedModel === "gemini" ? "border-[#7c3aed]" : selectedModel === "claude" ? "border-[#ea580c]" : "border-[#059669]"
                    } border-y border-r border-primary/20` 
                  : `bg-[#dae2ec] text-on-surface font-sans border border-[#cbd6e2] ${
                      selectedModel === "gemini" ? "border-r-2 border-r-[#7c3aed]" : selectedModel === "claude" ? "border-r-2 border-r-[#ea580c]" : "border-r-2 border-r-[#059669]"
                    }`
              }`}>
                {isStreaming ? (
                  <StreamingText 
                    text={msg.text} 
                    onComplete={() => setStreamingId(null)} 
                  />
                ) : (
                  <div className="space-y-1">
                    {renderFormattedText(msg.text)}
                  </div>
                )}

                {/* Processing Metadata display */}
                {isSupport && msg.metadata && (
                  <div className="mt-2 p-1.5 bg-[#f8fafc] border border-primary/10 text-[8px] font-mono text-on-surface-variant space-y-0.5 select-none rounded-none">
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-[#4f5e7c] font-bold">ENGINE:</span>
                      <span className="font-semibold text-primary">{msg.metadata.engine}</span>
                    </div>
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-[#4f5e7c] font-bold">LATENCY:</span>
                      <span>{msg.metadata.processingTime}</span>
                    </div>
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-[#4f5e7c] font-bold">TRACE STATUS:</span>
                      <span className="font-bold text-secondary uppercase text-[7px]">{msg.metadata.status}</span>
                    </div>
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-[#4f5e7c] font-bold">TOKENS SECURED:</span>
                      <span>{msg.metadata.tokens} units</span>
                    </div>
                  </div>
                )}
                
                {/* Micro Action Buttons Overlay on hover for completed Support replies */}
                {isSupport && !isStreaming && (
                  <div className="mt-2.5 pt-2 border-t border-primary/10 flex items-center justify-between text-[10px] text-on-surface-variant">
                    <div className="flex items-center gap-2">
                      {/* Copy reply */}
                      <button
                        onClick={() => handleCopyMessage(msg.id, msg.text)}
                        className="hover:text-primary transition-colors flex items-center gap-0.5 cursor-pointer"
                        title="Copy text to clipboard"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check className="w-3 h-3 text-secondary" />
                            <span className="text-[8px] font-mono font-bold text-secondary uppercase">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span className="text-[8px] font-mono uppercase">Copy</span>
                          </>
                        )}
                      </button>

                      {/* Regenerate (if there was a user query preceding) */}
                      {index > 0 && messages[index - 1].sender === "user" && (
                        <button
                          onClick={() => handleRegenerate(index)}
                          className="hover:text-primary transition-colors flex items-center gap-0.5 cursor-pointer ml-1"
                          title="Regenerate this response"
                        >
                          <RotateCw className="w-3 h-3" />
                          <span className="text-[8px] font-mono uppercase">Retry</span>
                        </button>
                      )}
                    </div>

                    {/* Thumbs up/down */}
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleReaction(msg.id, "up")}
                        className={`p-0.5 transition-colors cursor-pointer ${hasReaction === "up" ? "text-secondary" : "hover:text-primary"}`}
                        aria-label="Thumbs up helpful"
                      >
                        <ThumbsUp className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleReaction(msg.id, "down")}
                        className={`p-0.5 transition-colors cursor-pointer ${hasReaction === "down" ? "text-rose-700" : "hover:text-primary"}`}
                        aria-label="Thumbs down unhelpful"
                      >
                        <ThumbsDown className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <span className="text-[8px] text-on-surface-variant/70 mt-1 font-mono uppercase tracking-wider">{msg.timestamp}</span>
            </div>
          );
        })}

        {isTyping && (
          <div className="flex flex-col items-start max-w-[80%] mr-auto">
            <div className="flex items-center gap-1 mb-1 px-1 text-[9px] font-mono font-bold uppercase tracking-wider text-on-surface-variant/80">
              <Activity className="w-2.5 h-2.5 text-secondary animate-pulse" />
              <span>
                {selectedModel === "gemini" && "Gemini is thinking..."}
                {selectedModel === "claude" && "Claude is analyzing logs..."}
                {selectedModel === "gpt" && "GPT-4o is writing step-by-step..."}
              </span>
            </div>
            <div className="p-3 rounded-none text-xs bg-white text-on-surface border border-primary/20 font-mono flex items-center gap-1.5 shadow-sm">
              <span className="w-1.5 h-1.5 bg-secondary rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-1.5 h-1.5 bg-secondary rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-1.5 h-1.5 bg-secondary rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions and Instant Results Panel */}
      {inputText.trim() ? (
        <div className="bg-[#dae2ec] border-t border-primary/25 p-2 flex flex-col gap-1 max-h-[120px] overflow-y-auto">
          <div className="text-[8px] font-mono font-bold text-secondary uppercase tracking-wider px-1 flex items-center gap-1">
            <Sparkles className="w-2 h-2 text-secondary animate-pulse" />
            <span>Matching Answers ({filteredSuggestions.length})</span>
          </div>
          {filteredSuggestions.length > 0 ? (
            <div className="flex flex-col gap-1">
              {filteredSuggestions.slice(0, 3).map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => handleSelectSuggestion(s)}
                  className="w-full text-left p-1.5 bg-background border border-primary/25 text-[10px] font-serif text-primary hover:bg-primary hover:text-on-primary cursor-pointer transition-all truncate flex items-center justify-between gap-2"
                >
                  <span className="truncate">"{s.question}"</span>
                  <span className="text-[7px] font-mono px-1 py-0.5 bg-secondary/15 text-secondary border border-secondary/20 uppercase flex-shrink-0">
                    Solve
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-[9px] font-mono text-on-surface-variant/70 italic px-1">
              No matching local guidelines. Hit Enter to query real-time AI model.
            </div>
          )}
        </div>
      ) : (
        /* Quick Suggestions when empty/about to type */
        <div className="px-3 py-2 bg-[#dae2ec]/50 border-t border-primary/25 flex gap-2 overflow-x-auto whitespace-nowrap scrollbar-none select-none">
          <button 
            type="button"
            onClick={() => handleSelectSuggestion(suggestionsData[0])}
            className="px-3 py-1 bg-background border border-primary rounded-none text-[9px] font-bold text-on-surface hover:text-secondary cursor-pointer uppercase tracking-wider transition-all flex items-center gap-1"
          >
            <Sparkles className="w-2.5 h-2.5 text-[#7c3aed]" /> Formats & Codecs
          </button>
          <button 
            type="button"
            onClick={() => handleSelectSuggestion(suggestionsData[1])}
            className="px-3 py-1 bg-background border border-primary rounded-none text-[9px] font-bold text-on-surface hover:text-secondary cursor-pointer uppercase tracking-wider transition-all flex items-center gap-1"
          >
            <Terminal className="w-2.5 h-2.5 text-primary" /> Failed Extraction
          </button>
          <button 
            type="button"
            onClick={() => handleSelectSuggestion(suggestionsData[2])}
            className="px-3 py-1 bg-background border border-primary rounded-none text-[9px] font-bold text-on-surface hover:text-secondary cursor-pointer uppercase tracking-wider transition-all flex items-center gap-1"
          >
            <HelpCircle className="w-2.5 h-2.5 text-[#ea580c]" /> Bulk Queue
          </button>
          <button 
            type="button"
            onClick={() => handleSelectSuggestion(suggestionsData[3])}
            className="px-3 py-1 bg-background border border-primary rounded-none text-[9px] font-bold text-on-surface hover:text-secondary cursor-pointer uppercase tracking-wider transition-all flex items-center gap-1"
          >
            <History className="w-2.5 h-2.5 text-[#059669]" /> View History
          </button>
        </div>
      )}

      {/* Input Tray */}
      <form 
        onSubmit={handleSendMessage}
        className="p-3 bg-[#dae2ec] border-t border-primary flex gap-2 items-center"
      >
        <input 
          type="text"
          placeholder={`Ask ${selectedModel === "gemini" ? "Gemini" : selectedModel === "claude" ? "Claude" : "GPT-4o"} about stream errors...`}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          className="flex-grow py-2.5 px-3 bg-background border border-primary text-xs font-mono rounded-none text-on-surface placeholder:text-on-surface-variant/40 focus:border-secondary focus:outline-none transition-all"
        />
        <button 
          type="submit"
          className="p-2.5 bg-secondary hover:bg-[#3d4960] text-white cursor-pointer active:scale-95 transition-all flex items-center justify-center rounded-none border border-secondary"
          aria-label="Send message"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
}
