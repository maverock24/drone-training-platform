"use client";

import React, { useMemo } from "react";
import trainingData from "../../courses/drone_training.json";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

const glossary = trainingData.glossary.sort((a, b) => b.term.length - a.term.length); // Match longest terms first

export function GlossaryText({ text }: { text: string }) {
  // We use useMemo so we don't recalculate the regex on every render
  const parsedElements = useMemo(() => {
    if (!text) return null;

    // Build a regex matching any of the glossary terms (case-insensitive, whole word boundaries)
    const escapedTerms = glossary.map((g) =>
      g.term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    );
    const regex = new RegExp(`\\b(${escapedTerms.join("|")})\\b`, "gi");

    const parts = text.split(regex);

    return parts.map((part, index) => {
      // Find if this part matches a glossary term
      const matchingTerm = glossary.find(
        (g) => g.term.toLowerCase() === part.toLowerCase()
      );

      if (matchingTerm) {
        return (
          <TooltipProvider key={index} delay={200}>
            <Tooltip>
              <TooltipTrigger>
                <span className="underline decoration-muted-foreground/50 decoration-dashed underline-offset-4 cursor-help text-foreground/90 font-medium">
                  {part}
                </span>
              </TooltipTrigger>
              <TooltipContent className="max-w-sm">
                <p className="font-semibold text-sm mb-1">{matchingTerm.term}</p>
                <p className="text-xs text-muted-foreground">
                  {matchingTerm.definition}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      }

      // Return regular text if not a match
      return <React.Fragment key={index}>{part}</React.Fragment>;
    });
  }, [text]);

  return <>{parsedElements}</>;
}
