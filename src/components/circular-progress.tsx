"use client";

export function CircularProgress({
  value,
  size = 80,
  strokeWidth = 7,
  className = "",
  color = "stroke-primary",
  children,
}: {
  value: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  color?: string;
  children?: React.ReactNode;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(Math.max(value, 0), 100) / 100) * circumference;
  const center = size / 2;

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" style={{ position: "absolute", top: 0, left: 0 }}>
        {/* Track */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          className="stroke-muted/30"
          strokeWidth={strokeWidth}
        />
        {/* Fill */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          className={`${color} transition-all duration-700`}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div className="relative z-10 flex flex-col items-center justify-center">
        {children}
      </div>
    </div>
  );
}
