import { GraduationCap } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border/40 bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-violet-600 to-cyan-600">
              <GraduationCap className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-semibold">DroneAI Academy</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Master AI, MLOps, Data Engineering &amp; Edge AI for autonomous drone systems.
          </p>
          <p className="text-xs text-muted-foreground">&copy; 2026 DroneAI Academy</p>
        </div>
      </div>
    </footer>
  );
}
