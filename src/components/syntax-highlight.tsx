"use client";

import React, { useState } from "react";
import { Check, Copy, Terminal } from "lucide-react";

// Lightweight token-based highlighter for Python/Shell/YAML/TypeScript
function tokenize(code: string): React.ReactNode[] {
  if (!code) return [];

  // Split by lines, then apply coloring per token
  const keywords = /\b(import|from|def|class|return|if|elif|else|for|while|in|not|and|or|try|except|with|as|pass|raise|lambda|yield|async|await|True|False|None|print|torch|nn|np|pd)\b/g;
  const builtins = /\b(self|super|len|range|enumerate|zip|map|filter|list|dict|str|int|float|bool|open|isinstance|type)\b/g;
  const strings = /("""[\s\S]*?"""|'''[\s\S]*?'''|"[^"\\]*(?:\\.[^"\\]*)*"|'[^'\\]*(?:\\.[^'\\]*)*')/g;
  const comments = /(#[^\n]*|\/\/[^\n]*)/g;
  const numbers = /\b(\d+\.?\d*(?:[eE][+-]?\d+)?)\b/g;
  const decorators = /(@\w+)/g;
  const yamlKeys = /^(\s*[\w-]+)(?=\s*:)/gm;
  const shellCmds = /^(\s*(?:pip|pip3|python|python3|conda|apt|apt-get|wget|curl|docker|kubectl|git|helm|terraform|npm|npx|node)\b[^\n]*)/gm;

  const lines = code.split("\n");
  return lines.map((line, lineIdx) => {
    // Detect comment lines first
    const commentMatch = line.match(/^(\s*)(#.*)$/);
    if (commentMatch) {
      return (
        <span key={lineIdx}>
          <span className="text-muted-foreground/60">{commentMatch[1]}</span>
          <span className="text-emerald-500/80 italic">{commentMatch[2]}</span>
          {"\n"}
        </span>
      );
    }

    // Apply keyword colouring using simple split/replace approach
    const parts: React.ReactNode[] = [];
    let remaining = line;
    let partIdx = 0;

    // Crude but effective: tokenize the line by building segments
    const tokenPattern = /(@\w+)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|\`[^`]*\`)|(\b(?:import|from|def|class|return|if|elif|else|for|while|in|not|and|or|try|except|with|as|pass|raise|lambda|yield|async|await|True|False|None)\b)|(\b(?:torch|nn|np|pd|self|super|len|range|enumerate|print|isinstance)\b)|(\b\d+\.?\d*\b)|([A-Z][a-zA-Z0-9_]*(?=\s*[(\[.]))|(\w+(?=\s*=\s*[^=]))|([\w.]+(?=\s*\())/g;

    let lastIdx = 0;
    let match: RegExpExecArray | null;
    tokenPattern.lastIndex = 0;

    while ((match = tokenPattern.exec(line)) !== null) {
      // Add everything before this match as plain text
      if (match.index > lastIdx) {
        parts.push(<span key={`${lineIdx}-p-${partIdx++}`} className="text-foreground/80">{line.slice(lastIdx, match.index)}</span>);
      }

      const [full, decorator, str, keyword, builtin, number, className, assignment, funcCall] = match;

      if (decorator) parts.push(<span key={`${lineIdx}-d-${partIdx++}`} className="text-amber-400">{decorator}</span>);
      else if (str) parts.push(<span key={`${lineIdx}-s-${partIdx++}`} className="text-amber-200/80">{str}</span>);
      else if (keyword) parts.push(<span key={`${lineIdx}-k-${partIdx++}`} className="text-violet-400 font-semibold">{keyword}</span>);
      else if (builtin) parts.push(<span key={`${lineIdx}-b-${partIdx++}`} className="text-sky-400">{builtin}</span>);
      else if (number) parts.push(<span key={`${lineIdx}-n-${partIdx++}`} className="text-orange-400">{number}</span>);
      else if (className) parts.push(<span key={`${lineIdx}-c-${partIdx++}`} className="text-emerald-400">{className}</span>);
      else if (assignment) parts.push(<span key={`${lineIdx}-a-${partIdx++}`} className="text-foreground/80">{assignment}</span>);
      else if (funcCall) parts.push(<span key={`${lineIdx}-f-${partIdx++}`} className="text-sky-300">{funcCall}</span>);

      lastIdx = match.index + full.length;
    }

    if (lastIdx < line.length) {
      parts.push(<span key={`${lineIdx}-tail-${partIdx}`} className="text-foreground/80">{line.slice(lastIdx)}</span>);
    }

    return (
      <span key={lineIdx}>
        {parts}
        {"\n"}
      </span>
    );
  });
}

export function SyntaxCodeBlock({ code, language = "python" }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);
  const lines = code.split("\n");

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const langColors: Record<string, string> = {
    python: "text-sky-400",
    shell: "text-emerald-400",
    yaml: "text-amber-400",
    typescript: "text-blue-400",
    javascript: "text-yellow-400",
  };

  // Detect language from content
  let detectedLang = language;
  if (code.trim().startsWith("apiVersion") || code.trim().startsWith("kind:")) detectedLang = "yaml";
  else if (code.trim().startsWith("#!/") || code.match(/^\s*(apt|pip|kubectl|docker|git|npm)\s/m)) detectedLang = "shell";
  else if (code.match(/^import.*from\s+["']|const\s+\w+\s*=\s*(async\s*)?\(/m)) detectedLang = "typescript";
  else if (code.match(/^import\s+\w+|^from\s+\w+\s+import|^def\s+\w+|^class\s+\w+/m)) detectedLang = "python";

  const langLabel = detectedLang.toUpperCase();
  const langColor = langColors[detectedLang] || "text-muted-foreground";

  return (
    <div className="group relative rounded-xl overflow-hidden border border-border/40 bg-zinc-950 shadow-xl my-4">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-900 border-b border-border/30">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <div className="w-3 h-3 rounded-full bg-green-500/80" />
          </div>
          <div className="flex items-center gap-1.5">
            <Terminal className="h-3.5 w-3.5 text-muted-foreground/60" />
            <span className={`text-xs font-mono font-semibold ${langColor}`}>{langLabel}</span>
          </div>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs transition-all bg-muted/20 hover:bg-muted/40 text-muted-foreground hover:text-foreground"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-500" />
              <span className="text-emerald-500">Copied</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code area with line numbers */}
      <div className="flex overflow-x-auto">
        {/* Line numbers */}
        <div className="select-none flex-shrink-0 px-4 py-4 text-right text-xs font-mono leading-relaxed text-muted-foreground/30 bg-zinc-950 border-r border-border/20 min-w-[3rem]">
          {lines.map((_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>
        {/* Code content */}
        <pre className="flex-1 px-4 py-4 text-xs font-mono leading-relaxed overflow-x-auto whitespace-pre">
          <code>{tokenize(code)}</code>
        </pre>
      </div>
    </div>
  );
}
