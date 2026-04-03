"use client";

import React, { useState, useRef, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Terminal as TerminalIcon, CheckCircle } from "lucide-react";

export interface ExpectedCommand {
  command: string;
  output: string[];
}

export function TerminalSimulator({
  expectedCommands,
  onComplete,
}: {
  expectedCommands: ExpectedCommand[];
  onComplete?: () => void;
}) {
  const [history, setHistory] = useState<string[]>([]);
  const [currentInput, setCurrentInput] = useState("");
  const [step, setStep] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleCommand = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedInput = currentInput.trim();
    if (!trimmedInput) return;

    const newHistory = [...history, `maverick@drone-edge:~$ ${trimmedInput}`];

    if (step < expectedCommands.length && trimmedInput === expectedCommands[step].command) {
      newHistory.push(...expectedCommands[step].output);
      const nextStep = step + 1;
      setStep(nextStep);
      if (nextStep === expectedCommands.length) {
        newHistory.push("", "✅ SUCCESS: All mission commands executed successfully.");
        setIsCompleted(true);
        if (onComplete) onComplete();
      }
    } else {
      newHistory.push(`bash: ${trimmedInput}: command not found or incorrect command for this stage.`);
      newHistory.push(`Hint: Expected something like -> ${expectedCommands[step]?.command}`);
    }

    setHistory(newHistory);
    setCurrentInput("");
  };

  useEffect(() => {
    // scroll to bottom
    if (inputRef.current) {
      inputRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [history]);

  return (
    <Card className="border-border/50 bg-black/90 font-mono text-green-400 overflow-hidden rounded-xl shadow-2xl my-6">
      <CardHeader className="bg-zinc-900 border-b border-zinc-800 py-3 flex flex-row items-center space-x-2">
        <div className="flex space-x-2 mr-4">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
        </div>
        <CardTitle className="text-sm text-zinc-400 font-medium flex items-center gap-2">
          <TerminalIcon className="w-4 h-4" />
          Mission Terminal Tracker
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 overflow-y-auto max-h-80" onClick={() => inputRef.current?.focus()}>
        <div className="text-sm text-zinc-500 mb-4">
          # Mission Objective: Execute the sequential commands to deploy your AI.<br />
          # Progress: {step} / {expectedCommands.length} commands verified.
        </div>
        {history.map((line, i) => (
          <div key={i} className={`text-sm ${line.startsWith("✅") ? "text-blue-400 font-bold" : "text-green-400"}`}>
            {line}
          </div>
        ))}
        {!isCompleted && (
          <form onSubmit={handleCommand} className="flex items-center mt-2 group">
            <span className="text-blue-400 mr-2 shrink-0">maverick@drone-edge:~$</span>
            <input
              ref={inputRef}
              type="text"
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              className="bg-transparent border-none outline-none flex-grow text-green-400 focus:ring-0 placeholder:text-zinc-700"
              placeholder="_"
              autoComplete="off"
              spellCheck="false"
            />
          </form>
        )}
        {isCompleted && (
          <div className="mt-4 flex items-center text-blue-400 gap-2">
            <CheckCircle className="w-5 h-5" /> Mission Terminal Locked. Proceed to the next objective.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
